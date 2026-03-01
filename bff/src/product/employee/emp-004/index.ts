// GET expenses (list own)
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffEmp004 = {
  endpoint: BFF_ENDPOINTS.EMP_004,
  method: 'get',
  handle,
};
