// ============================================================================
// ADMIN TYPES
// ============================================================================

export interface AdminUser {
  cognitoSub: string;
  email: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'FINANCE' | null;
  onboardingStatus: 'PENDING' | 'DONE' | null;
  budget: number | null;
}

export type PermissionState = 'ACTIVE' | 'INACTIVE' | 'NEVER_GRANTED';

export interface PermissionStatus {
  permissionCode: string;
  description: string;
  state: PermissionState;
  grantedBy?: string;
  createdAt?: string;
}

export interface FunctionStatus {
  functionId: number;
  functionKey: string;
  module: string;
  description: string;
  state: PermissionState;
  grantedBy?: string;
  createdAt?: string;
}

export interface ImportResult {
  successCount: number;
  failCount: number;
  errors: Array<{ row: string; message: string }>;
}

// ─── AI Expense Report ────────────────────────────────────────────────────────

export type ReportStatus = 'PENDING' | 'DONE' | 'FAILED';

export interface ExpenseReport {
  id: number;
  period: string;
  status: ReportStatus;
  markdown: string | null;
  reportData: string | null;  // JSON string
  errorMsg: string | null;
  generatedAt: string | null;
}

export interface GenerateReportResponse {
  jobId: number;
  status: 'PENDING';
}

export interface LatestReportResponse extends ExpenseReport {
  exists: true;
}

export interface NoReportResponse {
  exists: false;
}

// ─── Report Templates ──────────────────────────────────────────────────────

export type SectionKey =
  | 'executiveSummary'
  | 'breakdownByCategory'
  | 'anomalies'
  | 'recommendations'
  | 'byEmployee'
  | 'aiAnalysis';

export interface SectionItem {
  key: SectionKey;
  enabled: boolean;
}

export interface TemplateConfig {
  title: string;
  company: string;
  logoUrl: string;
  primaryColor: string;
  sections: SectionItem[];
}

export interface ReportTemplate {
  id: number;
  name: string;
  configJson: string;   // JSON string of TemplateConfig
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ReportTemplateListResponse {
  templates: ReportTemplate[];
}
