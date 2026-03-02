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
  redirectTo: '/onboarding' | '/dashboard';
}

/** MFA required - user needs to provide OTP */
export interface MfaRequiredResponse extends BaseResponse {
  authenticated: false;
  mfaRequired: true;
  challengeName: 'SOFTWARE_TOKEN_MFA';
  session: string; // Cognito session for MFA challenge (temporary, not stored)
  maskedEmail: string; // e.g., "u***@example.com"
}

/** New password required - first login with temp password */
export interface NewPasswordRequiredResponse extends BaseResponse {
  authenticated: false;
  newPasswordRequired: true;
  challengeName: 'NEW_PASSWORD_REQUIRED';
  session: string;
  username: string;
}

export type LoginResponse =
  | LoginSuccessResponse
  | MfaRequiredResponse
  | NewPasswordRequiredResponse;

// ============================================================================
// MFA VERIFICATION TYPES
// ============================================================================

export interface MfaVerifyRequest {
  otp: string;
  session: string; // Cognito challenge session
  email: string;
}

export type MfaVerifyResponse = LoginSuccessResponse;

// ============================================================================
// NEW PASSWORD TYPES
// ============================================================================

export interface NewPasswordRequest {
  username: string;
  newPassword: string;
  session: string;
}

export type NewPasswordResponse = LoginSuccessResponse;

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
 * Type guard to check if login response requires new password
 */
export const isNewPasswordRequired = (
  response: LoginResponse,
): response is NewPasswordRequiredResponse => {
  return 'newPasswordRequired' in response && response.newPasswordRequired === true;
};

/**
 * Type guard to check if login was successful
 */
export const isLoginSuccess = (response: LoginResponse): response is LoginSuccessResponse => {
  return 'authenticated' in response && response.authenticated === true;
};
