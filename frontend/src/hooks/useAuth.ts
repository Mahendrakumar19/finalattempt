'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { refreshAccessToken, logoutUser } from '@/services/auth';

// Interval for refreshing access token (14 min — just before 15 min expiry)
const REFRESH_INTERVAL_MS = 14 * 60 * 1000;

/**
 * Decode the JWT `exp` claim locally (no HTTP) and return true if the token
 * is missing, malformed, or within 60 seconds of expiry.
 */
function isTokenExpired(token: string | null): boolean {
  if (!token || token === 'guest-token' || token === 'null' || token === 'undefined') return true;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return true;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    const exp: number | undefined = payload.exp;
    if (!exp) return false; // no expiry claim — treat as valid
    return Date.now() / 1000 > exp - 60; // 60-second buffer
  } catch {
    return true; // malformed token — treat as expired
  }
}

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

  // On mount: use a LOCAL JWT expiry check first so we don't hit the network
  // unnecessarily.  Only call the refresh endpoint when the access token is
  // missing or within 60 seconds of expiry.
  useEffect(() => {
    const storedState = useAuthStore.getState();

    // ── Fast path: token is still valid ──────────────────────────────────────
    if (storedState.isAuthenticated && !isTokenExpired(storedState.accessToken)) {
      setLoading(false);
      return;
    }

    // ── Slow path: token expired or missing — attempt silent server refresh ──
    let mounted = true;
    setLoading(true);

    const init = async () => {
      const storedToken = useAuthStore.getState().accessToken;
      const localTokenValid = storedToken && !isTokenExpired(storedToken);

      const res = await refreshAccessToken();
      if (!mounted) return;

      if (res.success && res.data) {
        setAuth(res.data.user, res.data.accessToken);
      } else if (localTokenValid) {
        // Refresh token failed/missing on server, but local token is still valid
        setLoading(false);
      } else if (res.error === 'Network error. Please check your connection.') {
        if (storedToken) {
          setLoading(false);
        } else {
          clearAuth();
        }
      } else {
        // Auth error and no valid local token — user must log in.
        clearAuth();
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
