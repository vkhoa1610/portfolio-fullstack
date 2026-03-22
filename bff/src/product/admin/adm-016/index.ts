// POST /adm-016/report-templates/generate-pdf — Puppeteer PDF generation
import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffAdm016 = {
  endpoint: BFF_ENDPOINTS.ADM_016,
  method: 'post',
  handle,
};
