import { api } from './api';
import type { LoginPayload, TokenResponse, User } from '../types';

export const authService = {
  login: async (payload: LoginPayload): Promise<TokenResponse> => {
    const response = await api.post<TokenResponse>('/auth/login', payload);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    } finally {
      localStorage.removeItem('iiitp_erp_token');
      localStorage.removeItem('iiitp_erp_user');
    }
  },
};
