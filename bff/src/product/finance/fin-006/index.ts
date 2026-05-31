// GET /fin-006/gdpr/pending — pseudonymizations awaiting Finance sign-off
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffFin006 = {
  endpoint: BFF_ENDPOINTS.FIN_006,
  method: 'get',
  handle,
};
