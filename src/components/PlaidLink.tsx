'use client';
import { usePlaidLink } from 'react-plaid-link';
import { useState, useEffect } from 'react';
import { fetchLinkToken, exchangePublicToken } from '@/lib/api';
import styles from './PlaidLink.module.css';

interface PlaidLinkProps {
    sessionToken: string;
    mode: 'initial' | 'update';
    onSuccess: () => void;
}

export default function PlaidLink({ sessionToken, mode, onSuccess }: PlaidLinkProps) {
    const [linkToken, setLinkToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getLinkToken = async () => {
            try {
                const token = await fetchLinkToken(sessionToken, mode);
                console.log(`${mode} link token fetched:`, token ? 'Success' : 'Null');
                setLinkToken(token);
                setError(null);
            } catch (error: any) {
                console.error(`Error fetching ${mode} link token:`, error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };
        getLinkToken();
    }, [sessionToken, mode]);

    const { open, ready } = usePlaidLink({
        token: linkToken!,
        onSuccess: async (publicToken, metadata) => {
            console.log(`${mode} mode success:`, { publicToken, metadata });
            if (mode === 'initial') {
                try {
                    await exchangePublicToken(publicToken, sessionToken);
                    console.log('metadata:', metadata)
                    onSuccess(); // callback when success.
                } catch (error) {
                    console.error('Error exchaging public token:', error);
                }
            } else {
                onSuccess();
            }
        },
        onExit: (err, metadata) => {
            console.log(`${mode} mode exit:`, { err, metadata });
            if (err) alert(`Plaid Link error: ${err.error_message || 'Unknown error'}`);
        },
        onEvent: (eventName, metadata) => {
            console.log(`${mode} mode event:`, { eventName, metadata });
        },
    });

    if (loading) return <div>Loading Plaid Link...</div>;
    if (error) return <div>{error}</div>;

    return (
        <button
          onClick={() => open()}
          disabled={!ready || !linkToken}
          className={styles.button}
        >
            {mode === 'initial' ? 'Connect Bank Account' : 'Reconnect Bank Account'}
        </button>
    );
}