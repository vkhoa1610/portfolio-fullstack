import { apiClientGet } from '../config/apiClient.js';
import { JAVA_API_URL } from '../config/env.js';
import { UserProfile } from '../api/get-user.js';
import { UISession } from '../types/auth-types.js';

/**
 * Fetches user profile from Java backend
 * Uses the ID token for authorization
 */
export const fetchUserProfile = async (idToken: string): Promise<UserProfile> => {
  console.log('📡 Fetching user profile from Java backend');

  try {
    const response = await apiClientGet<UserProfile>('/api/v1/users/me', {
      baseURL: JAVA_API_URL,
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    console.log('✅ User profile fetched:', {
      role: response.data.role,
      onboardingStatus: response.data.onboardingStatus,
    });

    return response.data;
  } catch (error: any) {
    console.warn('⚠️ Failed to fetch user profile from Java:', error.message);
    return {
      role: 'ADMIN',
      budget: 0,
      onboardingStatus: 'PENDING',
    };
  }
};

/**
 * Fetches permission codes for the current user from Java backend
 */
export const fetchUserPermissions = async (idToken: string): Promise<string[]> => {
  try {
    const response = await apiClientGet<string[]>('/api/v1/users/me/permissions', {
      baseURL: JAVA_API_URL,
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });
    return response.data;
  } catch (error: any) {
    console.warn('⚠️ Failed to fetch user permissions from Java:', error.message);
    return [];
  }
};

/**
 * Checks whether the current user is a system admin
 */
export const fetchUserAdminStatus = async (idToken: string): Promise<boolean> => {
  try {
    const response = await apiClientGet<{ isAdmin: boolean }>('/api/v1/users/me/is-admin', {
      baseURL: JAVA_API_URL,
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });
    return response.data.isAdmin ?? false;
  } catch (error: any) {
    console.warn('⚠️ Failed to fetch admin status from Java:', error.message);
    return false;
  }
};

/**
 * Fetches granted UI function IDs for the current user from Java backend
 */
export const fetchUserFunctions = async (idToken: string): Promise<number[]> => {
  try {
    const response = await apiClientGet<number[]>('/api/v1/users/me/functions', {
      baseURL: JAVA_API_URL,
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });
    return response.data;
  } catch (error: any) {
    console.warn('⚠️ Failed to fetch user functions from Java:', error.message);
    return [];
  }
};

/**
 * Builds a frontend-safe UI session from user profile + permissions + functions
 *
 * ❌ No tokens
 * ❌ No sensitive data
 */
export const buildUISession = (
  profile: UserProfile,
  email: string,
  permissions: string[],
  functions: number[],
  isAdmin: boolean,
): UISession => {
  return {
    user: {
      email,
      role: (profile.role as 'USER' | 'ADMIN') || 'USER',
    },
    budget: profile.budget || 0,
    onboardingStatus: (profile.onboardingStatus as 'PENDING' | 'DONE') || 'PENDING',
    permissions,
    functions,
    isAdmin,
  };
};

/**
 * Determines the redirect URL based on user profile and admin status
 */
export const getRedirectUrl = (profile: UserProfile, isAdmin: boolean = false): '/onboarding' | '/dashboard' | '/admin' => {
  if (isAdmin) return '/admin';
  return profile.onboardingStatus === 'PENDING' ? '/onboarding' : '/dashboard';
};
