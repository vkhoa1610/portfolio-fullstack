import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  AdminUser, PermissionStatus, FunctionStatus, ImportResult,
  ExpenseReport, GenerateReportResponse, LatestReportResponse, NoReportResponse,
} from './types';

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_BFF_URL || '/api',
    credentials: 'include',
  }),
  tagTypes: ['AdminUsers', 'UserPermissions', 'UserFunctions', 'ExpenseReport'],
  endpoints: (builder) => ({

    // ── Users ─────────────────────────────────────────────────────────
    getAdminUsers: builder.query<AdminUser[], void>({
      query: () => '/adm-001/users',
      providesTags: ['AdminUsers'],
    }),

    // ── Permissions ───────────────────────────────────────────────────
    getUserPermissions: builder.query<PermissionStatus[], string>({
      query: (sub) => `/adm-002/${sub}/permissions`,
      providesTags: (_result, _err, sub) => [{ type: 'UserPermissions', id: sub }],
    }),

    grantPermission: builder.mutation<void, { sub: string; permissionCode: string }>({
      query: ({ sub, permissionCode }) => ({
        url: `/adm-003/${sub}/permissions`,
        method: 'POST',
        body: { permissionCode },
      }),
      invalidatesTags: (_result, _err, { sub }) => [{ type: 'UserPermissions', id: sub }],
    }),

    revokePermission: builder.mutation<void, { sub: string; code: string }>({
      query: ({ sub, code }) => ({
        url: `/adm-004/${sub}/permissions/${code}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, { sub }) => [{ type: 'UserPermissions', id: sub }],
    }),

    // ── Functions ─────────────────────────────────────────────────────
    getUserFunctions: builder.query<FunctionStatus[], string>({
      query: (sub) => `/adm-005/${sub}/functions`,
      providesTags: (_result, _err, sub) => [{ type: 'UserFunctions', id: sub }],
    }),

    grantFunction: builder.mutation<void, { sub: string; functionKey: string }>({
      query: ({ sub, functionKey }) => ({
        url: `/adm-006/${sub}/functions`,
        method: 'POST',
        body: { functionKey },
      }),
      invalidatesTags: (_result, _err, { sub }) => [{ type: 'UserFunctions', id: sub }],
    }),

    revokeFunction: builder.mutation<void, { sub: string; key: string }>({
      query: ({ sub, key }) => ({
        url: `/adm-007/${sub}/functions/${key}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, { sub }) => [{ type: 'UserFunctions', id: sub }],
    }),

    // ── CSV Import ────────────────────────────────────────────────────
    importUsers: builder.mutation<ImportResult, FormData>({
      query: (formData) => ({
        url: '/adm-008/import/users',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['AdminUsers'],
    }),

    importPermissions: builder.mutation<ImportResult, FormData>({
      query: (formData) => ({
        url: '/adm-009/import/permissions',
        method: 'POST',
        body: formData,
      }),
    }),

    // ── AI Expense Reports ────────────────────────────────────────
    generateReport: builder.mutation<GenerateReportResponse, string>({
      query: (period) => ({
        url: `/adm-011/reports/generate?period=${encodeURIComponent(period)}`,
        method: 'POST',
      }),
    }),

    getReportStatus: builder.query<ExpenseReport, number>({
      query: (jobId) => `/adm-012/reports/status/${jobId}`,
    }),

    getLatestReport: builder.query<LatestReportResponse | NoReportResponse, void>({
      query: () => '/adm-013/reports/latest',
      providesTags: ['ExpenseReport'],
    }),
  }),
});

export const {
  useGetAdminUsersQuery,
  useGetUserPermissionsQuery,
  useGrantPermissionMutation,
  useRevokePermissionMutation,
  useGetUserFunctionsQuery,
  useGrantFunctionMutation,
  useRevokeFunctionMutation,
  useImportUsersMutation,
  useImportPermissionsMutation,
  useGenerateReportMutation,
  useGetReportStatusQuery,
  useGetLatestReportQuery,
} = adminApi;
