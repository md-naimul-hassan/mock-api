import '../../scripts/lib/exampleEnv';
import { afterAll, beforeAll, inject } from 'vitest';
import { connectDatabase, disconnectDatabase, markSeeded } from '../../src/DB';

beforeAll(async () => {
    await connectDatabase(inject('mongoUri'));
    markSeeded(true);
});

afterAll(async () => {
    await disconnectDatabase();
});
