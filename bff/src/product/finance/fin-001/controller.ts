import { Request, Response } from 'express';
import { handleNormal, handleBackendError, throwBffError } from '@common/util/response-handler.js';
import { apiClientGet } from '@common/config/apiClient.js';
import { JAVA_API_URL } from '@common/config/env.js';

/**
 * GET /api/fin-001
 * Finance: all expenses (PENDING_REVIEW + APPROVED) for accountant settlement.
 *
 * TODO: Replace with /api/v1/finance/expenses when backend adds a dedicated
 * finance endpoint that returns APPROVED + PAID items without role restriction.
 * Currently proxies to /api/v1/manager/expenses (PENDING_REVIEW queue).
 */
export const handle = async (req: Request, res: Response) => {
  try {
    const idToken = req.authTokens?.idToken;
    if (!idToken) return throwBffError('Authentication required', 401);

    const response = await apiClientGet('/api/v1/manager/expenses', {
      baseURL: JAVA_API_URL,
      headers: { Authorization: `Bearer ${idToken}` },
    });

    return handleNormal(res, response.data);
  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
