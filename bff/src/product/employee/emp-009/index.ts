// GET /emp-009 — current user's consent history
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffEmp009 = {
  endpoint: BFF_ENDPOINTS.EMP_009,
  method: 'get',
  handle,
};
