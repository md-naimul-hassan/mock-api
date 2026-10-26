import crypto from 'crypto';

// Demo-grade cost: fine for fictional practice accounts, keeps seeding fast.
const SCRYPT_OPTIONS = { N: 2048, r: 8, p: 1 };
const KEY_LENGTH = 32;

/** Hashes a password with scrypt. The salt is derived from `saltSeed` so reseeding is reproducible. */
export function hashPassword(password: string, saltSeed: string): string {
    const salt = crypto.createHash('sha256').update(`mockapis:${saltSeed}`).digest('hex').slice(0, 32);
    const hash = crypto.scryptSync(password, salt, KEY_LENGTH, SCRYPT_OPTIONS).toString('hex');
    return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
    const [scheme, salt, hash] = stored.split('$');
    if (scheme !== 'scrypt' || !salt || !hash) return false;
    const candidate = crypto.scryptSync(password, salt, KEY_LENGTH, SCRYPT_OPTIONS);
    const expected = Buffer.from(hash, 'hex');
    return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

/** Random-salt scrypt hash for real Builder accounts (not demo fixtures). */
export function hashPasswordRandom(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, KEY_LENGTH, SCRYPT_OPTIONS).toString('hex');
    return `scrypt$${salt}$${hash}`;
}
