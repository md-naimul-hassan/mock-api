import mongoose from 'mongoose';
import config from '../config';
import { logger } from '../shared/logger';
import { connectDatabase, disconnectDatabase } from './index';
import { migrateDatabase, seedDatabase } from './seed';

const commands = ['migrate', 'seed', 'reset'] as const;
type Command = (typeof commands)[number];

async function run(command: Command) {
    await connectDatabase(config.database_url);
    try {
        if (command === 'reset') {
            await mongoose.connection.dropDatabase();
            logger.info('Database dropped');
        }
        await migrateDatabase();
        logger.info('Collections and indexes are up to date');
        if (command === 'seed' || command === 'reset') {
            await seedDatabase({ baseUrl: config.public_api_url, force: true });
        }
    } finally {
        await disconnectDatabase();
    }
}

const command = process.argv[2] as Command;
if (!commands.includes(command)) {
    console.error(`Usage: tsx src/DB/cli.ts <${commands.join('|')}>`);
    process.exit(1);
}

run(command)
    .then(() => process.exit(0))
    .catch((error) => {
        logger.error({ err: error }, `db:${command} failed`);
        process.exit(1);
    });
