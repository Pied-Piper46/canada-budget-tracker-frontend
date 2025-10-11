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
        <div className={styles.terminal}>
          <div className={styles['terminal-header']}>
            <div className={styles['terminal-dots']}>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div className={styles['terminal-title']}>canada-budget-tracker</div>
          </div>
          <div className={styles['terminal-body']}>
            <div className={styles['ascii-art']}>
              <pre>{`
    ██████╗██████╗ ████████╗
   ██╔════╝██╔══██╗╚══██╔══╝
██║     ██████╔╝   ██║
██║     ██╔══██╗   ██║
╚██████╗██████╔╝   ██║
 ╚═════╝╚═════╝    ╚═╝
              `}</pre>
            </div>
            <div className={styles['login-prompt']}>
              <p className={styles['prompt-text']}>$ system authentication required</p>
              <p className={styles['prompt-text']}>$ enter password to continue...</p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className={styles['login-form']}>
              <div className={styles['input-group']}>
                <label className={styles['input-label']}>
                  <span className={styles['prompt-symbol']}>{'>'}</span>
                  <input
                    type="password"
                    placeholder="password"
                    className={styles['terminal-input']}
                    disabled={isLoading}
                    {...register('password', { required: 'Password is required' })}
                  />
                </label>
              </div>
              {errors.password && (
                <p className={styles['error-message']}>
                  $ error: {errors.password.message}
                </p>
              )}
              <button
                type="submit"
                className={styles['submit-button']}
                disabled={isLoading}
              >
                {isLoading ? '$ authenticating...' : '$ enter'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}