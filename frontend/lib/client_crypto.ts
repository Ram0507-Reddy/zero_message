export async function generateClientKey(): Promise<CryptoKey> {
    return window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256
        },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function exportKeyToHash(key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey("raw", key);
    return Buffer.from(exported).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function importKeyFromHash(hash: string): Promise<CryptoKey> {
    // Restore base64url to base64
    let base64 = hash.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }
    const raw = Buffer.from(base64, 'base64');

    return window.crypto.subtle.importKey(
        "raw",
        raw,
        "AES-GCM",
        true,
        ["encrypt", "decrypt"]
    );
}

export async function clientEncrypt(text: string, key: CryptoKey): Promise<string> {
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key,
        enc.encode(text)
    );

    // Pack IV + Ciphertext
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return Buffer.from(combined).toString('base64');
}

export async function clientDecrypt(base64: string, key: CryptoKey): Promise<string> {
    const combined = Buffer.from(base64, 'base64');
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key,
        data
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
}
