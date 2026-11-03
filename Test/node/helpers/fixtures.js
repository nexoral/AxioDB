/* eslint-disable no-undef */
/**
 * Test data fixtures and generators for AxioDB tests
 */

const fixtures = {
  /**
   * Generate sample users
   */
  generateUsers(count = 100) {
    const users = [];
    const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'];
    const domains = ['example.com', 'test.org', 'demo.io', 'sample.net'];

    for (let i = 0; i < count; i++) {
      const firstName = firstNames[i % firstNames.length];
      const domain = domains[i % domains.length];
      users.push({
        name: `${firstName}${i}`,
        email: `${firstName.toLowerCase()}${i}@${domain}`,
        age: 20 + (i % 50),
        active: i % 3 !== 0,
        score: Math.floor(Math.random() * 100),
        createdAt: new Date(Date.now() - i * 86400000).toISOString()
      });
    }
    return users;
  },

  /**
   * Generate sample products
   */
  generateProducts(count = 50) {
    const products = [];
    const categories = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports'];
    const adjectives = ['Premium', 'Basic', 'Pro', 'Ultra', 'Lite'];

    for (let i = 0; i < count; i++) {
      const category = categories[i % categories.length];
      const adj = adjectives[i % adjectives.length];
      products.push({
        name: `${adj} ${category} Item ${i}`,
        category,
        price: parseFloat((10 + Math.random() * 990).toFixed(2)),
        stock: Math.floor(Math.random() * 500),
        rating: parseFloat((1 + Math.random() * 4).toFixed(1)),
        inStock: Math.random() > 0.2
      });
    }
    return products;
  },

  /**
   * Generate sample orders
   */
  generateOrders(count = 30) {
    const orders = [];
    const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    for (let i = 0; i < count; i++) {
      orders.push({
        orderId: `ORD-${String(i + 1).padStart(5, '0')}`,
        userId: `user${i % 10}`,
        total: parseFloat((50 + Math.random() * 450).toFixed(2)),
        status: statuses[i % statuses.length],
        items: Math.floor(1 + Math.random() * 5),
        createdAt: new Date(Date.now() - i * 3600000).toISOString()
      });
    }
    return orders;
  },

  /**
   * Get a single sample user
   */
  sampleUser(index = 0) {
    return this.generateUsers(1)[0];
  },

  /**
   * Get sample data for specific test scenarios
   */
  scenarios: {
    // For testing exact match queries
    exactMatch: {
      data: [
        { name: 'UniqueUser', email: 'unique@test.com', age: 25 },
        { name: 'CommonName', email: 'common1@test.com', age: 30 },
        { name: 'CommonName', email: 'common2@test.com', age: 35 }
      ],
      queries: {
        unique: { name: 'UniqueUser' },
        multiple: { name: 'CommonName' }
      }
    },

    // For testing range queries
    rangeQuery: {
      data: Array.from({ length: 20 }, (_, i) => ({
        name: `User${i}`,
        age: 20 + i * 2,
        score: i * 5
      })),
      queries: {
        ageRange: { age: { $gte: 30, $lte: 40 } },
        scoreAbove: { score: { $gt: 50 } }
      }
    },

    // For testing $in operator
    inOperator: {
      data: [
        { name: 'Alice', status: 'active' },
        { name: 'Bob', status: 'inactive' },
        { name: 'Charlie', status: 'pending' },
        { name: 'Diana', status: 'active' }
      ],
      queries: {
        multiStatus: { status: { $in: ['active', 'pending'] } }
      }
    },

    // For testing transactions
    transaction: {
      initial: [
        { name: 'TxUser1', balance: 100 },
        { name: 'TxUser2', balance: 200 }
      ],
      operations: {
        insert: { name: 'TxUser3', balance: 150 },
        update: { query: { name: 'TxUser1' }, data: { balance: 50 } },
        delete: { name: 'TxUser2' }
      }
    }
  },

  /**
   * Cleanup utility - removes test directories
   */
  async cleanupTestDir(testDir) {
    const fs = require('fs');
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
};

module.exports = fixtures;
