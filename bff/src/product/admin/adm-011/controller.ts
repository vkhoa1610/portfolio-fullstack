import { Request, Response } from 'express';
import { handleBackendError, throwBffError } from '@common/util/response-handler.js';
import { apiClientPost } from '@common/config/apiClient.js';
import { JAVA_API_URL } from '@common/config/env.js';

/**
 * POST /adm-011/reports/generate?period=2026-03
 * Triggers an async AI report generation job.
 * Returns { jobId, status: "PENDING" }
 */
export const handle = async (req: Request, res: Response) => {
  try {
    const idToken = req.authTokens?.idToken;
    if (!idToken) return throwBffError('Authentication required', 401);

    const { period } = req.query;
    if (!period || typeof period !== 'string') {
      return throwBffError('Query param "period" is required (e.g. 2026-03)', 400);
    }

    const response = await apiClientPost(
      `/api/v1/admin/reports/generate?period=${encodeURIComponent(period)}`,
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
