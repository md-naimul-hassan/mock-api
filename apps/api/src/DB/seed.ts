import { RESOURCE_KEYS } from '@mockapis/api-spec';
import { BuilderUser, MockEndpoint, MockProject } from '../app/modules/builder/builder.models';
import { logger } from '../shared/logger';
import { buildFixtures, fixtureFingerprint, toStoredUsers } from './fixtures';
import { resourceModels, SeedMeta } from './models';
import { RateLimitHit } from '../helpers/mongoRateLimitStore';

const META_ID = 'fixtures';

/** Creates collections and indexes. MongoDB is schemaless, so this is the "migration" step. */
export async function migrateDatabase() {
    for (const model of [...Object.values(resourceModels), SeedMeta, RateLimitHit, BuilderUser, MockProject, MockEndpoint]) {
        await model.createCollection().catch((error: { codeName?: string }) => {
            if (error.codeName !== 'NamespaceExists') throw error;
        });
        await model.syncIndexes();
    }
}

/** True when every resource collection contains the expected number of seeded records. */
export async function isSeeded(baseUrl: string) {
    const fixtures = buildFixtures(baseUrl);
    const counts = await Promise.all(RESOURCE_KEYS.map((key) => resourceModels[key].estimatedDocumentCount()));
    return RESOURCE_KEYS.every((key, index) => counts[index] === fixtures[key].length);
}

export async function seedDatabase({ baseUrl, force = false }: { baseUrl: string; force?: boolean }) {
    const fingerprint = fixtureFingerprint(baseUrl);
    const fixtures = buildFixtures(baseUrl);

    if (!force) {
        const meta = await SeedMeta.findById(META_ID).lean();
        if (meta?.fingerprint === fingerprint) {
            const counts = await Promise.all(RESOURCE_KEYS.map((key) => resourceModels[key].estimatedDocumentCount()));
            if (RESOURCE_KEYS.every((key, index) => counts[index] === fixtures[key].length)) {
                return { seeded: false, fingerprint };
            }
        }
    }

    const counts: Record<string, number> = {};
    for (const key of RESOURCE_KEYS) {
        const model = resourceModels[key];
        const documents = key === 'users' ? toStoredUsers(fixtures.users) : fixtures[key];
        await model.deleteMany({});
        await model.insertMany(documents, { ordered: true, lean: true });
        counts[key] = documents.length;
    }

    await SeedMeta.findByIdAndUpdate(META_ID, { fingerprint, seededAt: new Date(), counts }, { upsert: true });
    logger.info({ counts, fingerprint }, 'Database seeded');
    return { seeded: true, fingerprint, counts };
}
