const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export interface LoginResponse {
  token: string;
  expires_at: string;
}

export interface LoginRequest {
  password: string;
}

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
