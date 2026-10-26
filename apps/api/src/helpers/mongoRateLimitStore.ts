import type { ClientRateLimitInfo, Options, Store } from 'express-rate-limit';
import { model, Schema } from 'mongoose';

type IRateLimitHit = { _id: string; hits: number; resetTime: Date };

export const RateLimitHit = model<IRateLimitHit>(
    'RateLimitHit',
    new Schema<IRateLimitHit>(
        {
            _id: { type: String, required: true },
            hits: { type: Number, required: true },
            // TTL index: MongoDB removes expired windows automatically.
            resetTime: { type: Date, required: true, expires: 0 },
        },
        { collection: 'rate_limits', versionKey: false },
    ),
);

/**
 * Shared rate-limit counter for multi-instance deployments. Each key is updated atomically
 * with an aggregation-pipeline upsert, so concurrent instances never lose hits.
 */
export class MongoRateLimitStore implements Store {
    prefix: string;
    localKeys = false;
    private windowMs = 60_000;

    constructor(prefix = 'rl:') {
        this.prefix = prefix;
    }

    init(options: Options) {
        this.windowMs = options.windowMs;
    }

    private key(key: string) {
        return `${this.prefix}${key}`;
    }

    async get(key: string): Promise<ClientRateLimitInfo | undefined> {
        const doc = await RateLimitHit.collection.findOne({ _id: this.key(key) } as never);
        if (!doc || (doc.resetTime as Date) <= new Date()) return undefined;
        return { totalHits: doc.hits as number, resetTime: doc.resetTime as Date };
    }

    async increment(key: string): Promise<ClientRateLimitInfo> {
        const now = new Date();
        const expired = { $or: [{ $lte: ['$resetTime', now] }, { $eq: [{ $type: '$resetTime' }, 'missing'] }] };
        const doc = await RateLimitHit.collection.findOneAndUpdate(
            { _id: this.key(key) } as never,
            [
                {
                    $set: {
                        hits: { $cond: [expired, 1, { $add: ['$hits', 1] }] },
                        resetTime: { $cond: [expired, new Date(now.getTime() + this.windowMs), '$resetTime'] },
                    },
                },
            ],
            { upsert: true, returnDocument: 'after' },
        );
        return { totalHits: (doc?.hits as number) ?? 1, resetTime: (doc?.resetTime as Date) ?? new Date(now.getTime() + this.windowMs) };
    }

    async decrement(key: string) {
        await RateLimitHit.collection.updateOne({ _id: this.key(key), hits: { $gt: 0 } } as never, { $inc: { hits: -1 } });
    }

    async resetKey(key: string) {
        await RateLimitHit.collection.deleteOne({ _id: this.key(key) } as never);
    }
}
