// POST finance/reports (create)
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffFin004 = {
  endpoint: BFF_ENDPOINTS.FIN_004,
  method: 'post',
  handle,
};
