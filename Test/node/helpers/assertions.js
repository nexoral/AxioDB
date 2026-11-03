/* eslint-disable no-undef */
/**
 * Custom assertion helpers for AxioDB tests
 */

class AssertionError extends Error {
  constructor(message, expected, actual) {
    super(message);
    this.name = 'AssertionError';
    this.expected = expected;
    this.actual = actual;
  }
}

const assert = {
  /**
   * Assert that a value is truthy
   */
  ok(value, message = 'Expected value to be truthy') {
    if (!value) {
      throw new AssertionError(message, 'truthy', value);
    }
  },

  /**
   * Assert strict equality
   */
  equal(actual, expected, message) {
    if (actual !== expected) {
      throw new AssertionError(
        message || `Expected ${expected}, got ${actual}`,
        expected,
        actual
      );
    }
  },

  /**
   * Assert deep equality for objects/arrays
   */
  deepEqual(actual, expected, message) {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
      throw new AssertionError(
        message || `Objects are not equal`,
        expected,
        actual
      );
    }
  },

  /**
   * Assert that a value is not undefined or null
   */
  exists(value, message = 'Expected value to exist') {
    if (value === undefined || value === null) {
      throw new AssertionError(message, 'defined value', value);
    }
  },

  /**
   * Assert that an array has a specific length
   */
  lengthOf(arr, length, message) {
    if (!Array.isArray(arr)) {
      throw new AssertionError('Expected an array', 'array', typeof arr);
    }
    if (arr.length !== length) {
      throw new AssertionError(
        message || `Expected array length ${length}, got ${arr.length}`,
        length,
        arr.length
      );
    }
  },

  /**
   * Assert that a value is greater than another
   */
  isAbove(actual, expected, message) {
    if (actual <= expected) {
      throw new AssertionError(
        message || `Expected ${actual} to be above ${expected}`,
        `> ${expected}`,
        actual
      );
    }
  },

  /**
   * Assert that a value is less than another
   */
  isBelow(actual, expected, message) {
    if (actual >= expected) {
      throw new AssertionError(
        message || `Expected ${actual} to be below ${expected}`,
        `< ${expected}`,
        actual
      );
    }
  },

  /**
   * Assert that a function throws an error
   */
  async throws(fn, expectedMessage, message) {
    try {
      await fn();
      throw new AssertionError(
        message || 'Expected function to throw',
        'error thrown',
        'no error'
      );
    } catch (error) {
      if (error instanceof AssertionError) throw error;
      if (expectedMessage && !error.message.includes(expectedMessage)) {
        throw new AssertionError(
          message || `Expected error message to include "${expectedMessage}"`,
          expectedMessage,
          error.message
        );
      }
    }
  },

  /**
   * Assert that an array includes a value
   */
  includes(arr, value, message) {
    if (!arr.includes(value)) {
      throw new AssertionError(
        message || `Expected array to include ${value}`,
        value,
        arr
      );
    }
  },

  /**
   * Assert that an object has a property
   */
  hasProperty(obj, prop, message) {
    if (!(prop in obj)) {
      throw new AssertionError(
        message || `Expected object to have property "${prop}"`,
        prop,
        Object.keys(obj)
      );
    }
  },

  /**
   * Assert that a response is successful (AxioDB specific)
   */
  isSuccess(response, message = 'Expected successful response') {
    if (!response || response.status !== true) {
      throw new AssertionError(
        message,
        { status: true },
        response
      );
    }
  },

  /**
   * Assert that a response is an error (AxioDB specific)
   */
  isError(response, message = 'Expected error response') {
    if (!response || response.status !== false) {
      throw new AssertionError(
        message,
        { status: false },
        response
      );
    }
  },

  /**
   * Assert performance - execution time is within threshold
   */
  performanceWithin(durationMs, maxMs, message) {
    if (durationMs > maxMs) {
      throw new AssertionError(
        message || `Expected execution within ${maxMs}ms, took ${durationMs}ms`,
        `<= ${maxMs}ms`,
        `${durationMs}ms`
      );
    }
  }
};

module.exports = { assert, AssertionError };
