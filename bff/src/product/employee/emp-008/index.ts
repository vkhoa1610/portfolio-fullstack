// GET /emp-008 — current user's data map
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffEmp008 = {
  endpoint: BFF_ENDPOINTS.EMP_008,
  method: 'get',
  handle,
};
