import type { Transaction, DashboardSummary, AssetHistory, SyncResponse, TransactionListResponse } from '@/types';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// Re-export types for backward compatibility
export type { Transaction, DashboardSummary, AssetHistory, SyncResponse, TransactionListResponse };

// Custom error for session expiration
export class SessionExpiredError extends Error {
  constructor(message = 'Session expired') {
    super(message);
    this.name = 'SessionExpiredError';
  }
}

// Fetch wrapper with authentication and error handling
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, options);

  if (response.status === 401) {
    // Import clearToken dynamically to avoid circular dependency
    if (typeof window !== 'undefined') {
      const { clearToken } = await import('./auth');
      clearToken();
      window.location.href = '/';
    }
    throw new SessionExpiredError('Your session has expired. Please login again.');
  }

  return response;
}

// Helper function to create headers with auth token
function getHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

// Plaid Link APIs
export async function fetchLinkToken(sessionToken: string, mode: 'initial' | 'update'): Promise<string> {
    const endpoint = mode === 'initial' ? '/plaid/link/token/create' : '/plaid/link/token/update';
    const response = await fetchWithAuth(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: getHeaders(sessionToken),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to fetch ${mode} link token`);
    }
    const data = await response.json();
    return data.link_token;
}

export async function exchangePublicToken(publicToken: string, sessionToken: string): Promise<{ status: string }> {
    const response = await fetchWithAuth(`${BACKEND_URL}/plaid/item/public_token/exchange`, {
        method: 'POST',
        headers: getHeaders(sessionToken),
        body: JSON.stringify({ public_token: publicToken }),
    });
    if (!response.ok) throw new Error('Failed to exchange public token');
    return response.json();
}

// Dashboard APIs
export async function getDashboardSummary(
  accountId: string,
  token: string,
  groupBy: 'week' | 'month' = 'month',
  startDate?: string
): Promise<DashboardSummary> {
  const params = new URLSearchParams({
    account_id: accountId,
    group_by: groupBy,
  });

  if (startDate) {
    params.append('start_date', startDate);
  }

  const response = await fetchWithAuth(`${BACKEND_URL}/transactions/summary?${params}`, {
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch dashboard summary');
  }

  return response.json();
}

export async function getAssetHistory(
  accountId: string,
  token: string,
  granularity: 'day' | 'week' | 'month' = 'month'
): Promise<AssetHistory> {
  const params = new URLSearchParams({
    account_id: accountId,
    granularity,
  });

  const response = await fetchWithAuth(`${BACKEND_URL}/assets/history?${params}`, {
    headers: getHeaders(token),
  });

  if (!response.ok) {
    // Return empty data if endpoint not implemented yet
    if (response.status === 404) {
      return {
        current_balance: 0,
        balance_history: []
      };
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch asset history');
  }

  return response.json();
}

export interface GetTransactionsParams {
  accountId: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeRemoved?: boolean;
  includePending?: boolean;
}

export async function getTransactions(
  token: string,
  params: GetTransactionsParams
): Promise<TransactionListResponse> {
  const queryParams = new URLSearchParams({
    account_id: params.accountId,
    limit: (params.limit || 50).toString(),
    offset: (params.offset || 0).toString(),
    sort_by: params.sortBy || 'transaction_date',
    sort_order: params.sortOrder || 'desc',
    include_removed: (params.includeRemoved || false).toString(),
    include_pending: (params.includePending !== false).toString(),
  });

  if (params.startDate) queryParams.append('start_date', params.startDate);
  if (params.endDate) queryParams.append('end_date', params.endDate);

  const response = await fetchWithAuth(`${BACKEND_URL}/transactions/?${queryParams}`, {
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch transactions');
  }

  return response.json();
}

export async function getRecentTransactions(
  accountId: string,
  token: string,
  limit: number = 10
): Promise<{ transactions: Transaction[] }> {
  const params = new URLSearchParams({
    account_id: accountId,
    limit: limit.toString(),
    sort_order: 'desc',
  });

  const response = await fetchWithAuth(`${BACKEND_URL}/transactions/?${params}`, {
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch transactions');
  }

  return response.json();
}

export async function syncTransactions(token: string): Promise<SyncResponse> {
  const response = await fetchWithAuth(`${BACKEND_URL}/transactions/sync`, {
    method: 'GET',
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = errorData.detail || errorData;
    console.log(error);

    // Check for Item Login Required error
    if (error.error_code === 'ITEM_LOGIN_REQUIRED') {
      throw new Error('ITEM_LOGIN_REQUIRED');
    }

    throw new Error(error.message || errorData.detail || 'Failed to sync transactions');
  }

  return response.json();
}