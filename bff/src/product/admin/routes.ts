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
import { bffAdm011 } from '@product/admin/adm-011/index.js';
import { bffAdm012 } from '@product/admin/adm-012/index.js';
import { bffAdm013 } from '@product/admin/adm-013/index.js';
import { bffAdm014 } from '@product/admin/adm-014/index.js';
import { bffAdm015 } from '@product/admin/adm-015/index.js';
import { bffAdm016 } from '@product/admin/adm-016/index.js';
import { bffAdm017 } from '@product/admin/adm-017/index.js';
import { bffAdm018 } from '@product/admin/adm-018/index.js';
import { bffAdm019 } from '@product/admin/adm-019/index.js';
import { bffAdm020 } from '@product/admin/adm-020/index.js';
import { bffAdm021 } from '@product/admin/adm-021/index.js';

const bffList = [
  bffAdm001, // GET    /adm-001/users
  bffAdm002, // GET    /adm-002/:sub/permissions
  bffAdm003, // POST   /adm-003/:sub/permissions
  bffAdm004, // DELETE /adm-004/:sub/permissions/:code
  bffAdm005, // GET    /adm-005/:sub/functions
  bffAdm006, // POST   /adm-006/:sub/functions
  bffAdm007, // DELETE /adm-007/:sub/functions/:key
  bffAdm008, // POST   /adm-008/import/users
  bffAdm009, // POST   /adm-009/import/permissions
  bffAdm010, // GET    /adm-010/template/:type
  bffAdm011, // POST   /adm-011/reports/generate
  bffAdm012, // GET    /adm-012/reports/status/:jobId
  bffAdm013, // GET    /adm-013/reports/latest
  bffAdm014, // GET/POST /adm-014/report-templates
  bffAdm015, // GET/PUT  /adm-015/report-templates/:id
  bffAdm016, // POST   /adm-016/report-templates/generate-pdf
  bffAdm017, // POST   /adm-017/ai-playground/chat
  bffAdm018, // GET    /adm-018/gdpr/requests
  bffAdm019, // GET    /adm-019/gdpr/data-map/:sub
  bffAdm020, // POST   /adm-020/gdpr/process/:id
  bffAdm021, // GET    /adm-021/gdpr/audit-log
];

export const createAdminRouter = () => createBffRouter('admin', bffList);
