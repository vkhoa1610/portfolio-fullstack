// POST /adm-003/:sub/permissions — grant permission
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffAdm003 = {
  endpoint: BFF_ENDPOINTS.ADM_003,
  method: 'post',
  handle,
};
