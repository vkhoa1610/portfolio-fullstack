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
  challengeName: 'SOFTWARE_TOKEN_MFA';
  session: string;
}

export interface NewPasswordRequiredResponse extends BaseResponse {
  requireNewPassword: true;
  challengeName: 'NEW_PASSWORD_REQUIRED';
  session: string;
  username: string;
}

export type LoginResponse = LoginSuccessResponse | MfaRequiredResponse | NewPasswordRequiredResponse;

// === NEW PASSWORD (Product-004) ===

export interface NewPasswordRequest {
  username?: string;
  newPassword?: string;
  session?: string;
}

export type NewPasswordResponse = LoginSuccessResponse;
