import { Request, Response } from 'express';
import { handleNormal, handleBackendError, throwBffError } from '@common/util/response-handler.js';
import { apiClientGet } from '@common/config/apiClient.js';
import { JAVA_API_URL } from '@common/config/env.js';

const VALID_STATUSES = new Set(['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PAID', 'ALL']);

/**
 * GET /api/manager/expenses?status=PENDING_REVIEW|APPROVED|REJECTED|PAID|ALL
 * Manager: danh sách expenses theo trạng thái (mặc định PENDING_REVIEW).
 * Backend cũng validate lại status bằng whitelist — check ở đây chỉ để
 * fail fast trước khi gọi Java API.
 */
export const handle = async (req: Request, res: Response) => {
  try {
    const idToken = req.authTokens?.idToken;
    if (!idToken) return throwBffError('Authentication required', 401);

    const status = typeof req.query.status === 'string' ? req.query.status : 'PENDING_REVIEW';
    if (!VALID_STATUSES.has(status)) {
      return throwBffError(`Invalid status filter: ${status}`, 400);
    }

    const response = await apiClientGet('/api/v1/manager/expenses', {
      baseURL: JAVA_API_URL,
      headers: { Authorization: `Bearer ${idToken}` },
      params: { status },
    });

    return handleNormal(res, response.data);
  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
