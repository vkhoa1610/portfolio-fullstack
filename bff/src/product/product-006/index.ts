import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffProduct006 = {
  endpoint: BFF_ENDPOINTS.AUTH_005, // /auth/session
  method: 'get',
  handle,
};
