// POST expenses/:id/submit
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffEmp006 = {
  endpoint: BFF_ENDPOINTS.EMP_006,
  method: 'post',
  handle,
};
