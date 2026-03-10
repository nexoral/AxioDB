/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */

/**
 * TestRunner - Base class for all test modules
 * Provides common test utilities, timing, and result tracking
 */
class TestRunner {
  constructor(suiteName) {
    this.suiteName = suiteName;
    this.testResults = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      failures: [],
      timings: []
    };
  }

  // Color output helpers
  colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
    gray: '\x1b[90m'
  };

  log(message, type = 'info') {
    const colorMap = {
      info: this.colors.blue,
      success: this.colors.green,
      error: this.colors.red,
      warning: this.colors.yellow,
      gray: this.colors.gray
    };
    const color = colorMap[type] || this.colors.reset;
    console.log(`${color}${message}${this.colors.reset}`);
  }

  /**
   * Run a single test case with timing and result tracking
   */
  async test(description, testFn, options = {}) {
    const { skip = false, timeout = 30000 } = options;
    this.testResults.total++;

    if (skip) {
      this.testResults.skipped++;
      this.log(`  ⏭️  SKIPPED: ${description}`, 'warning');
      return;
    }

    const startTime = Date.now();
    console.log(`\n  🧪 ${description}`);

    try {
      // Wrap test in timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Test timeout after ${timeout}ms`)), timeout);
      });

      await Promise.race([testFn(), timeoutPromise]);

      const duration = Date.now() - startTime;
      this.testResults.passed++;
      this.testResults.timings.push({ description, duration });
      this.log(`     ✅ PASSED (${duration}ms)`, 'success');
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.failed++;
      this.testResults.failures.push({
        description,
        error: error.message || error,
        duration
      });
      this.log(`     ❌ FAILED (${duration}ms): ${error.message || error}`, 'error');
    }
  }

  /**
   * Run a test group (describe block)
   */
  async describe(groupName, testsFn) {
    console.log(`\n${this.colors.bright}📂 ${groupName}${this.colors.reset}`);
    await testsFn();
  }

  /**
   * Setup method to be overridden by test modules
   */
  async setUp() {
    // Override in subclass
  }

  /**
   * Teardown method to be overridden by test modules
   */
  async tearDown() {
    // Override in subclass
  }

  /**
   * Main test execution method - to be overridden
   */
  async runTests() {
    throw new Error('runTests() must be implemented by subclass');
  }

  /**
   * Execute the full test suite
   */
  async run() {
    console.log('\n' + '═'.repeat(60));
    console.log(`${this.colors.bright}🚀 ${this.suiteName}${this.colors.reset}`);
    console.log('═'.repeat(60));

    const suiteStartTime = Date.now();

    try {
      await this.setUp();
      await this.runTests();
    } catch (error) {
      this.log(`Suite error: ${error.message}`, 'error');
    } finally {
      try {
        await this.tearDown();
      } catch (error) {
        this.log(`Teardown error: ${error.message}`, 'warning');
      }
    }

    const suiteDuration = Date.now() - suiteStartTime;
    return { ...this.testResults, suiteDuration };
  }

  /**
   * Get results summary
   */
  getResults() {
    return this.testResults;
  }

  /**
   * Print detailed results
   */
  printResults() {
    console.log('\n' + '─'.repeat(60));
    console.log(`${this.colors.bright}📊 ${this.suiteName} Results${this.colors.reset}`);
    console.log('─'.repeat(60));

    console.log(`  Total:   ${this.testResults.total}`);
    this.log(`  Passed:  ${this.testResults.passed}`, 'success');
    if (this.testResults.failed > 0) {
      this.log(`  Failed:  ${this.testResults.failed}`, 'error');
    }
    if (this.testResults.skipped > 0) {
      this.log(`  Skipped: ${this.testResults.skipped}`, 'warning');
    }

    const rate = this.testResults.total > 0
      ? ((this.testResults.passed / this.testResults.total) * 100).toFixed(1)
      : 0;
    console.log(`  Rate:    ${rate}%`);

    if (this.testResults.failures.length > 0) {
      console.log('\n  Failures:');
      this.testResults.failures.forEach((f, i) => {
        this.log(`    ${i + 1}. ${f.description}`, 'error');
        this.log(`       ${f.error}`, 'gray');
      });
    }
  }
}

module.exports = TestRunner;
