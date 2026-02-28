import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffProduct012 = {
  endpoint: BFF_ENDPOINTS.EXPENSE_002, // GET /expenses/:id
  method: 'get',
  handle,
};
