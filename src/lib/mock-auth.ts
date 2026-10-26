// TEMPORARY MOCK FOR DEVELOPMENT
// Remove when backend /api/auth/* endpoints are integrated

import { User } from '@/types/auth';

export const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'admin@cpmi.gov': {
    password: 'admin123',
    user: {
      id: 'usr_super_001',
      email: 'admin@cpmi.gov',
      firstName: 'Platform',
      lastName: 'Administrator',
      role: 'super_admin',
    },
  },
  'manager@cpmi.gov': {
    password: 'manager123',
    user: {
      id: 'usr_tm_001',
      email: 'manager@cpmi.gov',
      firstName: 'Training',
      lastName: 'Manager',
      role: 'training_manager',
    },
  },
  'agency@agency.gov': {
    password: 'agency123',
    user: {
      id: 'usr_aa_001',
      email: 'agency@agency.gov',
      firstName: 'Agency',
      lastName: 'Admin',
      role: 'agency_admin',
      agencies: [
        {
          agencyId: 'agc_001',
          agencySlug: 'federal-transit',
          agencyName: 'Federal Transit Administration',
          role: 'agency_admin',
        },
      ],
      activeAgencyId: 'agc_001',
    },
  },
  'learner@agency.gov': {
    password: 'learner123',
    user: {
      id: 'usr_ln_001',
      email: 'learner@agency.gov',
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'learner',
      agencies: [
        {
          agencyId: 'agc_001',
          agencySlug: 'federal-transit',
          agencyName: 'Federal Transit Administration',
          role: 'learner',
        },
      ],
      activeAgencyId: 'agc_001',
    },
  },
};

// Mock authentication (client-side only for demo)
export function mockLogin(email: string, password: string): User | null {
  const account = MOCK_USERS[email];
  if (account && account.password === password) {
    // Store in sessionStorage for demo persistence
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('mock_user', JSON.stringify(account.user));
    }
    return account.user;
  }
  return null;
}

export function mockGetCurrentUser(): User | null {
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('mock_user');
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return null;
}

export function mockLogout(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('mock_user');
  }
}
