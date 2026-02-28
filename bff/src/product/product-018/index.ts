import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffProduct018 = {
  endpoint: BFF_ENDPOINTS.EXPENSE_005, // GET /expenses/upload-url
  method: 'get',
  handle,
};
