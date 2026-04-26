import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  LoginRequest,
  LoginResponse,
  LoginSuccessResponse,
  MfaVerifyRequest,
  MfaVerifyResponse,
  SessionResponse,
  LogoutResponse,
  ConsentRequest,
  ConsentResponse,
  ProfileSetupRequest,
  ProfileSetupResponse,
  UserProfileDetail,
  UpdateProfileRequest,
  AvatarUploadUrlResponse,
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
  tagTypes: ['Session', 'ProfileDetail'],
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

    // ─────────────────────────────────────────────────────────────────
    // Profile - Get full profile detail (name, avatarUrl, languageCode)
    // ─────────────────────────────────────────────────────────────────
    getProfileDetail: builder.query<UserProfileDetail, void>({
      query: () => '/pro-001',
      providesTags: ['ProfileDetail'],
    }),

    // ─────────────────────────────────────────────────────────────────
    // Profile - Update profile
    // ─────────────────────────────────────────────────────────────────
    updateProfile: builder.mutation<UserProfileDetail, UpdateProfileRequest>({
      query: (body) => ({
        url: '/pro-002',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['ProfileDetail'],
    }),

    // ─────────────────────────────────────────────────────────────────
    // Profile - Get presigned URL for avatar upload
    // ─────────────────────────────────────────────────────────────────
    getAvatarUploadUrl: builder.query<AvatarUploadUrlResponse, string>({
      query: (filename) => `/pro-003?filename=${encodeURIComponent(filename)}`,
    }),

    // ─────────────────────────────────────────────────────────────────
    // Demo Login - One-click login as a specific role (portfolio demo)
    // ─────────────────────────────────────────────────────────────────
    demoLogin: builder.mutation<LoginSuccessResponse, 'EMPLOYEE' | 'MANAGER' | 'FINANCE' | 'ADMIN'>({
      query: (role) => ({
        url: `/demo-001?role=${role}`,
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
  useGetSessionQuery,
  useLazyGetSessionQuery,
  useLogoutMutation,
  useSubmitConsentMutation,
  useSubmitProfileMutation,
  useGetProfileDetailQuery,
  useUpdateProfileMutation,
  useLazyGetAvatarUploadUrlQuery,
  useDemoLoginMutation,
} = authApi;
