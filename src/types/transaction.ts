/**
 * Transaction types
 */

export interface Transaction {
  transaction_id: string;
  account_id: string;
  amount: number; // Plaid format: positive = expense, negative = income
  transaction_date: string;
  merchant_name: string;
  name: string;
  pending: boolean;
  pending_transaction_id: string | null;
  personal_finance_category_primary: string;
  personal_finance_category_detailed: string;
  custom_category_id: string | null;
  created_at: string;
  updated_at: string;
  is_removed: boolean;
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
