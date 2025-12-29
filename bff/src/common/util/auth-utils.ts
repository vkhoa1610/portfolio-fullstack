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
    // Return default profile - user can still use the app
    return {
      role: 'ADMIN',
      budget: 0,
      onboardingStatus: 'PENDING',
    };
  }
};

/**
 * Builds a frontend-safe UI session from user profile
 * This is the ONLY data that gets sent to the frontend
 * 
 * ❌ No tokens
 * ❌ No sensitive data
 */
export const buildUISession = (profile: UserProfile, email: string): UISession => {
  return {
    user: {
      email,
      role: (profile.role as 'USER' | 'ADMIN') || 'USER',
    },
    budget: profile.budget || 0,
    onboardingStatus: (profile.onboardingStatus as 'PENDING' | 'DONE') || 'PENDING',
  };
};

/**
 * Determines the redirect URL based on user profile
 */
export const getRedirectUrl = (profile: UserProfile): '/onboarding' | '/dashboard' => {
  return profile.onboardingStatus === 'PENDING' ? '/onboarding' : '/dashboard';
};
