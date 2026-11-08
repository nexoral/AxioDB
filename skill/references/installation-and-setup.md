# AxioDB Installation and Setup Guide

## 1. Core NPM Package Installation

For Node.js applications (backend services, API servers, Express/Fastify/NestJS), install the embedded engine directly:

```bash
# Using npm
npm install axiodb@latest

# Using pnpm
pnpm add axiodb@latest

# Using yarn
yarn add axiodb@latest
```

**System Requirements**:
- Node.js `>= 20.0.0`
- Zero external native dependencies required (no build tools needed).

---

## 2. CLI Tool Installation

The AxioDB CLI provides a MongoDB-style interactive REPL, admin commands, and temporary server spinning.

### Download from GitHub Releases

Pre-compiled standalone binaries with SHA-256 checksums are published on [GitHub Releases](https://github.com/nexoral/AxioDB/releases/latest):

- **Linux (x64 / arm64)**: `axiodb_linux_amd64` / `axiodb_linux_arm64`
- **macOS (Intel / Apple Silicon)**: `axiodb_darwin_amd64` / `axiodb_darwin_arm64`
- **Windows (x64 / arm64)**: `axiodb_windows_amd64.exe` / `axiodb_windows_arm64.exe`

Quick setup example on Linux/macOS:
```bash
# Download binary (replace linux_amd64 with your OS/architecture)
curl -fsSL https://github.com/nexoral/AxioDB/releases/latest/download/axiodb_linux_amd64 -o axiodb
chmod +x axiodb
sudo mv axiodb /usr/local/bin/
```

### Verify CLI Installation

```bash
axiodb version
axiodb --help
```

---

## 3. Desktop GUI Installation (Electron App)

AxioDB provides a cross-platform desktop application featuring visual database inspection, card-based document viewing, and live performance metrics.

### Download from GitHub Releases

Download the installer or portable package for your platform from [GitHub Releases](https://github.com/nexoral/AxioDB/releases/latest):
- **Linux**: Download `.deb` (Debian/Ubuntu) or `.AppImage` (portable).
- **macOS**: Download `.zip`, extract, and move `AxioDB Control.app` into `/Applications`.
- **Windows**: Download `.exe` installer (NSIS) and run the setup wizard.

---

## 4. HTTP Control Server & REST API

AxioDB includes an HTTP Control Server serving Fastify REST API endpoints on port `27018`.

### Starting the HTTP Control Server in Node.js Code

```typescript
import { AxioDB } from "axiodb";

// Enable the HTTP Control Server
const db = new AxioDB({
  HTTP: true,                    // Launches HTTP Control Server on port 27018
  RootName: "MyProductionDB",    // Root database directory name
  CustomPath: "./data",          // Directory where databases persist
});

// Access http://localhost:27018/api/* for REST endpoints
```

### Starting via Docker

```bash
docker run -d \
  --name axiodb-server \
  -p 27018:27018 \
  -p 27019:27019 \
  -v axiodb-data:/app \
  theankansaha/axiodb
```
Visiting `http://localhost:27018` displays welcome and desktop GUI installation commands. All REST endpoints are under `/api/*`.

---

## 5. Mock / Ephemeral Server for Testing & CI

When writing tests or CI/CD pipelines, you frequently need an isolated AxioDB server without persisting test data.

### Option A: Using CLI Temporary Server (`axiodb serve`)

The CLI includes a built-in command to spin up temporary local servers:

```bash
# 1. Start HTTP REST API only (Port 27018)
axiodb serve http

# 2. Start TCP server without auth (Port 27019)
axiodb serve tcp

# 3. Start TCP server with authentication and initial admin password
axiodb serve tcp-auth "<ADMIN_PASSWORD>"

# 4. Start Full stack (HTTP 27018 + TCP 27019 with auth)
axiodb serve full "<ADMIN_PASSWORD>"
```

### Option B: Ephemeral In-Memory / Isolated Temp Directory in Code

For unit/integration test suites (e.g., Jest, Vitest, Mocha), initialize AxioDB in a temporary directory and tear it down after testing:

```typescript
import { AxioDB } from "axiodb";
import fs from "fs";
import path from "path";
import os from "os";

describe("Database Integration Tests", () => {
  let db: AxioDB;
  let tempDir: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "axiodb-test-"));
    db = new AxioDB({
      RootName: "TestDB",
      CustomPath: tempDir,
      Cache: true,
      minTTL: 1,
      maxTTL: 2,
    });
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test("should insert and query document", async () => {
    const database = await db.createDB("testing");
    const col = await database.createCollection("items");
    const doc = await col.insert({ sku: "TEST-01", price: 99 });
    expect(doc.status).toBe(true);

    const queryResult = await col.query({ sku: "TEST-01" }).exec();
    expect(queryResult.status).toBe(true);
  });
});
```
