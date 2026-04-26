import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffDemo001 = {
  endpoint: BFF_ENDPOINTS.DEMO_001,
  method: 'post',
  handle,
};
