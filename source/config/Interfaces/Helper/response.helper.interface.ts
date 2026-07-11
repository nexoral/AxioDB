/* eslint-disable @typescript-eslint/no-explicit-any */

export interface SuccessInterface {
  statusCode: number;
  status: boolean;
  data?: any;
}

export interface ErrorInterface {
  statusCode: number;
  status: boolean;
  message?: string;
  data?: any;
}
