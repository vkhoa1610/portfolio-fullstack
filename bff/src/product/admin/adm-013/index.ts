// GET /adm-013/reports/latest — latest DONE report
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffAdm013 = {
  endpoint: BFF_ENDPOINTS.ADM_013,
  method: 'get',
  handle,
};
