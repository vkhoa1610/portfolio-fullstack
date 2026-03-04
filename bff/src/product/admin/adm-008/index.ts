// POST /adm-008/import/users — bulk import users via CSV
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffAdm008 = {
  endpoint: BFF_ENDPOINTS.ADM_008,
  method: 'post',
  handle,
};
