// GET/PUT /adm-015/report-templates/:id — get & update report template
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffAdm015 = {
  endpoint: BFF_ENDPOINTS.ADM_015,
  method: 'all',
  handle,
};
