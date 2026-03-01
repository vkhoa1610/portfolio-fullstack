import { Request, Response } from 'express';
import { handleNormal, handleBackendError, throwBffError } from '@common/util/response-handler.js';
import { apiClientGet } from '@common/config/apiClient.js';
import { JAVA_API_URL } from '@common/config/env.js';

/**
 * GET /api/expenses/:id
 * Chi tiết 1 expense
 */
export const handle = async (req: Request, res: Response) => {
  try {
    const idToken = req.authTokens?.idToken;
    if (!idToken) return throwBffError('Authentication required', 401);

    const { id } = req.params;

    const response = await apiClientGet(`/api/v1/expenses/${id}`, {
      baseURL: JAVA_API_URL,
      headers: { Authorization: `Bearer ${idToken}` },
    });

    return handleNormal(res, response.data);
  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
