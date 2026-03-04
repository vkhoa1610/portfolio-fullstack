// DELETE /adm-004/:sub/permissions/:code — revoke permission
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffAdm004 = {
  endpoint: BFF_ENDPOINTS.ADM_004,
  method: 'delete',
  handle,
};
