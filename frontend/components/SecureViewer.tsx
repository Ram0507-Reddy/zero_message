'use client';

import { useState, useEffect } from 'react';
import { readMessage, API_BASE } from '../lib/api';
import { validateChecksum } from '../lib/security';
import { clientDecrypt, importKeyFromHash } from '../lib/client_crypto';

export default function SecureViewer({ onClose }: { onClose: () => void }) {
    const [token, setToken] = useState('');
    const [content, setContent] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleInputChange = (val: string) => {
        setToken(val);
        if (val.length > 5 && !validateChecksum(val)) {
            setError("Invalid Format (Check for typos)");
        } else {
            setError("");
        }
    };

    // Auto-wipe on unmount
    useEffect(() => {
        return () => {
            setContent(null);
            setToken('');
        };
    }, []);

    const handleRead = async () => {
        setLoading(true);
        setError('');

        // 1. PANIC MODE CHECK
        if (token === 'agent457') {
            try {
                await fetch(`${API_BASE}/panic`, { method: 'POST' });
            } catch (e) { }
            // Show Dummy Secret
            setContent("My bank PIN is 1234");
            setLoading(false);
            return;
        }

        try {
            // 2. Parse Token + Key
            const parts = token.split('#');
            const serverToken = parts[0];
            const keyHash = parts[1];

            // 3. Fetch from Server
            const res = await fetch(`${API_BASE}/read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rxToken: serverToken }),
            });

            if (res.status === 429) throw new Error("Rate Limit Exceeded");

            const data = await res.json();

            // Check for Logic Error (Burnt)
            if (data.content === "No note available") {
                setContent("No note available");
                return;
            }

            // 4. Content is now Plaintext (Token-Only Mode)
            // If the user *does* have a key (legacy), we could try to decrypt, but for now we assume Plaintext.

            setContent(data.content);

        } catch (e) {
            setContent("No note available");
        } finally {
            setLoading(false);
        }
    };

    // --- VIEWING STATE (Looks like a normal note) ---
    if (content) {
        const isBurnt = content === "No note available";

        return (
            <div className="flex flex-col h-full bg-white text-[#111111]">
                {/* Header: Cyan for valid, Gray for Burnt */}
                <div className={`px-6 py-8 flex flex-col justify-end transition-colors ${isBurnt ? 'bg-gray-200' : 'bg-[#A5F3FC]'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wide ${isBurnt ? 'bg-gray-500 text-white' : 'bg-black/20 text-white'}`}>
                            {isBurnt ? 'Burnt' : 'Now'}
                        </span>
                        <button onClick={onClose} className="bg-white/50 hover:bg-white text-black w-8 h-8 rounded-full flex items-center justify-center transition">
                            ×
                        </button>
                    </div>
                    <h2 className="text-3xl font-bold leading-tight">Note</h2>
                </div>

                <div className="p-8 flex-1 overflow-y-auto bg-white flex flex-col justify-center items-center">
                    <pre className={`text-lg leading-relaxed whitespace-pre-wrap font-sans ${isBurnt ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                        {content}
                    </pre>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end flex-col items-center">
                    <div className={`text-xs font-bold uppercase tracking-widest mb-2 opacity-50 ${isBurnt ? 'text-gray-400' : 'text-red-500'}`}>
                        {isBurnt ? 'Note Destroyed' : 'Self-destructing on close'}
                    </div>
                    <button
                        onClick={onClose}
                        className={`w-full py-3 rounded-xl text-sm font-bold shadow-lg transition ${isBurnt ? 'bg-gray-400 text-white hover:bg-gray-500' : 'bg-red-600 text-white hover:bg-red-700'}`}
                    >
                        {isBurnt ? 'Close' : 'Burn & Close'}
                    </button>
                </div>
            </div>
        );
    }

    // --- INPUT STATE (Looks like a system dialog) ---
    return (
        <div className="flex flex-col h-full bg-white text-[#111111]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-500">
                    Access Note
                </h2>
                <button onClick={onClose} className="text-gray-400 hover:text-black text-xl">×</button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
                <div className="w-full space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-400">Access Key</label>
                    <input
                        type="text"
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-lg font-medium outline-none focus:border-black transition text-center placeholder-gray-300"
                        placeholder="docket-id"
                        value={token}
                        onChange={(e) => handleInputChange(e.target.value)}
                        autoFocus
                    />
                </div>

                {error && (
                    <div className="text-red-500 text-sm font-medium bg-red-50 px-4 py-2 rounded-lg">
                        {error}
                    </div>
                )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                <button onClick={onClose} className="flex-1 py-3 text-sm font-bold text-gray-400 hover:text-black transition">
                    Cancel
                </button>
                <button
                    onClick={handleRead}
                    disabled={loading || !token}
                    className="flex-1 py-3 bg-black text-white text-sm font-bold rounded-xl shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
                >
                    {loading ? 'Opening...' : 'Read Note'}
                </button>
            </div>
        </div>
    );
}
