import { Worker } from "worker_threads";
import os from "os";

interface WorkerJob<TInput, TOutput> {
  jobId: number;
  payload: TInput;
  resolve: (value: TOutput) => void;
  reject: (reason?: unknown) => void;
}

interface WorkerEntry {
  worker: Worker;
  busy: boolean;
  activeJob: WorkerJob<unknown, unknown> | null;
}

export default class WorkerPool {
  private static readonly pools: Map<string, WorkerPool> = new Map();
  private readonly workers: WorkerEntry[] = [];
  private readonly taskQueue: WorkerJob<unknown, unknown>[] = [];
  private nextJobId = 1;
  private readonly maxWorkers: number;
  private readonly scriptPath: string;

  constructor(scriptPath: string, maxWorkers?: number) {
    this.scriptPath = scriptPath;
    this.maxWorkers = maxWorkers ?? Math.min(4, Math.max(1, os.cpus().length));
  }

  public static getPool(scriptPath: string, maxWorkers?: number): WorkerPool {
    let pool = WorkerPool.pools.get(scriptPath);
    if (!pool) {
      pool = new WorkerPool(scriptPath, maxWorkers);
      WorkerPool.pools.set(scriptPath, pool);
    }
    return pool;
  }

  public execute<TInput, TOutput>(payload: TInput): Promise<TOutput> {
    return new Promise<TOutput>((resolve, reject) => {
      const job: WorkerJob<unknown, unknown> = {
        jobId: this.nextJobId++,
        payload,
        resolve: resolve as (value: unknown) => void,
        reject,
      };

      const idleWorker = this.workers.find((w) => !w.busy);
      if (idleWorker) {
        this.dispatch(idleWorker, job);
      } else if (this.workers.length < this.maxWorkers) {
        const newWorker = this.createWorker();
        this.dispatch(newWorker, job);
      } else {
        this.taskQueue.push(job);
      }
    });
  }

  private createWorker(): WorkerEntry {
    const worker = new Worker(this.scriptPath);
    worker.unref();

    const entry: WorkerEntry = {
      worker,
      busy: false,
      activeJob: null,
    };

    worker.on("message", (message: unknown) => {
      const msg = message as { jobId?: number; result?: unknown; error?: string };
      const currentJob = entry.activeJob;

      if (currentJob && msg.jobId === currentJob.jobId) {
        entry.busy = false;
        entry.activeJob = null;

        if (msg.error) {
          currentJob.reject(new Error(msg.error));
        } else {
          currentJob.resolve(msg.result);
        }

        this.processQueue(entry);
      }
    });

    worker.on("error", (error) => {
      if (entry.activeJob) {
        entry.activeJob.reject(error);
        entry.activeJob = null;
      }
      this.removeWorker(entry);
      this.drainQueue();
    });

    worker.on("exit", (code) => {
      if (entry.activeJob && code !== 0) {
        entry.activeJob.reject(new Error(`Worker exited with code ${code}`));
        entry.activeJob = null;
      }
      this.removeWorker(entry);
      this.drainQueue();
    });

    this.workers.push(entry);
    return entry;
  }

  private dispatch(entry: WorkerEntry, job: WorkerJob<unknown, unknown>): void {
    entry.busy = true;
    entry.activeJob = job;
    entry.worker.ref();

    const message = typeof job.payload === "object" && job.payload !== null
      ? { jobId: job.jobId, ...job.payload }
      : { jobId: job.jobId, data: job.payload };

    entry.worker.postMessage(message);
  }

  private processQueue(entry: WorkerEntry): void {
    if (this.taskQueue.length > 0) {
      const nextJob = this.taskQueue.shift()!;
      this.dispatch(entry, nextJob);
    } else {
      entry.worker.unref();
    }
  }

  private drainQueue(): void {
    if (this.taskQueue.length === 0) return;

    const idleWorker = this.workers.find((w) => !w.busy);
    if (idleWorker) {
      this.dispatch(idleWorker, this.taskQueue.shift()!);
    } else if (this.workers.length < this.maxWorkers) {
      const newWorker = this.createWorker();
      this.dispatch(newWorker, this.taskQueue.shift()!);
    }
  }

  private removeWorker(entry: WorkerEntry): void {
    const idx = this.workers.indexOf(entry);
    if (idx !== -1) {
      this.workers.splice(idx, 1);
    }
  }

  public async terminate(): Promise<void> {
    const promises = this.workers.map((entry) => entry.worker.terminate());
    this.workers.length = 0;
    this.taskQueue.length = 0;
    await Promise.all(promises);
  }

  public static async terminateAll(): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const pool of WorkerPool.pools.values()) {
      promises.push(pool.terminate());
    }
    WorkerPool.pools.clear();
    await Promise.all(promises);
  }
}
