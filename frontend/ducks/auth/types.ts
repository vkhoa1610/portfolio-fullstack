// ============================================================================
// FRONTEND AUTH TYPES
// These types mirror the BFF response types but are frontend-safe
// ============================================================================

/**
 * Frontend-safe session snapshot
 * This is the ONLY auth-related data stored in React
 * 
 * ❌ NO access_token
 * ❌ NO id_token  
 * ❌ NO refresh_token
 */
export interface UISession {
  user: {
    email: string;
    role: 'EMPLOYEE' | 'MANAGER' | 'FINANCE';
  };
  budget: number;
  onboardingStatus: 'PENDING' | 'DONE';
  permissions: string[];
  functions: number[];
  isAdmin: boolean;
}

// ============================================================================
// LOGIN TYPES
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

/** Successful login - user is fully authenticated */
export interface LoginSuccessResponse {
  processStatus: number;
  message: string[];
  authenticated: true;
  session: UISession;
  redirectTo: '/onboarding' | '/dashboard' | '/admin';
}

/** MFA required - user needs to provide OTP */
export interface MfaRequiredResponse {
  processStatus: number;
  message: string[];
  authenticated: false;
  mfaRequired: true;
  challengeName: 'SOFTWARE_TOKEN_MFA';
  session: string; // Cognito session for MFA (passed back to BFF)
  maskedEmail: string;
}

/** New password required - first login with temp password */
export interface NewPasswordRequiredResponse {
  processStatus: number;
  message: string[];
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
// MFA TYPES
// ============================================================================

export interface MfaVerifyRequest {
  otp: string;
  session: string;
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
// SESSION TYPES
// ============================================================================

export interface SessionResponse {
  processStatus: number;
  message: string[];
  authenticated: boolean;
  session?: UISession;
}

// ============================================================================
// LOGOUT TYPES
// ============================================================================

export interface LogoutResponse {
  processStatus: number;
  message: string[];
  authenticated: false;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export const isMfaRequired = (response: LoginResponse): response is MfaRequiredResponse => {
  return 'mfaRequired' in response && response.mfaRequired === true;
};

export const isNewPasswordRequired = (
  response: LoginResponse,
): response is NewPasswordRequiredResponse => {
  return 'newPasswordRequired' in response && response.newPasswordRequired === true;
};

export const isLoginSuccess = (response: LoginResponse): response is LoginSuccessResponse => {
  return 'authenticated' in response && response.authenticated === true;
};

// ============================================================================
// ONBOARDING TYPES
// ============================================================================

export interface ConsentRequest {
  policyIds: number[];
}

export interface ConsentResponse {
  processStatus: number;
  message: string[];
}

export interface ProfileSetupRequest {
  languageCode: string;
}

export interface ProfileSetupResponse {
  processStatus: number;
  message: string[];
}
