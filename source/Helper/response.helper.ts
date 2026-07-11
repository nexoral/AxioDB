import { StatusCodes } from "../config/Keys/StatusCode";
import {
  ErrorInterface,
  SuccessInterface,
} from "../config/Interfaces/Helper/response.helper.interface";

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Generates standardized success/error response objects.
 * @example
 * const responseHelper = new ResponseHelper();
 * const successResponse = await responseHelper.Success({ key: 'value' });
 * const errorResponse = await responseHelper.Error('An error occurred');
 */
export default class ResponseHelper {
  private SucessCode: number;
  private ErrorCode: number;

  constructor() {
    this.SucessCode = StatusCodes.OK;
    this.ErrorCode = StatusCodes.INTERNAL_SERVER_ERROR;
  }

  public async Success(data?: any): Promise<SuccessInterface> {
    return {
      statusCode: this.SucessCode,
      status: true,
      data: data,
    };
  }

  public async Error(message?: any): Promise<ErrorInterface> {
    return {
      statusCode: this.ErrorCode,
      status: false,
      message: message,
    };
  }
}
