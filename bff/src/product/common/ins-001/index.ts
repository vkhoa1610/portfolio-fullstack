import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffIns001 = {
  endpoint: BFF_ENDPOINTS.INS_001,
  method: 'post',
  handle,
};
