import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  AdminUser, PermissionStatus, FunctionStatus, ImportResult,
  ExpenseReport, GenerateReportResponse, LatestReportResponse, NoReportResponse,
  ReportTemplate, ReportTemplateListResponse,
  GdprErasureRequest, GdprDataMap, GdprAuditEntry, GdprProcessResult,
} from './types';

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_BFF_URL || '/api',
    credentials: 'include',
  }),
  tagTypes: ['AdminUsers', 'UserPermissions', 'UserFunctions', 'ExpenseReport', 'ReportTemplate', 'GdprRequests', 'GdprDataMap', 'GdprAuditLog'],
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

    // ── AI Playground ─────────────────────────────────────────────
    aiPlaygroundChat: builder.mutation<
      { response?: string; error?: string; model: string; durationMs: number },
      { systemPrompt?: string; userPrompt: string }
    >({
      query: (body) => ({ url: '/adm-017/ai-playground/chat', method: 'POST', body }),
    }),

    // ── Manager: AI Report (read-only) ───────────────────────────
    getManagerLatestReport: builder.query<LatestReportResponse | NoReportResponse, void>({
      query: () => '/mgr-005/reports/latest',
      providesTags: ['ExpenseReport'],
    }),

    // ── Report Templates ──────────────────────────────────────────
    getReportTemplates: builder.query<ReportTemplateListResponse, void>({
      query: () => '/adm-014/report-templates',
      providesTags: ['ReportTemplate'],
    }),

    getReportTemplate: builder.query<ReportTemplate, number>({
      query: (id) => `/adm-015/report-templates/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'ReportTemplate', id }],
    }),

    createReportTemplate: builder.mutation<ReportTemplate, { name: string; configJson: string }>({
      query: (body) => ({ url: '/adm-014/report-templates', method: 'POST', body }),
      invalidatesTags: ['ReportTemplate'],
    }),

    updateReportTemplate: builder.mutation<ReportTemplate, { id: number; name: string; configJson: string }>({
      query: ({ id, ...body }) => ({ url: `/adm-015/report-templates/${id}`, method: 'PUT', body }),
      invalidatesTags: ['ReportTemplate'],
    }),

    // ── GDPR ──────────────────────────────────────────────────────
    getGdprRequests: builder.query<GdprErasureRequest[], void>({
      query: () => '/adm-018/gdpr/requests',
      providesTags: ['GdprRequests'],
    }),

    getGdprDataMap: builder.query<GdprDataMap, string>({
      query: (sub) => `/adm-019/gdpr/data-map/${sub}`,
      providesTags: (_r, _e, sub) => [{ type: 'GdprDataMap', id: sub }],
    }),

    processGdprRequest: builder.mutation<GdprProcessResult, { id: number; sub: string }>({
      query: ({ id }) => ({ url: `/adm-020/gdpr/process/${id}`, method: 'POST' }),
      invalidatesTags: (_r, _e, { sub }) => [
        'GdprRequests',
        'GdprAuditLog',
        'AdminUsers',
        { type: 'GdprDataMap', id: sub },
      ],
    }),

    getGdprAuditLog: builder.query<GdprAuditEntry[], { subjectSub?: string; limit?: number } | void>({
      query: (arg) => {
        const params = new URLSearchParams();
        if (arg && arg.subjectSub) params.set('subjectSub', arg.subjectSub);
        if (arg && arg.limit) params.set('limit', String(arg.limit));
        const qs = params.toString();
        return `/adm-021/gdpr/audit-log${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['GdprAuditLog'],
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
  useAiPlaygroundChatMutation,
  useGetLatestReportQuery,
  useGetManagerLatestReportQuery,
  useGetReportTemplatesQuery,
  useGetReportTemplateQuery,
  useCreateReportTemplateMutation,
  useUpdateReportTemplateMutation,
  useGetGdprRequestsQuery,
  useGetGdprDataMapQuery,
  useProcessGdprRequestMutation,
  useGetGdprAuditLogQuery,
} = adminApi;
