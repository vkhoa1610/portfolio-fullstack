import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  LoginRequest,
  LoginResponse,
  MfaVerifyRequest,
  MfaVerifyResponse,
  NewPasswordRequest,
  NewPasswordResponse,
  SessionResponse,
  LogoutResponse,
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
        url: '/auth/login',
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
        url: '/auth/mfa',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Session'],
    }),

    // ─────────────────────────────────────────────────────────────────
    // New Password - Set password for first-time login
    // ─────────────────────────────────────────────────────────────────
    setNewPassword: builder.mutation<NewPasswordResponse, NewPasswordRequest>({
      query: (body) => ({
        url: '/auth/new-password',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Session'],
    }),

    // ─────────────────────────────────────────────────────────────────
    // Session - Re-hydrate UI session from cookies (after page refresh)
    // ─────────────────────────────────────────────────────────────────
    getSession: builder.query<SessionResponse, void>({
      query: () => '/auth/session',
      providesTags: ['Session'],
    }),

    // ─────────────────────────────────────────────────────────────────
    // Logout - Clear all authentication
    // ─────────────────────────────────────────────────────────────────
    logout: builder.mutation<LogoutResponse, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Session'],
    }),
  }),
});

// Export hooks for components
export const {
  useLoginMutation,
  useVerifyMfaMutation,
  useSetNewPasswordMutation,
  useGetSessionQuery,
  useLazyGetSessionQuery,
  useLogoutMutation,
} = authApi;
