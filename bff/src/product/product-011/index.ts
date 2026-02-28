import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffProduct011 = {
  endpoint: BFF_ENDPOINTS.EXPENSE_001, // GET /expenses
  method: 'get',
  handle,
};
