import { Request, Response } from 'express';
import { signIn } from '@common/config/auth0-service.js';
import { ProcessStatus, ErrorResponse } from '@common/config/common-types.js';
import { setAuthCookies } from '@common/config/cookie-config.js';
import { handleNormal, handleBackendError, throwBffError } from '@common/util/response-handler.js';
import { fetchUserProfile, fetchUserPermissions, fetchUserFunctions, fetchUserAdminStatus, buildUISession, getRedirectUrl } from '@common/util/auth-utils.js';
import { LoginSuccessResponse } from '@common/types/auth-types.js';
import { DEMO_CREDENTIALS } from '@common/config/env.js';

const VALID_ROLES = ['EMPLOYEE', 'MANAGER', 'FINANCE', 'ADMIN', 'NEW_EMPLOYEE'] as const;
type DemoRole = typeof VALID_ROLES[number];

/**
 * POST /demo-001?role=EMPLOYEE|MANAGER|FINANCE|ADMIN
 * One-click demo login for portfolio visitors.
 * Credentials are read from BFF env vars — never exposed to the frontend.
 */
export const handle = async (req: Request, res: Response<LoginSuccessResponse | ErrorResponse>) => {
  try {
    const role = (req.query.role as string)?.toUpperCase() as DemoRole;

    if (!role || !VALID_ROLES.includes(role)) {
      return throwBffError('Invalid demo role. Must be EMPLOYEE, MANAGER, FINANCE, ADMIN, or NEW_EMPLOYEE.', 400);
    }

    const creds = DEMO_CREDENTIALS[role];
    if (!creds?.email || !creds?.password) {
      return throwBffError(`Demo account for ${role} is not configured.`, 503);
    }

    console.log(`🎭 Demo login as ${role}: ${creds.email}`);

    const result = await signIn(creds.email, creds.password);

    if (result.type === 'mfa_required') {
      return throwBffError('Demo accounts must not have MFA enabled.', 503);
    }

    if (result.type === 'error') {
      return throwBffError(result.message, 401);
    }

    const { access_token, id_token, refresh_token } = result.data;

    setAuthCookies(res, { accessToken: access_token, idToken: id_token, refreshToken: refresh_token });

    const [userProfile, permissions, functions, isAdmin] = await Promise.all([
      fetchUserProfile(id_token),
      fetchUserPermissions(id_token),
      fetchUserFunctions(id_token),
      fetchUserAdminStatus(id_token),
    ]);

    const uiSession  = buildUISession(userProfile, creds.email, permissions, functions, isAdmin);
    const redirectTo = getRedirectUrl(userProfile, isAdmin);

    return handleNormal(res, {
      processStatus: ProcessStatus.SUCCESS,
      message:       [`Demo login successful as ${role}`],
      authenticated: true,
      session:       uiSession,
      redirectTo,
    });
  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
