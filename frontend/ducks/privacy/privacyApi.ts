import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  PrivacyDataMap,
  PrivacyErasureStatus,
  UserConsentItem,
} from './types';

export const privacyApi = createApi({
  reducerPath: 'privacyApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_BFF_URL || '/api',
    credentials: 'include',
  }),
  tagTypes: ['PrivacyDataMap', 'PrivacyErasureStatus', 'PrivacyConsents'],
  endpoints: (builder) => ({
    getMyDataMap: builder.query<PrivacyDataMap, void>({
      query: () => '/emp-008',
      providesTags: ['PrivacyDataMap'],
    }),

    getMyConsents: builder.query<UserConsentItem[], void>({
      query: () => '/emp-009',
      providesTags: ['PrivacyConsents'],
    }),

    getMyErasureStatus: builder.query<PrivacyErasureStatus | null, void>({
      query: () => '/emp-010',
      providesTags: ['PrivacyErasureStatus'],
    }),

    submitErasureRequest: builder.mutation<PrivacyErasureStatus, { reason?: string }>({
      query: (body) => ({ url: '/emp-011', method: 'POST', body }),
      invalidatesTags: ['PrivacyErasureStatus'],
    }),
  }),
});

export const {
  useGetMyDataMapQuery,
  useGetMyConsentsQuery,
  useGetMyErasureStatusQuery,
  useSubmitErasureRequestMutation,
} = privacyApi;
