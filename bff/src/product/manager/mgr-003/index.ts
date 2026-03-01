// PUT manager/expenses/:id/reject
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffMgr003 = {
  endpoint: BFF_ENDPOINTS.MGR_003,
  method: 'put',
  handle,
};
