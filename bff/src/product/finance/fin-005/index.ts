// GET finance/reports (list)
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffFin005 = {
  endpoint: BFF_ENDPOINTS.FIN_005,
  method: 'get',
  handle,
};
