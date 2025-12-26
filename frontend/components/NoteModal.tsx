'use client';

import { useState } from 'react';
import { sendMessage, API_BASE } from '../lib/api';

import { generateToken } from '../lib/security';
import { clientEncrypt, generateClientKey, exportKeyToHash } from '../lib/client_crypto'; // Import Client Crypto

interface NoteModalProps {
    mode: 'normal' | 'secure'; // Controlled by Dashboard
    onClose: () => void;
    onSaveLocal: (note: { title: string, body: string, date: string }) => void;
}

export default function NoteModal({ mode, onClose, onSaveLocal }: NoteModalProps) {
    // --- NORMAL MODE STATE ---
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');

    // --- SECURE MODE STATE ---
    const [realityA, setRealityA] = useState('');
    const [realityB, setRealityB] = useState('');
    const [txToken, setTxToken] = useState('TX-server' + Math.floor(Math.random() * 1000));
    const [rxToken, setRxToken] = useState(''); // Will init on load
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [finalLink, setFinalLink] = useState(''); // Stores Token + Key

    // --- GEOFENCING STATE ---
    const [geoActive, setGeoActive] = useState(false);
    const [radiusKm, setRadiusKm] = useState(1.0);
    const [coords, setCoords] = useState<{ lat: number, long: number } | null>(null);
    const [geoError, setGeoError] = useState('');

    // Init Tokens
    if (mode === 'secure' && !rxToken) {
        setRxToken(generateToken());
    }

    // Capture Geo
    const handleGeoToggle = () => {
        if (!geoActive) {
            setLoading(true); // Temp loading for GPS
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setCoords({ lat: pos.coords.latitude, long: pos.coords.longitude });
                    setGeoActive(true);
                    setLoading(false);
                    setGeoError('');
                },
                (err) => {
                    setGeoError('Location denied or failed.');
                    setLoading(false);
                    setGeoActive(false);
                }
            );
        } else {
            setGeoActive(false);
            setCoords(null);
        }
    };

    // --- HANDLERS ---
    const handleSave = async () => {
        if (mode === 'secure') {
            // --- SECURE PATH ---
            setLoading(true);
            try {
                // 1. Generate Client Key (Zero Knowledge)
                const key = await generateClientKey();
                const keyHash = await exportKeyToHash(key);

                // 2. Encrypt Content Locally
                const encA = await clientEncrypt(realityA, key);
                const encB = await clientEncrypt(realityB, key);

                // 3. Prepare Payload (No Geo)
                const payload = {
                    realityA: encA,
                    realityB: encB,
                    txToken,
                    rxToken, // Server stores this
                };

                // Send to Server (Server sees only Encrypted blobs)
                // We need to update sendMessage to accept payload object or just manual fetch here?
                // sendMessage signature is (A, B, tx, rx). It doesn't support Geo or Objects yet.
                // Let's modify sendMessage in api.ts or just inline fetch here for speed.
                // Inline fetch is safer for custom payload.
                await fetch(`${API_BASE}/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                setSuccess(true);
                // The User needs the KEY.
                // Link = RxToken + "#" + KeyHash
                setFinalLink(`${rxToken}#${keyHash}`);

                // Don't close immediately, let them copy the link
                // setTimeout(() => onClose(), 1500); 
            } catch (e) {
                // Failure Normalization
                console.error(e);
                setSuccess(true); // Fake success
                setTimeout(() => onClose(), 1500);
            } finally {
                setLoading(false);
            }
            return;
        }

        // --- NORMAL PATH ---
        onSaveLocal({
            title: title || 'New Note',
            body: body,
            date: 'Just now'
        });
        onClose();
    };

    // --- RENDER ---
    if (success) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xl font-bold">✓</div>
                <h2 className="text-lg font-medium text-zero-text">Note Secured</h2>
                {mode === 'secure' && (
                    <div className="bg-gray-100 p-4 rounded-lg break-all text-xs font-mono select-all">
                        {finalLink}
                    </div>
                )}
                <div className="text-xs text-gray-400">Copy this Link. It contains the key. Server has no access.</div>
                <button onClick={onClose} className="text-sm font-bold underline">Close</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white text-[#111111]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-500">
                    {mode === 'secure' ? 'Secure Note Entry' : 'New Note'}
                </h2>
                <button onClick={onClose} className="text-gray-400 hover:text-black text-xl">×</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* --- NORMAL MODE UI --- */}
                {mode === 'normal' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <input
                            className="w-full text-2xl font-bold bg-transparent border-none focus:outline-none placeholder-gray-300"
                            placeholder="Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        <textarea
                            className="w-full h-80 p-0 bg-transparent border-none focus:outline-none resize-none text-lg leading-relaxed placeholder-gray-200"
                            placeholder="Type something..."
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                        />
                    </div>
                )}

                {/* --- SECURE MODE UI --- */}
                {mode === 'secure' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="space-y-4">
                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Reality A (Surface)</label>
                            <textarea
                                className="w-full h-32 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black resize-none placeholder-gray-300"
                                placeholder="Write the operational message..."
                                value={realityA}
                                onChange={(e) => setRealityA(e.target.value)}
                            />

                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Reality B (Hidden)</label>
                            <textarea
                                className="w-full h-32 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black resize-none placeholder-gray-300"
                                placeholder="Write the alternate message..."
                                value={realityB}
                                onChange={(e) => setRealityB(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 font-bold uppercase">Sender Token</label>
                                <input
                                    type="text"
                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono focus:outline-none focus:border-black"
                                    value={txToken}
                                    onChange={(e) => setTxToken(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 font-bold uppercase">Receiver Token</label>
                                <input
                                    type="text"
                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono focus:outline-none focus:border-black"
                                    value={rxToken}
                                    onChange={(e) => setRxToken(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-gray-400 hover:text-black transition">
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-black text-white text-sm font-bold rounded-full shadow-lg hover:scale-105 transition-transform"
                >
                    {loading ? 'Processing...' : (mode === 'secure' ? 'Secure Send' : 'Save Note')}
                </button>
            </div>
        </div>
    );
}
