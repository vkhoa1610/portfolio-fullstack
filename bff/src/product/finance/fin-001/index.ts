// GET finance/expenses
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffFin001 = {
  endpoint: BFF_ENDPOINTS.FIN_001,
  method: 'get',
  handle,
};
