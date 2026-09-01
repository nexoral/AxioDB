
export interface SuccessInterface {
  statusCode: number;
  status: boolean;
  data?: unknown;
}

export interface ErrorInterface {
  statusCode: number;
  status: boolean;
  message?: string;
  data?: unknown;
}
