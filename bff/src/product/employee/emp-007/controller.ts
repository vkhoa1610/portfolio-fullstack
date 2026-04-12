import { Request, Response } from 'express';
import { handleNormal, handleBackendError, throwBffError } from '@common/util/response-handler.js';
import { apiClientGet } from '@common/config/apiClient.js';
import { JAVA_API_URL } from '@common/config/env.js';

/**
 * GET /api/expenses/view-url?fileUrl=...
 * Returns a 1-hour presigned GET URL for a private-bucket receipt file.
 */
export const handle = async (req: Request, res: Response) => {
  try {
    const idToken = req.authTokens?.idToken;
    if (!idToken) return throwBffError('Authentication required', 401);

    const { fileUrl } = req.query;
    if (!fileUrl) return throwBffError('fileUrl is required', 400);

    const response = await apiClientGet(
      `/api/v1/expenses/view-url?fileUrl=${encodeURIComponent(String(fileUrl))}`,
      {
        baseURL: JAVA_API_URL,
        headers: { Authorization: `Bearer ${idToken}` },
      }
    );

    return handleNormal(res, response.data);
  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
