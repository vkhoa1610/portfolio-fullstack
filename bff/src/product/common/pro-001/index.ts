import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffPro001 = {
  endpoint: BFF_ENDPOINTS.PRO_001,
  method: 'get',
  handle,
};
