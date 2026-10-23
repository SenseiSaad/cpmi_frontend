export type UserRole = 'super_admin' | 'training_manager' | 'agency_admin' | 'learner';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  agencies?: UserAgency[];
  activeAgencyId?: string;
}

export interface UserAgency {
  agencyId: string;
  agencySlug: string;
  agencyName: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface AcceptInvitationRequest {
  token: string;
  firstName?: string;
  lastName?: string;
  password?: string;
}

export interface CSRFResponse {
  token: string;
}
