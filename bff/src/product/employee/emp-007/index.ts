// GET expenses/view-url
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffEmp007 = {
  endpoint: BFF_ENDPOINTS.EMP_007,
  method: 'get',
  handle,
};
