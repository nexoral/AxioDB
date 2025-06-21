/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Builds a standardized response object with status code, message, and optional data.
 * 
 * @param statusCode - The HTTP status code to include in the response
 * @param message - The message describing the result of the operation
 * @param data - Optional data payload to include in the response
 * @returns A response object with statusCode, message, and data properties
 * 
 * @example
 * // Success response with data
 * buildResponse(200, "User fetched successfully", { id: 1, name: "John Doe" });
 * 
 * @example
 * // Error response without data
 * buildResponse(404, "User not found");
 */
export default function buildResponse(statusCode: number, message: string, data?: any): object {
  return {
    statusCode,
    message,
    data: data || null,
  };
}