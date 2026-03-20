// PUT /fin-003/batch-pay — bulk mark expenses PAID
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffFin003 = {
  endpoint: BFF_ENDPOINTS.FIN_003,
  method: 'put',
  handle,
};
