/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * AxioDB Test Suite Runner
 * 
 * Due to AxioDB singleton pattern, tests must run in separate processes.
 * 
 * Usage:
 *   node Test/run.js           # Run all tests (sequentially in child processes)
 *   node Test/run.js crud      # Run only CRUD tests
 *   node Test/run.js transaction  # Run only transaction tests
 *   node Test/run.js read      # Run only read optimization tests
 */

const { spawn } = require('child_process');
const path = require('path');

// Color helpers
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  gray: '\x1b[90m'
};

// Available test modules (run as separate processes)
const testModules = {
  crud: './modules/crud.test.js',
  transaction: './modules/transaction.test.js',
  read: './modules/read.test.js'
};

/**
 * Run a single test module in a child process
 */
function runTestModule(name, modulePath) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const testDir = path.dirname(require.resolve(modulePath));
    
    // Create a simple runner script inline
    const runnerCode = `
      const TestClass = require('${modulePath}');
      const suite = new TestClass();
      suite.run().then(results => {
        suite.printResults();
        process.exit(results.failed > 0 ? 1 : 0);
      }).catch(err => {
        console.error('Suite error:', err.message);
        process.exit(1);
      });
    `;
    
    const child = spawn('node', ['-e', runnerCode], {
      cwd: __dirname,
      stdio: 'inherit'
    });
    
    child.on('close', (code) => {
      resolve({
        name,
        exitCode: code,
        duration: Date.now() - startTime
      });
    });
  });
}

/**
 * Main test runner - runs tests sequentially in separate processes
 */
async function runAllTests() {
  const args = process.argv.slice(2);
  const specificSuite = args[0]?.toLowerCase();

  console.log('\n' + '═'.repeat(70));
  console.log(`${colors.bright}${colors.blue}   AxioDB Complete Test Suite${colors.reset}`);
  console.log('═'.repeat(70));
  console.log(`   Started at: ${new Date().toISOString()}`);
  console.log('   Note: Each suite runs in isolated process (singleton pattern)');
  console.log('═'.repeat(70));

  const results = {
    passed: 0,
    failed: 0,
    suites: [],
    startTime: Date.now()
  };

  // Determine which suites to run
  let suitesToRun = Object.entries(testModules);
  if (specificSuite && testModules[specificSuite]) {
    suitesToRun = [[specificSuite, testModules[specificSuite]]];
    console.log(`\n   Running only: ${specificSuite} tests\n`);
  } else if (specificSuite) {
    console.log(`${colors.yellow}   Unknown suite: ${specificSuite}${colors.reset}`);
    console.log(`   Available suites: ${Object.keys(testModules).join(', ')}`);
    process.exit(1);
  }

  // Run each test suite in a separate process
  for (const [name, modulePath] of suitesToRun) {
    console.log(`\n${colors.bright}Running ${name} tests...${colors.reset}\n`);
    
    const result = await runTestModule(name, modulePath);
    results.suites.push(result);
    
    if (result.exitCode === 0) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  // Print final summary
  const totalDuration = Date.now() - results.startTime;
  printFinalSummary(results, totalDuration);

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

/**
 * Print the final aggregated summary
 */
function printFinalSummary(results, duration) {
  console.log('\n' + '═'.repeat(70));
  console.log(`${colors.bright}   FINAL SUMMARY${colors.reset}`);
  console.log('═'.repeat(70));

  // Per-suite breakdown
  results.suites.forEach(suite => {
    const status = suite.exitCode === 0 
      ? `${colors.green}✓ PASSED${colors.reset}` 
      : `${colors.red}✗ FAILED${colors.reset}`;
    console.log(`   ${suite.name}: ${status} (${suite.duration}ms)`);
  });

  console.log('\n   ' + '─'.repeat(50));
  console.log(`   ${colors.bright}Suites Passed:${colors.reset}  ${results.passed}/${results.suites.length}`);
  console.log(`   ${colors.bright}Total Duration:${colors.reset} ${duration}ms`);

  console.log('\n' + '═'.repeat(70));
  
  if (results.failed === 0) {
    console.log(`${colors.green}${colors.bright}   🎉 ALL TEST SUITES PASSED!${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bright}   ⚠️  ${results.failed} SUITE(S) FAILED${colors.reset}`);
  }
  
  console.log('═'.repeat(70) + '\n');
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error running test suite:', error);
  process.exit(1);
});
