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
  // FIN_001: '/fin-001',
} as const;