/**
 * Sync types
 */

export interface SyncResponse {
  synced_count: number;
  latest_transaction_date: string;
  sync_status: 'success' | 'partial' | 'failed';
  errors?: string[];
}
