// POST auth/logout
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffCom005 = {
  endpoint: BFF_ENDPOINTS.COM_005,
  method: 'post',
  handle,
};
