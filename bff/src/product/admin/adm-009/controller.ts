import { Request, Response } from 'express';
import multer from 'multer';
import FormData from 'form-data';
import { handleBackendError, throwBffError } from '@common/util/response-handler.js';
import apiClient from '@common/config/apiClient.js';
import { JAVA_API_URL } from '@common/config/env.js';

const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /adm-009/import/permissions
 * Receives a CSV file (multipart), forwards to Java backend for bulk permission import.
 * Expected CSV columns: User Email,Permission Code,Action (GRANT|REVOKE)
 */
export const handle = async (req: Request, res: Response) => {
  // Run multer middleware inline to parse the uploaded file
  await new Promise<void>((resolve, reject) => {
    upload.single('file')(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  try {
    const idToken = req.authTokens?.idToken;
    if (!idToken) return throwBffError('Authentication required', 401);

    if (!req.file) return throwBffError('file is required', 400);

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname || 'permissions.csv',
      contentType: req.file.mimetype || 'text/csv',
    });

    const response = await apiClient.post('/api/v1/admin/import/permissions', formData, {
      baseURL: JAVA_API_URL,
      headers: {
        Authorization: `Bearer ${idToken}`,
        ...formData.getHeaders(),
      },
    });

    return res.status(200).json(response.data);
  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
