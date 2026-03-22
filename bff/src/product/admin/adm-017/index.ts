// POST adm-017/ai-playground/chat
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffAdm017 = {
  endpoint: BFF_ENDPOINTS.ADM_017,
  method: 'post',
  handle,
};
