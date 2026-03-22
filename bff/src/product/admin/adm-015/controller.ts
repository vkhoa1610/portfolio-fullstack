import { Request, Response } from 'express';
import { handleBackendError, throwBffError } from '@common/util/response-handler.js';
import { apiClientGet, apiClientPut } from '@common/config/apiClient.js';
import { JAVA_API_URL } from '@common/config/env.js';

/**
 * GET /adm-015/report-templates/:id → get one template
 * PUT /adm-015/report-templates/:id → update template
 */
export const handle = async (req: Request, res: Response) => {
  try {
    const idToken = req.authTokens?.idToken;
    if (!idToken) return throwBffError('Authentication required', 401);

    const { id } = req.params;
    const url = `/api/v1/admin/report-templates/${id}`;
    const headers = { Authorization: `Bearer ${idToken}` };

    if (req.method === 'GET') {
      const response = await apiClientGet(url, { baseURL: JAVA_API_URL, headers });
      return res.status(200).json(response.data);
    }

    if (req.method === 'PUT') {
      const response = await apiClientPut(url, req.body, { baseURL: JAVA_API_URL, headers });
      return res.status(200).json(response.data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
