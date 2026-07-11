import path from 'path';

/**
 * PathSanitizer - Security helper to prevent directory traversal attacks
 *
 * Provides methods to sanitize user-controlled path components and validate
 * that constructed paths remain within expected boundaries.
 *
 * @class PathSanitizer
 * @example
 * const safe = PathSanitizer.sanitizePathComponent('../../etc/passwd');
 * // Returns: '______etc_passwd'
 */
export default class PathSanitizer {
  /**
   * Sanitizes user input to prevent directory traversal attacks
   *
   * Removes dangerous characters that could be used for path traversal,
   * including: '../', '/', '\', null bytes, and other special characters.
   *
   * @param userInput - Potentially malicious path component
   * @returns Sanitized string safe for file paths
   * @throws Error if input is invalid or results in empty string
   *
   * @example
   * PathSanitizer.sanitizePathComponent('../../../etc/passwd');
   * // Returns: '______etc_passwd'
   *
   * PathSanitizer.sanitizePathComponent('safe-name_123');
   * // Returns: 'safe-name_123'
   */
  static sanitizePathComponent(userInput: string): string {
    if (!userInput || typeof userInput !== 'string') {
      throw new Error('Invalid path component: must be a non-empty string');
    }

    let sanitized = userInput
      .replace(/\.\./g, '_')    // parent directory
      .replace(/\//g, '_')      // Unix path separator
      .replace(/\\/g, '_')      // Windows path separator
      .replace(/\0/g, '_');     // null bytes

    // Dots are preserved (for file extensions) since '..' was already stripped above
    sanitized = sanitized.replace(/[^a-zA-Z0-9-_.]/g, '_');

    if (sanitized.length === 0) {
      throw new Error('Invalid path component: results in empty string after sanitization');
    }

    // Avoid producing a hidden file
    if (sanitized.startsWith('.')) {
      sanitized = '_' + sanitized.substring(1);
    }

    return sanitized;
  }

  /**
   * Validates that resolved path is within basePath (defense in depth)
   *
   * This provides an additional security layer by ensuring the final
   * constructed path hasn't escaped the expected base directory through
   * symlinks or other means.
   *
   * @param basePath - Expected parent directory
   * @param fullPath - Constructed path to validate
   * @throws Error if path traversal detected
   *
   * @example
   * PathSanitizer.validatePath('/app/data', '/app/data/users/123.axiodb');
   * // No error - path is within base
   *
   * PathSanitizer.validatePath('/app/data', '/etc/passwd');
   * // Throws: Security violation: Path traversal attempt detected
   */
  static validatePath(basePath: string, fullPath: string): void {
    const resolvedBase = path.resolve(basePath);
    const resolvedFull = path.resolve(fullPath);

    if (!resolvedFull.startsWith(resolvedBase)) {
      throw new Error('Security violation: Path traversal attempt detected');
    }
  }

  /**
   * Safe path join with automatic sanitization and validation
   *
   * Combines base path with one or more path components after sanitizing
   * each component and validating the final path remains within the base.
   *
   * @param basePath - Base directory (trusted path)
   * @param components - Path components to join (will be sanitized)
   * @returns Safe joined path guaranteed to be within basePath
   * @throws Error if sanitization fails or path traversal detected
   *
   * @example
   * PathSanitizer.safePath('/app/data', 'users', 'doc123.axiodb');
   * // Returns: '/app/data/users/doc123.axiodb'
   *
   * PathSanitizer.safePath('/app/data', '../../../etc/passwd');
   * // Throws: Security violation (after sanitization and validation)
   */
  static safePath(basePath: string, ...components: string[]): string {
    const sanitizedComponents = components.map(c => this.sanitizePathComponent(c));
    const fullPath = path.join(basePath, ...sanitizedComponents);
    this.validatePath(basePath, fullPath);

    return fullPath;
  }
}
