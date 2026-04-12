import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  LoginRequest,
  LoginResponse,
  MfaVerifyRequest,
  MfaVerifyResponse,
  SessionResponse,
  LogoutResponse,
  ConsentRequest,
  ConsentResponse,
  ProfileSetupRequest,
  ProfileSetupResponse,
} from './types';

/**
 * Auth API Slice - RTK Query
 * 
 * All requests use credentials: 'include' to send HttpOnly cookies
 * The BFF handles all token management - frontend never sees tokens
 */
export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_BFF_URL || '/api',
    credentials: 'include', // CRITICAL: Send cookies with every request
  }),
  tagTypes: ['Session'],
  endpoints: (builder) => ({
    // ─────────────────────────────────────────────────────────────────
    // Login - Initial authentication
    // ─────────────────────────────────────────────────────────────────
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({
        url: '/com-001',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Session'],
    }),

    // ─────────────────────────────────────────────────────────────────
    // MFA Verification - Complete login with OTP
    // ─────────────────────────────────────────────────────────────────
    verifyMfa: builder.mutation<MfaVerifyResponse, MfaVerifyRequest>({
      query: (body) => ({
        url: '/com-002',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Session'],
    }),

    // ─────────────────────────────────────────────────────────────────
    // Session - Re-hydrate UI session from cookies (after page refresh)
    // ─────────────────────────────────────────────────────────────────
    getSession: builder.query<SessionResponse, void>({
      query: () => '/com-004',
      providesTags: ['Session'],
    }),

    // ─────────────────────────────────────────────────────────────────
    // Logout - Clear all authentication
    // ─────────────────────────────────────────────────────────────────
    logout: builder.mutation<LogoutResponse, void>({
      query: () => ({
        url: '/com-005',
        method: 'POST',
      }),
      invalidatesTags: ['Session'],
    }),

    // ─────────────────────────────────────────────────────────────────
    // Onboarding - Submit consent (GDPR + Terms)
    // ─────────────────────────────────────────────────────────────────
    submitConsent: builder.mutation<ConsentResponse, ConsentRequest>({
      query: (body) => ({
        url: '/com-006',
        method: 'POST',
        body,
      }),
    }),

    // ─────────────────────────────────────────────────────────────────
    // Onboarding - Submit profile (language selection)
    // ─────────────────────────────────────────────────────────────────
    submitProfile: builder.mutation<ProfileSetupResponse, ProfileSetupRequest>({
      query: (body) => ({
        url: '/com-007',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Session'],
    }),
  }),
});

// Export hooks for components
export const {
  useLoginMutation,
  useVerifyMfaMutation,
  useGetSessionQuery,
  useLazyGetSessionQuery,
  useLogoutMutation,
  useSubmitConsentMutation,
  useSubmitProfileMutation,
} = authApi;
