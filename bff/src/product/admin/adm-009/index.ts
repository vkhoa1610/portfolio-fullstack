// POST /adm-009/import/permissions — bulk import permissions via CSV
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffAdm009 = {
  endpoint: BFF_ENDPOINTS.ADM_009,
  method: 'post',
  handle,
};
