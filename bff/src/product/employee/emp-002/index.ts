// POST expenses/scan
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffEmp002 = {
  endpoint: BFF_ENDPOINTS.EMP_002,
  method: 'post',
  handle,
};
