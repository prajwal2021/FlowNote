export const AUTH_KEY = 'flownoteAuth';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  canUseAi: boolean;
  mustChangePassword: boolean;
}

export interface StoredAuth {
  token: string;
  user: AuthUser;
}
