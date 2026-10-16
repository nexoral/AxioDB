# Test/ — Test Suites (Agent Instructions)

Global rules live in [../AGENTS.md](../AGENTS.md). This file only adds `Test/` specifics — read the root first.

**Role** — the project's whole test surface. No Jest/Mocha — a small hand-rolled runner. Suites are **node-based JavaScript** run against the **compiled** `lib/` build, so `npm run build` must pass first.

## Layout

```
run.js                    orchestrator — spawns each suite in a child process
helpers/TestRunner.js     base class: test(), describe(), run(), printResults()
helpers/assertions.js     assert.* (isSuccess, isError, throws, equal, includes, …)
helpers/fixtures.js       shared sample data
modules/*.test.js         the suites
key.js                    legacy benchmark data (Data_To_Loop_*, schema, …)
```

## The 14 suites

`crud` · `transaction` · `read` · `aggregation` · `auth` · `http-api` · `tcp-auth` · `tcp-noauth` · `tcp-transaction` · `tcp-tls` · `crash-recovery` · `mcp-confirm` · `mcp-functional` · `cache-options`

## Commands

```bash
npm test              # all suites (ask before running — slow)
npm test crud         # one suite — run directly, no permission needed
```

## Why child processes

`new AxioDB()` is a **singleton** — a second instance in the same process throws. `run.js` therefore spawns one `node` child per suite with `cwd` at the repo root. Never require two DB instances in one suite.

## Writing a suite

```js
const TestRunner = require('../helpers/TestRunner');
const { assert } = require('../helpers/assertions');
const fixtures = require('../helpers/fixtures');
const fs = require('fs');
const { AxioDB } = require('../../lib/config/DB.js');   // compiled output, not source/

class MyTests extends TestRunner {
  constructor() { super('My Test Suite'); }
  async setUp() { /* rm old temp dir, init DB with { GUI: false, CustomPath: <temp> } */ }
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

* Require from `../../lib/...` — tests run against the build. Rebuild before trusting results.
* Use `fixtures` for data, not inline literals, where a fixture fits.
* Always clean up in `setUp()` **and** `tearDown()` — leave no temp dirs; tests must be re-runnable and parallel-safe.
* A `setUp()`/`runTests()` throw already counts as a failure (see `TestRunner.run`) — don't swallow it.
* `fixtures.js` and `key.js` are shared; changing them ripples across suites.
* ESLint ignores `Test/**` — this is plain JS with `require`, not part of the typed core.

## Done for this folder

- [ ] `npm run build` first, then the affected suite(s) green
- [ ] New/changed feature has a suite; new suite registered in `run.js`
- [ ] Temp dirs cleaned; no leaked DB instances; CI gates (auth, tcp-*, http-api, mcp-functional, crud/transaction/read/crash-recovery/mcp-confirm) considered
