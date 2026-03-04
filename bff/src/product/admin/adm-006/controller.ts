import { Request, Response } from 'express';
import { handleBackendError, throwBffError } from '@common/util/response-handler.js';
import { apiClientPost } from '@common/config/apiClient.js';
import { JAVA_API_URL } from '@common/config/env.js';

/**
 * POST /adm-006/:sub/functions
 * Grant a UI function to a user. Body: { functionKey: string }
 */
export const handle = async (req: Request, res: Response) => {
  try {
    const idToken = req.authTokens?.idToken;
    if (!idToken) return throwBffError('Authentication required', 401);

    const { sub } = req.params;

    await apiClientPost(`/api/v1/admin/users/${sub}/functions`, req.body, {
      baseURL: JAVA_API_URL,
      headers: { Authorization: `Bearer ${idToken}` },
    });

    return res.status(200).json({ message: 'Function granted' });
  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
