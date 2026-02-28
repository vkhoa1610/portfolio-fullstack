import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffProduct015 = {
  endpoint: BFF_ENDPOINTS.MANAGER_001, // GET /manager/expenses
  method: 'get',
  handle,
};
