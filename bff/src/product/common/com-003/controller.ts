import { Request, Response } from 'express';
import { throwBffError } from '@common/util/response-handler.js';

/**
 * POST /api/auth/new-password
 * Previously handled Cognito NEW_PASSWORD_REQUIRED challenge.
 * Auth0 does not have this flow — users are created with permanent passwords.
 * Endpoint kept for backwards compatibility but always returns 410 Gone.
 */
export const handle = async (_req: Request, res: Response) => {
  return throwBffError('This flow is not supported with Auth0. Please contact your administrator.', 410);
};
