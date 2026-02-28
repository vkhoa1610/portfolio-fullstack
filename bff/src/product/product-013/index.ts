import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffProduct013 = {
  endpoint: BFF_ENDPOINTS.EXPENSE_003, // POST /expenses/:id/submit
  method: 'post',
  handle,
};
