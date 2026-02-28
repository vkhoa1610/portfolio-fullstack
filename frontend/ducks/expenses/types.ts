// ============================================================================
// EXPENSE TYPES
// ============================================================================

export type ExpenseType = 'RECEIPT' | 'PER_DIEM' | 'MILEAGE';
export type ExpenseStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

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

  createdAt?: string;
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
}

export interface SubmitExpenseRequest {
  id: number;
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
