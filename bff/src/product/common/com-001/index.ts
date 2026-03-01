// POST auth/login
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffCom001 = {
  endpoint: BFF_ENDPOINTS.COM_001,
  method: 'post',
  handle,
};
