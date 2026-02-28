import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffProduct016 = {
  endpoint: BFF_ENDPOINTS.MANAGER_002, // PUT /manager/expenses/:id/approve
  method: 'put',
  handle,
};
