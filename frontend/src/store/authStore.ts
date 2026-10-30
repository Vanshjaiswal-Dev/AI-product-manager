import { create } from 'zustand';
import api from '../services/api';
import type { AuthState, LoginCredentials, RegisterCredentials, User } from '../types';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  checkAuth: async (): Promise<void> => {
    try {
      const res = await api.get<{ user: User }>('/auth/me');
      set({ user: res.data.user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (credentials: LoginCredentials) => {
    const res = await api.post<{ success: boolean; user: User }>('/auth/login', credentials);
    set({ user: res.data.user, isAuthenticated: true });
    return res.data;
  },

  register: async (credentials: RegisterCredentials) => {
    const res = await api.post<{ success: boolean; user: User }>('/auth/register', credentials);
    set({ user: res.data.user, isAuthenticated: true });
    return res.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignored — clear local state regardless
    }
    set({ user: null, isAuthenticated: false });
  },
}));
