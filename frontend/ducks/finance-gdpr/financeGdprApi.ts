import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface PendingFinanceConfirmation {
  pseudoEventId: number;
  subjectSub: string | null;
  subjectToken: string;
  pseudonymizedAt: string | null;
  actorSub: string | null;
  actorRole: string | null;
  detailsJson: string | null;
}

export const financeGdprApi = createApi({
  reducerPath: 'financeGdprApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_BFF_URL || '/api',
    credentials: 'include',
  }),
  tagTypes: ['FinanceGdprPending'],
  endpoints: (builder) => ({
    getPendingFinanceConfirmations: builder.query<PendingFinanceConfirmation[], void>({
      query: () => '/fin-006/gdpr/pending',
      providesTags: ['FinanceGdprPending'],
    }),

    confirmFinanceGobd: builder.mutation<{ pseudoEventId: number; confirmed: boolean }, number>({
      query: (id) => ({ url: `/fin-007/gdpr/confirm/${id}`, method: 'PUT' }),
      invalidatesTags: ['FinanceGdprPending'],
    }),
  }),
});

export const {
  useGetPendingFinanceConfirmationsQuery,
  useConfirmFinanceGobdMutation,
} = financeGdprApi;
