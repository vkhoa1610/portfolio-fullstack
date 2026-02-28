import { handle } from './controller.js';
import { BFF_ENDPOINTS } from '@common/config/bff-endpoints.js';

export const bffProduct017 = {
  endpoint: BFF_ENDPOINTS.MANAGER_003, // PUT /manager/expenses/:id/reject
  method: 'put',
  handle,
};
