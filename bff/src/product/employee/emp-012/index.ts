// GET /emp-012 — download data export ZIP
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffEmp012 = {
  endpoint: BFF_ENDPOINTS.EMP_012,
  method: 'get',
  handle,
};
