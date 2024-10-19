/* eslint-disable @typescript-eslint/no-explicit-any */

// Interface for the Success method in the response helper.
export interface SuccessInterface {
    statusCode: number;
    status: boolean;
    data?: any;
}

// Interface for the Error method in the response helper.
export interface ErrorInterface {
    statusCode: number;
    status: boolean;
    message?: string;
}