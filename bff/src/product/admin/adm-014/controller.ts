import { Request, Response } from 'express';
import { handleBackendError, throwBffError } from '@common/util/response-handler.js';
import { apiClientGet, apiClientPost } from '@common/config/apiClient.js';
import { JAVA_API_URL } from '@common/config/env.js';

const BASE = '/api/v1/admin/report-templates';

/**
 * GET  /adm-014/report-templates → list all templates
 * POST /adm-014/report-templates → create template
 */
export const handle = async (req: Request, res: Response) => {
  try {
    const idToken = req.authTokens?.idToken;
    if (!idToken) return throwBffError('Authentication required', 401);

    const headers = { Authorization: `Bearer ${idToken}` };

    if (req.method === 'GET') {
      const response = await apiClientGet(BASE, { baseURL: JAVA_API_URL, headers });
      return res.status(200).json(response.data);
    }

    if (req.method === 'POST') {
      const response = await apiClientPost(BASE, req.body, { baseURL: JAVA_API_URL, headers });
      return res.status(200).json(response.data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
