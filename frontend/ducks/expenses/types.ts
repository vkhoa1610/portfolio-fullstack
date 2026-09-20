// ============================================================================
// EXPENSE TYPES
// ============================================================================

export type ExpenseType = 'RECEIPT' | 'PER_DIEM' | 'MILEAGE';
export type ExpenseStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'PAID';
export type PolicyRuleSeverity = 'error' | 'warning' | 'info' | 'success';
export type PolicyRuleState = 'pending' | 'ok' | 'triggered';

export interface PolicyEvaluationSnapshotItem {
  id: string;
  severity: PolicyRuleSeverity;
  state: PolicyRuleState;
  titleKey?: string;
  pendingDescKey?: string;
  okDescKey?: string;
  triggeredDescKey?: string;
  resolvedTitle?: string;
  resolvedDesc?: string;
  blocksSave?: boolean;
}

export interface PolicyEvaluationSnapshot {
  screenKey: string;
  screenVersion?: number;
  items: PolicyEvaluationSnapshotItem[];
  inputSnapshot?: Record<string, unknown>;
}

export interface Expense {
  id: number;
  userSub: string;
  type: ExpenseType;
  title?: string;
  amount?: number;
  currency: string;
  status: ExpenseStatus;

  // Receipt
  vendorName?: string;
  receiptDate?: string;
  vatAmount?: number;
  receiptFileUrl?: string;
  aiExtractedData?: string;
  aiFlags?: string;

  // Per Diem
  tripFrom?: string;
  tripTo?: string;
  countryCode?: string;
  perDiemRate?: number;
  perDiemDays?: number;

  // Mileage
  distanceKm?: number;
  ratePerKm?: number;

  // Workflow
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  paidAt?: string;

  /** GoBD retention deadline (paid_at + 10 years). Null until expense reaches PAID. */
  retentionExpiresAt?: string;

  createdAt?: string;
  policyEvaluationSnapshot?: PolicyEvaluationSnapshot;

  /** Set only on the manager approval queue response (backend joins
   *  user_profiles). Empty string or undefined if the submitter's profile
   *  no longer exists (e.g. GDPR-erased) — render as "[Deleted user]". */
  submitterName?: string;

  /** Set only on the manager approval queue response (backend-computed
   *  duplicate detection). duplicateOfId is the id of the earlier matching
   *  RECEIPT this one duplicates; duplicateOfStatus is that row's status
   *  ('PENDING_REVIEW' | 'APPROVED' | 'PAID'). Both undefined/null when this
   *  expense is not a duplicate of anything. */
  duplicateOfId?: number | null;
  duplicateOfStatus?: ExpenseStatus | null;

  /** Set only on the manager approval-history response (backend joins
   *  user_profiles on reviewed_by). Empty/undefined if the reviewer's
   *  profile no longer exists (GDPR-erased), or if never reviewed. */
  reviewerName?: string;
}

export interface CreateExpenseRequest {
  type: ExpenseType;
  title?: string;
  amount?: number;
  currency?: string;

  // Receipt
  vendorName?: string;
  receiptDate?: string;
  vatAmount?: number;
  receiptFileUrl?: string;
  aiExtractedData?: string;
  aiFlags?: string;

  // Per Diem
  tripFrom?: string;
  tripTo?: string;
  countryCode?: string;
  perDiemRate?: number;
  perDiemDays?: number;

  // Mileage
  distanceKm?: number;
  ratePerKm?: number;

  policyEvaluationSnapshot?: PolicyEvaluationSnapshot;
}

export interface SubmitExpenseRequest {
  id: number;
}

// ============================================================================
// UPLOAD TYPES
// ============================================================================

export interface UploadUrlResponse {
  uploadUrl: string;
  fileUrl: string;
}

// ============================================================================
// SCAN (OCR) TYPES
// ============================================================================

export interface ScanResponse {
  vendor: string;
  date: string;
  amount: number;
  vatAmount: number;
  vatRate: string;
  flags: string[];
}

// ============================================================================
// MANAGER TYPES
// ============================================================================

export interface RejectExpenseRequest {
  id: number;
  rejectionReason: string;
}

// ============================================================================
// FINANCE TYPES
// ============================================================================

export interface MarkAsPaidRequest {
  ids: number[];
}

export type FinanceReportType = 'FINANCIAL' | 'ANALYTICS' | 'OPERATIONS' | 'COMPLIANCE';
export type FinanceReportStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
export type FinanceReportPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface LineItem {
  description: string;
  category: 'OPEX' | 'CAPEX';
  amount: number;
}

export interface ReportAttachment {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: 'PRIMARY' | 'SUPPORTING';
}

export interface ApprovalLevel {
  level: number;
  reviewerName: string;
  deadlineDays: number;
}

export interface FinanceReport {
  id: number;
  userSub: string;
  title: string;
  reportType: FinanceReportType;
  fiscalPeriod?: string;
  dueDate?: string;
  description?: string;
  priority: FinanceReportPriority;
  totalAmount?: number;
  currency: string;
  lineItems?: LineItem[];
  attachments?: ReportAttachment[];
  approvalRoute?: ApprovalLevel[];
  notifyCc?: { name: string }[];
  status: FinanceReportStatus;
  submittedAt?: string;
  createdAt?: string;
}

export interface CreateFinanceReportRequest {
  title: string;
  reportType: FinanceReportType;
  fiscalPeriod?: string;
  dueDate?: string;
  description?: string;
  priority: FinanceReportPriority;
  totalAmount?: number;
  currency: string;
  lineItems?: string;      // JSON string
  attachments?: string;    // JSON string
  approvalRoute?: string;  // JSON string
  notifyCc?: string;       // JSON string
  submitNow?: boolean;
}

/** Analytics: tổng hợp chi tiêu theo type/tháng từ danh sách expenses */
export interface SpendByType {
  type: ExpenseType;
  total: number;
  count: number;
}

export interface SpendByMonth {
  month: string; // "2025-01"
  total: number;
}
