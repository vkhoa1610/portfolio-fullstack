import { createBffRouter } from '@common/util/create-bff-router.js';
import { bffFin001 } from '@product/finance/fin-001/index.js';

const bffList = [
  bffFin001, // GET /fin-001  finance/expenses
];

export const createFinanceRouter = () => createBffRouter('finance', bffList);
