import { createBffRouter } from '@common/util/create-bff-router.js';
import { bffEmp001 } from '@product/employee/emp-001/index.js';
import { bffEmp002 } from '@product/employee/emp-002/index.js';
import { bffEmp003 } from '@product/employee/emp-003/index.js';
import { bffEmp004 } from '@product/employee/emp-004/index.js';
import { bffEmp005 } from '@product/employee/emp-005/index.js';
import { bffEmp006 } from '@product/employee/emp-006/index.js';

const bffList = [
  bffEmp001, // GET  /emp-001      expenses/upload-url
  bffEmp002, // POST /emp-002      expenses/scan
  bffEmp003, // POST /emp-003      expenses (create)
  bffEmp004, // GET  /emp-004      expenses (list own)
  bffEmp005, // GET  /emp-005/:id  expenses/:id
  bffEmp006, // POST /emp-006/:id  expenses/:id/submit
];

export const createEmployeeRouter = () => createBffRouter('employee', bffList);
