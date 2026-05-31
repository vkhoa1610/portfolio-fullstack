// PUT /fin-007/gdpr/confirm/:id — Finance confirms a pseudonymization
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffFin007 = {
  endpoint: BFF_ENDPOINTS.FIN_007,
  method: 'put',
  handle,
};
