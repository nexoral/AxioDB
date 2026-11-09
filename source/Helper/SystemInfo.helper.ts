import { cpus } from "node:os";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { AxioDB } from "../Services/Indexation.operation";

export interface SystemInfoData {
  process: {
    runtime: string;
    runtimeVersion: string;
    uptimeSeconds: number;
    startedAt: string;
    pid: number;
    nodeVersion: string;
    platform: string;
    arch: string;
    cpuCount: number;
  };
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
    unit: string;
  };
  cache: {
    used: number;
    max: number;
    unit: string;
  };
  instance: {
    version: string;
    rootName: string | null;
    path: string | null;
    totalDatabases: number;
  };
  services: Array<{ name: string; port: number; running: boolean; note?: string }>;
}

function getRuntimeInfo(): { runtime: string; runtimeVersion: string } {
  const versions = process.versions as Record<string, string | undefined>;
  if (versions?.bun) {
    return { runtime: "Bun", runtimeVersion: `v${versions.bun}` };
  }
  if (versions?.deno) {
    return { runtime: "Deno", runtimeVersion: `v${versions.deno}` };
  }
  return { runtime: "Node.js", runtimeVersion: process.version };
}

async function getPackageVersion(): Promise<string> {
  const packagePaths = [
    path.resolve(__dirname, "../../package.json"),
    path.resolve(process.cwd(), "package.json"),
  ];
  for (const pkgPath of packagePaths) {
    try {
      const data = await readFile(pkgPath, "utf8");
      const parsed = JSON.parse(data) as { version?: string };
      if (parsed.version) return String(parsed.version);
    } catch {
      // try next
    }
  }
  return "unknown";
}

export async function getSystemInfo(axioDB: AxioDB): Promise<SystemInfoData> {
  const version = await getPackageVersion();
  const runtimeInfo = getRuntimeInfo();
  const memory = process.memoryUsage();
  const toMB = (bytes: number) => parseFloat((bytes / 1024 / 1024).toFixed(2));
  const cache = await axioDB.Cache.getCacheDetails();
  const instance = await axioDB.getInstanceInfo();
  const cacheData = cache as { cacheSizeInBytes: number; availableMemoryInBytes: number } | false;
  const instanceData = instance?.data as Record<string, unknown> | undefined;

  return {
    process: {
      runtime: runtimeInfo.runtime,
      runtimeVersion: runtimeInfo.runtimeVersion,
      uptimeSeconds: Math.floor(process.uptime()),
      startedAt: new Date(Date.now() - process.uptime() * 1000).toISOString(),
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cpuCount: cpus().length,
    },
    memory: {
      rss: toMB(memory.rss),
      heapUsed: toMB(memory.heapUsed),
      heapTotal: toMB(memory.heapTotal),
      external: toMB(memory.external),
      unit: "MB",
    },
    cache: {
      used: parseFloat(((cacheData ? cacheData.cacheSizeInBytes : 0) / 1024 / 1024).toFixed(2)),
      max: parseFloat(((cacheData ? cacheData.availableMemoryInBytes : 0) / 1024 / 1024).toFixed(2)),
      unit: "MB",
    },
    instance: {
      version,
      rootName: (instanceData?.RootName as string) ?? null,
      path: (instanceData?.CurrentPath as string) ?? null,
      totalDatabases: ((instanceData?.ListOfDatabases as unknown[])?.length) ?? 0,
    },
    services: [
      { name: "HTTP Server", port: 27018, running: true },
      { name: "TCP Server", port: 27019, running: Boolean(axioDB.isTCP || process.env.AXIODB_TCP === "true") },
      { name: "MCP Server", port: 27020, running: Boolean(axioDB.isMCP || process.env.AXIODB_MCP === "true"), note: "Native in core & Docker" },
    ],
  };
}
