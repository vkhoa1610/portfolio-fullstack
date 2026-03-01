// GET expenses/:id — re-export từ canonical emp-005
import { handle } from '@product/employee/emp-005/controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffMgr004 = {
  endpoint: BFF_ENDPOINTS.MGR_004,
  method: 'get',
  handle,
};
