export interface SendResponse {
    tokenA: string;
    tokenB: string;
}

export interface ReadResponse {
    content: string;
}

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export async function sendMessage(realityA: string, realityB: string, txToken: string, rxToken: string): Promise<SendResponse> {
    const res = await fetch(`${API_BASE}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ realityA, realityB, txToken, rxToken }),
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
}

export async function readMessage(rxToken: string): Promise<string> {
    const res = await fetch(`${API_BASE}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rxToken }),
    });
    // Canonical Failure Normalization: On 404/500 we can return empty or throw,
    // but the UI expects a string or error.
    if (!res.ok) throw new Error('No note available');
    const data: ReadResponse = await res.json();
    return data.content;
}
