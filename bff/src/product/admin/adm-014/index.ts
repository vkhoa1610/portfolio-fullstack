// GET/POST /adm-014/report-templates — list & create report templates
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffAdm014 = {
  endpoint: BFF_ENDPOINTS.ADM_014,
  method: 'all',
  handle,
};
