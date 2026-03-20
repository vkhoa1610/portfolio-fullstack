import { Request, Response } from 'express';
import { handleBackendError, throwBffError } from '@common/util/response-handler.js';
import { apiClientPut } from '@common/config/apiClient.js';
import { JAVA_API_URL } from '@common/config/env.js';

/**
 * PUT /fin-003/batch-pay
 * Finance: bulk mark a list of APPROVED expenses as PAID.
 * Body: { ids: number[] }
 */
export const handle = async (req: Request, res: Response) => {
  try {
    const idToken = req.authTokens?.idToken;
    if (!idToken) return throwBffError('Authentication required', 401);

    const { ids } = req.body as { ids?: number[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      return throwBffError('Body must contain a non-empty "ids" array', 400);
    }

    const response = await apiClientPut(
      '/api/v1/finance/expenses/batch-pay',
      { ids },
      {
        baseURL: JAVA_API_URL,
        headers: { Authorization: `Bearer ${idToken}` },
      },
    );

    return res.status(200).json(response.data);
  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
