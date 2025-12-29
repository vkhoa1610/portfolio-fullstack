import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffProduct007 = {
  endpoint: BFF_ENDPOINTS.AUTH_006, // /auth/logout
  method: 'post',
  handle,
};
