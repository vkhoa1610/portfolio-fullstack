export const BFF_ENDPOINTS = {
  // ─── Common (auth + onboarding) ───────────────────────────────────
  COM_001: '/com-001',  // POST auth/login
  COM_002: '/com-002',  // POST auth/mfa
  COM_003: '/com-003',  // POST auth/new-password
  COM_004: '/com-004',  // GET  auth/session
  COM_005: '/com-005',  // POST auth/logout
  COM_006: '/com-006',  // POST onboarding/consent
  COM_007: '/com-007',  // POST onboarding/profile

  // ─── Employee ─────────────────────────────────────────────────────
  EMP_001: '/emp-001',      // GET  expenses/upload-url
  EMP_002: '/emp-002',      // POST expenses/scan
  EMP_003: '/emp-003',      // POST expenses (create)
  EMP_004: '/emp-004',      // GET  expenses (list own)
  EMP_005: '/emp-005/:id',  // GET  expenses/:id — canonical (shared với mgr-004)
  EMP_006: '/emp-006/:id',  // POST expenses/:id/submit

  // ─── Manager ──────────────────────────────────────────────────────
  MGR_001: '/mgr-001',      // GET manager/expenses
  MGR_002: '/mgr-002/:id',  // PUT manager/expenses/:id/approve
  MGR_003: '/mgr-003/:id',  // PUT manager/expenses/:id/reject
  MGR_004: '/mgr-004/:id',  // GET expenses/:id (re-export từ emp-005)

  // ─── Finance ──────────────────────────────────────────────────────
  FIN_001: '/fin-001',          // GET  finance/expenses (APPROVED + PAID)
  FIN_002: '/fin-002/:id/pay',  // PUT  finance/expenses/:id/pay
  FIN_003: '/fin-003/batch-pay',// PUT  finance/expenses/batch-pay

  // ─── Screen Config (CMS) ──────────────────────────────────────────
  SCR_001: '/scr-001/:screenKey',  // GET screen config JSON for a screen

  // ─── Admin ────────────────────────────────────────────────────────
  ADM_001: '/adm-001/users',                   // GET  list all users
  ADM_002: '/adm-002/:sub/permissions',         // GET  permission status (3-state)
  ADM_003: '/adm-003/:sub/permissions',         // POST grant permission
  ADM_004: '/adm-004/:sub/permissions/:code',   // DELETE revoke permission
  ADM_005: '/adm-005/:sub/functions',           // GET  function status (3-state)
  ADM_006: '/adm-006/:sub/functions',           // POST grant function
  ADM_007: '/adm-007/:sub/functions/:key',      // DELETE revoke function
  ADM_008: '/adm-008/import/users',             // POST import users CSV
  ADM_009: '/adm-009/import/permissions',       // POST import permissions CSV
  ADM_010: '/adm-010/template/:type',           // GET  download CSV template

  // ─── Admin: AI Report ─────────────────────────────────────────
  ADM_011: '/adm-011/reports/generate',         // POST trigger report job
  ADM_012: '/adm-012/reports/status/:jobId',    // GET  poll job status
  ADM_013: '/adm-013/reports/latest',           // GET  latest DONE report
} as const;