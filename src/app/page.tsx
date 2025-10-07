'use client';
import styles from "./page.module.css";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PlaidLink from '@/components/PlaidLink';

export default function LoginPage() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [plaidMode, setPlaidMode] = useState<'initial' | 'update'>('initial');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setSessionToken('dummy-session-token');
    setPlaidMode('initial');
  }, []);

  const handleSync = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/transactions/sync`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` },
      });
      if (response.status === 400 && response.statusText.includes('Item login required')) {
        setPlaidMode('update');
        setError('Please reconnect your CIBC account to continue.');
      } else if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Sync failed');
      } else {
        setError(null);
        router.push('/dashboard');
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleConnect = () => {
    setPlaidMode('initial');
    setError(null);
  };

  const handleReconnect = () => {
    setPlaidMode('update');
    setError('Please reconnect your CIBC account.');
  }

  const handlePlaidSuccess = () => {
    router.push('/dashboard');
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Canada Budget Tracker</h1>
        {error && <div className={styles['error-message']}>{error}</div>}
        <div className={styles['button-container']}>
          <PlaidLink
            sessionToken={sessionToken!}
            mode={plaidMode}
            onSuccess={handlePlaidSuccess} />
        </div>
        <div>
          {sessionToken && (
            <div className={styles['button-container']}>
              <button
                onClick={handleConnect}
                className={styles['connect-button']}
              >
                Connect Bank Account
              </button>
              <button
                onClick={handleReconnect}
                className={styles['reconnect-button']}
              >
                Reconnect Bank Account
              </button>
              <button
                onClick={handleSync}
                className={styles['sync-button']}
              >
                Get Transactions
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}