/**
 * Account types
 */

export interface Account {
  account_id: string;
  account_name: string | null;
  account_official_name?: string | null;
  account_type?: string | null;
  created_at?: string;
  last_synced_at?: string | null;
}
