export function generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const prefix = 'RX-';
    const word1 = ['eagle', 'hawk', 'falcon', 'osprey', 'swift', 'kite'][Math.floor(Math.random() * 6)];
    const num = Math.floor(100 + Math.random() * 900); // 3 digits

    const base = `${prefix}${word1}${num}`;

    // Compute Checksum
    const checksum = computeChecksum(base);
    return `${base}-${checksum}`;
}

export function validateChecksum(token: string): boolean {
    // Expected Checksum is last char
    if (token.length < 5) return true; // Too short to validate fully

    // Format: [Base]-[Checksum] or [Base]-[Checksum]-[A/B] for forced reality?
    // Let's assume the Checksum is always the character BEFORE any reality suffix (-A/-B)
    // OR simpler: The user inputs the BASE token which HAS a checksum.
    // Example: RX-eagle784-K (-A/-B added invisibly or manually for reality)

    // If suffix A/B is present, strip it first
    let cleanToken = token;
    if (token.endsWith('-A') || token.endsWith('-B')) {
        cleanToken = token.slice(0, -2);
    }

    const parts = cleanToken.split('-');
    const providedSum = parts.pop(); // Last "part" is sum?
    // Warning: RX-eagle784-K is NOT split by dash usually.
    // Let's append it simpler: RX-eagle784X

    // Implementation: Last character is checksum
    const charToCheck = cleanToken.slice(-1);
    const core = cleanToken.slice(0, -1);

    return computeChecksum(core) === charToCheck;
}

function computeChecksum(str: string): string {
    let sum = 0;
    for (let i = 0; i < str.length; i++) {
        sum += str.charCodeAt(i);
    }
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return chars[sum % 36];
}
