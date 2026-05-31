// POST /emp-011 — submit erasure request
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffEmp011 = {
  endpoint: BFF_ENDPOINTS.EMP_011,
  method: 'post',
  handle,
};
