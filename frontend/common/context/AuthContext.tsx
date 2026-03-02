"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { UISession } from "@/ducks/auth/types";
import { useGetSessionQuery } from "@/ducks/auth/authApi";

// ============================================================================
// AUTH CONTEXT TYPES
// ============================================================================

interface AuthContextType {
  /** Whether user is authenticated (has valid session) */
  isAuthenticated: boolean;

  /** Whether auth state is being determined (checking cookies) */
  isLoading: boolean;

  /** Frontend-safe session data (NO TOKENS!) */
  session: UISession | null;

  /** Update session after successful login/MFA */
  setSession: (session: UISession | null) => void;

  /** Clear session (logout) */
  clearSession: () => void;

  /** Check if current user has a specific permission code */
  hasPermission: (permissionCode: string) => boolean;

  /** Check if current user has a specific UI function ID (for CMS rendering) */
  hasFunctionId: (functionId: number) => boolean;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// AUTH PROVIDER
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider - Manages in-memory authentication state
 *
 * KEY SECURITY POINTS:
 * ❌ No tokens stored here
 * ❌ No localStorage/sessionStorage
 * ✅ Only UI session snapshot in memory
 * ✅ Session lost on page refresh (re-hydrated from cookies)
 *
 * The session is automatically re-hydrated on mount by calling
 * GET /api/auth/session which validates HttpOnly cookies
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSessionState] = useState<UISession | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Auto-hydrate session from cookies on mount
  const {
    data,
    isLoading: isQueryLoading,
    isFetching,
  } = useGetSessionQuery(undefined, {
    // Skip if we already have a session (prevents re-fetch after login)
    skip: session !== null && isHydrated,
  });

  // Process session response
  useEffect(() => {
    if (!isQueryLoading && !isFetching && data) {
      if (data.authenticated && data.session) {
        setSessionState(data.session);
      } else {
        setSessionState(null);
      }
      setIsHydrated(true);
    }
  }, [data, isQueryLoading, isFetching]);

  // Set session (after login/MFA success)
  const setSession = useCallback((newSession: UISession | null) => {
    setSessionState(newSession);
    setIsHydrated(true);
  }, []);

  // Clear session (logout)
  const clearSession = useCallback(() => {
    setSessionState(null);
  }, []);

  // Check if user has a specific permission
  const hasPermission = useCallback((permissionCode: string): boolean => {
    return session?.permissions?.includes(permissionCode) ?? false;
  }, [session]);

  // Check if user has a specific UI function ID
  const hasFunctionId = useCallback((functionId: number): boolean => {
    return session?.functions?.includes(functionId) ?? false;
  }, [session]);

  // Determine loading state
  const isLoading = !isHydrated && (isQueryLoading || isFetching);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: session !== null,
        isLoading,
        session,
        setSession,
        clearSession,
        hasPermission,
        hasFunctionId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * useAuth - Access authentication state and actions
 * Must be used within AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

/**
 * useSession - Convenience hook for session-only access
 * Returns null if not authenticated
 */
export const useSession = (): UISession | null => {
  const { session } = useAuth();
  return session;
};

/**
 * useIsAuthenticated - Convenience hook for auth check
 */
export const useIsAuthenticated = (): boolean => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
};
