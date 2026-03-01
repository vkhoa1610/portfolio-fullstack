import { createBffRouter } from '@common/util/create-bff-router.js';
import { bffMgr001 } from '@product/manager/mgr-001/index.js';
import { bffMgr002 } from '@product/manager/mgr-002/index.js';
import { bffMgr003 } from '@product/manager/mgr-003/index.js';
import { bffMgr004 } from '@product/manager/mgr-004/index.js';

const bffList = [
  bffMgr001, // GET /mgr-001      manager/expenses
  bffMgr002, // PUT /mgr-002/:id  manager/expenses/:id/approve
  bffMgr003, // PUT /mgr-003/:id  manager/expenses/:id/reject
  bffMgr004, // GET /mgr-004/:id  expenses/:id (shared — canonical: emp-005)
];

export const createManagerRouter = () => createBffRouter('manager', bffList);
