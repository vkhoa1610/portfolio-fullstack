import { Request, Response } from 'express';
import { handleBackendError, throwBffError } from '@common/util/response-handler.js';
import { apiClientGet } from '@common/config/apiClient.js';
import { JAVA_API_URL } from '@common/config/env.js';

/**
 * GET /adm-013/reports/latest
 * Returns the most recent DONE report, or { exists: false } if none yet.
 */
export const handle = async (req: Request, res: Response) => {
  try {
    const idToken = req.authTokens?.idToken;
    if (!idToken) return throwBffError('Authentication required', 401);

    const response = await apiClientGet(
      '/api/v1/admin/reports/latest',
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
