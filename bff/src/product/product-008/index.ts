import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffProduct008 = {
  endpoint: BFF_ENDPOINTS.ONBOARDING_001, // /onboarding/consent
  method: 'post',
  handle,
};
