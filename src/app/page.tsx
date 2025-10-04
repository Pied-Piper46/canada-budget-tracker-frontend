'use client';
import styles from "./page.module.css";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PlaidLink from '@/components/PlaidLink';

export default function LoginPage() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [plaidMode, setPlaidMode] = useState<'initial' | 'update'>('initial');
  const router = useRouter();

  useEffect(() => {
    setSessionToken('dummy-session-token');
    setPlaidMode('initial');
  }, []);

  const handleReconnect = () => {
    setPlaidMode('update');
  }

  const handlePlaidSuccess = () => {
    router.push('/dashboard');
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Canada Budget Tracker</h1>
        <div>
          <PlaidLink
            sessionToken={sessionToken!}
            mode={plaidMode}
            onSuccess={handlePlaidSuccess} />
        </div>
        <div>
          {sessionToken && (
            <button
              type="button"
              onClick={handleReconnect}
              className={styles.button}
            >
              Reconnect Bank Account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}