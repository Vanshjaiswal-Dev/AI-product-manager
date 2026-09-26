import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // For initial checkAuth
  
  checkAuth: async () => {
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    set({ user: res.data.user, isAuthenticated: true });
    return res.data;
  },

  register: async (credentials) => {
    const res = await api.post('/auth/register', credentials);
    set({ user: res.data.user, isAuthenticated: true });
    return res.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignored
    }
    set({ user: null, isAuthenticated: false });
  },
}));
