'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import useSWR from 'swr';
import {
  isAuthenticated,
  getToken,
  clearToken,
  getAccounts,
  getSelectedAccountId,
  saveSelectedAccountId,
  type Account
} from '@/lib/auth';
import {
  syncTransactions,
  getDashboardSummary,
  getAssetHistory,
  getRecentTransactions,
  type Transaction
} from '@/lib/api';
import AssetSummaryCard from '@/components/dashboard/AssetSummaryCard';
import IncomeSummaryCard from '@/components/dashboard/IncomeSummaryCard';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import PlaidLink from '@/components/PlaidLink';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [plaidMode, setPlaidMode] = useState<'initial' | 'update'>('update');

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push('/');
      return;
    }

    const sessionToken = getToken();
    const userAccounts = getAccounts();
    const savedAccountId = getSelectedAccountId();

    setToken(sessionToken);
    setAccounts(userAccounts);

    // Set selected account (use saved or first available)
    if (savedAccountId && userAccounts.some(acc => acc.account_id === savedAccountId)) {
      setSelectedAccountId(savedAccountId);
    } else if (userAccounts.length > 0) {
      const firstAccountId = userAccounts[0].account_id;
      setSelectedAccountId(firstAccountId);
      saveSelectedAccountId(firstAccountId);
    }
  }, [router]);

  // Calculate date for 12 months ago
  const getStartDate = (monthsAgo: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() - monthsAgo);
    return date.toISOString().split('T')[0];
  };

  // Calculate date for 12 weeks ago
  const getWeeksAgo = (weeks: number) => {
    const date = new Date();
    date.setDate(date.getDate() - (weeks * 7));
    return date.toISOString().split('T')[0];
  };

  // Fetch dashboard data (only when account is selected)
  // revalidateOnFocus: false でウィンドウ切り替え時の自動再取得を無効化
  const { data: monthlyData, error: monthlyError, mutate: mutateMonthly, isLoading: isLoadingMonthly } = useSWR(
    token && selectedAccountId ? ['monthly-summary', selectedAccountId, token] : null,
    () => getDashboardSummary(selectedAccountId!, token!, 'month', getStartDate(12)),
    { revalidateOnFocus: false }
  );

  const { data: weeklyData, error: weeklyError, mutate: mutateWeekly, isLoading: isLoadingWeekly } = useSWR(
    token && selectedAccountId ? ['weekly-summary', selectedAccountId, token] : null,
    () => getDashboardSummary(selectedAccountId!, token!, 'week', getWeeksAgo(12)),
    { revalidateOnFocus: false }
  );

  const { data: assetData, error: assetError, mutate: mutateAsset, isLoading: isLoadingAsset } = useSWR(
    token && selectedAccountId ? ['asset-history', selectedAccountId, token] : null,
    () => getAssetHistory(selectedAccountId!, token!, 'month'),
    { revalidateOnFocus: false }
  );

  const { data: transactionsData, error: transactionsError, mutate: mutateTransactions, isLoading: isLoadingTransactions } = useSWR(
    token && selectedAccountId ? ['recent-transactions', selectedAccountId, token] : null,
    () => getRecentTransactions(selectedAccountId!, token!, 10),
    { revalidateOnFocus: false }
  );

  const handleAccountChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newAccountId = event.target.value;
    setSelectedAccountId(newAccountId);
    saveSelectedAccountId(newAccountId);
  };

  const handleSync = async () => {
    if (!token) return;

    setIsSyncing(true);
    try {
      const result = await syncTransactions(token);
      toast.success(`Synced ${result.synced_count} transactions!`);

      // Refresh all data
      mutateMonthly();
      mutateWeekly();
      mutateAsset();
      mutateTransactions();
    } catch (error: any) {
      if (error.message === 'ITEM_LOGIN_REQUIRED') {
        setNeedsReconnect(true);
        toast.error('Please reconnect your bank account');
      } else {
        toast.error(error.message || 'Sync failed');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleReconnect = () => {
    setPlaidMode('update');
  };

  const handlePlaidSuccess = () => {
    setNeedsReconnect(false);
    toast.success('Account reconnected successfully!');
    // Refresh data
    handleSync();
  };

  const handleLogout = () => {
    clearToken();
    router.push('/');
  };

  if (!token) {
    return <div className={styles.loading}>Loading...</div>;
  }

  // Get current month data
  const currentMonthData = monthlyData?.period_summaries?.[monthlyData.period_summaries.length - 1];

  return (
    <>
      <Toaster position="top-right" />
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerLeft}>
              <h1 className={styles.title}>Canada Budget Tracker</h1>
              {accounts.length > 0 && (
                <div className={styles.accountSelector}>
                  <label htmlFor="account-select" className={styles.accountLabel}>
                    Account:
                  </label>
                  <select
                    id="account-select"
                    value={selectedAccountId || ''}
                    onChange={handleAccountChange}
                    className={styles.accountSelect}
                    disabled={accounts.length === 0}
                  >
                    {accounts.map((account) => (
                      <option key={account.account_id} value={account.account_id}>
                        {account.name || account.official_name || account.account_id}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className={styles.headerActions}>
              <button
                onClick={handleSync}
                disabled={isSyncing || !selectedAccountId}
                className={styles.syncButton}
              >
                {isSyncing ? 'Syncing...' : '⟳ Sync'}
              </button>
              <button onClick={handleLogout} className={styles.logoutButton}>
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Reconnect Banner */}
        {needsReconnect && (
          <div className={styles.reconnectBanner}>
            <p>⚠️ Bank connection lost. Please reconnect your account.</p>
            {token && (
              <PlaidLink
                sessionToken={token}
                mode={plaidMode}
                onSuccess={handlePlaidSuccess}
              />
            )}
          </div>
        )}

        {/* Main Content */}
        <main className={styles.main}>
          <div className={styles.grid}>
            {/* Asset Summary Card */}
            <AssetSummaryCard
              currentBalance={assetData?.current_balance || 0}
              balanceHistory={assetData?.balance_history || []}
              isLoading={isLoadingAsset}
            />

            {/* Income/Expense Summary Card */}
            <IncomeSummaryCard
              weeklyData={weeklyData?.period_summaries || []}
              monthlyData={monthlyData?.period_summaries || []}
              currentIncome={currentMonthData?.income || 0}
              currentExpense={currentMonthData?.expense || 0}
              currentNet={currentMonthData?.net || 0}
              isLoading={isLoadingMonthly || isLoadingWeekly}
            />

            {/* Recent Transactions */}
            <RecentTransactions
              transactions={transactionsData?.transactions || []}
              isLoading={isLoadingTransactions}
            />
          </div>
        </main>
      </div>
    </>
  );
}
