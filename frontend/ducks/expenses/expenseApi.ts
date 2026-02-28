import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  Expense,
  CreateExpenseRequest,
  ScanResponse,
  UploadUrlResponse,
  RejectExpenseRequest,
} from './types';

export const expenseApi = createApi({
  reducerPath: 'expenseApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_BFF_URL || '/api',
    credentials: 'include',
  }),
  tagTypes: ['Expense', 'ManagerQueue'],
  endpoints: (builder) => ({

    // ─────────────────────────────────────────────────────
    // EMPLOYEE: List own expenses
    // ─────────────────────────────────────────────────────
    getExpenses: builder.query<Expense[], void>({
      query: () => '/expenses',
      providesTags: ['Expense'],
    }),

    // ─────────────────────────────────────────────────────
    // EMPLOYEE: Get expense detail
    // ─────────────────────────────────────────────────────
    getExpenseById: builder.query<Expense, number>({
      query: (id) => `/expenses/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Expense', id }],
    }),

    // ─────────────────────────────────────────────────────
    // EMPLOYEE: Create expense (DRAFT)
    // ─────────────────────────────────────────────────────
    createExpense: builder.mutation<Expense, CreateExpenseRequest>({
      query: (body) => ({
        url: '/expenses',
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
        url: `/expenses/${id}/submit`,
        method: 'POST',
      }),
      invalidatesTags: ['Expense', 'ManagerQueue'],
    }),

    // ─────────────────────────────────────────────────────
    // EMPLOYEE: Get presigned PUT URL để upload thẳng lên MinIO
    // ─────────────────────────────────────────────────────
    getUploadUrl: builder.mutation<UploadUrlResponse, string>({
      query: (filename) => ({
        url: `/expenses/upload-url?filename=${encodeURIComponent(filename)}`,
        method: 'GET',
      }),
    }),

    // ─────────────────────────────────────────────────────
    // EMPLOYEE: Scan receipt (gửi fileUrl sau khi upload xong) → Mock OCR
    // ─────────────────────────────────────────────────────
    scanReceipt: builder.mutation<ScanResponse, { fileUrl: string }>({
      query: (body) => ({
        url: '/expenses/scan',
        method: 'POST',
        body,
      }),
    }),

    // ─────────────────────────────────────────────────────
    // MANAGER: Pending approval queue
    // ─────────────────────────────────────────────────────
    getManagerQueue: builder.query<Expense[], void>({
      query: () => '/manager/expenses',
      providesTags: ['ManagerQueue'],
    }),

    // ─────────────────────────────────────────────────────
    // MANAGER: Approve expense
    // ─────────────────────────────────────────────────────
    approveExpense: builder.mutation<void, number>({
      query: (id) => ({
        url: `/manager/expenses/${id}/approve`,
        method: 'PUT',
      }),
      invalidatesTags: ['ManagerQueue', 'Expense'],
    }),

    // ─────────────────────────────────────────────────────
    // MANAGER: Reject expense
    // ─────────────────────────────────────────────────────
    rejectExpense: builder.mutation<void, RejectExpenseRequest>({
      query: ({ id, rejectionReason }) => ({
        url: `/manager/expenses/${id}/reject`,
        method: 'PUT',
        body: { rejectionReason },
      }),
      invalidatesTags: ['ManagerQueue', 'Expense'],
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
  useApproveExpenseMutation,
  useRejectExpenseMutation,
} = expenseApi;
