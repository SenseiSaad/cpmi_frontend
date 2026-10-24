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

/** POST /api/invitations/accept: all four fields are required by the API. */
export interface AcceptInvitationRequest {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
}

/**
 * 201 { signedIn: true, user } when the acceptance created the account (a session cookie is set), or
 * 200 { signedIn: false } when the person already had an account and was only added to the agency.
 */
export interface AcceptInvitationResponse {
  signedIn: boolean;
  message?: string;
  user?: {
    userPublicId?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    roles: { roleCode: UserRole; agencyId: number | null }[];
  };
}

export interface CSRFResponse {
  token: string;
}
