import type { Account, LoginRequest, LoginResponse } from '@/types';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function login(password: string): Promise<LoginResponse> {
  const response = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Login failed');
  }

  return response.json();
}

export function saveToken(token: string, expiresAt: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('session_token', token);
    localStorage.setItem('token_expires_at', expiresAt);
  }
}

export function saveAccounts(accounts: Account[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accounts', JSON.stringify(accounts));
  }
}

export function getAccounts(): Account[] {
  if (typeof window !== 'undefined') {
    const accountsJson = localStorage.getItem('accounts');
    if (accountsJson) {
      try {
        return JSON.parse(accountsJson);
      } catch {
        return [];
      }
    }
  }
  return [];
}

export function saveSelectedAccountId(accountId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('selected_account_id', accountId);
  }
}

export function getSelectedAccountId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('selected_account_id');
  }
  return null;
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('session_token');
  }
  return null;
}

export function clearToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('session_token');
    localStorage.removeItem('token_expires_at');
    localStorage.removeItem('accounts');
    localStorage.removeItem('selected_account_id');
  }
}

export function isTokenExpired(): boolean {
  if (typeof window !== 'undefined') {
    const expiresAt = localStorage.getItem('token_expires_at');
    if (!expiresAt) return true;

    return new Date(expiresAt) <= new Date();
  }
  return true;
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;

  return !isTokenExpired();
}
