// POST /adm-006/:sub/functions — grant function
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffAdm006 = {
  endpoint: BFF_ENDPOINTS.ADM_006,
  method: 'post',
  handle,
};
