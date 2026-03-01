// POST expenses (create)
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffEmp003 = {
  endpoint: BFF_ENDPOINTS.EMP_003,
  method: 'post',
  handle,
};
