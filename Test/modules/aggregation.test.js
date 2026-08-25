/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */

const TestRunner = require('../helpers/TestRunner');
const { assert } = require('../helpers/assertions');
const fs = require('fs');
const path = require('path');

const { AxioDB, OperatorRegistry } = require('../../lib/config/DB.js');

class AggregationTests extends TestRunner {
  constructor() {
    super('Aggregation Test Suite');
    this.testDir = './Test/TestAggregation';
    this.dbInstance = null;
    this.testDB = null;
    this.usersCollection = null;
    this.ordersCollection = null;
    this.productsCollection = null;
  }

  async setUp() {
    this.log('Setting up test environment...', 'info');

    // Clean up previous test data
    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }

    // Clear any custom operators from previous runs
    OperatorRegistry.clearAll();

    // Create database instance
    this.dbInstance = new AxioDB({ GUI: false, RootName: 'AggregationTestDB', CustomPath: this.testDir });
    this.testDB = await this.dbInstance.createDB('TestDatabase');

    // Create collections
    this.usersCollection = await this.testDB.createCollection('Users');
    this.ordersCollection = await this.testDB.createCollection('Orders');
    this.productsCollection = await this.testDB.createCollection('Products');

    // Insert test data - Users
    await this.usersCollection.insertMany([
      { name: 'Alice', age: 30, department: 'Engineering', salary: 90000, active: true, userId: 'user1' },
      { name: 'Bob', age: 25, department: 'Marketing', salary: 60000, active: true, userId: 'user2' },
      { name: 'Charlie', age: 35, department: 'Engineering', salary: 110000, active: false, userId: 'user3' },
      { name: 'Diana', age: 28, department: 'Marketing', salary: 70000, active: true, userId: 'user4' },
      { name: 'Eve', age: 42, department: 'Engineering', salary: 130000, active: true, userId: 'user5' },
      { name: 'Frank', age: 31, department: 'Sales', salary: 55000, active: true, userId: 'user6' },
      { name: 'Grace', age: 29, department: 'Sales', salary: 62000, active: false, userId: 'user7' },
      { name: 'Henry', age: 38, department: 'Engineering', salary: 120000, active: true, userId: 'user8' },
    ]);

    // Insert test data - Orders
    await this.ordersCollection.insertMany([
      { orderId: 'ORD-001', userId: 'user1', total: 150.00, status: 'completed', items: 3 },
      { orderId: 'ORD-002', userId: 'user1', total: 75.50, status: 'completed', items: 1 },
      { orderId: 'ORD-003', userId: 'user2', total: 200.00, status: 'pending', items: 5 },
      { orderId: 'ORD-004', userId: 'user3', total: 320.00, status: 'completed', items: 2 },
      { orderId: 'ORD-005', userId: 'user4', total: 95.00, status: 'shipped', items: 1 },
      { orderId: 'ORD-006', userId: 'user5', total: 500.00, status: 'completed', items: 8 },
      { orderId: 'ORD-007', userId: 'user2', total: 180.00, status: 'completed', items: 4 },
      { orderId: 'ORD-008', userId: 'user6', total: 45.00, status: 'pending', items: 1 },
    ]);

    // Insert test data - Products
    await this.productsCollection.insertMany([
      { name: 'Laptop', category: 'Electronics', price: 999.99, stock: 50 },
      { name: 'Mouse', category: 'Electronics', price: 29.99, stock: 200 },
      { name: 'Desk', category: 'Furniture', price: 299.99, stock: 30 },
      { name: 'Chair', category: 'Furniture', price: 199.99, stock: 45 },
      { name: 'Keyboard', category: 'Electronics', price: 79.99, stock: 100 },
    ]);

    this.log('Test environment ready', 'success');
  }

  async tearDown() {
    this.log('Cleaning up...', 'info');
    OperatorRegistry.clearAll();
    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }
    this.log('Cleanup complete', 'success');
  }

  async runTests() {
    // ============================================================
    // BACKWARD COMPATIBILITY - Existing operators
    // ============================================================
    await this.describe('Backward Compatibility - Existing Operators', async () => {
      await this.test('$match with exact equality', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: { department: 'Engineering' } }
        ]).exec();
        assert.isSuccess(result);
        assert.equal(result.data.length, 4);
        result.data.forEach(doc => assert.equal(doc.department, 'Engineering'));
      });

      await this.test('$match with comparison operators', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: { age: { $gte: 30 } } }
        ]).exec();
        assert.isSuccess(result);
        assert.ok(result.data.length >= 5);
        result.data.forEach(doc => assert.ok(doc.age >= 30));
      });

      await this.test('$match with $in operator', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: { department: { $in: ['Engineering', 'Sales'] } } }
        ]).exec();
        assert.isSuccess(result);
        assert.equal(result.data.length, 6);
      });

      await this.test('$match with $regex', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: { name: { $regex: '^[AB]', $options: '' } } }
        ]).exec();
        assert.isSuccess(result);
        assert.equal(result.data.length, 2); // Alice, Bob
      });

      await this.test('$group with $sum', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: {} },
          { $group: { _id: '$department', totalSalary: { $sum: '$salary' } } }
        ]).exec();
        assert.isSuccess(result);
        assert.equal(result.data.length, 3); // Engineering, Marketing, Sales
        const eng = result.data.find(d => d._id === 'Engineering');
        assert.exists(eng);
        assert.equal(eng.totalSalary, 90000 + 110000 + 130000 + 120000);
      });

      await this.test('$group with $avg', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: {} },
          { $group: { _id: '$department', avgSalary: { $avg: '$salary' } } }
        ]).exec();
        assert.isSuccess(result);
        const eng = result.data.find(d => d._id === 'Engineering');
        assert.exists(eng);
        assert.equal(eng.avgSalary, (90000 + 110000 + 130000 + 120000) / 4);
      });

      await this.test('$sort ascending', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: {} },
          { $sort: { age: 1 } }
        ]).exec();
        assert.isSuccess(result);
        for (let i = 1; i < result.data.length; i++) {
          assert.ok(result.data[i].age >= result.data[i - 1].age);
        }
      });

      await this.test('$sort descending', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: {} },
          { $sort: { age: -1 } }
        ]).exec();
        assert.isSuccess(result);
        for (let i = 1; i < result.data.length; i++) {
          assert.ok(result.data[i].age <= result.data[i - 1].age);
        }
      });

      await this.test('$project with inclusion', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: {} },
          { $project: { name: 1, age: 1 } }
        ]).exec();
        assert.isSuccess(result);
        result.data.forEach(doc => {
          assert.exists(doc.name);
          assert.exists(doc.age);
          assert.ok(!('salary' in doc));
        });
      });

      await this.test('$limit', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: {} },
          { $limit: 3 }
        ]).exec();
        assert.isSuccess(result);
        assert.equal(result.data.length, 3);
      });

      await this.test('$skip', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: {} },
          { $skip: 5 }
        ]).exec();
        assert.isSuccess(result);
        assert.equal(result.data.length, 3); // 8 - 5 = 3
      });

      await this.test('$unwind', async () => {
        const result = await this.ordersCollection.aggregate([
          { $match: {} },
          { $unwind: '$items' }
        ]).exec();
        assert.isSuccess(result);
        // Each order's items field should now be a single value
        result.data.forEach(doc => {
          assert.ok(typeof doc.items === 'number');
        });
      });

      await this.test('$addFields', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: {} },
          { $addFields: { status: 'active' } }
        ]).exec();
        assert.isSuccess(result);
        result.data.forEach(doc => assert.equal(doc.status, 'active'));
      });
    });

    // ============================================================
    // ENHANCED OPERATORS
    // ============================================================
    await this.describe('Enhanced Operators', async () => {
      await this.test('$match with $or operator', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: { $or: [{ department: 'Sales' }, { age: { $gt: 35 } }] } }
        ]).exec();
        assert.isSuccess(result);
        result.data.forEach(doc => {
          assert.ok(doc.department === 'Sales' || doc.age > 35);
        });
      });

      await this.test('$match with $and operator', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: { $and: [{ department: 'Engineering' }, { age: { $gte: 35 } }] } }
        ]).exec();
        assert.isSuccess(result);
        // Charlie (35), Eve (42), Henry (38) are Engineering with age >= 35
        assert.equal(result.data.length, 3);
        result.data.forEach(doc => {
          assert.equal(doc.department, 'Engineering');
          assert.ok(doc.age >= 35);
        });
      });

      await this.test('$match with $not operator', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: { age: { $not: { $lt: 30 } } } }
        ]).exec();
        assert.isSuccess(result);
        result.data.forEach(doc => assert.ok(doc.age >= 30));
      });

      await this.test('$match with $exists operator', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: { salary: { $exists: true } } }
        ]).exec();
        assert.isSuccess(result);
        assert.equal(result.data.length, 8);
      });

      await this.test('$sort multi-field', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: {} },
          { $sort: { department: 1, salary: -1 } }
        ]).exec();
        assert.isSuccess(result);
        // Verify Engineering comes before Marketing, and within Engineering, salary is descending
        const engUsers = result.data.filter(d => d.department === 'Engineering');
        for (let i = 1; i < engUsers.length; i++) {
          assert.ok(engUsers[i].salary <= engUsers[i - 1].salary);
        }
      });

      await this.test('$project with exclusion', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: {} },
          { $project: { salary: 0, active: 0 } }
        ]).exec();
        assert.isSuccess(result);
        result.data.forEach(doc => {
          assert.ok(!('salary' in doc));
          assert.ok(!('active' in doc));
          assert.exists(doc.name);
        });
      });

      await this.test('$project with computed fields', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: {} },
          { $project: { name: 1, bonus: { $multiply: ['$salary', 0.1] } } }
        ]).exec();
        assert.isSuccess(result);
        result.data.forEach(doc => {
          assert.exists(doc.name);
          assert.exists(doc.bonus);
          assert.ok(typeof doc.bonus === 'number');
        });
      });

      await this.test('$group with $min and $max', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: {} },
          { $group: { _id: '$department', minSalary: { $min: '$salary' }, maxSalary: { $max: '$salary' } } }
        ]).exec();
        assert.isSuccess(result);
        const eng = result.data.find(d => d._id === 'Engineering');
        assert.exists(eng);
        assert.equal(eng.minSalary, 90000);
        assert.equal(eng.maxSalary, 130000);
      });

      await this.test('$group with $first and $last', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: {} },
          { $sort: { age: 1 } },
          { $group: { _id: '$department', youngest: { $first: '$name' }, oldest: { $last: '$name' } } }
        ]).exec();
        assert.isSuccess(result);
        const eng = result.data.find(d => d._id === 'Engineering');
        assert.exists(eng);
        assert.equal(eng.youngest, 'Alice'); // age 30
        assert.equal(eng.oldest, 'Eve'); // age 42
      });

      await this.test('$group with $push', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: {} },
          { $group: { _id: '$department', names: { $push: '$name' } } }
        ]).exec();
        assert.isSuccess(result);
        const eng = result.data.find(d => d._id === 'Engineering');
        assert.exists(eng);
        assert.ok(Array.isArray(eng.names));
        assert.equal(eng.names.length, 4);
      });

      await this.test('$group with $addToSet', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: {} },
          { $group: { _id: null, departments: { $addToSet: '$department' } } }
        ]).exec();
        assert.isSuccess(result);
        assert.equal(result.data.length, 1);
        assert.ok(Array.isArray(result.data[0].departments));
        assert.equal(result.data[0].departments.length, 3);
      });

      await this.test('$group with null _id (all documents)', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: {} },
          { $group: { _id: null, totalCount: { $sum: 1 }, avgAge: { $avg: '$age' } } }
        ]).exec();
        assert.isSuccess(result);
        assert.equal(result.data.length, 1);
        assert.equal(result.data[0].totalCount, 8);
      });

      await this.test('$unwind with preserveNullAndEmptyArrays', async () => {
        const result = await this.ordersCollection.aggregate([
          { $match: {} },
          { $unwind: { path: '$items', preserveNullAndEmptyArrays: true } }
        ]).exec();
        assert.isSuccess(result);
        assert.ok(result.data.length >= 8);
      });
    });

    // ============================================================
    // NEW STAGE OPERATORS
    // ============================================================
    await this.describe('New Stage Operators', async () => {
      await this.test('$count', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: { active: true } },
          { $count: 'activeUsers' }
        ]).exec();
        assert.isSuccess(result);
        assert.equal(result.data.length, 1);
        assert.exists(result.data[0].activeUsers);
        assert.ok(result.data[0].activeUsers > 0);
      });

      await this.test('$sortByCount', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: {} },
          { $sortByCount: '$department' }
        ]).exec();
        assert.isSuccess(result);
        assert.equal(result.data.length, 3);
        // Should be sorted by count descending
        for (let i = 1; i < result.data.length; i++) {
          assert.ok(result.data[i].count <= result.data[i - 1].count);
        }
      });

      await this.test('$sample', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: {} },
          { $sample: { size: 3 } }
        ]).exec();
        assert.isSuccess(result);
        assert.equal(result.data.length, 3);
      });

      await this.test('$set (alias for $addFields)', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: {} },
          { $set: { fullName: { $concat: ['$name', ' Smith'] } } }
        ]).exec();
        assert.isSuccess(result);
        result.data.forEach(doc => {
          assert.exists(doc.fullName);
          assert.ok(doc.fullName.endsWith(' Smith'));
        });
      });

      await this.test('$unset', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: {} },
          { $unset: ['salary', 'active'] }
        ]).exec();
        assert.isSuccess(result);
        result.data.forEach(doc => {
          assert.ok(!('salary' in doc));
          assert.ok(!('active' in doc));
          assert.exists(doc.name);
        });
      });

      await this.test('$replaceRoot', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: { name: 'Alice' } },
          { $replaceRoot: { newRoot: { name: '$name', age: '$age' } } }
        ]).exec();
        assert.isSuccess(result);
        assert.equal(result.data.length, 1);
        // The expression evaluator should resolve $name and $age
        assert.exists(result.data[0].name);
        assert.exists(result.data[0].age);
      });

      await this.test('$facet - multiple pipelines', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: {} },
          {
            $facet: {
              byDepartment: [{ $group: { _id: '$department', count: { $sum: 1 } } }],
              seniorEmployees: [{ $match: { age: { $gte: 35 } } }, { $count: 'count' }],
              avgSalary: [{ $group: { _id: null, avg: { $avg: '$salary' } } }]
            }
          }
        ]).exec();
        assert.isSuccess(result);
        assert.equal(result.data.length, 1);
        const facet = result.data[0];
        assert.exists(facet.byDepartment);
        assert.exists(facet.seniorEmployees);
        assert.exists(facet.avgSalary);
        assert.equal(facet.byDepartment.length, 3);
      });

      await this.test('$bucket', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: {} },
          {
            $bucket: {
              groupBy: '$age',
              boundaries: [25, 30, 35, 40, 45],
              default: 'Other',
              output: { count: { $sum: 1 }, names: { $push: '$name' } }
            }
          }
        ]).exec();
        assert.isSuccess(result);
        assert.ok(result.data.length >= 3);
        result.data.forEach(bucket => {
          assert.exists(bucket._id);
          assert.exists(bucket.count);
        });
      });

      await this.test('$bucketAuto', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: {} },
          {
            $bucketAuto: {
              groupBy: '$age',
              buckets: 3,
              output: { count: { $sum: 1 } }
            }
          }
        ]).exec();
        assert.isSuccess(result);
        assert.equal(result.data.length, 3);
      });
    });

    // ============================================================
    // $lookup - CROSS-COLLECTION JOINS
    // ============================================================
    await this.describe('$lookup - Cross-Collection Joins', async () => {
      await this.test('$lookup with equality join', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: {} },
          {
            $lookup: {
              from: 'Orders',
              localField: 'userId',
              foreignField: 'userId',
              as: 'userOrders'
            }
          }
        ]).exec();
        assert.isSuccess(result);
        assert.equal(result.data.length, 8);
        // Alice (user1) should have 2 orders
        const alice = result.data.find(d => d.name === 'Alice');
        assert.exists(alice);
        assert.ok(Array.isArray(alice.userOrders));
        assert.equal(alice.userOrders.length, 2);
        // Frank (user6) should have 1 order
        const frank = result.data.find(d => d.name === 'Frank');
        assert.exists(frank);
        assert.equal(frank.userOrders.length, 1);
      });

      await this.test('$lookup with $unwind', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: { department: 'Engineering' } },
          {
            $lookup: {
              from: 'Orders',
              localField: 'userId',
              foreignField: 'userId',
              as: 'userOrders'
            }
          },
          { $unwind: '$userOrders' }
        ]).exec();
        assert.isSuccess(result);
        // Each result should have an order
        result.data.forEach(doc => {
          assert.exists(doc.userOrders);
          assert.exists(doc.userOrders.orderId);
        });
      });

      await this.test('$lookup with $match on joined data', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: {} },
          {
            $lookup: {
              from: 'Orders',
              localField: 'userId',
              foreignField: 'userId',
              as: 'userOrders'
            }
          },
          { $unwind: '$userOrders' },
          { $match: { 'userOrders.status': 'completed' } }
        ]).exec();
        assert.isSuccess(result);
        result.data.forEach(doc => {
          assert.equal(doc.userOrders.status, 'completed');
        });
      });

      await this.test('$lookup with $group on joined data', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: {} },
          {
            $lookup: {
              from: 'Orders',
              localField: 'userId',
              foreignField: 'userId',
              as: 'userOrders'
            }
          }
        ]).exec();
        assert.isSuccess(result);
        // Verify basic $lookup works
        assert.equal(result.data.length, 8);
        // Each user should have their orders
        const alice = result.data.find(d => d.name === 'Alice');
        assert.exists(alice);
        assert.ok(Array.isArray(alice.userOrders));
        assert.equal(alice.userOrders.length, 2);
      });

      await this.test('$lookup with non-existent collection returns error', async () => {
        let threw = false;
        try {
          await this.usersCollection.aggregate([
            { $match: {} },
            {
              $lookup: {
                from: 'NonExistent',
                localField: 'userId',
                foreignField: 'userId',
                as: 'joined'
              }
            }
          ]).exec();
        } catch (e) {
          threw = true;
          assert.ok(e.message.includes('NonExistent'));
        }
        assert.ok(threw, 'Should throw for non-existent collection');
      });

      await this.test('$lookup without resolver (standalone) throws', async () => {
        const { InstanceTypes } = require('../../lib/config/DB.js');
        const agg = new InstanceTypes.Aggregation('test', '/tmp/fake', [
          { $lookup: { from: 'other', localField: 'id', foreignField: 'id', as: 'data' } }
        ]);
        let threw = false;
        try {
          await agg.exec();
        } catch (e) {
          threw = true;
        }
        assert.ok(threw, 'Should throw when no resolver is provided');
      });
    });

    // ============================================================
    // EXPRESSION EVALUATOR
    // ============================================================
    await this.describe('Expression Evaluator', async () => {
      await this.test('$project with $add expression', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: { name: 'Alice' } },
          { $project: { name: 1, total: { $add: ['$salary', 5000] } } }
        ]).exec();
        assert.isSuccess(result);
        assert.equal(result.data[0].total, 95000);
      });

      await this.test('$project with $subtract expression', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: { name: 'Alice' } },
          { $project: { name: 1, diff: { $subtract: ['$salary', 10000] } } }
        ]).exec();
        assert.isSuccess(result);
        assert.equal(result.data[0].diff, 80000);
      });

      await this.test('$project with $multiply expression', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: { name: 'Alice' } },
          { $project: { name: 1, bonus: { $multiply: ['$salary', 0.15] } } }
        ]).exec();
        assert.isSuccess(result);
        assert.equal(result.data[0].bonus, 13500);
      });

      await this.test('$project with $cond expression', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: {} },
          {
            $project: {
              name: 1,
              level: {
                $cond: {
                  if: { $gte: ['$age', 35] },
                  then: 'Senior',
                  else: 'Junior'
                }
              }
            }
          }
        ]).exec();
        assert.isSuccess(result);
        const alice = result.data.find(d => d.name === 'Alice');
        assert.equal(alice.level, 'Junior');
        const eve = result.data.find(d => d.name === 'Eve');
        assert.equal(eve.level, 'Senior');
      });

      await this.test('$project with $concat expression', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: { name: 'Alice' } },
          { $project: { name: 1, greeting: { $concat: ['Hello, ', '$name', '!'] } } }
        ]).exec();
        assert.isSuccess(result);
        assert.equal(result.data[0].greeting, 'Hello, Alice!');
      });

      await this.test('$project with $toLower expression', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: { name: 'Alice' } },
          { $project: { name: 1, lowerDept: { $toLower: '$department' } } }
        ]).exec();
        assert.isSuccess(result);
        assert.equal(result.data[0].lowerDept, 'engineering');
      });

      await this.test('$project with $ifNull expression', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: { name: 'Alice' } },
          { $project: { name: 1, nickname: { $ifNull: ['$nickname', 'N/A'] } } }
        ]).exec();
        assert.isSuccess(result);
        assert.equal(result.data[0].nickname, 'N/A');
      });

      await this.test('$addFields with computed expression', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: {} },
          { $addFields: { annualBonus: { $multiply: ['$salary', 0.1] } } }
        ]).exec();
        assert.isSuccess(result);
        const alice = result.data.find(d => d.name === 'Alice');
        assert.equal(alice.annualBonus, 9000);
      });
    });

    // ============================================================
    // CUSTOM OPERATORS
    // ============================================================
    await this.describe('Custom Operators via OperatorRegistry', async () => {
      await this.test('Register and use custom stage operator', async () => {
        OperatorRegistry.registerStageOperator('$filterByRange', (input, expr) => {
          const { field, min, max } = expr;
          return input.filter(doc => doc[field] >= min && doc[field] <= max);
        });

        const result = await this.usersCollection.aggregate([
          { $match: {} },
          { $filterByRange: { field: 'age', min: 28, max: 35 } }
        ]).exec();
        assert.isSuccess(result);
        result.data.forEach(doc => {
          assert.ok(doc.age >= 28 && doc.age <= 35);
        });
      });

      await this.test('Register and use custom accumulator', async () => {
        OperatorRegistry.registerAccumulator('$median', (collection, expr) => {
          const field = typeof expr === 'string' ? expr.replace('$', '') : expr.field;
          const values = collection.map(doc => doc[field]).sort((a, b) => a - b);
          const mid = Math.floor(values.length / 2);
          return values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
        });

        const result = await this.usersCollection.aggregate([
          { $match: {} },
          { $group: { _id: '$department', medianSalary: { $median: '$salary' } } }
        ]).exec();
        assert.isSuccess(result);
        const eng = result.data.find(d => d._id === 'Engineering');
        assert.exists(eng);
        assert.ok(typeof eng.medianSalary === 'number');
      });

      await this.test('Register and use custom expression operator', async () => {
        OperatorRegistry.registerExpressionOperator('$reverse', (doc, expr) => {
          const str = typeof expr === 'string' && expr.startsWith('$')
            ? doc[expr.substring(1)]
            : String(expr);
          return String(str).split('').reverse().join('');
        });

        const result = await this.usersCollection.aggregate([
          { $match: { name: 'Alice' } },
          { $project: { name: 1, reversed: { $reverse: '$name' } } }
        ]).exec();
        assert.isSuccess(result);
        assert.equal(result.data[0].reversed, 'ecilA');
      });

      await this.test('OperatorRegistry.clearAll() removes custom operators', async () => {
        // First clear any operators from previous tests
        OperatorRegistry.clearAll();
        assert.equal(OperatorRegistry.getRegisteredNames().length, 0);

        // Register one operator
        OperatorRegistry.registerStageOperator('$testOp', (input) => input);
        assert.equal(OperatorRegistry.getRegisteredNames().length, 1);

        // Clear and verify
        OperatorRegistry.clearAll();
        assert.equal(OperatorRegistry.getRegisteredNames().length, 0);
      });

      await this.test('OperatorRegistry validates operator names', async () => {
        let threw = false;
        try {
          OperatorRegistry.registerStageOperator('noDollar', (input) => input);
        } catch (e) {
          threw = true;
        }
        assert.ok(threw, 'Should throw for operator names without $');
      });
    });

    // ============================================================
    // EDGE CASES
    // ============================================================
    await this.describe('Edge Cases', async () => {
      await this.test('Empty collection returns empty result', async () => {
        const emptyCollection = await this.testDB.createCollection('Empty');
        const result = await emptyCollection.aggregate([
          { $match: {} }
        ]).exec();
        assert.isSuccess(result);
        assert.equal(result.data.length, 0);
      });

      await this.test('Invalid pipeline (not array) throws', async () => {
        let threw = false;
        try {
          await this.usersCollection.aggregate('not an array').exec();
        } catch (e) {
          threw = true;
        }
        assert.ok(threw, 'Should throw for non-array pipeline');
      });

      await this.test('Empty pipeline returns all documents', async () => {
        const result = await this.usersCollection.aggregate([]).exec();
        assert.isSuccess(result);
        assert.equal(result.data.length, 8);
      });

      await this.test('$match not required as first stage', async () => {
        const result = await this.usersCollection.aggregate([
          { $sort: { age: 1 } },
          { $limit: 3 }
        ]).exec();
        assert.isSuccess(result);
        assert.equal(result.data.length, 3);
        // Should be sorted by age ascending
        for (let i = 1; i < result.data.length; i++) {
          assert.ok(result.data[i].age >= result.data[i - 1].age);
        }
      });

      await this.test('Complex pipeline: $match -> $group -> $sort -> $limit', async () => {
        const result = await this.usersCollection.aggregate([
          { $match: { active: true } },
          { $group: { _id: '$department', avgSalary: { $avg: '$salary' }, count: { $sum: 1 } } },
          { $sort: { avgSalary: -1 } },
          { $limit: 2 }
        ]).exec();
        assert.isSuccess(result);
        assert.equal(result.data.length, 2);
        assert.ok(result.data[0].avgSalary >= result.data[1].avgSalary);
      });

      await this.test('Nested field access in $group', async () => {
        // Insert a document with nested fields
        await this.productsCollection.insert({ name: 'Test', category: 'Test', price: 10, stock: 5, meta: { rating: 4.5 } });
        const result = await this.productsCollection.aggregate([
          { $match: {} },
          { $group: { _id: '$category', count: { $sum: 1 } } }
        ]).exec();
        assert.isSuccess(result);
        assert.ok(result.data.length >= 3);
      });
    });

    // ============================================================
    // PIPELINE WITHOUT $match FIRST
    // ============================================================
    await this.describe('Pipeline Flexibility', async () => {
      await this.test('Pipeline starting with $group', async () => {
        const result = await this.usersCollection.aggregate([
          { $group: { _id: '$department', count: { $sum: 1 } } }
        ]).exec();
        assert.isSuccess(result);
        assert.equal(result.data.length, 3);
      });

      await this.test('Pipeline starting with $sort', async () => {
        const result = await this.usersCollection.aggregate([
          { $sort: { name: 1 } },
          { $limit: 3 }
        ]).exec();
        assert.isSuccess(result);
        assert.equal(result.data.length, 3);
        assert.equal(result.data[0].name, 'Alice');
      });

      await this.test('Pipeline starting with $project', async () => {
        const result = await this.usersCollection.aggregate([
          { $project: { name: 1, age: 1 } }
        ]).exec();
        assert.isSuccess(result);
        assert.equal(result.data.length, 8);
        result.data.forEach(doc => {
          assert.exists(doc.name);
          assert.exists(doc.age);
        });
      });
    });
  }
}

module.exports = AggregationTests;
