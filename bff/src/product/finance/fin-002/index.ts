// PUT /fin-002/:id/pay — mark single expense PAID
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffFin002 = {
  endpoint: BFF_ENDPOINTS.FIN_002,
  method: 'put',
  handle,
};
