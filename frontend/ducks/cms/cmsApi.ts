import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type PolicyInsightType = "RECEIPT" | "PER_DIEM" | "MILEAGE" | "EXPENSE_SUMMARY";

export interface PolicyInsightRequest {
  type: PolicyInsightType;
  context: Record<string, unknown>;
}

export interface PolicyInsightResponse {
  insight: string;
}

export const cmsApi = createApi({
  reducerPath: "cmsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_BFF_URL || "/api",
    credentials: "include",
  }),
  endpoints: (builder) => ({
    getScreenConfig: builder.query<unknown, string>({
      query: (screenKey) => `/scr-001/${encodeURIComponent(screenKey)}`,
    }),
    getPolicyInsight: builder.mutation<PolicyInsightResponse, PolicyInsightRequest>({
      query: (body) => ({
        url: "/ins-001",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useGetScreenConfigQuery, useGetPolicyInsightMutation } = cmsApi;
