// Re-export auth types from centralized location
// This maintains backward compatibility while using the new type system
export {
  LoginRequest,
  LoginResponse,
  LoginSuccessResponse,
  MfaRequiredResponse,
  NewPasswordRequiredResponse,
  NewPasswordRequest,
  NewPasswordResponse,
} from '@common/types/auth-types.js';
