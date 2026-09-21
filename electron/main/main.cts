import { app, BrowserWindow, ipcMain, dialog, shell, nativeImage } from "electron";
import path from "path";
import http from "http";
import https from "https";
import fs from "fs";

// Set application identity for Linux desktop and Windows taskbar
app.setName("AxioDB Control");
if (process.platform === "win32") {
  app.setAppUserModelId("com.axiodb.control");
}

// In-memory session cookie store for AxioDB sessions
const cookieStore = new Map<string, string>();

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === "development" || process.argv.includes("--dev");

function getWindowIcon() {
  const possiblePaths = [
    path.join(process.resourcesPath, "icon.png"),
    path.join(process.resourcesPath, "resources/icon.png"),
    path.join(process.resourcesPath, "app.asar.unpacked/resources/icon.png"),
    path.join(__dirname, "../resources/icon.png"),
    path.join(__dirname, "../resources/icons/512x512.png"),
    path.join(__dirname, "../../resources/icon.png"),
    path.join(__dirname, "../public/AXioDB.png"),
    path.join(__dirname, "../src/assets/AXioDB.png"),
    "/usr/share/icons/hicolor/512x512/apps/axiodb-control.png",
    "/usr/share/pixmaps/axiodb-control.png",
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      const img = nativeImage.createFromPath(p);
      if (!img.isEmpty()) {
        return img;
      }
    }
  }
  return undefined;
}

function createWindow() {
  const icon = getWindowIcon();

  mainWindow = new BrowserWindow({
    width: 1320,
    height: 880,
    minWidth: 1040,
    minHeight: 680,
    frame: false,
    backgroundColor: "#f8fafc",
    icon,
    title: "AxioDB Control",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (icon) {
    mainWindow.setIcon(icon);
  }

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("maximize", () => {
    mainWindow?.webContents.send("window:maximize-change", true);
  });

  mainWindow.on("unmaximize", () => {
    mainWindow?.webContents.send("window:maximize-change", false);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    const levelNames = ["DEBUG", "INFO", "WARN", "ERROR"];
    const lvl = levelNames[level] || `L${level}`;
    const src = sourceId ? `${path.basename(sourceId)}:${line}` : "";
    console.log(`[Renderer:${lvl}] ${message} ${src}`.trim());
  });

  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    console.error("[Main] Renderer process gone:", details.reason, "exitCode:", details.exitCode);
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Window controls
ipcMain.handle("window:minimize", () => {
  mainWindow?.minimize();
});

ipcMain.handle("window:maximize", () => {
  if (!mainWindow) return false;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
    return false;
  } else {
    mainWindow.maximize();
    return true;
  }
});

ipcMain.handle("window:close", () => {
  mainWindow?.close();
});

ipcMain.handle("window:isMaximized", () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// App Info
ipcMain.handle("app:getVersion", () => {
  return app.getVersion();
});

ipcMain.handle("shell:openExternal", async (_event, url: string) => {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    await shell.openExternal(url);
  }
});

// Native File Picker for Backup Archive Import
ipcMain.handle("dialog:selectImportFile", async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Select AxioDB Backup Archive",
    properties: ["openFile"],
    filters: [
      { name: "Database Archives", extensions: ["zip", "tar", "gz", "tgz"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];
  const stats = fs.statSync(filePath);
  return {
    filePath,
    name: path.basename(filePath),
    size: stats.size,
  };
});

// Read file buffer for import
ipcMain.handle("file:readBuffer", async (_event, filePath: string) => {
  return fs.readFileSync(filePath);
});

// Clear session cookies (e.g. on disconnect or logout)
ipcMain.handle("network:clearCookies", () => {
  cookieStore.clear();
  return true;
});

// Streaming database archive import via HTTP multipart
ipcMain.handle("network:uploadDatabase", async (_event, { filePath, url }: { filePath: string; url: string }) => {
  return new Promise((resolve, reject) => {
    try {
      const fullUrl = new URL(url);
      const isHttps = fullUrl.protocol === "https:";
      const client = isHttps ? https : http;
      const hostKey = `${fullUrl.protocol}//${fullUrl.host}`;
      const savedCookie = cookieStore.get(hostKey);
      const boundary = "----AxioDBUpload" + Date.now() + Math.random().toString(36).slice(2);
      const fileName = path.basename(filePath);
      const stat = fs.statSync(filePath);

      const header = Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
        `Content-Type: application/gzip\r\n\r\n`
      );
      const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
      const totalSize = header.length + stat.size + footer.length;

      const requestHeaders: Record<string, string> = {
        "User-Agent": "AxioDB-Control/22.3.1 (Desktop)",
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": String(totalSize),
      };
      if (savedCookie) {
        requestHeaders["Cookie"] = savedCookie;
      }

      const req = client.request(
        {
          hostname: fullUrl.hostname,
          port: fullUrl.port || (isHttps ? 443 : 80),
          path: `${fullUrl.pathname}${fullUrl.search}`,
          method: "POST",
          headers: requestHeaders,
          timeout: 120000,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (c) => chunks.push(Buffer.from(c)));
          res.on("end", () => {
            const bodyText = Buffer.concat(chunks).toString("utf8");
            let parsedData: unknown = null;
            try {
              parsedData = JSON.parse(bodyText);
            } catch {
              parsedData = bodyText;
            }
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ status: res.statusCode, data: parsedData });
            } else {
              const errMsg =
                parsedData && typeof parsedData === "object" && "message" in parsedData
                  ? String((parsedData as { message: unknown }).message)
                  : `Upload failed with status ${res.statusCode}`;
              reject(new Error(errMsg));
            }
          });
        }
      );

      req.on("error", (err) => reject(err));

      req.write(header);
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(req, { end: false });
      fileStream.on("end", () => {
        req.write(footer);
        req.end();
      });
      fileStream.on("error", (err) => {
        req.destroy(err);
        reject(err);
      });
    } catch (err: unknown) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
});

// Network Request IPC Handler
// Executes requests natively in Node.js to bypass browser CORS and handle session cookies seamlessly
ipcMain.handle("network:request", async (_event, config: {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  data?: unknown;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
}) => {
  return new Promise((resolve, reject) => {
    try {
      const fullUrl = new URL(config.url);
      if (config.params) {
        for (const [key, value] of Object.entries(config.params)) {
          if (value !== undefined && value !== null) {
            fullUrl.searchParams.append(key, String(value));
          }
        }
      }

      const isHttps = fullUrl.protocol === "https:";
      const client = isHttps ? https : http;

      const hostKey = `${fullUrl.protocol}//${fullUrl.host}`;
      const savedCookie = cookieStore.get(hostKey);

      const requestHeaders: Record<string, string> = {
        "User-Agent": "AxioDB-Control/22.3.1 (Desktop)",
        "Accept": "application/json, text/plain, */*",
      };

      if (config.headers && typeof config.headers === "object") {
        for (const [key, value] of Object.entries(config.headers)) {
          if (value !== undefined && value !== null && typeof value !== "object") {
            requestHeaders[key] = String(value);
          }
        }
      }

      // Attach stored session cookie
      if (savedCookie) {
        requestHeaders["Cookie"] = savedCookie;
      }

      let payload: Buffer | null = null;
      if (config.data !== undefined && config.data !== null) {
        if (Buffer.isBuffer(config.data)) {
          payload = config.data;
        } else if (typeof config.data === "string") {
          payload = Buffer.from(config.data, "utf8");
        } else {
          payload = Buffer.from(JSON.stringify(config.data), "utf8");
        }
        requestHeaders["Content-Length"] = String(payload.length);
        if (!requestHeaders["Content-Type"]) {
          requestHeaders["Content-Type"] = "application/json";
        }
      }

      const options: http.RequestOptions = {
        hostname: fullUrl.hostname,
        port: fullUrl.port || (isHttps ? 443 : 80),
        path: `${fullUrl.pathname}${fullUrl.search}`,
        method: (config.method || "GET").toUpperCase(),
        headers: requestHeaders,
        timeout: config.timeout || 30000,
      };

      const req = client.request(options, (res) => {
        // Collect Set-Cookie headers
        const setCookieHeaders = res.headers["set-cookie"];
        if (setCookieHeaders && setCookieHeaders.length > 0) {
          const cookiePairs: string[] = [];
          for (const headerStr of setCookieHeaders) {
            const firstPart = headerStr.split(";")[0].trim();
            if (firstPart) {
              cookiePairs.push(firstPart);
            }
          }
          if (cookiePairs.length > 0) {
            cookieStore.set(hostKey, cookiePairs.join("; "));
          }
        }

        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        res.on("end", () => {
          const bodyBuffer = Buffer.concat(chunks);
          const bodyText = bodyBuffer.toString("utf8");

          let parsedData: unknown = bodyText;
          const contentType = res.headers["content-type"] || "";
          if (contentType.includes("application/json")) {
            try {
              parsedData = JSON.parse(bodyText);
            } catch {
              parsedData = bodyText;
            }
          }

          const responsePayload = {
            status: res.statusCode || 200,
            statusText: res.statusMessage || "OK",
            headers: res.headers,
            data: parsedData,
          };

          // Always resolve responsePayload so renderer / Axios receives full HTTP response (status, headers, data)
          // and Axios's built-in status validator creates an authentic AxiosError with error.response intact
          resolve(responsePayload);
        });
      });

      req.on("error", (err) => {
        reject(err);
      });

      req.on("timeout", () => {
        req.destroy();
        reject(new Error(`Request timed out after ${options.timeout}ms`));
      });

      if (payload) {
        req.write(payload);
      }
      req.end();
    } catch (err) {
      reject(err);
    }
  });
});
