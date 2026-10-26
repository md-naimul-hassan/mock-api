/**
 * Local MongoDB without Docker: starts mongod (downloaded by mongodb-memory-server) on 127.0.0.1:27017
 * with data persisted in ./.mongo-data. Stop with Ctrl+C.
 */
import fs from 'fs';
import path from 'path';
import { MongoMemoryServer } from 'mongodb-memory-server';

async function main() {
    const port = Number(process.env.MONGO_PORT ?? 27017);
    const dbPath = path.resolve(__dirname, '../../../.mongo-data');
    fs.mkdirSync(dbPath, { recursive: true });

    const server = await MongoMemoryServer.create({ instance: { port, ip: '127.0.0.1', dbPath, storageEngine: 'wiredTiger' } });
    console.log(`MongoDB running at ${server.getUri()} (data: ${dbPath}). Press Ctrl+C to stop.`);

    const stop = async () => {
        await server.stop({ doCleanup: false });
        process.exit(0);
    };
    process.on('SIGINT', () => void stop());
    process.on('SIGTERM', () => void stop());
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
