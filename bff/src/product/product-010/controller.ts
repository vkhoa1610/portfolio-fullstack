import { Request, Response } from 'express';
import { ProcessStatus, ErrorResponse } from '@common/config/common-types.js';
import { handleNormal, handleBackendError, throwBffError } from '@common/util/response-handler.js';
import { apiClientPost } from '@common/config/apiClient.js';
import { JAVA_API_URL } from '@common/config/env.js';

/**
 * POST /api/expenses
 * Tạo expense mới (lưu DRAFT)
 */
export const handle = async (req: Request, res: Response) => {
  try {
    const idToken = req.authTokens?.idToken;
    if (!idToken) return throwBffError('Authentication required', 401);

    const body = req.body;
    if (!body.type || !['RECEIPT', 'PER_DIEM', 'MILEAGE'].includes(body.type)) {
      return throwBffError('type must be RECEIPT, PER_DIEM, or MILEAGE', 400);
    }

    const response = await apiClientPost('/api/v1/expenses', body, {
      baseURL: JAVA_API_URL,
      headers: { Authorization: `Bearer ${idToken}` },
    });

    return handleNormal(res, response.data);
  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
