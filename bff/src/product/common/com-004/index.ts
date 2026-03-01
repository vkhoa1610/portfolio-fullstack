// GET auth/session
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffCom004 = {
  endpoint: BFF_ENDPOINTS.COM_004,
  method: 'get',
  handle,
};
