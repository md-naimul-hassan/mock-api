/**
 * Runs every documented example request against a freshly seeded in-memory MongoDB
 * and writes the real responses to packages/api-spec/src/examples.generated.json.
 */
import './lib/exampleEnv';
import fs from 'fs';
import path from 'path';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { endpoints } from '@mockapis/api-spec';
import { createApp } from '../src/app';
import { connectDatabase, disconnectDatabase, markSeeded } from '../src/DB';
import { migrateDatabase, seedDatabase } from '../src/DB/seed';
import { demoTokens, EXAMPLE_BASE_URL, normalize, runExample } from './lib/exampleRunner';

async function main() {
    const mongo = await MongoMemoryServer.create();
    await connectDatabase(mongo.getUri('mockapis_examples'));
    await migrateDatabase();
    await seedDatabase({ baseUrl: EXAMPLE_BASE_URL, force: true });
    markSeeded(true);

    const app = createApp({ logRequests: false });
    const tokens = await demoTokens(app);
    const output: Record<string, unknown> = {};
    const problems: string[] = [];

    for (const endpoint of endpoints) {
        const success = normalize(endpoint.id, await runExample(app, endpoint, endpoint.example, tokens));
        if (success.status !== endpoint.successStatus) problems.push(`${endpoint.id}: expected ${endpoint.successStatus}, got ${success.status} ${JSON.stringify(success.body)}`);
        const entry: Record<string, unknown> = { success };
        if (endpoint.failure) {
            const failure = normalize(endpoint.id, await runExample(app, endpoint, endpoint.failure, tokens));
            if (failure.status !== endpoint.failureStatus) problems.push(`${endpoint.id} (failure): expected ${endpoint.failureStatus}, got ${failure.status} ${JSON.stringify(failure.body)}`);
            entry.failure = failure;
        }
        output[endpoint.id] = entry;
    }

    await disconnectDatabase();
    await mongo.stop();

    if (problems.length > 0) {
        console.error(`Examples do not match documented status codes:\n  ${problems.join('\n  ')}`);
        process.exit(1);
    }

    const target = path.resolve(__dirname, '../../../packages/api-spec/src/examples.generated.json');
    fs.writeFileSync(target, `${JSON.stringify({ baseUrl: EXAMPLE_BASE_URL, endpoints: output }, null, 2)}\n`);
    console.log(`Captured ${endpoints.length} endpoint examples -> ${path.relative(process.cwd(), target)}`);
    process.exit(0);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
