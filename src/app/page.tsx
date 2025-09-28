'use client';
import Image from "next/image";
import styles from "./page.module.css";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PlaidLink from '@/components/PlaidLink';

export default function LoginPage() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setSessionToken('dummy-session-token');
  }, []);

  const handlePlaidSuccess = () => {
    router.push('/dashboard');
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Canada Budget Tracker</h1>
        <div>
          <PlaidLink sessionToken={sessionToken!} onSuccess={handlePlaidSuccess} />
        </div>
      </div>
    </div>
  );
}