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

### One-Line Install Script (Linux & macOS)

```bash
# Interactive installation (Menu: 1 -> CLI, 2 -> GUI, 3 -> Both)
curl -fsSL https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.sh | bash

# Non-interactive CLI-only installation
curl -fsSL https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.sh | CHOICE=1 bash
```

### Windows Installation (PowerShell)

```powershell
irm https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.ps1 | iex
```

### Verify CLI Installation

```bash
axiodb version
axiodb --help
```

---

## 3. Desktop GUI Installation (Electron App)

AxioDB provides a cross-platform desktop application featuring visual database inspection, card-based document viewing, and live performance metrics.

### Automated Script Install

```bash
# Linux: Install Desktop GUI (.deb or .AppImage)
curl -fsSL https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.sh | CHOICE=2 bash

# Linux: Install both CLI and Desktop GUI
curl -fsSL https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.sh | CHOICE=3 bash
```

### Manual Binary Download (GitHub Releases)
- **Linux**: Download `.deb` (Debian/Ubuntu) or `.AppImage` (portable).
- **macOS**: Download `.zip`, extract, and drag `AxioDB Control.app` into `/Applications`.
- **Windows**: Download `.exe` installer (NSIS) and run the setup wizard.

---

## 4. Web-Based GUI Dashboard

If you prefer browser access without installing the Electron desktop application, AxioDB includes a built-in Web GUI served by the HTTP Control Server on port `27018`.

### Starting the Web GUI in Node.js Code

```typescript
import { AxioDB } from "axiodb";

// Enable the HTTP Control Server + Web GUI
const db = new AxioDB({
  GUI: true,                     // Launches HTTP Control Server on port 27018
  RootName: "MyProductionDB",    // Root database directory name
  CustomPath: "./data",          // Directory where databases persist
});

// Navigate to http://localhost:27018 in any browser
```

### Starting the Web GUI via Docker

```bash
docker run -d \
  --name axiodb-server \
  -p 27018:27018 \
  -p 27019:27019 \
  -v axiodb-data:/app \
  theankansaha/axiodb
```
Open `http://localhost:27018` in your browser.

---

## 5. Mock / Ephemeral Server for Testing & CI

When writing tests or CI/CD pipelines, you frequently need an isolated AxioDB server without persisting test data.

### Option A: Using CLI Temporary Server (`axiodb serve`)

The CLI includes a built-in command to spin up temporary local servers:

```bash
# 1. Start HTTP API & Web GUI only (Port 27018)
axiodb serve http

# 2. Start TCP server without auth (Port 27019)
axiodb serve tcp

# 3. Start TCP server with authentication and initial admin password
axiodb serve tcp-auth my-admin-password

# 4. Start Full stack (HTTP 27018 + TCP 27019 with auth)
axiodb serve full my-admin-password
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
