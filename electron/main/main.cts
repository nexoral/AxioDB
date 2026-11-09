import { app, BrowserWindow, ipcMain, dialog, shell, nativeImage } from "electron";
import path from "path";
import http from "http";
import https from "https";
import fs from "fs";
import net from "net";
import tls from "tls";
import crypto from "crypto";

// AxioDB embedded — local app storage (no HTTP, no TCP)
import { AxioDB } from "axiodb";

// Set application identity for Linux desktop and Windows taskbar
app.setName("AxioDB Control");
if (process.platform === "win32") {
  app.setAppUserModelId("com.axiodb.control");
}

// In-memory session cookie store for AxioDB sessions
const cookieStore = new Map<string, string>();

// Local AxioDB instance for app data persistence (connections, settings, etc.)
const localDB = new AxioDB({
  HTTP: false,
  TCP: false,
  Cache: false,
  RootName: ".axiodb-control",
  CustomPath: app.getPath("userData"),
});

/** Helper: get or create a collection from the local DB */
async function getLocalCollection(dbName: string, collName: string) {
  const db = await localDB.createDB(dbName);
  return db.createCollection(collName);
}

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;

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

function createSplashWindow(): BrowserWindow {
  const splash = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: false,
    center: true,
    resizable: false,
    closable: false,
    minimizable: false,
    maximizable: false,
    backgroundColor: "#f8fafc",
    skipTaskbar: true,
  });

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>
  body{margin:0;background:#f8fafc;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
  .logo{display:flex;align-items:center;gap:10px;margin-bottom:26px}
  .logo-text{font-size:22px;font-weight:700;background:linear-gradient(135deg,#0f172a,#33415a);-webkit-background-clip:text;color:transparent}
  .balls{display:flex;align-items:flex-end;gap:7px;margin-bottom:18px}
  .ball{width:14px;height:14px;border-radius:50%;display:inline-block}
  .ball-0{background:linear-gradient(135deg,#3b82f8,#60a5fa);animation:bounce 0.6s ease-in-out 0ms infinite both}
  .ball-1{background:linear-gradient(135deg,#10b981,#34d399);animation:bounce 0.6s ease-in-out 100ms infinite both}
  .ball-2{background:linear-gradient(135deg,#a855f7,#c084fc);animation:bounce 0.6s ease-in-out 200ms infinite both}
  .ball-3{background:linear-gradient(135deg,#f59e0b,#fbbf24);animation:bounce 0.6s ease-in-out 300ms infinite both}
  .ball-4{background:linear-gradient(135deg,#ec4899,#f871f3);animation:bounce 0.6s ease-in-out 400ms infinite both}
  .text{font-size:13px;color:#64748b;font-weight:500}
  @keyframes bounce{0%,80%,100%{transform:scaleY(0.7);opacity:0.5}50%{transform:scaleY(1);opacity:1}}
  @keyframes pulseLogo{0%,100%{opacity:0.4}50%{opacity:1}}
</style>
</head>
<body>
  <div class="logo">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="12" cy="6" rx="8" ry="3" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M4 6v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="12" cy="18" r="4" fill="#10b981"/>
    </svg>
    <span class="logo-text">AxioDB Control</span>
  </div>
  <div class="balls">
    <div class="ball ball-0"></div>
    <div class="ball ball-1"></div>
    <div class="ball ball-2"></div>
    <div class="ball ball-3"></div>
    <div class="ball ball-4"></div>
  </div>
  <div class="text">Booting AxioDB Control…</div>
</body>
</html>`;

  splash.loadURL(`data:text/html;charset=utf-8;base64,${Buffer.from(html).toString("base64")}`);
  return splash;
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
    show: false,
    icon,
    title: "AxioDB Control",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    setTimeout(() => {
      mainWindow?.show();
      if (splashWindow) {
        splashWindow.close();
        splashWindow = null;
      }
    }, 500);
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
  splashWindow = createSplashWindow();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      splashWindow = createSplashWindow();
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

// Allowed file paths selected explicitly via native file dialog
const allowedImportFiles = new Set<string>();

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
  allowedImportFiles.add(filePath);
  const stats = fs.statSync(filePath);
  return {
    filePath,
    name: path.basename(filePath),
    size: stats.size,
  };
});

// Read file buffer for import
ipcMain.handle("file:readBuffer", async (_event, filePath: string) => {
  if (!allowedImportFiles.has(filePath)) {
    throw new Error("Access denied: File was not selected via file dialog");
  }
  return fs.readFileSync(filePath);
});

// Clear session cookies and active TCP connections (e.g. on disconnect or logout)
ipcMain.handle("network:clearCookies", () => {
  cookieStore.clear();
  tcpBridge.clearCredentials();
  tcpBridge.disconnect();
  return true;
});

// Streaming database archive import via HTTP multipart or chunked TCP
ipcMain.handle("network:uploadDatabase", async (_event, { filePath, url }: { filePath: string; url: string }) => {
  if (!allowedImportFiles.has(filePath)) {
    throw new Error("Access denied: File was not selected via file dialog");
  }

  if (url.startsWith("tcp://")) {
    const fullUrl = new URL(url);
    const host = fullUrl.hostname || "127.0.0.1";
    const port = parseInt(fullUrl.port || "27019", 10);
    const isTls = fullUrl.searchParams.get("tls") === "true";

    const fileStats = await fs.promises.stat(filePath);
    const chunkSize = 2 * 1024 * 1024;
    const totalChunks = Math.ceil(fileStats.size / chunkSize) || 1;
    const transferId = `tcp-import-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const fd = await fs.promises.open(filePath, "r");

    let lastRes: { id: string; statusCode: number; message: string; data?: unknown; error?: string } | null = null;
    try {
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, fileStats.size);
        const length = end - start;
        const buf = Buffer.alloc(length);
        await fd.read(buf, 0, length, start);

        const res = await tcpBridge.sendCommand(
          host,
          port,
          "IMPORT_DATABASE",
          {
            chunkIndex,
            totalChunks,
            data: buf.toString("base64"),
            transferId,
          },
          120000,
          isTls
        );

        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          throw new Error(res.message || res.error || `Failed to import chunk ${chunkIndex}`);
        }
        lastRes = res;
      }
    } finally {
      await fd.close();
    }

    return {
      status: 200,
      data: (lastRes?.data as Record<string, unknown>) || { message: "Database imported successfully" },
    };
  }

  return new Promise((resolve, reject) => {
    try {
      const fullUrl = new URL(url);
      if (fullUrl.protocol !== "http:" && fullUrl.protocol !== "https:") {
        throw new Error("Invalid URL protocol: Must be http or https");
      }
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

/**
 * TCP Client Bridge for AxioDB Binary Length-Prefixed Protocol (Port 27019)
 * Protocol: [4-byte UInt32BE length][JSON payload]
 */
interface TcpPendingRequest {
  resolve: (res: { id: string; statusCode: number; message: string; data?: unknown; error?: string }) => void;
  reject: (err: Error) => void;
  timer: NodeJS.Timeout;
}

class TcpClientBridge {
  private socket: net.Socket | tls.TLSSocket | null = null;
  private buffer: Buffer = Buffer.alloc(0);
  private pendingRequests = new Map<string, TcpPendingRequest>();
  private currentHost: string | null = null;
  private currentPort: number | null = null;
  private currentTls: boolean = false;
  private isConnecting = false;
  private connectWaiters: Array<{ resolve: () => void; reject: (err: Error) => void }> = [];
  private savedUsername: string | null = null;
  private savedPassword: string | null = null;

  public setCredentials(username: string, password: string) {
    this.savedUsername = username;
    this.savedPassword = password;
  }

  public getSavedUsername(): string | null {
    return this.savedUsername;
  }

  public getSavedPassword(): string | null {
    return this.savedPassword;
  }

  public clearCredentials() {
    this.savedUsername = null;
    this.savedPassword = null;
  }

  private ensureConnected(host: string, port: number, useTls = false): Promise<void> {
    if (
      this.socket &&
      !this.socket.destroyed &&
      this.currentHost === host &&
      this.currentPort === port &&
      this.currentTls === useTls
    ) {
      return Promise.resolve();
    }

    if (this.isConnecting) {
      return new Promise((resolve, reject) => {
        this.connectWaiters.push({ resolve, reject });
      });
    }

    this.disconnect();
    this.isConnecting = true;
    this.currentHost = host;
    this.currentPort = port;
    this.currentTls = useTls;

    return new Promise((resolve, reject) => {
      const onConnect = () => {
        this.isConnecting = false;
        resolve();
        for (const waiter of this.connectWaiters) waiter.resolve();
        this.connectWaiters = [];
      };

      const socket: net.Socket = useTls
        ? tls.connect(
            {
              host,
              port,
              rejectUnauthorized: false,
            },
            onConnect
          )
        : net.createConnection({ host, port }, onConnect);

      this.socket = socket;
      socket.setKeepAlive(true, 10000);
      socket.setNoDelay(true);

      socket.on("data", (chunk: Buffer) => {
        this.buffer = Buffer.concat([this.buffer, chunk]);
        while (this.buffer.length >= 4) {
          const msgLen = this.buffer.readUInt32BE(0);
          if (this.buffer.length < 4 + msgLen) {
            break;
          }
          const jsonBuf = this.buffer.subarray(4, 4 + msgLen);
          this.buffer = this.buffer.subarray(4 + msgLen);
          try {
            const parsed = JSON.parse(jsonBuf.toString("utf8")) as {
              id: string;
              statusCode: number;
              message: string;
              data?: unknown;
              error?: string;
            };
            if (parsed && typeof parsed === "object" && parsed.id) {
              const pending = this.pendingRequests.get(parsed.id);
              if (pending) {
                clearTimeout(pending.timer);
                this.pendingRequests.delete(parsed.id);
                pending.resolve(parsed);
              }
            }
          } catch (err) {
            console.error("[TCP Bridge] Parse error:", err);
          }
        }
      });

      socket.on("error", (err: Error) => {
        if (this.isConnecting) {
          this.isConnecting = false;
          reject(err);
          for (const waiter of this.connectWaiters) waiter.reject(err);
          this.connectWaiters = [];
        }
        this.cleanupPending(err);
      });

      socket.on("close", () => {
        this.cleanupPending(new Error("TCP connection closed"));
      });
    });
  }

  private cleanupPending(err: Error) {
    for (const [, pending] of this.pendingRequests.entries()) {
      clearTimeout(pending.timer);
      pending.reject(err);
    }
    this.pendingRequests.clear();
    this.socket = null;
    this.buffer = Buffer.alloc(0);
  }

  public disconnect() {
    this.clearCredentials();
    if (this.socket) {
      try {
        this.socket.destroy();
      } catch {
        // ignore
      }
      this.socket = null;
    }
    this.cleanupPending(new Error("TCP connection terminated"));
    this.currentHost = null;
    this.currentPort = null;
    this.currentTls = false;
    this.isConnecting = false;
  }

  public async sendCommand(
    host: string,
    port: number,
    command: string,
    params: Record<string, unknown> = {},
    timeoutMs = 30000,
    useTls = false
  ): Promise<{ id: string; statusCode: number; message: string; data?: unknown; error?: string }> {
    await this.ensureConnected(host, port, useTls);
    if (!this.socket || this.socket.destroyed) {
      throw new Error("TCP socket not connected");
    }

    const id = crypto.randomUUID();
    const payload = JSON.stringify({ id, command, params });
    const payloadBuf = Buffer.from(payload, "utf8");
    const lenBuf = Buffer.allocUnsafe(4);
    lenBuf.writeUInt32BE(payloadBuf.length, 0);
    const framed = Buffer.concat([lenBuf, payloadBuf]);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`TCP command ${command} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingRequests.set(id, { resolve, reject, timer });
      this.socket?.write(framed, (err) => {
        if (err) {
          clearTimeout(timer);
          this.pendingRequests.delete(id);
          reject(err);
        }
      });
    });
  }
}

const tcpBridge = new TcpClientBridge();

async function executeTcpRequest(fullUrl: URL, config: {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  data?: unknown;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
}) {
  const host = fullUrl.hostname;
  const port = parseInt(fullUrl.port, 10) || 27019;
  let pathname = fullUrl.pathname;
  if (!pathname || pathname === "/") {
    const rawUrl = config.url || fullUrl.href || "";
    const match = rawUrl.match(/\/api\/[a-zA-Z0-9_\-\/]+/);
    if (match) {
      pathname = match[0];
    }
  }

  const query: Record<string, string> = {};
  fullUrl.searchParams.forEach((v, k) => { query[k] = v; });
  if (config.params) {
    for (const [k, v] of Object.entries(config.params)) {
      if (v !== undefined && v !== null) query[k] = String(v);
    }
  }

  let body: Record<string, unknown> = {};
  if (config.data && typeof config.data === "object" && !Array.isArray(config.data)) {
    body = config.data as Record<string, unknown>;
  } else if (typeof config.data === "string") {
    try {
      const parsed = JSON.parse(config.data);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        body = parsed as Record<string, unknown>;
      }
    } catch {
      body = {};
    }
  }

  const timeout = config.timeout || 30000;
  const method = (config.method || "GET").toUpperCase();
  const isTls =
    config.headers?.["x-axiodb-tls"] === "true" ||
    fullUrl.searchParams.get("tls") === "true";

  // 1. Liveness & Ping Heartbeat
  if (pathname.includes("/api/health") || pathname.includes("/ping")) {
    const res = await tcpBridge.sendCommand(host, port, "PING", {}, timeout, isTls);
    return {
      status: res.statusCode || 200,
      statusText: "OK",
      headers: {},
      data: {
        status: "ok",
        success: true,
        message: res.message || "PONG",
        timestamp: new Date().toISOString(),
      },
    };
  }

  // 2. Authentication Login
  if (pathname.includes("/api/auth/login")) {
    const username = String(body.username || query.username || "");
    const password = String(body.password || query.password || "");
    const res = await tcpBridge.sendCommand(host, port, "AUTHENTICATE", { username, password }, timeout, isTls);
    const resData = (res.data || {}) as { username?: string; role?: string; permissions?: string[]; mustChangePassword?: boolean };
    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
      tcpBridge.setCredentials(username, password);
      return {
        status: res.statusCode,
        statusText: "OK",
        headers: {},
        data: {
          success: true,
          message: res.message || "Authenticated successfully",
          user: res.data,
          data: res.data,
        },
      };
    } else if (res.statusCode === 403 && resData.mustChangePassword) {
      // User must change their password on first login or after reset
      tcpBridge.setCredentials(username, password);
      const userPayload = {
        username: resData.username || username,
        role: resData.role || "Super Admin",
        permissions: resData.permissions || [],
        mustChangePassword: true,
      };
      return {
        status: 200,
        statusText: "OK",
        headers: {},
        data: {
          statusCode: 200,
          success: true,
          message: "Password change required",
          user: userPayload,
          data: userPayload,
        },
      };
    } else {
      return {
        status: res.statusCode || 401,
        statusText: "Unauthorized",
        headers: {},
        data: {
          success: false,
          message: res.message || res.error || "Invalid username or password",
        },
      };
    }
  }

  // 3. Authentication Logout
  if (pathname.includes("/api/auth/logout")) {
    tcpBridge.clearCredentials();
    tcpBridge.disconnect();
    return {
      status: 200,
      statusText: "OK",
      headers: {},
      data: { success: true, message: "Logged out" },
    };
  }

  // 4. List Databases
  if (pathname.includes("/api/db/databases")) {
    const res = await tcpBridge.sendCommand(host, port, "GET_INSTANCE_INFO", {}, timeout, isTls);
    if (res.statusCode && res.statusCode >= 400) {
      return {
        status: res.statusCode,
        statusText: "Error",
        headers: {},
        data: {
          statusCode: res.statusCode,
          message: res.message || res.error || "Authentication required",
          error: res.error,
        },
      };
    }
    return {
      status: res.statusCode || 200,
      statusText: "OK",
      headers: {},
      data: { data: res.data || { ListOfDatabases: [] } },
    };
  }

  // 5. Create Database
  if (pathname.includes("/api/db/create-database") || pathname.includes("/api/db/create")) {
    const dbName = String(body.name || body.dbName || query.name || query.dbName || query.databaseName || "");
    const res = await tcpBridge.sendCommand(host, port, "CREATE_DB", { dbName }, timeout, isTls);
    return {
      status: res.statusCode || 200,
      statusText: "OK",
      headers: {},
      data: { statusCode: res.statusCode || 200, message: res.message, data: res.data },
    };
  }

  // 6. Delete Database
  if (pathname.includes("/api/db/delete-database") || pathname.includes("/api/db/delete")) {
    const dbName = String(query.dbName || query.databaseName || body.dbName || "");
    const res = await tcpBridge.sendCommand(host, port, "DELETE_DB", { dbName }, timeout, isTls);
    return {
      status: res.statusCode || 200,
      statusText: "OK",
      headers: {},
      data: { statusCode: res.statusCode || 200, message: res.message, data: res.data },
    };
  }

  // 7. List Collections in Database
  if (pathname.includes("/api/collection/all")) {
    const dbName = String(query.databaseName || query.dbName || "");
    const res = await tcpBridge.sendCommand(host, port, "GET_COLLECTION_INFO", { dbName }, timeout, isTls);
    return {
      status: res.statusCode || 200,
      statusText: "OK",
      headers: {},
      data: { data: res.data || { ListOfCollections: [] } },
    };
  }

  // 8. Create Collection
  if (pathname.includes("/api/collection/create-collection") || pathname.includes("/api/collection/create")) {
    const dbName = String(body.dbName || query.dbName || query.databaseName || "");
    const collectionName = String(body.collectionName || query.collectionName || "");
    const res = await tcpBridge.sendCommand(host, port, "CREATE_COLLECTION", { dbName, collectionName }, timeout, isTls);
    return {
      status: res.statusCode || 200,
      statusText: "OK",
      headers: {},
      data: { statusCode: res.statusCode || 200, message: res.message, data: res.data },
    };
  }

  // 9. Delete Collection
  if (pathname.includes("/api/collection/delete-collection") || pathname.includes("/api/collection/delete")) {
    const dbName = String(query.dbName || query.databaseName || body.dbName || "");
    const collectionName = String(query.collectionName || body.collectionName || "");
    const res = await tcpBridge.sendCommand(host, port, "DELETE_COLLECTION", { dbName, collectionName }, timeout, isTls);
    return {
      status: res.statusCode || 200,
      statusText: "OK",
      headers: {},
      data: { statusCode: res.statusCode || 200, message: res.message, data: res.data },
    };
  }

  // 10. Query Documents
  if (pathname.includes("/api/operation/all")) {
    const dbName = String(query.dbName || query.databaseName || body.dbName || body.databaseName || "");
    const collectionName = String(query.collectionName || body.collectionName || "");
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const limit = body.limit !== undefined
      ? parseInt(String(body.limit), 10)
      : (query.limit !== undefined ? parseInt(String(query.limit), 10) : 50);
    const skip = body.skip !== undefined
      ? parseInt(String(body.skip), 10)
      : (query.skip !== undefined ? parseInt(String(query.skip), 10) : (page - 1) * limit);

    let q: Record<string, unknown> = {};
    if (body.query && typeof body.query === "object" && !Array.isArray(body.query)) {
      q = body.query as Record<string, unknown>;
    } else if (body && typeof body === "object" && !Array.isArray(body)) {
      const cleanBody = { ...body };
      delete cleanBody.dbName;
      delete cleanBody.collectionName;
      delete cleanBody.databaseName;
      delete cleanBody.page;
      delete cleanBody.limit;
      if (Object.keys(cleanBody).length > 0) {
        q = cleanBody;
      }
    }

    const sort = (body.sort && typeof body.sort === "object") ? (body.sort as Record<string, 1 | -1>) : undefined;

    const res = await tcpBridge.sendCommand(host, port, "QUERY_DOCUMENTS", {
      dbName,
      collectionName,
      query: q,
      limit,
      skip,
      sort,
    }, timeout, isTls);

    if (res.statusCode && res.statusCode >= 400) {
      return {
        status: res.statusCode,
        statusText: "Error",
        headers: {},
        data: {
          statusCode: res.statusCode,
          message: res.message || res.error || "Failed to query documents",
          error: res.error,
        },
      };
    }

    // Extract documents array from TCP query response
    // TCP returns: { statusCode: 200, status: true, data: { documents: [...] } }
    let docs: unknown[] = [];
    let totalDocs = 0;

    if (Array.isArray(res.data)) {
      docs = res.data;
      totalDocs = docs.length;
    } else if (res.data && typeof res.data === "object") {
      const rawData = res.data as Record<string, unknown>;
      if (Array.isArray(rawData.documents)) {
        docs = rawData.documents;
        totalDocs = typeof rawData.totalDocuments === "number" ? rawData.totalDocuments : docs.length;
      } else if (rawData.data && typeof rawData.data === "object") {
        const nestedData = rawData.data as Record<string, unknown>;
        if (Array.isArray(nestedData.documents)) {
          docs = nestedData.documents;
          totalDocs = typeof nestedData.totalDocuments === "number" ? nestedData.totalDocuments : docs.length;
        } else if (Array.isArray(nestedData)) {
          docs = nestedData;
          totalDocs = docs.length;
        }
      }
    }

    return {
      status: res.statusCode || 200,
      statusText: "OK",
      headers: {},
      data: {
        statusCode: res.statusCode || 200,
        message: res.message || "Documents retrieved successfully",
        data: {
          data: {
            documents: docs,
            totalDocuments: totalDocs,
          },
          documents: docs,
          totalDocuments: totalDocs,
        },
      },
    };
  }

  // 11. Create Document
  if (pathname.includes("/api/operation/create")) {
    const dbName = String(query.dbName || query.databaseName || body.dbName || body.databaseName || "");
    const collectionName = String(query.collectionName || body.collectionName || "");
    let docData: unknown = config.data;
    if (typeof docData === "string") {
      try {
        docData = JSON.parse(docData);
      } catch {
        docData = body;
      }
    }
    if (!docData || (typeof docData === "object" && Object.keys(docData as object).length === 0)) {
      docData = body;
    }
    if (docData && typeof docData === "object" && !Array.isArray(docData)) {
      const rec = docData as Record<string, unknown>;
      if (rec.data && typeof rec.data === "object" && !Array.isArray(rec.data) && Object.keys(rec.data).length > 0) {
        docData = rec.data;
      }
    }

    let res;
    if (Array.isArray(docData)) {
      res = await tcpBridge.sendCommand(host, port, "INSERT_MANY_DOCUMENTS", {
        dbName,
        collectionName,
        documents: docData as Record<string, unknown>[],
      }, timeout, isTls);
    } else {
      res = await tcpBridge.sendCommand(host, port, "INSERT_DOCUMENT", {
        dbName,
        collectionName,
        data: (docData || {}) as Record<string, unknown>,
      }, timeout, isTls);
    }

    if (res.statusCode && res.statusCode >= 400) {
      return {
        status: res.statusCode,
        statusText: "Error",
        headers: {},
        data: {
          statusCode: res.statusCode,
          message: res.message || res.error || "Failed to create document",
          error: res.error,
        },
      };
    }

    const rawData = (res.data && typeof res.data === "object") ? (res.data as Record<string, unknown>) : {};
    const documentId = rawData.documentId || rawData.id;

    return {
      status: res.statusCode || 201,
      statusText: "Created",
      headers: {},
      data: {
        statusCode: res.statusCode || 201,
        message: res.message || "Document created successfully",
        data: {
          ...rawData,
          documentId,
        },
      },
    };
  }

  // 12. Update Document
  if (pathname.includes("/api/operation/update")) {
    const dbName = String(query.dbName || query.databaseName || body.dbName || "");
    const collectionName = String(query.collectionName || body.collectionName || "");
    const documentId = String(query.documentId || query.id || body.documentId || body.id || "");
    const isByQuery = pathname.includes("/by-query") || (!documentId && body.query !== undefined);

    if (isByQuery) {
      const q = (body.query && typeof body.query === "object") ? (body.query as Record<string, unknown>) : {};
      const updateData = (body.update || body.data || body) as Record<string, unknown>;
      const updateOne = String(query.isMany) !== "true" && body.isMany !== true;

      const res = await tcpBridge.sendCommand(host, port, "UPDATE_DOCUMENTS_BY_QUERY", {
        dbName,
        collectionName,
        query: q,
        updateData,
        updateOne,
      }, timeout, isTls);

      if (res.statusCode && res.statusCode >= 400) {
        return {
          status: res.statusCode,
          statusText: "Error",
          headers: {},
          data: {
            statusCode: res.statusCode,
            message: res.message || res.error || "Failed to update documents",
            error: res.error,
          },
        };
      }

      return {
        status: res.statusCode || 200,
        statusText: "OK",
        headers: {},
        data: {
          statusCode: res.statusCode || 200,
          message: res.message || "Documents updated successfully",
          data: res.data,
        },
      };
    }

    let updateData: unknown = (body.data || body) as Record<string, unknown>;
    if (typeof config.data === "string") {
      try {
        const parsed = JSON.parse(config.data);
        if (parsed && typeof parsed === "object") updateData = parsed;
      } catch {
        // ignore
      }
    }

    const res = await tcpBridge.sendCommand(host, port, "UPDATE_DOCUMENT_BY_ID", {
      dbName,
      collectionName,
      id: documentId,
      updateData: updateData as Record<string, unknown>,
    }, timeout, isTls);

    if (res.statusCode && res.statusCode >= 400) {
      return {
        status: res.statusCode,
        statusText: "Error",
        headers: {},
        data: {
          statusCode: res.statusCode,
          message: res.message || res.error || "Failed to update document",
          error: res.error,
        },
      };
    }

    return {
      status: res.statusCode || 200,
      statusText: "OK",
      headers: {},
      data: {
        statusCode: res.statusCode || 200,
        message: res.message || "Document updated successfully",
        data: {
          document: updateData,
          data: res.data,
        },
      },
    };
  }

  // 13. Delete Document
  if (pathname.includes("/api/operation/delete")) {
    const dbName = String(query.dbName || query.databaseName || body.dbName || "");
    const collectionName = String(query.collectionName || body.collectionName || "");
    const documentId = String(query.documentId || query.id || body.documentId || body.id || "");
    const isByQuery = pathname.includes("/by-query") || (!documentId && body.query !== undefined);

    if (isByQuery) {
      const q = (body.query && typeof body.query === "object") ? (body.query as Record<string, unknown>) : {};
      const res = await tcpBridge.sendCommand(host, port, "DELETE_DOCUMENTS_BY_QUERY", {
        dbName,
        collectionName,
        query: q,
      }, timeout, isTls);

      if (res.statusCode && res.statusCode >= 400) {
        return {
          status: res.statusCode,
          statusText: "Error",
          headers: {},
          data: {
            statusCode: res.statusCode,
            message: res.message || res.error || "Failed to delete documents",
            error: res.error,
          },
        };
      }

      return {
        status: res.statusCode || 200,
        statusText: "OK",
        headers: {},
        data: { statusCode: res.statusCode || 200, message: res.message || "Documents deleted successfully", data: res.data },
      };
    }

    const res = await tcpBridge.sendCommand(host, port, "DELETE_DOCUMENT_BY_ID", {
      dbName,
      collectionName,
      id: documentId,
    }, timeout, isTls);

    if (res.statusCode && res.statusCode >= 400) {
      return {
        status: res.statusCode,
        statusText: "Error",
        headers: {},
        data: {
          statusCode: res.statusCode,
          message: res.message || res.error || "Failed to delete document",
          error: res.error,
        },
      };
    }

    return {
      status: res.statusCode || 200,
      statusText: "OK",
      headers: {},
      data: { statusCode: res.statusCode || 200, message: res.message, data: res.data },
    };
  }

  // 14. Aggregation
  if (pathname.includes("/api/operation/aggregate")) {
    const dbName = String(query.dbName || query.databaseName || body.dbName || "");
    const collectionName = String(query.collectionName || body.collectionName || "");
    const pipeline = Array.isArray(body.aggregation)
      ? body.aggregation
      : (Array.isArray(body.pipeline) ? body.pipeline : []);

    const res = await tcpBridge.sendCommand(host, port, "AGGREGATE", {
      dbName,
      collectionName,
      pipeline: pipeline as object[],
    }, timeout, isTls);

    if (res.statusCode && res.statusCode >= 400) {
      return {
        status: res.statusCode,
        statusText: "Error",
        headers: {},
        data: {
          statusCode: res.statusCode,
          message: res.message || res.error || "Aggregation failed",
          error: res.error,
        },
      };
    }

    let aggDocs: unknown[] = [];
    if (Array.isArray(res.data)) {
      aggDocs = res.data;
    } else if (res.data && typeof res.data === "object") {
      const d = res.data as Record<string, unknown>;
      if (Array.isArray(d.documents)) aggDocs = d.documents;
      else if (d.data && typeof d.data === "object") {
        const inner = d.data as Record<string, unknown>;
        if (Array.isArray(inner.documents)) aggDocs = inner.documents;
        else if (Array.isArray(inner)) aggDocs = inner;
      }
    }

    return {
      status: res.statusCode || 200,
      statusText: "OK",
      headers: {},
      data: {
        statusCode: res.statusCode || 200,
        message: res.message || "Aggregation completed",
        data: {
          documents: aggDocs,
          data: aggDocs,
        },
      },
    };
  }

  // 15. Metrics & System Diagnostics
  if (pathname.includes("/api/system")) {
    const res = await tcpBridge.sendCommand(host, port, "GET_SYSTEM_INFO", {}, timeout, isTls);
    if (res.statusCode && res.statusCode >= 400) {
      return {
        status: res.statusCode,
        statusText: "Error",
        headers: {},
        data: { statusCode: res.statusCode, message: res.message || res.error || "Failed to get system info", error: res.error },
      };
    }
    return {
      status: res.statusCode || 200,
      statusText: "OK",
      headers: {},
      data: { statusCode: res.statusCode || 200, message: res.message, data: res.data },
    };
  }

  if (pathname.includes("/api/dashboard-stats")) {
    const res = await tcpBridge.sendCommand(host, port, "GET_DASHBOARD_STATS", {}, timeout, isTls);
    if (res.statusCode && res.statusCode >= 400) {
      return {
        status: res.statusCode,
        statusText: "Error",
        headers: {},
        data: { statusCode: res.statusCode, message: res.message || res.error || "Failed to get dashboard stats", error: res.error },
      };
    }
    return {
      status: res.statusCode || 200,
      statusText: "OK",
      headers: {},
      data: { statusCode: res.statusCode || 200, message: res.message, data: res.data },
    };
  }

  // 16. User & Role Management
  if (pathname.includes("/api/auth/roles/permissions")) {
    const res = await tcpBridge.sendCommand(host, port, "LIST_PERMISSIONS", {}, timeout, isTls);
    if (res.statusCode && res.statusCode >= 400) {
      return {
        status: res.statusCode,
        statusText: "Error",
        headers: {},
        data: { statusCode: res.statusCode, message: res.message || res.error || "Failed to list permissions", error: res.error },
      };
    }
    return {
      status: res.statusCode || 200,
      statusText: "OK",
      headers: {},
      data: { statusCode: res.statusCode || 200, message: res.message, data: res.data },
    };
  }

  if (pathname.includes("/api/auth/roles")) {
    if (method === "GET") {
      const res = await tcpBridge.sendCommand(host, port, "LIST_ROLES", {}, timeout, isTls);
      if (res.statusCode && res.statusCode >= 400) {
        return {
          status: res.statusCode,
          statusText: "Error",
          headers: {},
          data: { statusCode: res.statusCode, message: res.message || res.error || "Failed to list roles", error: res.error },
        };
      }
      return {
        status: res.statusCode || 200,
        statusText: "OK",
        headers: {},
        data: { statusCode: res.statusCode || 200, message: res.message, data: res.data },
      };
    }

    if (method === "POST") {
      const roleName = String(body.roleName || "");
      const permissions = Array.isArray(body.permissions) ? body.permissions : [];
      const res = await tcpBridge.sendCommand(host, port, "CREATE_ROLE", { roleName, permissions }, timeout, isTls);
      if (res.statusCode && res.statusCode >= 400) {
        return {
          status: res.statusCode,
          statusText: "Error",
          headers: {},
          data: { statusCode: res.statusCode, message: res.message || res.error || "Failed to create role", error: res.error },
        };
      }
      return {
        status: res.statusCode || 201,
        statusText: "Created",
        headers: {},
        data: { statusCode: res.statusCode || 201, message: res.message, data: res.data },
      };
    }

    if (method === "DELETE") {
      const parts = pathname.split("/").filter(Boolean);
      const roleName = decodeURIComponent(parts[parts.length - 1] || "");
      const res = await tcpBridge.sendCommand(host, port, "DELETE_ROLE", { roleName }, timeout, isTls);
      if (res.statusCode && res.statusCode >= 400) {
        return {
          status: res.statusCode,
          statusText: "Error",
          headers: {},
          data: { statusCode: res.statusCode, message: res.message || res.error || "Failed to delete role", error: res.error },
        };
      }
      return {
        status: res.statusCode || 200,
        statusText: "OK",
        headers: {},
        data: { statusCode: res.statusCode || 200, message: res.message },
      };
    }
  }

  if (pathname.includes("/api/auth/change-password")) {
    const username = String(body.username || tcpBridge.getSavedUsername() || "");
    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");
    const res = await tcpBridge.sendCommand(host, port, "CHANGE_PASSWORD", {
      username,
      currentPassword,
      newPassword,
    }, timeout, isTls);
    if (res.statusCode && res.statusCode >= 400) {
      return {
        status: res.statusCode,
        statusText: "Error",
        headers: {},
        data: { statusCode: res.statusCode, message: res.message || res.error || "Failed to change password", error: res.error },
      };
    }
    // Update saved credentials and re-authenticate socket with the new password
    tcpBridge.setCredentials(username, newPassword);
    const authRes = await tcpBridge.sendCommand(host, port, "AUTHENTICATE", {
      username,
      password: newPassword,
    }, timeout, isTls);
    const authData = (authRes.data || {}) as { username?: string; role?: string; permissions?: string[] };
    return {
      status: 200,
      statusText: "OK",
      headers: {},
      data: {
        statusCode: 200,
        message: res.message || "Password changed successfully",
        data: {
          username,
          role: authData.role || "Super Admin",
          permissions: authData.permissions || [],
          mustChangePassword: false,
        },
      },
    };
  }

  if (pathname.includes("/api/auth/users")) {
    if (pathname.includes("/role")) {
      const parts = pathname.split("/").filter(Boolean);
      // /api/auth/users/:username/role -> index of users is parts[parts.indexOf("users") + 1]
      const userIdx = parts.indexOf("users");
      const username = userIdx >= 0 && parts[userIdx + 1] ? decodeURIComponent(parts[userIdx + 1]) : "";
      const role = String(body.role || "");
      const res = await tcpBridge.sendCommand(host, port, "UPDATE_USER_ROLE", { username, role }, timeout, isTls);
      if (res.statusCode && res.statusCode >= 400) {
        return {
          status: res.statusCode,
          statusText: "Error",
          headers: {},
          data: { statusCode: res.statusCode, message: res.message || res.error || "Failed to update role", error: res.error },
        };
      }
      return {
        status: res.statusCode || 200,
        statusText: "OK",
        headers: {},
        data: { statusCode: res.statusCode || 200, message: res.message },
      };
    }

    if (pathname.includes("/reset-password")) {
      const parts = pathname.split("/").filter(Boolean);
      const userIdx = parts.indexOf("users");
      const username = userIdx >= 0 && parts[userIdx + 1] ? decodeURIComponent(parts[userIdx + 1]) : "";
      const newPassword = String(body.newPassword || "");
      const res = await tcpBridge.sendCommand(host, port, "RESET_USER_PASSWORD", { username, newPassword }, timeout, isTls);
      if (res.statusCode && res.statusCode >= 400) {
        return {
          status: res.statusCode,
          statusText: "Error",
          headers: {},
          data: { statusCode: res.statusCode, message: res.message || res.error || "Failed to reset password", error: res.error },
        };
      }
      return {
        status: res.statusCode || 200,
        statusText: "OK",
        headers: {},
        data: { statusCode: res.statusCode || 200, message: res.message },
      };
    }

    if (method === "GET") {
      const res = await tcpBridge.sendCommand(host, port, "LIST_USERS", {}, timeout, isTls);
      if (res.statusCode && res.statusCode >= 400) {
        return {
          status: res.statusCode,
          statusText: "Error",
          headers: {},
          data: { statusCode: res.statusCode, message: res.message || res.error || "Failed to list users", error: res.error },
        };
      }
      return {
        status: res.statusCode || 200,
        statusText: "OK",
        headers: {},
        data: { statusCode: res.statusCode || 200, message: res.message, data: res.data },
      };
    }

    if (method === "POST") {
      const username = String(body.username || "");
      const password = String(body.password || "");
      const role = String(body.role || "");
      const res = await tcpBridge.sendCommand(host, port, "CREATE_USER", { username, password, role }, timeout, isTls);
      if (res.statusCode && res.statusCode >= 400) {
        return {
          status: res.statusCode,
          statusText: "Error",
          headers: {},
          data: { statusCode: res.statusCode, message: res.message || res.error || "Failed to create user", error: res.error },
        };
      }
      return {
        status: res.statusCode || 201,
        statusText: "Created",
        headers: {},
        data: { statusCode: res.statusCode || 201, message: res.message, data: res.data },
      };
    }

    if (method === "DELETE") {
      const parts = pathname.split("/").filter(Boolean);
      const userIdx = parts.indexOf("users");
      const username = userIdx >= 0 && parts[userIdx + 1] ? decodeURIComponent(parts[userIdx + 1]) : "";
      const res = await tcpBridge.sendCommand(host, port, "DELETE_USER", { username }, timeout, isTls);
      if (res.statusCode && res.statusCode >= 400) {
        return {
          status: res.statusCode,
          statusText: "Error",
          headers: {},
          data: { statusCode: res.statusCode, message: res.message || res.error || "Failed to delete user", error: res.error },
        };
      }
      return {
        status: res.statusCode || 200,
        statusText: "OK",
        headers: {},
        data: { statusCode: res.statusCode || 200, message: res.message },
      };
    }
  }

  // Fallback for unsupported features over TCP (Import/Export only)
  return {
    status: 400,
    statusText: "Bad Request",
    headers: {},
    data: {
      message: "This feature is not supported over TCP protocol. Please connect via HTTP or HTTPS.",
    },
  };
}

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
      if (fullUrl.protocol === "tcp:") {
        executeTcpRequest(fullUrl, config).then(resolve).catch(reject);
        return;
      }
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

// ──────────────────────────────────────────────────────────────────────────────
// Local AxioDB Storage IPC Handlers
// Replaces localStorage with embedded AxioDB for persistent app data.
// Collections: "connections" (saved server connections), "settings" (app prefs)
// ──────────────────────────────────────────────────────────────────────────────

// Connections — list all saved connections (deduplicated by instance identity)
ipcMain.handle("store:getConnections", async () => {
  try {
    const coll = await getLocalCollection("AppData", "connections");
    const result = await coll.query({}).exec();
    const data = result?.data as { documents: Record<string, unknown>[] } | undefined;
    const rawDocs = data?.documents ?? [];

    // Deduplicate by instance identity: name + host + port + username
    const map = new Map<string, Record<string, unknown>>();
    for (const doc of rawDocs) {
      if (!doc) continue;
      const key = `${String(doc.name || "").trim().toLowerCase()}@${doc.host}:${doc.port}:${doc.username || ""}`;
      if (!map.has(key)) {
        map.set(key, doc);
      } else {
        const existing = map.get(key)!;
        map.set(key, { ...existing, ...doc, id: existing.id || doc.id });
      }
    }
    return Array.from(map.values());
  } catch (err) {
    console.error("[Store] Failed to get connections:", err);
    return [];
  }
});

// Connections — save (insert or update) a connection without creating duplicates
ipcMain.handle("store:saveConnection", async (_event, connection: Record<string, unknown>) => {
  try {
    const coll = await getLocalCollection("AppData", "connections");
    let existingDoc: Record<string, unknown> | null = null;

    if (connection.id) {
      const existing = await coll.query({ id: connection.id }).exec();
      const docs = (existing?.data as { documents: Record<string, unknown>[] } | undefined)?.documents;
      if (docs && docs.length > 0) {
        existingDoc = docs[0];
      }
    }

    // If not matched by id, match by instance identity (name + host + port or host + port + username)
    if (!existingDoc && connection.host && connection.port) {
      const allRes = await coll.query({}).exec();
      const allDocs = (allRes?.data as { documents: Record<string, unknown>[] } | undefined)?.documents ?? [];
      const match = allDocs.find((c) =>
        (String(c.name || "").trim().toLowerCase() === String(connection.name || "").trim().toLowerCase() &&
          c.host === connection.host &&
          Number(c.port) === Number(connection.port)) ||
        (c.host === connection.host &&
          Number(c.port) === Number(connection.port) &&
          c.username === connection.username)
      );
      if (match) {
        existingDoc = match;
      }
    }

    if (existingDoc && existingDoc.id) {
      connection.id = existingDoc.id;
      await coll.update({ id: existingDoc.id }).UpdateOne(connection);
    } else {
      await coll.insert(connection);
    }
    return { success: true };
  } catch (err) {
    console.error("[Store] Failed to save connection:", err);
    return { success: false, error: String(err) };
  }
});

// Connections — delete a connection by id
ipcMain.handle("store:deleteConnection", async (_event, id: string) => {
  try {
    const coll = await getLocalCollection("AppData", "connections");
    await coll.delete({ id }).deleteOne();
    return { success: true };
  } catch (err) {
    console.error("[Store] Failed to delete connection:", err);
    return { success: false, error: String(err) };
  }
});

// Settings — get a setting value by key
ipcMain.handle("store:getSetting", async (_event, key: string) => {
  try {
    const coll = await getLocalCollection("AppData", "settings");
    const result = await coll.query({ key }).exec();
    const data = result?.data as { documents: { value?: unknown }[] } | undefined;
    return data?.documents[0]?.value ?? null;
  } catch (err) {
    console.error("[Store] Failed to get setting:", err);
    return null;
  }
});

// Settings — set a setting value (upsert by key)
ipcMain.handle("store:setSetting", async (_event, key: string, value: unknown) => {
  try {
    const coll = await getLocalCollection("AppData", "settings");
    const existing = await coll.query({ key }).exec();
    const existingData = existing?.data as { documents: Record<string, unknown>[] } | undefined;
    if (existingData?.documents && existingData.documents.length > 0) {
      await coll.update({ key }).UpdateOne({ key, value });
    } else {
      await coll.insert({ key, value });
    }
    return { success: true };
  } catch (err) {
    console.error("[Store] Failed to set setting:", err);
    return { success: false, error: String(err) };
  }
});

// Settings — delete a setting by key
ipcMain.handle("store:deleteSetting", async (_event, key: string) => {
  try {
    const coll = await getLocalCollection("AppData", "settings");
    await coll.delete({ key }).deleteOne();
    return { success: true };
  } catch (err) {
    console.error("[Store] Failed to delete setting:", err);
    return { success: false, error: String(err) };
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// Feature 1: Saved Queries & Snippet Library (AppData / saved_queries)
// ──────────────────────────────────────────────────────────────────────────────
ipcMain.handle("store:saveQuerySnippet", async (_event, snippet: { id?: string; name: string; query: string; collection?: string; database?: string }) => {
  try {
    const coll = await getLocalCollection("AppData", "saved_queries");
    const id = snippet.id || crypto.randomUUID();
    const doc = { ...snippet, id, updatedAt: Date.now() };
    if (snippet.id) {
      await coll.update({ id }).UpdateOne(doc);
    } else {
      await coll.insert(doc);
    }
    return { success: true, id };
  } catch (err) {
    console.error("[Store] Failed to save query snippet:", err);
    return { success: false, error: String(err) };
  }
});

ipcMain.handle("store:getSavedQueries", async () => {
  try {
    const coll = await getLocalCollection("AppData", "saved_queries");
    const res = await coll.query({}).exec();
    const docs = (res?.data as { documents: Record<string, unknown>[] } | undefined)?.documents || [];
    return docs.sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
  } catch (err) {
    console.error("[Store] Failed to get saved queries:", err);
    return [];
  }
});

ipcMain.handle("store:deleteSavedQuery", async (_event, id: string) => {
  try {
    const coll = await getLocalCollection("AppData", "saved_queries");
    await coll.delete({ id }).deleteOne();
    return { success: true };
  } catch (err) {
    console.error("[Store] Failed to delete saved query:", err);
    return { success: false, error: String(err) };
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// Feature 2: Query Execution History (AppData / query_history)
// ──────────────────────────────────────────────────────────────────────────────
ipcMain.handle("store:saveQueryHistory", async (_event, entry: { query: string; collection?: string; database?: string; durationMs?: number; status: string; error?: string }) => {
  try {
    const coll = await getLocalCollection("AppData", "query_history");
    const doc = {
      id: crypto.randomUUID(),
      ...entry,
      timestamp: Date.now(),
    };
    await coll.insert(doc);

    // Keep last 50 queries
    const res = await coll.query({}).exec();
    const docs = (res?.data as { documents: { id: string; timestamp?: number }[] } | undefined)?.documents || [];
    if (docs.length > 50) {
      docs.sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0));
      const toRemove = docs.slice(0, docs.length - 50);
      for (const oldDoc of toRemove) {
        await coll.delete({ id: oldDoc.id }).deleteOne().catch(() => {});
      }
    }
    return { success: true };
  } catch (err) {
    console.error("[Store] Failed to save query history:", err);
    return { success: false, error: String(err) };
  }
});

ipcMain.handle("store:getQueryHistory", async (_event, limit = 25) => {
  try {
    const coll = await getLocalCollection("AppData", "query_history");
    const res = await coll.query({}).exec();
    const docs = (res?.data as { documents: Record<string, unknown>[] } | undefined)?.documents || [];
    docs.sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));
    return docs.slice(0, limit);
  } catch (err) {
    console.error("[Store] Failed to get query history:", err);
    return [];
  }
});

ipcMain.handle("store:clearQueryHistory", async () => {
  try {
    const coll = await getLocalCollection("AppData", "query_history");
    await coll.delete({}).deleteMany().catch(() => {});
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// Feature 3: Audit Log & Activity Trail (AppData / audit_logs)
// ──────────────────────────────────────────────────────────────────────────────
ipcMain.handle("store:logActivity", async (_event, entry: { action: string; database?: string; collection?: string; details?: string; status?: string }) => {
  try {
    const coll = await getLocalCollection("AppData", "audit_logs");
    const doc = {
      id: crypto.randomUUID(),
      ...entry,
      status: entry.status || "success",
      timestamp: Date.now(),
    };
    await coll.insert(doc);

    // Cap to 100 entries
    const res = await coll.query({}).exec();
    const docs = (res?.data as { documents: { id: string; timestamp?: number }[] } | undefined)?.documents || [];
    if (docs.length > 100) {
      docs.sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0));
      const toRemove = docs.slice(0, docs.length - 100);
      for (const oldDoc of toRemove) {
        await coll.delete({ id: oldDoc.id }).deleteOne().catch(() => {});
      }
    }
    return { success: true };
  } catch (err) {
    console.error("[Store] Failed to log activity:", err);
    return { success: false, error: String(err) };
  }
});

ipcMain.handle("store:getAuditLogs", async (_event, limit = 50) => {
  try {
    const coll = await getLocalCollection("AppData", "audit_logs");
    const res = await coll.query({}).exec();
    const docs = (res?.data as { documents: Record<string, unknown>[] } | undefined)?.documents || [];
    docs.sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));
    return docs.slice(0, limit);
  } catch (err) {
    console.error("[Store] Failed to get audit logs:", err);
    return [];
  }
});

ipcMain.handle("store:clearAuditLogs", async () => {
  try {
    const coll = await getLocalCollection("AppData", "audit_logs");
    await coll.delete({}).deleteMany().catch(() => {});
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// Feature 5: Latency & Health Trend History (AppData / performance_history)
// ──────────────────────────────────────────────────────────────────────────────
ipcMain.handle("store:recordPerformanceSample", async (_event, sample: { latency: number; storageMB?: number; cacheMB?: number }) => {
  try {
    const coll = await getLocalCollection("AppData", "performance_history");
    const doc = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      latency: sample.latency,
      storageMB: sample.storageMB ?? 0,
      cacheMB: sample.cacheMB ?? 0,
    };
    await coll.insert(doc);

    // Cap to last 60 samples
    const res = await coll.query({}).exec();
    const docs = (res?.data as { documents: { id: string; timestamp?: number }[] } | undefined)?.documents || [];
    if (docs.length > 60) {
      docs.sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0));
      const toRemove = docs.slice(0, docs.length - 60);
      for (const oldDoc of toRemove) {
        await coll.delete({ id: oldDoc.id }).deleteOne().catch(() => {});
      }
    }
    return { success: true };
  } catch (err) {
    console.error("[Store] Failed to record performance sample:", err);
    return { success: false, error: String(err) };
  }
});

ipcMain.handle("store:getPerformanceHistory", async () => {
  try {
    const coll = await getLocalCollection("AppData", "performance_history");
    const res = await coll.query({}).exec();
    const docs = (res?.data as { documents: Record<string, unknown>[] } | undefined)?.documents || [];
    return docs.sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0));
  } catch (err) {
    console.error("[Store] Failed to get performance history:", err);
    return [];
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// Feature 6: Workspace Layout & Pinned Collections (AppData / workspace_prefs)
// ──────────────────────────────────────────────────────────────────────────────
ipcMain.handle("store:getPinnedCollections", async () => {
  try {
    const coll = await getLocalCollection("AppData", "workspace_prefs");
    const res = await coll.query({ key: "pinned_collections" }).exec();
    const data = (res?.data as { documents: { value?: { dbName: string; collName: string }[] }[] } | undefined)?.documents;
    return data?.[0]?.value || [];
  } catch (err) {
    console.error("[Store] Failed to get pinned collections:", err);
    return [];
  }
});

ipcMain.handle("store:togglePinCollection", async (_event, item: { dbName: string; collName: string }) => {
  try {
    const coll = await getLocalCollection("AppData", "workspace_prefs");
    const res = await coll.query({ key: "pinned_collections" }).exec();
    const docs = (res?.data as { documents: { id?: string; key: string; value?: { dbName: string; collName: string }[] }[] } | undefined)?.documents || [];
    let currentList = docs[0]?.value || [];

    const exists = currentList.some((p) => p.dbName === item.dbName && p.collName === item.collName);
    if (exists) {
      currentList = currentList.filter((p) => !(p.dbName === item.dbName && p.collName === item.collName));
    } else {
      currentList = [...currentList, item];
    }

    if (docs.length > 0) {
      await coll.update({ key: "pinned_collections" }).UpdateOne({ key: "pinned_collections", value: currentList });
    } else {
      await coll.insert({ key: "pinned_collections", value: currentList });
    }
    return { success: true, pinned: !exists, list: currentList };
  } catch (err) {
    console.error("[Store] Failed to toggle pin collection:", err);
    return { success: false, error: String(err) };
  }
});

// Binary file download — streams a binary HTTP response straight to disk via a save dialog.
// The export endpoint returns a tar.gz archive that cannot survive the JSON round-trip of
// `network:request`, so this handler pipes the raw Buffer stream into a WriteStream.
ipcMain.handle(
  "network:exportDatabase",
  async (_event, { dbName, baseUrl }: { dbName: string; baseUrl: string }) => {
    if (!mainWindow) throw new Error("No main window available");

    const saveResult = await dialog.showSaveDialog(mainWindow, {
      title: "Export Database",
      defaultPath: `${dbName}.tar.gz`,
      filters: [
        { name: "GZIP archives (*.tar.gz, *.tgz)", extensions: ["tar.gz", "tgz"] },
        { name: "All files", extensions: ["*"] },
      ],
    });

    if (saveResult.canceled || !saveResult.filePath) {
      return { canceled: true };
    }

    if (baseUrl.startsWith("tcp://")) {
      const fullUrl = new URL(baseUrl);
      const host = fullUrl.hostname || "127.0.0.1";
      const port = parseInt(fullUrl.port || "27019", 10);
      const isTls = fullUrl.searchParams.get("tls") === "true";

      const chunkSize = 2 * 1024 * 1024;
      const firstRes = await tcpBridge.sendCommand(
        host,
        port,
        "EXPORT_DATABASE",
        { dbName, chunkIndex: 0, chunkSize },
        60000,
        isTls
      );

      if (firstRes.statusCode && (firstRes.statusCode < 200 || firstRes.statusCode >= 300)) {
        throw new Error(firstRes.message || firstRes.error || "Export failed over TCP");
      }

      const expData = firstRes.data as {
        chunkIndex: number;
        totalChunks: number;
        totalSize: number;
        data: string;
        isLast: boolean;
      };
      const totalChunks = expData.totalChunks;
      const fileStream = fs.createWriteStream(saveResult.filePath);
      const firstBuf = Buffer.from(expData.data, "base64");
      fileStream.write(firstBuf);
      let downloadedBytes = firstBuf.length;

      for (let i = 1; i < totalChunks; i++) {
        const chunkRes = await tcpBridge.sendCommand(
          host,
          port,
          "EXPORT_DATABASE",
          { dbName, chunkIndex: i, chunkSize },
          60000,
          isTls
        );
        if (chunkRes.statusCode && (chunkRes.statusCode < 200 || chunkRes.statusCode >= 300)) {
          fileStream.close();
          await fs.promises.unlink(saveResult.filePath).catch(() => {});
          throw new Error(chunkRes.message || chunkRes.error || `Export chunk ${i} failed`);
        }
        const cData = chunkRes.data as { data: string };
        const chunkBuf = Buffer.from(cData.data, "base64");
        fileStream.write(chunkBuf);
        downloadedBytes += chunkBuf.length;
      }

      await new Promise<void>((resolve, reject) => {
        fileStream.end(() => resolve());
        fileStream.on("error", reject);
      });

      return {
        canceled: false,
        success: true,
        filePath: saveResult.filePath,
        bytes: downloadedBytes,
      };
    }

    return new Promise((resolve, reject) => {
      try {
        const fullUrl = new URL(`${baseUrl.replace(/\/+$/, "")}/api/db/export-database/`);
        fullUrl.searchParams.append("dbName", dbName);

        const isHttps = fullUrl.protocol === "https:";
        const client = isHttps ? https : http;
        const hostKey = `${fullUrl.protocol}//${fullUrl.host}`;
        const savedCookie = cookieStore.get(hostKey);

        const requestHeaders: Record<string, string> = {
          "User-Agent": "AxioDB-Control/22.3.1 (Desktop)",
          Accept: "*/*",
        };
        if (savedCookie) {
          requestHeaders["Cookie"] = savedCookie;
        }

        const req = client.request(
          {
            hostname: fullUrl.hostname,
            port: fullUrl.port || (isHttps ? 443 : 80),
            path: `${fullUrl.pathname}${fullUrl.search}`,
            method: "GET",
            headers: requestHeaders,
            timeout: 180000,
          },
          (res) => {
            if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
              let errorBody = "";
              res.on("data", (chunk) => {
                errorBody += chunk.toString("utf8");
              });
              res.on("end", () => {
                try {
                  const parsed = JSON.parse(errorBody);
                  reject(
                    new Error(
                      (parsed.message as string) ||
                        `Export failed with status ${res.statusCode}`,
                    ),
                  );
                } catch {
                  reject(
                    new Error(`Export failed with status ${res.statusCode}`),
                  );
                }
              });
              return;
            }

            const fileStream = fs.createWriteStream(saveResult.filePath);
            let downloadedBytes = 0;

            res.on("data", (chunk) => {
              downloadedBytes += chunk.length;
            });

            res.pipe(fileStream);

            fileStream.on("finish", () => {
              fileStream.close(() => {
                resolve({
                  canceled: false,
                  success: true,
                  filePath: saveResult.filePath,
                  bytes: downloadedBytes,
                });
              });
            });

            fileStream.on("error", (err) => {
              fs.unlink(saveResult.filePath, () => {});
              reject(err);
            });
          },
        );

        req.on("error", (err) => reject(err));
        req.on("timeout", () => {
          req.destroy();
          reject(new Error("Export timed out after 180000ms"));
        });

        req.end();
      } catch (err: unknown) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  },
);
