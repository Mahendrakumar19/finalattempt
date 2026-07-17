'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { refreshAccessToken, logoutUser } from '@/services/auth';

// Interval for refreshing access token (14 min — just before 15 min expiry)
const REFRESH_INTERVAL_MS = 14 * 60 * 1000;

export function useAuth() {
  const { user, accessToken, isLoading, isAuthenticated, setAuth, clearAuth, setLoading } = useAuthStore();
  const router = useRouter();

  // Silently refresh access token using refresh cookie
  const refresh = useCallback(async () => {
    const res = await refreshAccessToken();
    if (res.success && res.data) {
      setAuth(res.data.user, res.data.accessToken);
      return res.data.accessToken as string;
    } else {
      clearAuth();
      return null;
    }
  }, [setAuth, clearAuth]);

  // On mount: attempt silent token refresh via HttpOnly cookie if not authenticated.
  // This ensures we never use an expired access token stored in localStorage.
  useEffect(() => {
    // Prevent infinite loop: if already authenticated, do not set loading or refresh again
    if (useAuthStore.getState().isAuthenticated) {
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    const init = async () => {
      const res = await refreshAccessToken();
      if (mounted) {
        if (res.success && res.data) {
          setAuth(res.data.user, res.data.accessToken);
        } else {
          // If we already have a valid local token, do NOT log the user out on startup refresh failure
          // because it might be a transient connection issue or cookie restriction on localhost.
          const storedToken = useAuthStore.getState().accessToken;
          if (!storedToken) {
            clearAuth();
          } else {
            setLoading(false);
          }
        }
      }
    };

    init();
    return () => { mounted = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Set up periodic token refresh
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      refresh();
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isAuthenticated, refresh]);

  // Logout function
  const logout = useCallback(async () => {
    if (accessToken) {
      await logoutUser(accessToken);
    }
    clearAuth();
    router.push('/auth/login');
  }, [accessToken, clearAuth, router]);

  // Require auth guard — redirect if not authenticated after loading
  const requireAuth = useCallback((redirectTo = '/auth/login') => {
    if (!isLoading && !isAuthenticated) {
      router.push(`${redirectTo}?redirect=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [isLoading, isAuthenticated, router]);

  return {
    user,
    accessToken,
    isLoading,
    isAuthenticated,
    logout,
    refresh,
    requireAuth
  };
}
