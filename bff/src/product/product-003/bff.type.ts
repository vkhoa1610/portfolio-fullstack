import { BaseResponse } from '@common/config/common-types.js';

// === LOGIN (Product-003) ===

export interface LoginRequest {
  email?: string;
  password?: string;
}

export interface LoginSuccessResponse extends BaseResponse {
  user: {
    role?: string;
    budget?: number;
    firstLogin: boolean;
  };
  redirectUrl: string;
}

export interface MfaRequiredResponse extends BaseResponse {
  requireMfa: true;
  challengeName: string;
  session: string;
}

export type LoginResponse = LoginSuccessResponse | MfaRequiredResponse;
