// GET mgr-005/reports/latest
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffMgr005 = {
  endpoint: BFF_ENDPOINTS.MGR_005,
  method: 'get',
  handle,
};
