// GET /emp-010 — current user's latest erasure request status
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffEmp010 = {
  endpoint: BFF_ENDPOINTS.EMP_010,
  method: 'get',
  handle,
};
