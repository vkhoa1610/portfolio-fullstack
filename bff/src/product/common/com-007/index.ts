// POST onboarding/profile
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffCom007 = {
  endpoint: BFF_ENDPOINTS.COM_007,
  method: 'post',
  handle,
};
