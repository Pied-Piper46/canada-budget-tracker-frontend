'use client';
import { usePlaidLink } from 'react-plaid-link';
import { useState, useEffect } from 'react';
import { fetchLinkToken, exchangePublicToken } from '@/lib/api';
import styles from './PlaidLink.module.css';

interface PlaidLinkProps {
    sessionToken: string;
    onSuccess: () => void;
}

export default function PlaidLink({ sessionToken, onSuccess }: PlaidLinkProps) {
    const [linkToken, setLinkToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getLinkToken = async () => {
            try {
                const token = await fetchLinkToken(sessionToken);
                setLinkToken(token);
            } catch (error) {
                console.error('Error fetching link token:', error);
            } finally {
                setLoading(false);
            }
        };
        getLinkToken();
    }, [sessionToken]);

    const { open, ready } = usePlaidLink({
        token: linkToken!,
        onSuccess: async (publicToken, metadata) => {
            try {
                await exchangePublicToken(publicToken, sessionToken);
                console.log('metadata:', metadata)
                onSuccess(); // callback when success.
            } catch (error) {
                console.error('Error exchaging public token:', error);
            }
        },
        onExit: (err, metadata) => {
            if (err != null) {
                console.error('Plaid Link exited with error:', err);
            }
        },
        onEvent: (eventname, metadata) => {
            console.log('Plaid Link event:', eventname, metadata);
        },
    });

    if (loading) return <div>Loading Plaid Link...</div>;

    return (
        <button
          onClick={() => open()}
          disabled={!ready || !linkToken}
          className={styles.button}
        >
            Connect Bank Account
        </button>
    );
}