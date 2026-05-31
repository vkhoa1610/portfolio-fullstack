// GET /adm-018/gdpr/requests — GDPR erasure request queue
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffAdm018 = {
  endpoint: BFF_ENDPOINTS.ADM_018,
  method: 'get',
  handle,
};
