import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffProduct010 = {
  endpoint: BFF_ENDPOINTS.EXPENSE_001, // POST /expenses
  method: 'post',
  handle,
};
