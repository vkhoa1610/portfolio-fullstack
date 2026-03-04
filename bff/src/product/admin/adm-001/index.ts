// GET /adm-001/users — list all users
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffAdm001 = {
  endpoint: BFF_ENDPOINTS.ADM_001,
  method: 'get',
  handle,
};
