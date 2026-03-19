import { Request, Response } from 'express';
import { handleBackendError, throwBffError } from '@common/util/response-handler.js';
import { apiClientGet } from '@common/config/apiClient.js';
import { JAVA_API_URL } from '@common/config/env.js';

/**
 * GET /adm-012/reports/status/:jobId
 * Poll job status. Returns { id, period, status, markdown, reportData, generatedAt }
 */
export const handle = async (req: Request, res: Response) => {
  try {
    const idToken = req.authTokens?.idToken;
    if (!idToken) return throwBffError('Authentication required', 401);

    const { jobId } = req.params;

    const response = await apiClientGet(
      `/api/v1/admin/reports/status/${jobId}`,
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
