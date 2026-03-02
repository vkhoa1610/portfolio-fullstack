import { Request, Response } from 'express';
import { apiClientGet } from '@common/config/apiClient.js';
import { JAVA_API_URL } from '@common/config/env.js';
import { getAuthCookies } from '@common/config/cookie-config.js';
import { handleBackendError, throwBffError } from '@common/util/response-handler.js';

/**
 * GET /scr-001/:screenKey
 * Proxies the CMS screen config JSON from Java backend.
 *
 * - Requires a valid session (idToken cookie)
 * - Returns the raw config JSON string for the requested screen
 * - 404 if the screen key has no active config
 */
export const handle = async (req: Request, res: Response) => {
  try {
    const { screenKey } = req.params;

    if (!screenKey) {
      return throwBffError('screenKey is required', 400);
    }

    const tokens = getAuthCookies(req.cookies || {});
    if (!tokens) {
      return throwBffError('Unauthorized', 401);
    }

    const response = await apiClientGet<string>(
      `/api/v1/screen-configs/${encodeURIComponent(screenKey)}`,
      {
        baseURL: JAVA_API_URL,
        headers: {
          Authorization: `Bearer ${tokens.idToken}`,
        },
      },
    );

    // The Java endpoint returns a raw JSON string — parse and re-send as JSON
    const configJson = typeof response.data === 'string'
      ? JSON.parse(response.data)
      : response.data;

    return res.status(200).json(configJson);
  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
