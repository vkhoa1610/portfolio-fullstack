import { Request, Response } from 'express';
import { handleBackendError, throwBffError } from '@common/util/response-handler.js';
import { apiClientPut } from '@common/config/apiClient.js';
import { JAVA_API_URL } from '@common/config/env.js';

/**
 * PUT /fin-002/:id/pay
 * Finance: mark a single APPROVED expense as PAID.
 */
export const handle = async (req: Request, res: Response) => {
  try {
    const idToken = req.authTokens?.idToken;
    if (!idToken) return throwBffError('Authentication required', 401);

    const { id } = req.params;

    const response = await apiClientPut(
      `/api/v1/finance/expenses/${id}/pay`,
      {},
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
