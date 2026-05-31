import { Request, Response } from 'express';
import { handleBackendError, throwBffError } from '@common/util/response-handler.js';
import { apiClientGet } from '@common/config/apiClient.js';
import { JAVA_API_URL } from '@common/config/env.js';

/**
 * GET /adm-021/gdpr/audit-log
 * Returns recent GDPR audit events. Optional query: ?subjectSub=<sub>&limit=200
 */
export const handle = async (req: Request, res: Response) => {
  try {
    const idToken = req.authTokens?.idToken;
    if (!idToken) return throwBffError('Authentication required', 401);

    const params = new URLSearchParams();
    if (typeof req.query.subjectSub === 'string') params.set('subjectSub', req.query.subjectSub);
    if (typeof req.query.limit === 'string') params.set('limit', req.query.limit);
    const qs = params.toString();
    const url = `/api/v1/admin/gdpr/audit-log${qs ? `?${qs}` : ''}`;

    const response = await apiClientGet(url, {
      baseURL: JAVA_API_URL,
      headers: { Authorization: `Bearer ${idToken}` },
    });

    return res.status(200).json(response.data);
  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
