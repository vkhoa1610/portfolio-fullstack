import { Request, Response } from 'express';
import { handleBackendError, throwBffError } from '@common/util/response-handler.js';
import apiClient from '@common/config/apiClient.js';
import { JAVA_API_URL } from '@common/config/env.js';

/**
 * GET /adm-010/template/:type
 * Downloads a CSV template file. type = 'users' | 'permissions'
 */
export const handle = async (req: Request, res: Response) => {
  try {
    const idToken = req.authTokens?.idToken;
    if (!idToken) return throwBffError('Authentication required', 401);

    const { type } = req.params;
    if (type !== 'users' && type !== 'permissions') {
      return throwBffError('type must be "users" or "permissions"', 400);
    }

    const response = await apiClient.get(`/api/v1/admin/import/template/${type}`, {
      baseURL: JAVA_API_URL,
      headers: { Authorization: `Bearer ${idToken}` },
      responseType: 'arraybuffer',
    });

    res.set('Content-Type', 'text/csv');
    res.set(
      'Content-Disposition',
      response.headers['content-disposition'] || `attachment; filename="${type}_template.csv"`,
    );
    return res.send(Buffer.from(response.data));
  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
