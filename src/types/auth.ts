/**
 * Authentication types
 */

import { Account } from './account';

export interface LoginRequest {
  password: string;
}

export interface LoginResponse {
  token: string;
  expires_at: string;
  accounts: Account[];
}
