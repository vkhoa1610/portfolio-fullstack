// GET /scr-001/:screenKey — screen config proxy
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffScr001 = {
  endpoint: BFF_ENDPOINTS.SCR_001,
  method: 'get',
  handle,
};
