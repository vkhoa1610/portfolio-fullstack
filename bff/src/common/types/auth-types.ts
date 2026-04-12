import { BaseResponse } from '../config/common-types.js';

// ============================================================================
// CORE SESSION TYPES - Frontend-Safe Only (No Tokens!)
// ============================================================================

/**
 * User information safe for frontend display
 * Contains NO sensitive data or tokens
 */
export interface UISessionUser {
  email: string;
  role: 'USER' | 'ADMIN';
}

/**
 * Frontend-safe session snapshot
 * This is the ONLY auth-related data the frontend should ever receive
 * 
 * ❌ NO access_token
 * ❌ NO id_token  
 * ❌ NO refresh_token
 * ❌ NO Cognito session strings
 */
export interface UISession {
  user: UISessionUser;
  budget: number;
  onboardingStatus: 'PENDING' | 'DONE';
  permissions: string[];
  functions: number[];
  isAdmin: boolean;
}

// ============================================================================
// LOGIN FLOW TYPES
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

/** Successful login - user is fully authenticated */
export interface LoginSuccessResponse extends BaseResponse {
  authenticated: true;
  session: UISession;
  redirectTo: '/onboarding' | '/dashboard' | '/admin';
}

/** MFA required - user needs to provide OTP */
export interface MfaRequiredResponse extends BaseResponse {
  authenticated: false;
  mfaRequired: true;
  challengeName: 'MFA_REQUIRED';
  session: string; // Auth0 mfa_token (opaque, passed back as-is)
  maskedEmail: string; // e.g., "u***@example.com"
}

export type LoginResponse =
  | LoginSuccessResponse
  | MfaRequiredResponse;

// ============================================================================
// MFA VERIFICATION TYPES
// ============================================================================

export interface MfaVerifyRequest {
  otp: string;
  session: string; // Auth0 mfa_token (passed back from com-001 response)
  email: string;
}

export type MfaVerifyResponse = LoginSuccessResponse;

// ============================================================================
// SESSION MANAGEMENT TYPES
// ============================================================================

/** Response for GET /auth/session - re-hydrates UI after page refresh */
export interface SessionResponse extends BaseResponse {
  authenticated: boolean;
  session?: UISession;
}

/** Response for POST /auth/logout */
export interface LogoutResponse extends BaseResponse {
  authenticated: false;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Masks an email for display (e.g., "user@example.com" -> "u***@example.com")
 */
export const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!domain || local.length <= 1) {
    return email;
  }
  return `${local[0]}***@${domain}`;
};

/**
 * Type guard to check if login response requires MFA
 */
export const isMfaRequired = (response: LoginResponse): response is MfaRequiredResponse => {
  return 'mfaRequired' in response && response.mfaRequired === true;
};

/**
 * Type guard to check if login was successful
 */
export const isLoginSuccess = (response: LoginResponse): response is LoginSuccessResponse => {
  return 'authenticated' in response && response.authenticated === true;
};
