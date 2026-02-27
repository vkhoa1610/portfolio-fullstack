import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffProduct009 = {
  endpoint: BFF_ENDPOINTS.ONBOARDING_002, // /onboarding/profile
  method: 'post',
  handle,
};
