// ============================================================================
// ADMIN TYPES
// ============================================================================

export interface AdminUser {
  cognitoSub: string;
  email: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'FINANCE' | null;
  onboardingStatus: 'PENDING' | 'DONE' | null;
  budget: number | null;
}

export type PermissionState = 'ACTIVE' | 'INACTIVE' | 'NEVER_GRANTED';

export interface PermissionStatus {
  permissionCode: string;
  description: string;
  state: PermissionState;
  grantedBy?: string;
  createdAt?: string;
}

export interface FunctionStatus {
  functionId: number;
  functionKey: string;
  module: string;
  description: string;
  state: PermissionState;
  grantedBy?: string;
  createdAt?: string;
}

export interface ImportResult {
  successCount: number;
  failCount: number;
  errors: Array<{ row: string; message: string }>;
}
