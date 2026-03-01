// GET manager/expenses
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffMgr001 = {
  endpoint: BFF_ENDPOINTS.MGR_001,
  method: 'get',
  handle,
};
