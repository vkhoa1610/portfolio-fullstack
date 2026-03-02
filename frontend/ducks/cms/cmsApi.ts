import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

/**
 * RTK Query API for CMS screen configs.
 * Calls BFF GET /scr-001/:screenKey → returns parsed config JSON object.
 */
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
  }),
});

export const { useGetScreenConfigQuery } = cmsApi;
