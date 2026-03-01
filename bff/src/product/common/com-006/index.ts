// POST onboarding/consent
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffCom006 = {
  endpoint: BFF_ENDPOINTS.COM_006,
  method: 'post',
  handle,
};
