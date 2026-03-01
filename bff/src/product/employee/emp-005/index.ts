// GET expenses/:id — canonical (shared with manager/mgr-004)
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffEmp005 = {
  endpoint: BFF_ENDPOINTS.EMP_005,
  method: 'get',
  handle,
};
