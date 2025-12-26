'use client';

import { useEffect } from 'react';
import { readMessage } from '../lib/api';

export default function TrafficNoise() {
    useEffect(() => {
        const sendNoise = async () => {
            try {
                // Send a request similar to a read request but with a deterministic junk token
                // Use a random token that won't exist
                const junkToken = `NOISE-${Math.random().toString(36).substring(7)}`;
                await readMessage(junkToken);
                console.debug('Trace: Heartbeat sent');
            } catch (e) {
                // Ignore errors, noise should look like errors or empty reads
            }
        };

        // Schedule recursive timeout with random jitter
        let timeoutId: NodeJS.Timeout;
        const schedule = () => {
            // Interval: 45s to 90s
            const delay = 45000 + Math.random() * 45000;
            timeoutId = setTimeout(() => {
                sendNoise();
                schedule();
            }, delay);
        };

        schedule();

        return () => clearTimeout(timeoutId);
    }, []);

    return null; // Invisible component
}
