'use client';
import styles from "./page.module.css";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import { login, saveToken, saveAccounts, saveSelectedAccountId, isAuthenticated } from '@/lib/auth';
import type { LoginRequest } from '@/types';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginRequest>();

  useEffect(() => {
    // Already authenticated, redirect to dashboard
    if (isAuthenticated()) {
      router.push('/dashboard');
    }
  }, [router]);

  const onSubmit = async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await login(data.password);

      // Save authentication data
      saveToken(response.token, response.expires_at);
      saveAccounts(response.accounts);

      // Auto-select first account if available
      if (response.accounts && response.accounts.length > 0) {
        saveSelectedAccountId(response.accounts[0].account_id);
      }

      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className={styles.container}>
        <div className={styles.loginBox}>
          {/* Logo */}
          <div className={styles.logo}>
            <pre className={styles.logoText}>{`
  ██████╗ ██████╗ ████████╗
██╔════╝ ██╔══██╗╚══██╔══╝
██║      ██████╔╝   ██║
██║      ██╔══██╗   ██║
╚██████╗ ██████╔╝   ██║
 ╚═════╝ ╚═════╝    ╚═╝
`}
            </pre>
            <h1 className={styles.appName}>Canada Budget Tracker</h1>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className={styles.loginForm}>
            <div className={styles.inputGroup}>
              <input
                type="password"
                placeholder="Password"
                className={styles.passwordInput}
                disabled={isLoading}
                {...register('password', { required: 'Password is required' })}
              />
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Login'}
              </button>
            </div>
            {errors.password && (
              <p className={styles.errorMessage}>
                {errors.password.message}
              </p>
            )}
          </form>
        </div>
      </div>
    </>
  );
}