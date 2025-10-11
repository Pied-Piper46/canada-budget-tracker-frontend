/**
 * Transaction types
 */

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
