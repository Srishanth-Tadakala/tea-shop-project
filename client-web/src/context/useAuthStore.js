import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useToastStore } from './useToastStore';

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,

      // Store token (for future use or Socket.IO authentication)
      setToken: (token) => {
        set({ token });
      },

      // Clear token
      clearToken: () => {
        set({ token: null });
      },

      // Get token
      getToken: () => get().token,
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
      }),
    }
  )
);

export default useAuthStore;
      }),
    }
  )
);

export default useAuthStore;
