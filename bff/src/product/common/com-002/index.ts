// POST auth/mfa
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffCom002 = {
  endpoint: BFF_ENDPOINTS.COM_002,
  method: 'post',
  handle,
};
