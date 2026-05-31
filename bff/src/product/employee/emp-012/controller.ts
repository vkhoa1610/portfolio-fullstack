import { Request, Response } from 'express';
import axios from 'axios';
import { handleBackendError, throwBffError } from '@common/util/response-handler.js';
import { JAVA_API_URL } from '@common/config/env.js';

/**
 * GET /emp-012 — download a ZIP of the current user's data (GDPR Art. 20).
 * Streams the binary response straight through so we don't have to buffer the whole ZIP in memory.
 */
export const handle = async (req: Request, res: Response) => {
  try {
    const idToken = req.authTokens?.idToken;
    if (!idToken) return throwBffError('Authentication required', 401);

    const upstream = await axios.get(`${JAVA_API_URL}/api/v1/user/data-export`, {
      headers: { Authorization: `Bearer ${idToken}` },
      responseType: 'stream',
    });

    if (upstream.headers['content-type']) res.setHeader('Content-Type', upstream.headers['content-type']);
    if (upstream.headers['content-disposition']) res.setHeader('Content-Disposition', upstream.headers['content-disposition']);
    if (upstream.headers['content-length']) res.setHeader('Content-Length', upstream.headers['content-length']);

    upstream.data.pipe(res);
  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
