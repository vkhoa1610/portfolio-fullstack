import { Request, Response } from 'express';
import { handleNormal, handleBackendError, throwBffError } from '@common/util/response-handler.js';
import { apiClientPost } from '@common/config/apiClient.js';
import { JAVA_API_URL } from '@common/config/env.js';

/**
 * POST /api/expenses/:id/submit
 * Submit expense → PENDING_REVIEW
 */
export const handle = async (req: Request, res: Response) => {
  try {
    const idToken = req.authTokens?.idToken;
    if (!idToken) return throwBffError('Authentication required', 401);

    const { id } = req.params;

    await apiClientPost(`/api/v1/expenses/${id}/submit`, {}, {
      baseURL: JAVA_API_URL,
      headers: { Authorization: `Bearer ${idToken}` },
    });

    return handleNormal(res, { message: 'Expense submitted' });
  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
