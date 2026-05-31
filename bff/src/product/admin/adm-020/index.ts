// POST /adm-020/gdpr/process/:id — run full erasure workflow
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffAdm020 = {
  endpoint: BFF_ENDPOINTS.ADM_020,
  method: 'post',
  handle,
};
