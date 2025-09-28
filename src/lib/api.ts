const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function fetchLinkToken(sessionToken: string): Promise<string> {
    const response = await fetch(`${BACKEND_URL}/plaid/link/token/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`,
        },
    });
    if (!response.ok) throw new Error('Failed to fetch link token');
    const data = await response.json();
    return data.link_token;
}

export async function exchangePublicToken(publicToken: string, sessionToken: string): Promise<{ status: string }> {
    const response = await fetch(`${BACKEND_URL}/plaid/item/public_token/exchange`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ public_token: publicToken }),
    });
    if (!response.ok) throw new Error('Failed to exchange public token');
    return response.json();
}