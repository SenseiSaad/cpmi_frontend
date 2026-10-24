import { apiClient } from '@/lib/api-client';
import {
  User,
  LoginRequest,
  LoginResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AcceptInvitationRequest,
} from '@/types/auth';

export const authService = {
  async getMe(): Promise<User> {
    return apiClient.get<User>('/api/auth/me');
  },

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    await apiClient.fetchCSRF();
    return apiClient.post<LoginResponse>('/api/auth/login', credentials);
  },

  async logout(): Promise<void> {
    return apiClient.post<void>('/api/auth/logout');
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    return apiClient.post<void>('/api/auth/password-reset/request', data);
  },

  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    return apiClient.post<void>('/api/auth/password-reset/confirm', data);
  },

  async acceptInvitation(data: AcceptInvitationRequest): Promise<{ newAccount: boolean; user?: User }> {
    await apiClient.fetchCSRF();
    return apiClient.post<{ newAccount: boolean; user?: User }>('/api/invitations/accept', data);
  },
};
