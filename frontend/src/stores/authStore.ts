import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  mobile?: string;
  role: 'student' | 'faculty' | 'admin';
  avatarUrl?: string;
  isEmailVerified: boolean;
  targetExam?: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setAuth: (user: AuthUser, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isLoading: true,
      isAuthenticated: false,

      setAuth: (user, accessToken) => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('token', accessToken);
            localStorage.setItem('user', JSON.stringify(user));
          } catch {}
        }
        return set({ user, accessToken, isAuthenticated: true, isLoading: false });
      },

      setAccessToken: (token) =>
        set({ accessToken: token }),

      clearAuth: () => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('access_token');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          } catch {}
        }
        return set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
      },

      setLoading: (loading) =>
        set({ isLoading: loading })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
        isLoading: false
      })
    }
  )
);

