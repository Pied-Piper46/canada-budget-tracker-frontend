const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// Types
export interface Transaction {
  id: string;
  date: string;
  name: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  pending?: boolean;
}

export interface PeriodSummary {
  period: string;
  period_start?: string;
  period_end?: string;
  income: number;
  expense: number;
  net: number;
  transaction_count: number;
}

export interface DashboardSummary {
  period_summaries: PeriodSummary[];
  total_income: number;
  total_expense: number;
  net_total: number;
  total_transactions: number;
}

export interface AssetHistory {
  current_balance: number;
  balance_history: Array<{
    period: string;
    period_start?: string;
    period_end?: string;
    balance: number;
    change?: number;
    change_pct?: number;
  }>;
}

export interface SyncResponse {
  synced_count: number;
  latest_transaction_date: string;
  sync_status: 'success' | 'partial' | 'failed';
  errors?: string[];
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
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
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
    const response = await fetch(`${BACKEND_URL}/plaid/item/public_token/exchange`, {
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

  const response = await fetch(`${BACKEND_URL}/transactions/summary?${params}`, {
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

  const response = await fetch(`${BACKEND_URL}/assets/history?${params}`, {
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

  const response = await fetch(`${BACKEND_URL}/transactions/?${params}`, {
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch transactions');
  }

  return response.json();
}

export async function syncTransactions(token: string): Promise<SyncResponse> {
  const response = await fetch(`${BACKEND_URL}/transactions/sync`, {
    method: 'POST',
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // Check for Item Login Required error
    if (errorData.error_code === 'ITEM_LOGIN_REQUIRED') {
      throw new Error('ITEM_LOGIN_REQUIRED');
    }

    throw new Error(errorData.detail || 'Failed to sync transactions');
  }

  return response.json();
}