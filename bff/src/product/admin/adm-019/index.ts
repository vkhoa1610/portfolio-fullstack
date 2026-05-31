// GET /adm-019/gdpr/data-map/:sub — per-user data inventory
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffAdm019 = {
  endpoint: BFF_ENDPOINTS.ADM_019,
  method: 'get',
  handle,
};
