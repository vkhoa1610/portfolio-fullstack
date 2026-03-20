import { createBffRouter } from '@common/util/create-bff-router.js';
import { bffFin001 } from '@product/finance/fin-001/index.js';
import { bffFin002 } from '@product/finance/fin-002/index.js';
import { bffFin003 } from '@product/finance/fin-003/index.js';

const bffList = [
  bffFin001, // GET /fin-001          finance/expenses (APPROVED + PAID)
  bffFin002, // PUT /fin-002/:id/pay  mark single PAID
  bffFin003, // PUT /fin-003/batch-pay bulk mark PAID
];

export const createFinanceRouter = () => createBffRouter('finance', bffList);
