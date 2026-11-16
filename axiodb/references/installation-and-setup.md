# AxioDB Installation and Setup Guide

<package_install>
## 1. Core NPM Package Installation

AxioDB is a pure TypeScript/JavaScript package requiring Node.js >= 22 (or Bun >= 1.4.0). No C++ compiler or native build step required:

```bash
# Using npm
npm install axiodb

# Using pnpm
pnpm add axiodb

# Using yarn
yarn add axiodb
```
</package_install>

<binary_downloads>
## 2. CLI Tool & Desktop GUI

### Standalone Terminal CLI (Go Binary)
The AxioDB CLI provides an interactive REPL shell and export/backup tools without Node.js:
1. Download from [GitHub Releases](https://github.com/nexoral/AxioDB/releases/latest) for your target platform (`linux_amd64`, `darwin_arm64`, `windows_amd64.exe`).
2. Make executable and move to PATH:
   ```bash
   chmod +x axiodb && sudo mv axiodb /usr/local/bin/
   axiodb --version
   ```

### Desktop GUI (Electron App)
For visual collection browsing and index inspection without a web browser:
* Download `.AppImage` / `.deb` (Linux), `.dmg` (macOS), or `.exe` installer (Windows) from [GitHub Releases](https://github.com/nexoral/AxioDB/releases/latest).
</binary_downloads>

<control_server>
## 3. In-Code HTTP & TCP Server Options

Start the HTTP Fastify server (Port 27018) or TCP server (Port 27019) directly within your Node.js application:

```typescript
import { AxioDB } from "axiodb";

const db = new AxioDB({
  RootName: "ProductionDB",
  CustomPath: "./data",
  HTTP: true,             // Enable REST API on port 27018
  TCP: true,              // Enable binary TCP on port 27019
  AdminPassword: "MyAdminPassword123", // Pre-seed password to bypass TCP lock
  Cache: true,
});
```
</control_server>

<testing_ephemeral_setup>
## 4. Ephemeral Setup for CI & Unit Tests

To run integration tests in isolation without polluting local storage or causing concurrency collisions:

```typescript
import { AxioDB } from "axiodb";
import fs from "fs/promises";
import os from "os";
import path from "path";

// Setup ephemeral instance in temp folder
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "axiodb-test-"));
const db = new AxioDB({
  RootName: "TestDB",
  CustomPath: tempDir,
  Cache: false,           // Disable cache to ensure 100% disk roundtrip
});

const database = await db.createDB("test_db");
const testCol = await database.createCollection("items");

// ... Execute test assertions ...

// Teardown: Stop instance and clean temp directory
await db.stop();
await fs.rm(tempDir, { recursive: true, force: true });
```
</testing_ephemeral_setup>
