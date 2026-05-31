// GET /adm-021/gdpr/audit-log — recent GDPR audit events
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffAdm021 = {
  endpoint: BFF_ENDPOINTS.ADM_021,
  method: 'get',
  handle,
};
