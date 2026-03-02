import { createBffRouter } from '@common/util/create-bff-router.js';
import { bffCom001 } from '@product/common/com-001/index.js';
import { bffCom002 } from '@product/common/com-002/index.js';
import { bffCom003 } from '@product/common/com-003/index.js';
import { bffCom004 } from '@product/common/com-004/index.js';
import { bffCom005 } from '@product/common/com-005/index.js';
import { bffCom006 } from '@product/common/com-006/index.js';
import { bffCom007 } from '@product/common/com-007/index.js';
import { bffScr001 } from '@product/common/scr-001/index.js';

const bffList = [
  bffCom001, // POST /com-001  auth/login
  bffCom002, // POST /com-002  auth/mfa
  bffCom003, // POST /com-003  auth/new-password
  bffCom004, // GET  /com-004  auth/session
  bffCom005, // POST /com-005  auth/logout
  bffCom006, // POST /com-006  onboarding/consent
  bffCom007, // POST /com-007  onboarding/profile
  bffScr001, // GET  /scr-001/:screenKey  screen config
];

export const createCommonRouter = () => createBffRouter('common', bffList);
