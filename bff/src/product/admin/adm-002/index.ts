// GET /adm-002/:sub/permissions — permission status (3-state)
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffAdm002 = {
  endpoint: BFF_ENDPOINTS.ADM_002,
  method: 'get',
  handle,
};
