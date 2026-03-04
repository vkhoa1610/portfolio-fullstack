// DELETE /adm-007/:sub/functions/:key — revoke function
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffAdm007 = {
  endpoint: BFF_ENDPOINTS.ADM_007,
  method: 'delete',
  handle,
};
