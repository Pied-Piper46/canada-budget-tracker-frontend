/**
 * Asset types
 */

export interface BalanceHistoryItem {
  period: string;
  period_start?: string;
  period_end?: string;
  balance: number;
  change?: number;
  change_pct?: number;
}

export interface AssetHistory {
  current_balance: number;
  balance_history: BalanceHistoryItem[];
}
