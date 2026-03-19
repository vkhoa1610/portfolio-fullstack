// POST /adm-011/reports/generate — trigger AI report job
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffAdm011 = {
  endpoint: BFF_ENDPOINTS.ADM_011,
  method: 'post',
  handle,
};
