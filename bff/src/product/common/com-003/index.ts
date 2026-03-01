// POST auth/new-password
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffCom003 = {
  endpoint: BFF_ENDPOINTS.COM_003,
  method: 'post',
  handle,
};
