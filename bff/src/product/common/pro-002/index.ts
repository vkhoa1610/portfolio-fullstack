import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffPro002 = {
  endpoint: BFF_ENDPOINTS.PRO_002,
  method: 'put',
  handle,
};
