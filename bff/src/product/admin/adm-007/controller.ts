import { Request, Response } from 'express';
import { handleBackendError, throwBffError } from '@common/util/response-handler.js';
import { apiClientDelete } from '@common/config/apiClient.js';
import { JAVA_API_URL } from '@common/config/env.js';

/**
 * DELETE /adm-007/:sub/functions/:key
 * Revoke (soft-delete) a UI function from a user
 */
export const handle = async (req: Request, res: Response) => {
  try {
    const idToken = req.authTokens?.idToken;
    if (!idToken) return throwBffError('Authentication required', 401);

    const { sub, key } = req.params;

    await apiClientDelete(`/api/v1/admin/users/${sub}/functions/${key}`, {
      baseURL: JAVA_API_URL,
      headers: { Authorization: `Bearer ${idToken}` },
    });

    return res.status(200).json({ message: 'Function revoked' });
  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
