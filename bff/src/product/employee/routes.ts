import { createBffRouter } from '@common/util/create-bff-router.js';
import { bffEmp001 } from '@product/employee/emp-001/index.js';
import { bffEmp002 } from '@product/employee/emp-002/index.js';
import { bffEmp003 } from '@product/employee/emp-003/index.js';
import { bffEmp004 } from '@product/employee/emp-004/index.js';
import { bffEmp005 } from '@product/employee/emp-005/index.js';
import { bffEmp006 } from '@product/employee/emp-006/index.js';
import { bffEmp007 } from '@product/employee/emp-007/index.js';
import { bffEmp008 } from '@product/employee/emp-008/index.js';
import { bffEmp009 } from '@product/employee/emp-009/index.js';
import { bffEmp010 } from '@product/employee/emp-010/index.js';
import { bffEmp011 } from '@product/employee/emp-011/index.js';
import { bffEmp012 } from '@product/employee/emp-012/index.js';

const bffList = [
  bffEmp001, // GET  /emp-001      expenses/upload-url
  bffEmp002, // POST /emp-002      expenses/scan
  bffEmp003, // POST /emp-003      expenses (create)
  bffEmp004, // GET  /emp-004      expenses (list own)
  bffEmp005, // GET  /emp-005/:id  expenses/:id
  bffEmp006, // POST /emp-006/:id  expenses/:id/submit
  bffEmp007, // GET  /emp-007      expenses/view-url
  bffEmp008, // GET  /emp-008      privacy/data-map
  bffEmp009, // GET  /emp-009      privacy/consents
  bffEmp010, // GET  /emp-010      privacy/erasure-status
  bffEmp011, // POST /emp-011      privacy/erasure-request
  bffEmp012, // GET  /emp-012      data-export (ZIP)
];

export const createEmployeeRouter = () => createBffRouter('employee', bffList);
