"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/common/context/AuthContext";

// ============================================================================
// PROTECTED ROUTE COMPONENT
// ============================================================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Required role to access this route */
  requiredRole?: "EMPLOYEE" | "MANAGER" | "FINANCE";
  /** Custom redirect path (default: /auth/login) */
  redirectTo?: string;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
}

/**
 * ProtectedRoute - Wraps routes that require authentication
 *
 * Features:
 * - Redirects to login if not authenticated
 * - Optional role-based access control
 * - Shows loading state while checking auth
 *
 * Usage:
 * ```tsx
 * <ProtectedRoute>
 *   <DashboardContent />
 * </ProtectedRoute>
 *
 * <ProtectedRoute requiredRole="MANAGER">
 *   <ManagerPanel />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = "/auth/login",
  loadingComponent,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth check to complete
    if (isLoading) return;

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      router.replace(redirectTo);
      return;
    }

    // Check role if required
    if (requiredRole && session?.user.role !== requiredRole) {
      router.replace("/unauthorized");
      return;
    }
  }, [isLoading, isAuthenticated, session, requiredRole, redirectTo, router]);

  // Show loading state
  if (isLoading) {
    return loadingComponent || <DefaultLoadingSpinner />;
  }

  // Not authenticated - don't render children (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  // Role check failed - don't render
  if (requiredRole && session?.user.role !== requiredRole) {
    return null;
  }

  // All checks passed - render children
  return <>{children}</>;
}

// ============================================================================
// DEFAULT LOADING SPINNER
// ============================================================================

function DefaultLoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        <p className="text-sm text-neutral-500">Loading...</p>
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ProtectedRoute;
