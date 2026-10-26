import '../../scripts/lib/exampleEnv';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { TestProject } from 'vitest/node';
import { connectDatabase, disconnectDatabase } from '../../src/DB';
import { migrateDatabase, seedDatabase } from '../../src/DB/seed';

declare module 'vitest' {
    export interface ProvidedContext {
        mongoUri: string;
    }
}

/** Starts one MongoDB for the whole run (or uses MONGO_TEST_URI) and seeds it once. */
export default async function setup(project: TestProject) {
    let server: MongoMemoryServer | undefined;
    let uri = process.env.MONGO_TEST_URI;
    if (!uri) {
        server = await MongoMemoryServer.create();
        uri = server.getUri('mockapis_test');
    }

    await connectDatabase(uri);
    await migrateDatabase();
    await seedDatabase({ baseUrl: process.env.PUBLIC_API_URL!, force: true });
    await disconnectDatabase();

    project.provide('mongoUri', uri);
    return async () => {
        await server?.stop();
    };
}
