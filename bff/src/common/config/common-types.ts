export enum ProcessStatus {
  SUCCESS = 0,
  ERROR = 1,
}

export interface BaseResponse {
  processStatus: ProcessStatus;
  message: string[];
}

export interface ErrorResponse extends BaseResponse {}
