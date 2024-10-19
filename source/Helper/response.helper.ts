// Purpose: Helper class for response.
import { StatusCodes } from "outers";

// Import Types & Interfaces
import { ErrorInterface, SuccessInterface } from "../config/Interfaces/Helper/response.helper.interface";

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @class ResponseHelper
 * @description A helper class to standardize API responses.
 * 
 * @property {number} SucessCode - The HTTP status code for a successful response.
 * @property {number} ErrorCode - The HTTP status code for an error response.
 * 
 * @constructor
 * Initializes the ResponseHelper with default status codes.
 * 
 * @method Success
 * @async
 * @param {any} [data] - Optional data to include in the success response.
 * @returns {Promise<SuccessInterface>} A promise that resolves to a success response object.
 * 
 * @method Error
 * @async
 * @param {string} [message] - Optional error message to include in the error response.
 * @returns {Promise<ErrorInterface>} A promise that resolves to an error response object.
 */
/**
 * A helper class for generating standardized success and error response objects.
 *
 * @remarks
 * This class provides methods to generate success and error responses with predefined status codes.
 * It uses the `StatusCodes` enumeration to set the HTTP status codes for success and error responses.
 *
 * @example
 * ```typescript
 * const responseHelper = new ResponseHelper();
 * const successResponse = await responseHelper.Success({ key: 'value' });
 * const errorResponse = await responseHelper.Error('An error occurred');
 * ```
 *
 * @public
 */
export default class ResponseHelper {
    // Properties
    private SucessCode: number;
    private ErrorCode: number;

    constructor() {
        this.SucessCode = StatusCodes.OK;
        this.ErrorCode = StatusCodes.INTERNAL_SERVER_ERROR;
    }

    /**
     * Generates a success response object.
     *
     * @param data - Optional data to include in the success response.
     * @returns A promise that resolves to a success response object implementing the SuccessInterface.
     */
    public async Success(data?: any): Promise<SuccessInterface> {
        return {
            statusCode: this.SucessCode,
            status: true,
            data: data
        };
    }

    /**
     * Generates an error response object.
     *
     * @param {string} [message] - Optional error message to include in the response.
     * @returns {Promise<ErrorInterface>} A promise that resolves to an error response object.
     */
    public async Error( message?: any): Promise<ErrorInterface> {
        return {
            statusCode: this.ErrorCode,
            status: false,
            message: message
        };
    }
}