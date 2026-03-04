import { Request, Response } from 'express';
import { handleBackendError, throwBffError } from '@common/util/response-handler.js';
import { apiClientDelete } from '@common/config/apiClient.js';
import { JAVA_API_URL } from '@common/config/env.js';

/**
 * DELETE /adm-004/:sub/permissions/:code
 * Revoke (soft-delete) a permission from a user
 */
export const handle = async (req: Request, res: Response) => {
  try {
    const idToken = req.authTokens?.idToken;
    if (!idToken) return throwBffError('Authentication required', 401);

    const { sub, code } = req.params;

    await apiClientDelete(`/api/v1/admin/users/${sub}/permissions/${code}`, {
      baseURL: JAVA_API_URL,
      headers: { Authorization: `Bearer ${idToken}` },
    });

    return res.status(200).json({ message: 'Permission revoked' });
  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
