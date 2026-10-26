/** Deterministic PRNG (mulberry32) so seed data is identical on every run. */
export function createRandom(seed: number) {
    let state = seed >>> 0;
    const next = () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const int = (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min;
    const pick = <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)];
    const float = (min: number, max: number, decimals = 2) => Number((next() * (max - min) + min).toFixed(decimals));
    const bool = (probability = 0.5) => next() < probability;
    const sample = <T>(items: readonly T[], count: number): T[] => {
        const copy = [...items];
        const result: T[] = [];
        while (result.length < count && copy.length > 0) {
            result.push(copy.splice(Math.floor(next() * copy.length), 1)[0]);
        }
        return result;
    };

    return { next, int, pick, float, bool, sample };
}

export type Random = ReturnType<typeof createRandom>;
