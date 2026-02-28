import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffProduct014 = {
  endpoint: BFF_ENDPOINTS.EXPENSE_004, // POST /expenses/scan
  method: 'post',
  handle,
};
