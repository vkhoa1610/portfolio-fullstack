import { createBffRouter } from '@common/util/create-bff-router.js';
import { bffAdm001 } from '@product/admin/adm-001/index.js';
import { bffAdm002 } from '@product/admin/adm-002/index.js';
import { bffAdm003 } from '@product/admin/adm-003/index.js';
import { bffAdm004 } from '@product/admin/adm-004/index.js';
import { bffAdm005 } from '@product/admin/adm-005/index.js';
import { bffAdm006 } from '@product/admin/adm-006/index.js';
import { bffAdm007 } from '@product/admin/adm-007/index.js';
import { bffAdm008 } from '@product/admin/adm-008/index.js';
import { bffAdm009 } from '@product/admin/adm-009/index.js';
import { bffAdm010 } from '@product/admin/adm-010/index.js';

const bffList = [
  bffAdm001, // GET  /adm-001/users
  bffAdm002, // GET  /adm-002/:sub/permissions
  bffAdm003, // POST /adm-003/:sub/permissions
  bffAdm004, // DELETE /adm-004/:sub/permissions/:code
  bffAdm005, // GET  /adm-005/:sub/functions
  bffAdm006, // POST /adm-006/:sub/functions
  bffAdm007, // DELETE /adm-007/:sub/functions/:key
  bffAdm008, // POST /adm-008/import/users
  bffAdm009, // POST /adm-009/import/permissions
  bffAdm010, // GET  /adm-010/template/:type
];

export const createAdminRouter = () => createBffRouter('admin', bffList);
