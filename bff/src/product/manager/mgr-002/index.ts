// PUT manager/expenses/:id/approve
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffMgr002 = {
  endpoint: BFF_ENDPOINTS.MGR_002,
  method: 'put',
  handle,
};
