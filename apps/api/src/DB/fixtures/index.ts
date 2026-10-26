import crypto from 'crypto';
import type { Cart, Comment, Post, Product, Quote, Recipe, Todo } from '@mockapis/api-spec';
import { hashPassword } from '../../util/password';
import { buildCarts } from './carts';
import { buildComments } from './comments';
import { buildPosts } from './posts';
import { buildProducts } from './products';
import { buildQuotes } from './quotes';
import { buildRecipes } from './recipes';
import { buildTodos } from './todos';
import { buildUsers, type UserFixture } from './users';

/** Bump when fixture generation logic changes so AUTO_SEED reseeds existing databases. */
export const FIXTURE_VERSION = 1;

export type Fixtures = {
    users: UserFixture[];
    products: Product[];
    posts: Post[];
    comments: Comment[];
    todos: Todo[];
    carts: Cart[];
    recipes: Recipe[];
    quotes: Quote[];
};

const cache = new Map<string, Fixtures>();

/** Builds the full deterministic dataset. Image URLs are absolute, based on `baseUrl`. */
export function buildFixtures(baseUrl: string): Fixtures {
    const cached = cache.get(baseUrl);
    if (cached) return cached;

    const users = buildUsers(baseUrl);
    const products = buildProducts(baseUrl);
    const posts = buildPosts(users.length);
    const fixtures: Fixtures = {
        users,
        products,
        posts,
        comments: buildComments(posts, users.length),
        todos: buildTodos(users.length),
        carts: buildCarts(products, users.length),
        recipes: buildRecipes(baseUrl, users.length),
        quotes: buildQuotes(),
    };
    cache.set(baseUrl, fixtures);
    return fixtures;
}

/** Users as stored in MongoDB: plain-text demo passwords are replaced by scrypt hashes. */
export const toStoredUsers = (users: UserFixture[]) =>
    users.map(({ password, ...user }) => ({ ...user, passwordHash: hashPassword(password, user.username) }));

/** Stable fingerprint of the dataset, stored alongside the seed to detect stale data. */
export function fixtureFingerprint(baseUrl: string): string {
    const fixtures = buildFixtures(baseUrl);
    return crypto.createHash('sha256').update(`${FIXTURE_VERSION}:${JSON.stringify(fixtures)}`).digest('hex').slice(0, 16);
}
