'use client';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import type { Transaction } from '@/types';
import styles from './RecentTransactions.module.css';

interface RecentTransactionsProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export default function RecentTransactions({
  transactions,
  isLoading = false
}: RecentTransactionsProps) {
  const router = useRouter();

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(Math.abs(value));
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  // Format category (convert from SCREAMING_SNAKE_CASE to Title Case)
  const formatCategory = (category: string | null | undefined) => {
    if (!category) return 'Uncategorized';
    return category
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleViewAll = () => {
    router.push('/transactions');
  };

  if (isLoading) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Recent Transactions</h2>
        </div>
        <div className={styles.skeleton}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className={styles.skeletonRow}></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Recent Transactions</h2>
        <button onClick={handleViewAll} className={styles.viewAllButton}>
          View All →
        </button>
      </div>

      {transactions.length > 0 ? (
        <div className={styles.transactionList}>
          {transactions.map((transaction) => (
            <div key={transaction.id} className={styles.transactionRow}>
              <div className={styles.transactionMain}>
                <div className={styles.transactionInfo}>
                  <div className={styles.transactionName}>
                    {transaction.name}
                    {transaction.pending && (
                      <span className={styles.pendingBadge}>Pending</span>
                    )}
                  </div>
                  <div className={styles.transactionMeta}>
                    <span className={styles.transactionDate}>
                      {formatDate(transaction.date)}
                    </span>
                    <span className={styles.transactionSeparator}>•</span>
                    <span className={styles.transactionCategory}>
                      {formatCategory(transaction.category)}
                    </span>
                  </div>
                </div>
              </div>
              <div className={styles.transactionAmount}>
                <span
                  className={`${styles.amount} ${
                    transaction.type === 'income' ? styles.income : styles.expense
                  }`}
                >
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.noData}>
          No transactions yet. Sync your account to get started.
        </div>
      )}
    </div>
  );
}
