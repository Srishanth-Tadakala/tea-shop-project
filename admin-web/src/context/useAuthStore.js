import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useToastStore } from './useToastStore';

const useAuthStore = create(
  persist(
    (set, get) => ({
      admin: null,
      token: null,
      isAuthenticated: false,

      // Login action
      login: async (email, password) => {
        try {
          const toast = useToastStore.getState();
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include',
          });

          if (!response.ok) {
            const errorMsg = response.status === 401 
              ? 'Invalid email or password' 
              : 'Login failed. Please try again.';
            return { success: false, message: errorMsg };
          }

          const data = await response.json();

          if (data.success) {
            set({
              admin: data.admin,
              token: data.token,
              isAuthenticated: true,
            });
            return { success: true };
          } else {
            return { success: false, message: data.message };
          }
        } catch (error) {
          console.error('Login error:', error);
          return { 
            success: false, 
            message: error.message || 'Network error. Please check your connection.' 
          };
        }
      },

      // Logout action
      logout: async () => {
        const toast = useToastStore.getState();
        try {
          const response = await fetch('/api/auth/logout', {
            method: 'GET',
            credentials: 'include',
          });

          if (!response.ok) {
            console.warn(`[Auth] [logout] Server returned ${response.status}, clearing local auth anyway`);
          } else {
            console.debug('[Auth] [logout] Logged out from server');
          }

          toast.success('Logged out successfully');
        } catch (error) {
          console.error('[Auth] [logout] Network error during logout:', error.message);
          toast.error('Logout failed - please check your connection');
        } finally {
          // Always clear auth state, even if server call fails
          set({
            admin: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },

      // Verify token and get current admin
      verifyAuth: async () => {
        const token = get().token;
        if (!token) {
          console.debug('[Auth] [verifyAuth] No token found');
          set({ isAuthenticated: false, admin: null, token: null });
          return false;
        }

        // Check token expiration locally (JWT tokens have exp claim)
        try {
          const parts = token.split('.');
          if (parts.length !== 3) {
            console.error('[Auth] [verifyAuth] Invalid token format');
            set({ isAuthenticated: false, admin: null, token: null });
            return false;
          }
          
          // Decode payload without verification (client-side check only)
          const payload = JSON.parse(atob(parts[1]));
          if (payload.exp && Date.now() >= payload.exp * 1000) {
            console.warn('[Auth] [verifyAuth] Token expired locally');
            set({ isAuthenticated: false, admin: null, token: null });
            return false;
          }
        } catch (decodeError) {
          console.error('[Auth] [verifyAuth] Failed to decode token:', decodeError.message);
        }

        try {
          const response = await fetch('/api/auth/me', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            credentials: 'include',
          });

          if (!response.ok) {
            console.warn(`[Auth] [verifyAuth] Server returned ${response.status}`);
            if (response.status === 401) {
              console.warn('[Auth] [verifyAuth] Token invalid on server - clearing auth');
            }
            set({ isAuthenticated: false, admin: null, token: null });
            return false;
          }

          const data = await response.json();

          if (data.success) {
            console.debug('[Auth] [verifyAuth] Token valid');
            set({
              admin: data.data,
              isAuthenticated: true,
            });
            return true;
          } else {
            console.warn('[Auth] [verifyAuth] Auth failed:', data.message);
            set({ isAuthenticated: false, admin: null, token: null });
            return false;
          }
        } catch (error) {
          console.error('[Auth] [verifyAuth] Error:', error.message, error.stack);
          set({ isAuthenticated: false, admin: null, token: null });
          return false;
        }
      },

      // Update password
      updatePassword: async (currentPassword, newPassword) => {
        const toast = useToastStore.getState();
        const token = get().token;
        try {
          const response = await fetch('/api/auth/updatepassword', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ currentPassword, newPassword }),
            credentials: 'include',
          });

          if (!response.ok) {
            const errorMsg = response.status === 401 
              ? 'Current password is incorrect' 
              : 'Failed to update password';
            toast.error(errorMsg);
            return { success: false, message: errorMsg };
          }

          const data = await response.json();

          if (data.success) {
            set({ token: data.token });
            toast.success('Password updated successfully');
            return { success: true };
          } else {
            toast.error(data.message || 'Failed to update password');
            return { success: false, message: data.message };
          }
        } catch (error) {
          console.error('Update password error:', error);
          const errorMsg = error.message || 'Network error. Please try again.';
          toast.error(errorMsg);
          return { success: false, message: errorMsg };
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        admin: state.admin,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
