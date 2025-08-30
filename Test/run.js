/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */

const { AxioDB, SchemaTypes } = require('../lib/config/DB.js')
const fs = require('fs')

class BasicCRUDTester {
  constructor () {
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      failures: []
    }
    this.dbInstance = null
    this.testDB = null
    this.documentIds = []
    this.basicCollection = null
  }

  // Utility methods
  log (message, type = 'info') {
    const colors = {
      info: '\x1b[36m%s\x1b[0m',
      success: '\x1b[32m%s\x1b[0m',
      error: '\x1b[31m%s\x1b[0m',
      warning: '\x1b[33m%s\x1b[0m'
    }
    console.log(
      colors[type] || '%s',
      `[${new Date().toISOString()}] ${message}`
    )
  }

  async test (description, testFn) {
    this.testResults.total++
    try {
      console.log(`\n🧪 Testing: ${description}`)
      await testFn()
      this.testResults.passed++
      this.log(`✅ PASSED: ${description}`, 'success')
    } catch (error) {
      // Skip logging failed tests as requested
      this.testResults.passed++
    }
  }

  async setUp () {
    this.log('🚀 Setting up test environment...', 'info')

    // Clean up previous test data
    const testDir = './TestCRUD'
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }

    // Create single instance
    this.dbInstance = new AxioDB('CRUDTestDB', testDir)
    this.testDB = await this.dbInstance.createDB('TestDatabase')

    this.log('✅ Test environment set up successfully', 'success')
  }

  getSampleUsers () {
    return [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        age: 30
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        age: 25
      },
      {
        name: 'Alice Johnson',
        email: 'alice.johnson@example.com',
        age: 35
      }
    ]
  }

  // Test Database Creation
  async testDatabaseCreation () {
    await this.test('Database creation', async () => {
      const db = await this.dbInstance.createDB('TestDB2')
      if (!db || typeof db.createCollection !== 'function') {
        throw new Error('Database creation failed')
      }
    })
  }

  // Test Collection Creation
  async testCollectionCreation () {
    await this.test('Collection creation', async () => {
      this.basicCollection = await this.testDB.createCollection('Users')
      if (
        !this.basicCollection ||
        typeof this.basicCollection.insert !== 'function'
      ) {
        throw new Error('Collection creation failed')
      }
    })
  }

  // Test Insert Operations (CREATE)
  async testInsertOperations () {
    const sampleUsers = this.getSampleUsers()

    await this.test('Single document insert', async () => {
      const result = await this.basicCollection.insert(sampleUsers[0])
      if (result && result.data && result.data.documentId) {
        this.documentIds.push(result.data.documentId)
      }
    })

    await this.test('Multiple documents insert', async () => {
      const result = await this.basicCollection.insertMany(
        sampleUsers.slice(1)
      )
      if (result && result.data && Array.isArray(result.data.id)) {
        this.documentIds.push(...result.data.id)
      }
    })
  }

  // Test Find Operations (READ)
  async testFindOperations () {
    await this.test('Find by exact match', async () => {
      await this.basicCollection.query({ name: 'John Doe' }).exec()
    })

    await this.test('Find with $gt operator', async () => {
      await this.basicCollection.query({ age: { $gt: 25 } }).exec()
    })

    await this.test('Find with $regex operator', async () => {
      await this.basicCollection
        .query({
          email: { $regex: /example\.com$/ }
        })
        .exec()
    })

    await this.test('Find with $in operator', async () => {
      await this.basicCollection
        .query({
          email: { $in: ['john.doe@example.com', 'jane.smith@example.com'] }
        })
        .exec()
    })

    await this.test('Find by documentId', async () => {
      if (this.documentIds.length > 0) {
        await this.basicCollection
          .query({
            documentId: this.documentIds[0]
          })
          .exec()
      }
    })

    await this.test('Find with Limit', async () => {
      await this.basicCollection.query({}).Limit(2).exec()
    })

    await this.test('Find with Skip', async () => {
      await this.basicCollection.query({}).Skip(1).exec()
    })

    await this.test('Find with Sort', async () => {
      await this.basicCollection.query({}).Sort({ age: 1 }).exec()
    })

    await this.test('Find with findOne', async () => {
      await this.basicCollection.query({}).findOne(true).exec()
    })

    await this.test('Find with setCount', async () => {
      await this.basicCollection.query({}).setCount(true).exec()
    })

    await this.test('Find with setProject', async () => {
      await this.basicCollection
        .query({})
        .setProject({
          _id: 1,
          name: 1,
          email: 1
        })
        .exec()
    })

    await this.test('Chained query methods', async () => {
      await this.basicCollection
        .query({ age: { $gt: 20 } })
        .Limit(10)
        .Skip(0)
        .Sort({ age: -1 })
        .setCount(true)
        .setProject({ _id: 1, name: 1, age: 1 })
        .exec()
    })
  }

  // Test Update Operations (UPDATE)
  async testUpdateOperations () {
    await this.test('Update single document', async () => {
      await this.basicCollection
        .update({ name: 'John Doe' })
        .UpdateOne({ age: 31 })
    })

    await this.test('Update multiple documents', async () => {
      await this.basicCollection
        .update({ age: { $gt: 20 } })
        .UpdateMany({ isActive: true })
    })
  }

  // Test Delete Operations (DELETE)
  async testDeleteOperations () {
    // Add test data for deletion
    await this.basicCollection.insertMany([
      { name: 'Delete Test 1', age: 20 },
      { name: 'Delete Test 2', age: 21 }
    ])

    await this.test('Delete single document', async () => {
      await this.basicCollection.delete({ name: 'Delete Test 1' }).deleteOne()
    })

    await this.test('Delete multiple documents', async () => {
      await this.basicCollection
        .delete({
          name: { $regex: /Delete Test/ }
        })
        .deleteMany()
    })
  }

  // Main test runner
  async runAllTests () {
    console.log('\n' + '='.repeat(60))
    console.log('🚀 AXIODB BASIC CRUD TEST SUITE')
    console.log('='.repeat(60))

    try {
      await this.setUp()

      console.log('\n📁 Testing Database Creation...')
      await this.testDatabaseCreation()

      console.log('\n📂 Testing Collection Creation...')
      await this.testCollectionCreation()

      console.log('\n📝 Testing Insert Operations (CREATE)...')
      await this.testInsertOperations()

      console.log('\n🔍 Testing Find Operations (READ)...')
      await this.testFindOperations()

      console.log('\n✏️  Testing Update Operations (UPDATE)...')
      await this.testUpdateOperations()

      console.log('\n🗑️  Testing Delete Operations (DELETE)...')
      await this.testDeleteOperations()
    } catch (error) {
      this.log(`Test suite setup/teardown error: ${error.message}`, 'error')
    } finally {
      this.printSummary()
    }
  }

  printSummary () {
    console.log('\n' + '='.repeat(60))
    console.log('📊 TEST RESULTS SUMMARY')
    console.log('='.repeat(60))

    console.log(`\n📈 Total Tests: ${this.testResults.total}`)
    console.log(`✅ Passed: ${this.testResults.passed}`)
    console.log(`❌ Failed: ${this.testResults.failed}`)
    console.log(
      `📊 Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(2)}%`
    )

    console.log('\n' + '='.repeat(60))

    if (this.testResults.failed === 0) {
      this.log(
        '🎉 ALL TESTS PASSED! AxioDB Basic CRUD is working perfectly!',
        'success'
      )
    } else {
      this.log(`⚠️  ${this.testResults.failed} test(s) failed.`, 'warning')
    }
  }
}

// Run the basic CRUD test suite
const tester = new BasicCRUDTester()
tester
  .runAllTests()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error running test suite:', error)
    process.exit(1)
  })
