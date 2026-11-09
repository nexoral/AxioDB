import { IncomingMessage } from "http";
import { PassThrough } from "stream";
import { MultipartFile } from "./HttpTypes";

export default class MultipartHelper {
  public static readonly MAX_HEADER_SIZE = 64 * 1024;

  public static async parseFile(req: IncomingMessage, boundary: string): Promise<MultipartFile | null> {
    const headerEnd = Buffer.from("\r\n\r\n");

    let headerBuffer = Buffer.alloc(0);
    let foundHeaders = false;
    let filename = "";
    const fileStream = new PassThrough();

    let tail = Buffer.alloc(0);
    const boundaryWithCrlf = Buffer.from(`\r\n--${boundary}`);

    return new Promise<MultipartFile | null>((resolve, reject) => {
      let resolved = false;

      const onData = (chunk: Buffer): void => {
        if (!foundHeaders) {
          headerBuffer = Buffer.concat([headerBuffer, chunk]);
          if (headerBuffer.length > MultipartHelper.MAX_HEADER_SIZE) {
            req.removeListener("data", onData);
            req.resume();
            fileStream.destroy();
            if (!resolved) {
              resolved = true;
              reject(new Error("Multipart headers exceed maximum allowed size"));
            }
            return;
          }

          const headerEndIndex = headerBuffer.indexOf(headerEnd);
          if (headerEndIndex !== -1) {
            foundHeaders = true;
            const headersStr = headerBuffer.subarray(0, headerEndIndex).toString("utf8");
            const match = /filename\*?=(?:["']([^"']+)["']|([^;\s\r\n]+))/i.exec(headersStr);
            filename = match ? (match[1] || match[2] || "upload.tar.gz") : "upload.tar.gz";

            const remaining = headerBuffer.subarray(headerEndIndex + headerEnd.length);
            headerBuffer = Buffer.alloc(0);

            if (!resolved) {
              resolved = true;
              resolve({ filename, file: fileStream });
            }

            if (remaining.length > 0) {
              processBodyChunk(remaining);
            }
          }
        } else {
          processBodyChunk(chunk);
        }
      };

      const processBodyChunk = (chunk: Buffer): void => {
        const combined = Buffer.concat([tail, chunk]);
        const boundaryIndex = combined.indexOf(boundaryWithCrlf);

        if (boundaryIndex !== -1) {
          const fileData = combined.subarray(0, boundaryIndex);
          if (fileData.length > 0) {
            fileStream.write(fileData);
          }
          fileStream.end();
          req.removeListener("data", onData);
          req.resume(); // drain rest of request
        } else {
          const safeLength = Math.max(0, combined.length - (boundaryWithCrlf.length + 2));
          if (safeLength > 0) {
            const safeData = combined.subarray(0, safeLength);
            fileStream.write(safeData);
            tail = combined.subarray(safeLength);
          } else {
            tail = combined;
          }
        }
      };

      req.on("data", onData);
      req.on("error", (err) => {
        fileStream.destroy(err);
        if (!resolved) {
          resolved = true;
          reject(err);
        }
      });
      req.on("end", () => {
        if (!resolved) {
          resolved = true;
          resolve(null);
        }
        if (!fileStream.writableEnded) {
          if (tail.length > 0) {
            fileStream.write(tail);
          }
          fileStream.end();
        }
      });
    });
  }

  public static getBoundary(contentType?: string): string | null {
    if (!contentType) return null;
    const match = /boundary=(?:["']([^"']+)["']|([^;\s]+))/i.exec(contentType);
    return match ? (match[1] || match[2] || null) : null;
  }
}
