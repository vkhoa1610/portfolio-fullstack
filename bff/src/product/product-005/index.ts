import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffProduct005 = {
  endpoint: BFF_ENDPOINTS.AUTH_002, // /auth/mfa
  method: 'post',
  handle,
};
