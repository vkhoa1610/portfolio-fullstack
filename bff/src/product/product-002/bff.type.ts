import { BaseResponse } from '@common/config/common-types.js';

// === MFA (Product-002) ===

export interface MfaRequest {
  otp?: string;
  session?: string;
}

export interface MfaSuccessResponse extends BaseResponse {
  user: {
    role?: string;
    budget?: number;
    firstLogin: boolean;
  };
  redirectUrl: string;
}
