import { Request, Response } from 'express';
import { handleNormal, handleBackendError, throwBffError } from '@common/util/response-handler.js';
import { apiClientPost } from '@common/config/apiClient.js';
import { JAVA_API_URL } from '@common/config/env.js';

/**
 * POST /adm-017/ai-playground/chat
 * Body: { systemPrompt?: string, userPrompt: string }
 * Admin-only: test the AI model with custom prompts.
 * Returns: { response, model, durationMs } or { error, model, durationMs }
 */
export const handle = async (req: Request, res: Response) => {
  try {
    const idToken = req.authTokens?.idToken;
    if (!idToken) return throwBffError('Authentication required', 401);

    const { systemPrompt, userPrompt } = req.body;
    if (!userPrompt?.trim()) {
      return throwBffError('userPrompt is required', 400);
    }

    const response = await apiClientPost(
      '/api/v1/admin/ai-playground/chat',
      { systemPrompt: systemPrompt || '', userPrompt },
      {
        baseURL: JAVA_API_URL,
        headers: { Authorization: `Bearer ${idToken}` },
        timeout: 150_000, // 2.5min — LLM can be slow
      },
    );

    return handleNormal(res, response.data);
  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
