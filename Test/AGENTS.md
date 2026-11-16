# Test/ — Test Suites (Agent Instructions)

Global rules live in [../AGENTS.md](../AGENTS.md). This file only adds `Test/` specifics — read the root first.

**Role** — the project's whole test surface. No Jest/Mocha — a small hand-rolled runner. Suites are **node-based JavaScript** run against the **compiled** `lib/` build, so `npm run build` must pass first.

## Directory Map

* **`node/`** — Primary Node.js test runner & suites
  * `run.js` — Orchestrator spawning suites in child processes
  * `helpers/` — `TestRunner.js` (base class), `assertions.js` (`assert.*`), `fixtures.js` (shared data)
  * `modules/*.test.js` — 14 integration test suites
* **`bun/`** — Bun runtime verification test runner
  * `run.js` (orchestrator), `helpers/`, `modules/*.test.js`
* **`deno/`** — Deno runtime verification test suite

## The 14 suites

`crud` · `transaction` · `read` · `aggregation` · `auth` · `http-api` · `tcp-auth` · `tcp-noauth` · `tcp-transaction` · `tcp-tls` · `crash-recovery` · `mcp-confirm` · `mcp-functional` · `cache-options`

## Commands

```bash
npm run node-test              # all suites under Node (ask before running — slow)
npm run node-test crud         # one suite under Node — run directly, no permission needed
npm run bun-test               # all suites under Bun (ask before running — slow)
npm run bun-test crud          # one suite under Bun — run directly, no permission needed
```

## Why child processes

`new AxioDB()` is a **singleton** — a second instance in the same process throws. `run.js` therefore spawns one `node` (or `bun`) child per suite with `cwd` at the repo root. Never require two DB instances in one suite.

## Writing a suite

```js
const TestRunner = require('../helpers/TestRunner');
const { assert } = require('../helpers/assertions');
const fixtures = require('../helpers/fixtures');
const fs = require('fs');
const { AxioDB } = require('../../../lib/config/DB.js');   // compiled output, not source/

class MyTests extends TestRunner {
  constructor() { super('My Test Suite'); }
  async setUp() { /* rm old temp dir, init DB with { HTTP: false, CustomPath: <temp> } */ }
  async tearDown() { /* rm -rf the temp dir */ }
  async runTests() {
    await this.describe('Group', async () => {
      await this.test('does the thing', async () => {
        assert.isSuccess(await this.collection.insert(fixtures.sampleUser()));
      });
    });
  }
}
module.exports = MyTests;
```

Then register the file in the `testModules` map in `run.js` (key = suite name used on CLI).

## Hard rules

* Require from `../../../lib/...` — tests run against the build. Rebuild before trusting results.
* Use `fixtures` for data, not inline literals, where a fixture fits.
* Always clean up in `setUp()` **and** `tearDown()` — leave no temp dirs; tests must be re-runnable and parallel-safe.
* A `setUp()`/`runTests()` throw already counts as a failure (see `TestRunner.run`) — don't swallow it.
* `fixtures.js` is shared; changing it ripples across suites.
* ESLint ignores `Test/**` — this is plain JS with `require`, not part of the typed core.

## Done for this folder

- [ ] `npm run build` first, then the affected suite(s) green
- [ ] New/changed feature has a suite; new suite registered in `run.js`
- [ ] Temp dirs cleaned; no leaked DB instances; CI gates (auth, tcp-*, http-api, mcp-functional, crud/transaction/read/crash-recovery/mcp-confirm) considered
