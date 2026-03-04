// GET /adm-010/template/:type — download CSV template
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffAdm010 = {
  endpoint: BFF_ENDPOINTS.ADM_010,
  method: 'get',
  handle,
};
