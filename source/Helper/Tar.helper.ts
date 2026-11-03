import fs from "fs";
import path from "path";
import { Writable } from "node:stream";

export interface TarEntryHeader {
  name: string;
  size: number;
  type: "File" | "Directory";
  mode?: number;
  mtime?: number;
}

export default class TarHelper {
  private static readonly BLOCK_SIZE = 512;

  public static encodeHeader(entry: TarEntryHeader): Buffer {
    const header = Buffer.alloc(TarHelper.BLOCK_SIZE);
    let name = entry.name.replace(/\\/g, "/");
    if (entry.type === "Directory" && !name.endsWith("/")) {
      name += "/";
    }

    let prefix = "";
    if (Buffer.byteLength(name, "utf8") > 100) {
      const lastSlash = name.lastIndexOf("/", 155);
      if (lastSlash > 0) {
        prefix = name.slice(0, lastSlash);
        name = name.slice(lastSlash + 1);
      }
    }

    header.write(name, 0, 100, "utf8");
    const mode = entry.mode ?? (entry.type === "Directory" ? 0o755 : 0o644);
    header.write(mode.toString(8).padStart(7, "0") + "\0", 100, 8, "ascii");
    header.write("0000000\0", 108, 8, "ascii");
    header.write("0000000\0", 116, 8, "ascii");

    const size = entry.type === "Directory" ? 0 : entry.size;
    header.write(size.toString(8).padStart(11, "0") + "\0", 124, 12, "ascii");

    const mtime = entry.mtime ? Math.floor(entry.mtime / 1000) : Math.floor(Date.now() / 1000);
    header.write(mtime.toString(8).padStart(11, "0") + "\0", 136, 12, "ascii");

    // Checksum placeholder: 8 spaces
    header.fill(0x20, 148, 156);

    header[156] = entry.type === "Directory" ? 0x35 : 0x30; // '5' or '0'
    header.write("ustar\0", 257, 6, "ascii");
    header.write("00", 263, 2, "ascii");

    if (prefix) {
      header.write(prefix, 345, 155, "utf8");
    }

    let checksum = 0;
    for (let i = 0; i < TarHelper.BLOCK_SIZE; i++) {
      checksum += header[i];
    }
    header.write(checksum.toString(8).padStart(6, "0") + "\0 ", 148, 8, "ascii");

    return header;
  }

  public static async packFolder(sourceFolder: string, destination: Writable): Promise<void> {
    const parentDir = path.dirname(sourceFolder);
    const baseFolder = path.basename(sourceFolder);

    const writeBlock = async (buffer: Buffer): Promise<void> => {
      if (!destination.write(buffer)) {
        await new Promise<void>((resolve) => destination.once("drain", resolve));
      }
    };

    const processDirectory = async (currentDir: string): Promise<void> => {
      const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
      entries.sort((a, b) => a.name.localeCompare(b.name));

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relativePath = path.relative(parentDir, fullPath).replace(/\\/g, "/");

        if (entry.isDirectory()) {
          const stat = await fs.promises.stat(fullPath);
          const header = TarHelper.encodeHeader({
            name: relativePath,
            size: 0,
            type: "Directory",
            mode: stat.mode,
            mtime: stat.mtimeMs,
          });
          await writeBlock(header);
          await processDirectory(fullPath);
        } else if (entry.isFile()) {
          const stat = await fs.promises.stat(fullPath);
          const header = TarHelper.encodeHeader({
            name: relativePath,
            size: stat.size,
            type: "File",
            mode: stat.mode,
            mtime: stat.mtimeMs,
          });
          await writeBlock(header);

          const readStream = fs.createReadStream(fullPath);
          for await (const chunk of readStream) {
            await writeBlock(chunk as Buffer);
          }

          const padding = (TarHelper.BLOCK_SIZE - (stat.size % TarHelper.BLOCK_SIZE)) % TarHelper.BLOCK_SIZE;
          if (padding > 0) {
            await writeBlock(Buffer.alloc(padding));
          }
        }
      }
    };

    const rootStat = await fs.promises.stat(sourceFolder);
    const rootHeader = TarHelper.encodeHeader({
      name: baseFolder,
      size: 0,
      type: "Directory",
      mode: rootStat.mode,
      mtime: rootStat.mtimeMs,
    });
    await writeBlock(rootHeader);

    await processDirectory(sourceFolder);

    // Two 512-byte zero blocks marking end of archive
    await writeBlock(Buffer.alloc(TarHelper.BLOCK_SIZE * 2));
  }

  public static createExtractor(
    destFolder: string,
    onEntry?: (entryPath: string, type: "File" | "Directory") => boolean,
  ): Writable {
    return new TarExtractor(destFolder, onEntry);
  }
}

class TarExtractor extends Writable {
  private buffer: Buffer = Buffer.alloc(0);
  private currentWriteStream: fs.WriteStream | null = null;
  private currentPath: string | null = null;
  private remainingFileSize = 0;
  private remainingPadding = 0;
  private skippingBytes = 0;
  private isFinished = false;

  constructor(
    private readonly destFolder: string,
    private readonly onEntry?: (entryPath: string, type: "File" | "Directory") => boolean,
  ) {
    super();
  }

  override _write(chunk: Buffer, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    this.processBuffer()
      .then(() => callback())
      .catch((err) => callback(err instanceof Error ? err : new Error(String(err))));
  }

  override _final(callback: (error?: Error | null) => void): void {
    if (this.currentWriteStream) {
      this.currentWriteStream.end(() => callback());
    } else {
      callback();
    }
  }

  private async processBuffer(): Promise<void> {
    while (this.buffer.length > 0 && !this.isFinished) {
      if (this.skippingBytes > 0) {
        const toSkip = Math.min(this.buffer.length, this.skippingBytes);
        this.buffer = this.buffer.subarray(toSkip);
        this.skippingBytes -= toSkip;
        continue;
      }

      if (this.remainingFileSize > 0) {
        const toWrite = Math.min(this.buffer.length, this.remainingFileSize);
        const dataChunk = this.buffer.subarray(0, toWrite);
        this.buffer = this.buffer.subarray(toWrite);
        this.remainingFileSize -= toWrite;

        if (this.currentWriteStream) {
          if (!this.currentWriteStream.write(dataChunk)) {
            await new Promise<void>((resolve) => this.currentWriteStream!.once("drain", resolve));
          }
        }

        if (this.remainingFileSize === 0 && this.currentWriteStream) {
          await new Promise<void>((resolve, reject) => {
            this.currentWriteStream!.end((err?: Error | null) => {
              if (err) reject(err);
              else resolve();
            });
          });
          this.currentWriteStream = null;
        }
        continue;
      }

      if (this.remainingPadding > 0) {
        const toSkip = Math.min(this.buffer.length, this.remainingPadding);
        this.buffer = this.buffer.subarray(toSkip);
        this.remainingPadding -= toSkip;
        continue;
      }

      if (this.buffer.length < 512) {
        break;
      }

      const headerBlock = this.buffer.subarray(0, 512);
      this.buffer = this.buffer.subarray(512);

      let isZero = true;
      for (let i = 0; i < 512; i++) {
        if (headerBlock[i] !== 0) {
          isZero = false;
          break;
        }
      }
      if (isZero) {
        continue;
      }

      let rawName = headerBlock.toString("utf8", 0, 100).replace(/\0.*$/, "");
      const prefix = headerBlock.toString("utf8", 345, 500).replace(/\0.*$/, "");
      if (prefix) {
        rawName = `${prefix}/${rawName}`;
      }

      const sizeStr = headerBlock.toString("ascii", 124, 136).replace(/\0.*$/, "").trim();
      const size = sizeStr ? parseInt(sizeStr, 8) || 0 : 0;
      const typeflag = headerBlock[156];
      const type: "File" | "Directory" = typeflag === 0x35 || rawName.endsWith("/") ? "Directory" : "File";

      const cleanPath = rawName.replace(/^(\.\/|\/)+/, "");
      if (!cleanPath) continue;

      if (this.onEntry && !this.onEntry(cleanPath, type)) {
        const padding = (512 - (size % 512)) % 512;
        this.skippingBytes = size + padding;
        continue;
      }

      const targetPath = path.resolve(this.destFolder, cleanPath);
      const destWithSep = this.destFolder.endsWith(path.sep) ? this.destFolder : this.destFolder + path.sep;
      if (targetPath !== this.destFolder && !targetPath.startsWith(destWithSep)) {
        throw new Error(`Archive entry escapes destination: ${cleanPath}`);
      }

      if (type === "Directory") {
        await fs.promises.mkdir(targetPath, { recursive: true });
      } else {
        await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
        this.currentWriteStream = fs.createWriteStream(targetPath);
        this.remainingFileSize = size;
        this.remainingPadding = (512 - (size % 512)) % 512;
      }
    }
  }
}
