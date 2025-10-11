'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { format } from 'date-fns';
import {
  isAuthenticated,
  getToken,
  clearToken,
  getAccounts,
  getSelectedAccountId,
} from '@/lib/auth';
import { getTransactions, syncTransactions, type GetTransactionsParams } from '@/lib/api';
import type { Transaction } from '@/types';
import styles from './transactions.module.css';

export default function TransactionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filter & Sort state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('transaction_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 50;

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push('/');
      return;
    }

    const sessionToken = getToken();
    const selectedAccountId = getSelectedAccountId();

    if (!selectedAccountId) {
      router.push('/dashboard');
      return;
    }

    setToken(sessionToken);
    setAccountId(selectedAccountId);
  }, [router]);

  useEffect(() => {
    if (!token || !accountId) return;

    fetchTransactions();
  }, [token, accountId, startDate, endDate, sortBy, sortOrder, currentPage]);

  const fetchTransactions = async () => {
    if (!token || !accountId) return;

    setIsLoading(true);
    try {
      const params: GetTransactionsParams = {
        accountId,
        limit,
        offset: (currentPage - 1) * limit,
        sortBy,
        sortOrder,
      };

      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data = await getTransactions(token, params);
      setTransactions(data.transactions);
      setTotal(data.total);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    if (!token) return;

    setIsSyncing(true);
    try {
      const result = await syncTransactions(token);
      toast.success(`Synced ${result.synced_count} transactions!`);
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    router.push('/');
  };

  const getTransactionType = (amount: number): 'income' | 'expense' => {
    return amount > 0 ? 'expense' : 'income';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(Math.abs(value));
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatCategory = (category: string | null | undefined) => {
    if (!category) return 'Uncategorized';
    return category
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const totalPages = Math.ceil(total / limit);

  if (!token || !accountId) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>Canada Budget Tracker</h1>
            <div className={styles.headerActions}>
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className={styles.syncButton}
              >
                {isSyncing ? 'Syncing...' : '⟳ Sync'}
              </button>
              <button onClick={() => router.push('/dashboard')} className={styles.backButton}>
                ← Dashboard
              </button>
              <button onClick={handleLogout} className={styles.logoutButton}>
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className={styles.main}>
          {/* Page Title */}
          <h2 className={styles.pageTitle}>Transactions</h2>

          {/* Filters */}
          <div className={styles.filterPanel}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Start Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className={styles.dateInput}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>End Date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className={styles.dateInput}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Sort By:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={styles.select}
              >
                <option value="transaction_date">Date</option>
                <option value="amount">Amount</option>
                <option value="merchant_name">Name</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Order:</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className={styles.select}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>

          {/* Results Summary */}
          <div className={styles.resultsSummary}>
            <span className={styles.resultsText}>
              {isLoading ? 'Loading...' : `${total} transactions found`}
            </span>
          </div>

          {/* Transaction Table */}
          {isLoading ? (
            <div className={styles.loading}>Loading transactions...</div>
          ) : transactions.length > 0 ? (
            <>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Name</th>
                      <th className={styles.amountColumn}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => {
                      const transactionType = getTransactionType(transaction.amount);
                      return (
                        <tr key={transaction.transaction_id}>
                          <td className={styles.dateCell}>
                            {formatDate(transaction.transaction_date)}
                          </td>
                          <td className={styles.categoryCell}>
                            {formatCategory(transaction.personal_finance_category_primary)}
                          </td>
                          <td className={styles.nameCell}>
                            {transaction.merchant_name || transaction.name}
                            {transaction.pending && (
                              <span className={styles.pendingBadge}>Pending</span>
                            )}
                          </td>
                          <td className={styles.amountCell}>
                            <span
                              className={`${styles.amount} ${
                                transactionType === 'income' ? styles.income : styles.expense
                              }`}
                            >
                              {transactionType === 'income' ? '+' : '-'}
                              {formatCurrency(transaction.amount)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={styles.paginationButton}
                  >
                    ← Previous
                  </button>
                  <span className={styles.pageInfo}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={styles.paginationButton}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className={styles.noData}>
              No transactions found. Try adjusting your filters or sync your account.
            </div>
          )}
        </main>
      </div>
    </>
  );
}
