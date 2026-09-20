import { Response } from 'express';
import { ProcessStatus, ErrorResponse, BaseResponse } from '../config/common-types.js';

export class BffError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'BffError';
    this.statusCode = statusCode;
  }
}

export const throwBffError = (message: string, statusCode: number = 500): never => {
  throw new BffError(message, statusCode);
};

/**
 * Handles backend errors
 * processes BffError or generic errors
 * @param res Express Response
 * @param err Error object
 */
export const handleBackendError = (res: Response, err: any) => {
  if (err instanceof BffError) {
    console.warn(`⚠️ BFF Error: ${err.message} (${err.statusCode})`);
    return res.status(err.statusCode).json({
      processStatus: ProcessStatus.ERROR,
      message: [err.message],
    });
  }

  // Axios error with a real response from the Java backend (e.g. 403/404/409)
  // — forward its status and message instead of flattening every backend
  // error to 500, which previously made it impossible for the frontend to
  // tell "already reviewed" (409) apart from an actual server failure.
  if (err?.response?.status) {
    const backendMessage = err.response.data?.message;
    console.warn(`⚠️ Backend Error: ${backendMessage ?? err.message} (${err.response.status})`);
    return res.status(err.response.status).json({
      processStatus: ProcessStatus.ERROR,
      message: [backendMessage ?? 'Backend error occurred'],
    });
  }

  // Generic/Unexpected errors (no response at all — network/timeout/etc.)
  console.error(`❌ Error: ${err?.name || 'Unknown'} - ${err?.message || 'No message'}`);
  return res.status(500).json({
    processStatus: ProcessStatus.ERROR,
    message: ['System error occurred'],
  });
};

/**
 * Handles success responses (200)
 * @param res Express Response
 * @param response Data to return (must extend BaseResponse)
 */
export const handleNormal = <T extends BaseResponse>(res: Response, response: T) => {
  return res.status(200).json(response);
};
