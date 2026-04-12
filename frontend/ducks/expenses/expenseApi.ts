import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  Expense,
  CreateExpenseRequest,
  ScanResponse,
  UploadUrlResponse,
  RejectExpenseRequest,
  MarkAsPaidRequest,
  FinanceReport,
  CreateFinanceReportRequest,
} from './types';

export const expenseApi = createApi({
  reducerPath: 'expenseApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_BFF_URL || '/api',
    credentials: 'include',
  }),
  tagTypes: ['Expense', 'ManagerQueue', 'FinanceQueue'],
  endpoints: (builder) => ({

    // ─────────────────────────────────────────────────────
    // EMPLOYEE: List own expenses
    // ─────────────────────────────────────────────────────
    getExpenses: builder.query<Expense[], void>({
      query: () => '/emp-004',
      providesTags: ['Expense'],
    }),

    // ─────────────────────────────────────────────────────
    // EMPLOYEE: Get expense detail
    // ─────────────────────────────────────────────────────
    getExpenseById: builder.query<Expense, number>({
      query: (id) => `/emp-005/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Expense', id }],
    }),

    // ─────────────────────────────────────────────────────
    // EMPLOYEE: Create expense (DRAFT)
    // ─────────────────────────────────────────────────────
    createExpense: builder.mutation<Expense, CreateExpenseRequest>({
      query: (body) => ({
        url: '/emp-003',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Expense'],
    }),

    // ─────────────────────────────────────────────────────
    // EMPLOYEE: Submit expense → PENDING_REVIEW
    // ─────────────────────────────────────────────────────
    submitExpense: builder.mutation<void, number>({
      query: (id) => ({
        url: `/emp-006/${id}`,
        method: 'POST',
      }),
      invalidatesTags: ['Expense', 'ManagerQueue'],
    }),

    // ─────────────────────────────────────────────────────
    // EMPLOYEE: Get presigned PUT URL để upload thẳng lên MinIO
    // ─────────────────────────────────────────────────────
    getUploadUrl: builder.mutation<UploadUrlResponse, string>({
      query: (filename) => ({
        url: `/emp-001?filename=${encodeURIComponent(filename)}`,
        method: 'GET',
      }),
    }),

    // ─────────────────────────────────────────────────────
    // EMPLOYEE: Get presigned GET URL for private-bucket receipt (1h)
    // ─────────────────────────────────────────────────────
    getReceiptViewUrl: builder.query<{ viewUrl: string }, string>({
      query: (fileUrl) => `/emp-007?fileUrl=${encodeURIComponent(fileUrl)}`,
    }),

    // ─────────────────────────────────────────────────────
    // EMPLOYEE: Scan receipt (gửi fileUrl sau khi upload xong) → Mock OCR
    // ─────────────────────────────────────────────────────
    scanReceipt: builder.mutation<ScanResponse, { fileUrl: string }>({
      query: (body) => ({
        url: '/emp-002',
        method: 'POST',
        body,
      }),
    }),

    // ─────────────────────────────────────────────────────
    // MANAGER: Pending approval queue
    // ─────────────────────────────────────────────────────
    getManagerQueue: builder.query<Expense[], void>({
      query: () => '/mgr-001',
      providesTags: ['ManagerQueue'],
    }),

    // ─────────────────────────────────────────────────────
    // MANAGER: Get expense detail (for review)
    // ─────────────────────────────────────────────────────
    getManagerExpenseById: builder.query<Expense, number>({
      query: (id) => `/mgr-004/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Expense', id }],
    }),

    // ─────────────────────────────────────────────────────
    // MANAGER: Approve expense
    // ─────────────────────────────────────────────────────
    approveExpense: builder.mutation<void, number>({
      query: (id) => ({
        url: `/mgr-002/${id}`,
        method: 'PUT',
      }),
      invalidatesTags: ['ManagerQueue', 'Expense'],
    }),

    // ─────────────────────────────────────────────────────
    // MANAGER: Reject expense
    // ─────────────────────────────────────────────────────
    rejectExpense: builder.mutation<void, RejectExpenseRequest>({
      query: ({ id, rejectionReason }) => ({
        url: `/mgr-003/${id}`,
        method: 'PUT',
        body: { rejectionReason },
      }),
      invalidatesTags: ['ManagerQueue', 'Expense'],
    }),

    // ─────────────────────────────────────────────────────
    // FINANCE: All expenses (for accountant — FIN_001)
    // ─────────────────────────────────────────────────────
    getFinanceExpenses: builder.query<Expense[], void>({
      query: () => '/fin-001',
      providesTags: ['FinanceQueue'],
    }),

    // ─────────────────────────────────────────────────────
    // FINANCE: Bulk mark selected expenses as PAID
    // ─────────────────────────────────────────────────────
    markAsPaid: builder.mutation<{ paid: number }, MarkAsPaidRequest>({
      query: (body) => ({
        url: '/fin-003/batch-pay',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['FinanceQueue', 'ManagerQueue'],
    }),

    // ─────────────────────────────────────────────────────
    // FINANCE: Create finance report
    // ─────────────────────────────────────────────────────
    createFinanceReport: builder.mutation<FinanceReport, CreateFinanceReportRequest>({
      query: (body) => ({
        url: '/fin-004/reports',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FinanceQueue'],
    }),

    // ─────────────────────────────────────────────────────
    // FINANCE: List finance reports
    // ─────────────────────────────────────────────────────
    getFinanceReports: builder.query<FinanceReport[], void>({
      query: () => '/fin-005/reports',
      providesTags: ['FinanceQueue'],
      transformResponse: (raw: any[]) =>
        raw.map((r) => ({
          ...r,
          lineItems: r.lineItems ? JSON.parse(r.lineItems) : [],
          attachments: r.attachments ? JSON.parse(r.attachments) : [],
          approvalRoute: r.approvalRoute ? JSON.parse(r.approvalRoute) : [],
          notifyCc: r.notifyCc ? JSON.parse(r.notifyCc) : [],
        })),
    }),
  }),
});

export const {
  useGetExpensesQuery,
  useGetExpenseByIdQuery,
  useCreateExpenseMutation,
  useSubmitExpenseMutation,
  useGetUploadUrlMutation,
  useScanReceiptMutation,
  useGetManagerQueueQuery,
  useGetManagerExpenseByIdQuery,
  useApproveExpenseMutation,
  useRejectExpenseMutation,
  useGetFinanceExpensesQuery,
  useMarkAsPaidMutation,
  useCreateFinanceReportMutation,
  useGetFinanceReportsQuery,
  useGetReceiptViewUrlQuery,
} = expenseApi;
