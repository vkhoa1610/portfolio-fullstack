export const BFF_ENDPOINTS = {
  // ─── Common (auth + onboarding) ───────────────────────────────────
  COM_001: '/com-001',  // POST auth/login
  DEMO_001: '/demo-001', // POST demo/login?role=EMPLOYEE|MANAGER|FINANCE|ADMIN
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
  EMP_007: '/emp-007',      // GET  expenses/view-url (presigned GET for private bucket)
  EMP_008: '/emp-008',      // GET  user/privacy/data-map
  EMP_009: '/emp-009',      // GET  user/privacy/consents
  EMP_010: '/emp-010',      // GET  user/privacy/erasure-status
  EMP_011: '/emp-011',      // POST user/privacy/erasure-request
  EMP_012: '/emp-012',      // GET  user/data-export (ZIP download)

  // ─── Manager ──────────────────────────────────────────────────────
  MGR_001: '/mgr-001',      // GET manager/expenses
  MGR_002: '/mgr-002/:id',  // PUT manager/expenses/:id/approve
  MGR_003: '/mgr-003/:id',  // PUT manager/expenses/:id/reject
  MGR_004: '/mgr-004/:id',  // GET expenses/:id (re-export từ emp-005)
  MGR_005: '/mgr-005/reports/latest', // GET latest DONE AI report (read-only)

  // ─── Finance ──────────────────────────────────────────────────────
  FIN_001: '/fin-001',          // GET  finance/expenses (APPROVED + PAID)
  FIN_002: '/fin-002/:id/pay',  // PUT  finance/expenses/:id/pay
  FIN_003: '/fin-003/batch-pay',// PUT  finance/expenses/batch-pay
  FIN_004: '/fin-004/reports',  // POST create finance report
  FIN_005: '/fin-005/reports',  // GET  list finance reports
  FIN_006: '/fin-006/gdpr/pending',     // GET  pseudonymizations awaiting Finance sign-off
  FIN_007: '/fin-007/gdpr/confirm/:id', // PUT  confirm one pseudonymization

  // ─── Profile ──────────────────────────────────────────────────────
  PRO_001: '/pro-001',  // GET  users/me/detail
  PRO_002: '/pro-002',  // PUT  users/me
  PRO_003: '/pro-003',  // GET  users/me/avatar-url

  // ─── Screen Config (CMS) ──────────────────────────────────────────
  SCR_001: '/scr-001/:screenKey',  // GET screen config JSON for a screen

  // ─── AI Insight ───────────────────────────────────────────────────
  INS_001: '/ins-001',  // POST policy insight (Groq AI)

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

  // ─── Admin: Report Templates + PDF ────────────────────────────
  ADM_014: '/adm-014/report-templates',         // GET list / POST create
  ADM_015: '/adm-015/report-templates/:id',     // GET one / PUT update
  ADM_016: '/adm-016/report-templates/generate-pdf', // POST generate PDF
  ADM_017: '/adm-017/ai-playground/chat',            // POST AI model test (admin)

  // ─── Admin: GDPR ──────────────────────────────────────────────
  ADM_018: '/adm-018/gdpr/requests',                 // GET  erasure request queue
  ADM_019: '/adm-019/gdpr/data-map/:sub',            // GET  per-user data inventory
  ADM_020: '/adm-020/gdpr/process/:id',              // POST run full erasure for request id
  ADM_021: '/adm-021/gdpr/audit-log',                // GET  recent audit events (?subjectSub=)
} as const;