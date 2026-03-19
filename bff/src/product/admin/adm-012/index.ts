// GET /adm-012/reports/status/:jobId — poll report job status
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffAdm012 = {
  endpoint: BFF_ENDPOINTS.ADM_012,
  method: 'get',
  handle,
};
