import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffPro003 = {
  endpoint: BFF_ENDPOINTS.PRO_003,
  method: 'get',
  handle,
};
