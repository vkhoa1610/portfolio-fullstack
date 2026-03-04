// GET /adm-005/:sub/functions — function status (3-state)
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffAdm005 = {
  endpoint: BFF_ENDPOINTS.ADM_005,
  method: 'get',
  handle,
};
