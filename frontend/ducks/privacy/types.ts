// ─── Privacy / GDPR self-service types ───────────────────────

export type GdprRequestStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED';
export type GdprTableClassification = 'PII_HARD_DELETE' | 'FINANCIAL_PSEUDONYMIZE' | 'AUDIT_NULLIFY';
export type ConsentStatus = 'ACTIVE' | 'WITHDRAWN';

export interface PrivacyDataMapTable {
  name: string;
  rowCount: number;
  classification: GdprTableClassification;
  note: string;
}

export interface PrivacyDataMap {
  subjectSub: string;
  tables: PrivacyDataMapTable[];
}

export interface PrivacyErasureStatus {
  requestId: number;
  subjectSub: string | null;
  subjectToken: string;
  status: GdprRequestStatus;
  requestedAt: string | null;
  deadlineAt: string | null;
  daysRemaining: number;
  reason: string;
}

export interface UserConsentItem {
  id: number;
  policyId: number;
  policyTitle: string;
  policyType: string;
  policyVersion: string;
  consentMethod: string;
  createdAt: string | null;
  revokedAt: string | null;
  status: ConsentStatus;
}
