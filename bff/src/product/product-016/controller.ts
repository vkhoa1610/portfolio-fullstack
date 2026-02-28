import { Request, Response } from 'express';
import { handleNormal, handleBackendError, throwBffError } from '@common/util/response-handler.js';
import { apiClientPut } from '@common/config/apiClient.js';
import { JAVA_API_URL } from '@common/config/env.js';

/**
 * PUT /api/manager/expenses/:id/approve
 */
export const handle = async (req: Request, res: Response) => {
  try {
    const idToken = req.authTokens?.idToken;
    if (!idToken) return throwBffError('Authentication required', 401);

    const { id } = req.params;

    await apiClientPut(`/api/v1/manager/expenses/${id}/approve`, {}, {
      baseURL: JAVA_API_URL,
      headers: { Authorization: `Bearer ${idToken}` },
    });

    return handleNormal(res, { message: 'Expense approved' });
  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
