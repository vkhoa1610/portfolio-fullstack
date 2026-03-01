// GET expenses/upload-url
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffEmp001 = {
  endpoint: BFF_ENDPOINTS.EMP_001,
  method: 'get',
  handle,
};
