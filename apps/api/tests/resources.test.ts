import { describe, expect, it } from 'vitest';
import { listResponseSchema, RESOURCE_KEYS, resources } from '@mockapis/api-spec';
import { api, expectError, fixtures } from './helpers';

describe.each(RESOURCE_KEYS)('%s resource', (key) => {
    const resource = resources[key];
    const seeded = fixtures[key] as { id: number }[];

    it('lists records with pagination metadata and the default page size', async () => {
        const response = await api().get(`/api/v1/${key}`);
        expect(response.status).toBe(200);
        expect(listResponseSchema(resource).safeParse(response.body).success).toBe(true);
        expect(response.body.total).toBe(seeded.length);
        expect(response.body.skip).toBe(0);
        expect(response.body.limit).toBe(30);
        expect(response.body[key]).toHaveLength(Math.min(30, seeded.length));
        expect(response.body[key][0].id).toBe(1);
    });

    it('returns a record by ID that matches the seed data', async () => {
        const response = await api().get(`/api/v1/${key}/1`);
        expect(response.status).toBe(200);
        expect(resource.schema.strict().safeParse(response.body).success).toBe(true);
        const { password: _password, ...expected } = seeded[0] as Record<string, unknown>;
        expect(response.body).toEqual(expected);
    });

    it('returns 404 for an unknown ID', async () => {
        expectError(await api().get(`/api/v1/${key}/999999`), 404, 'RESOURCE_NOT_FOUND');
    });

    it.each(['abc', '0', '-1', '1.5', '99999999999'])('returns 400 INVALID_ID for malformed id "%s"', async (id) => {
        expectError(await api().get(`/api/v1/${key}/${id}`), 400, 'INVALID_ID');
    });
});

describe('pagination', () => {
    it('applies limit and skip with correct totals', async () => {
        const response = await api().get('/api/v1/users?limit=10&skip=20');
        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({ total: 100, skip: 20, limit: 10 });
        expect(response.body.users.map((user: { id: number }) => user.id)).toEqual([21, 22, 23, 24, 25, 26, 27, 28, 29, 30]);
    });

    it('returns an empty page past the end', async () => {
        const response = await api().get('/api/v1/users?skip=500');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ users: [], total: 100, skip: 500, limit: 30 });
    });

    it('allows the maximum limit and rejects anything above it', async () => {
        const max = await api().get('/api/v1/users?limit=100');
        expect(max.status).toBe(200);
        expect(max.body.users).toHaveLength(100);
        expectError(await api().get('/api/v1/users?limit=101'), 400, 'INVALID_PARAMETER');
    });

    it.each([
        ['limit=0', /limit must be at least 1/],
        ['limit=-5', /limit must be at least 1/],
        ['skip=-1', /skip must be at least 0/],
        ['limit=ten', /limit must be an integer/],
        ['limit=1&limit=2', /provided once/],
        ['page=2', /Unknown query parameter\(s\): page/],
    ])('rejects invalid pagination "%s"', async (query, message) => {
        const response = await api().get(`/api/v1/products?${query}`);
        expectError(response, 400, 'INVALID_PARAMETER');
        expect(response.body.message).toMatch(message);
    });
});

describe('field selection', () => {
    it('returns only the selected fields plus id', async () => {
        const response = await api().get('/api/v1/users?select=firstName,email&limit=2');
        expect(response.status).toBe(200);
        expect(response.body.users).toEqual([
            { id: 1, firstName: 'Emily', email: 'emily.carter@example.com' },
            { id: 2, firstName: 'Michael', email: 'michael.brooks@example.com' },
        ]);
    });

    it('works on detail endpoints', async () => {
        const response = await api().get('/api/v1/products/1?select=title,price');
        expect(Object.keys(response.body).sort()).toEqual(['id', 'price', 'title']);
    });

    it('rejects unknown and internal fields', async () => {
        const unknown = await api().get('/api/v1/users?select=id,shoeSize');
        expectError(unknown, 400, 'INVALID_PARAMETER');
        expect(unknown.body.message).toMatch(/shoeSize/);
        expectError(await api().get('/api/v1/users?select=passwordHash'), 400, 'INVALID_PARAMETER');
        expectError(await api().get('/api/v1/users?select=_id'), 400, 'INVALID_PARAMETER');
    });

    it('never exposes password hashes or Mongo internals', async () => {
        const response = await api().get('/api/v1/users?limit=100');
        const text = JSON.stringify(response.body);
        expect(text).not.toMatch(/passwordHash|"_id"|"__v"|scrypt/);
    });
});

describe('sorting', () => {
    it('sorts ascending and descending by a numeric field', async () => {
        const asc = await api().get('/api/v1/products?sortBy=price&order=asc&limit=100');
        const prices = asc.body.products.map((product: { price: number }) => product.price);
        expect(prices).toEqual([...prices].sort((a, b) => a - b));

        const desc = await api().get('/api/v1/products?sortBy=price&order=desc&limit=5');
        expect(desc.body.products[0].price).toBe(Math.max(...prices));
    });

    it('sorts by a string field', async () => {
        const response = await api().get('/api/v1/quotes?sortBy=author&limit=100');
        const authors = response.body.quotes.map((quote: { author: string }) => quote.author);
        expect(authors).toEqual([...authors].sort());
    });

    it('rejects unknown sort fields and directions', async () => {
        expectError(await api().get('/api/v1/products?sortBy=secret'), 400, 'INVALID_PARAMETER');
        expectError(await api().get('/api/v1/products?order=sideways'), 400, 'INVALID_PARAMETER');
    });
});

describe('search', () => {
    it('is case-insensitive and searches across fields', async () => {
        const response = await api().get('/api/v1/users/search?q=EMILY');
        expect(response.status).toBe(200);
        expect(response.body.total).toBeGreaterThanOrEqual(1);
        for (const user of response.body.users) {
            expect(`${user.firstName} ${user.lastName} ${user.username} ${user.email}`.toLowerCase()).toContain('emily');
        }
    });

    it('finds products by partial title', async () => {
        const response = await api().get('/api/v1/products/search?q=phone');
        expect(response.body.total).toBeGreaterThan(5);
        expect(response.body.products.some((product: { title: string }) => product.title.includes('Smartphone'))).toBe(true);
        expect(response.body.products.some((product: { title: string }) => product.title.includes('Headphones'))).toBe(true);
    });

    it('returns a predictable empty result', async () => {
        const response = await api().get('/api/v1/recipes/search?q=zzzznotfound');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ recipes: [], total: 0, skip: 0, limit: 30 });
    });

    it('treats regex characters literally', async () => {
        const response = await api().get('/api/v1/posts/search?q=.*');
        expect(response.status).toBe(200);
        expect(response.body.total).toBe(0);
    });

    it('requires q', async () => {
        const response = await api().get('/api/v1/products/search');
        expectError(response, 400, 'INVALID_PARAMETER');
        expect(response.body.message).toMatch(/q is required/);
    });
});

describe('filtering', () => {
    it('filters by enum and range', async () => {
        const response = await api().get('/api/v1/products?category=smartphones&minPrice=100&maxPrice=900&limit=100');
        expect(response.status).toBe(200);
        for (const product of response.body.products) {
            expect(product.category).toBe('smartphones');
            expect(product.price).toBeGreaterThanOrEqual(100);
            expect(product.price).toBeLessThanOrEqual(900);
        }
    });

    it('filters todos by boolean and user', async () => {
        const response = await api().get('/api/v1/todos?completed=true&userId=1');
        for (const todo of response.body.todos) expect(todo).toMatchObject({ completed: true, userId: 1 });
        const expected = fixtures.todos.filter((todo) => todo.completed && todo.userId === 1).length;
        expect(response.body.total).toBe(expected);
    });

    it('filters users by role and city case-insensitively', async () => {
        const response = await api().get('/api/v1/users?role=admin&city=denver&limit=100');
        for (const user of response.body.users) {
            expect(user.role).toBe('admin');
            expect(user.address.city).toBe('Denver');
        }
        expect(response.body.users.some((user: { id: number }) => user.id === 1)).toBe(true);
    });

    it('rejects invalid filter values', async () => {
        expectError(await api().get('/api/v1/users?role=superuser'), 400, 'INVALID_PARAMETER');
        expectError(await api().get('/api/v1/todos?completed=yes'), 400, 'INVALID_PARAMETER');
        expectError(await api().get('/api/v1/products?minPrice=cheap'), 400, 'INVALID_PARAMETER');
    });
});

describe('products', () => {
    it('lists categories with counts', async () => {
        const response = await api().get('/api/v1/products/categories');
        expect(response.status).toBe(200);
        expect(response.body.total).toBe(10);
        expect(response.body.categories).toContainEqual({ slug: 'smartphones', name: 'Smartphones', productCount: 10 });
    });

    it('lists products in a category and 404s for unknown categories', async () => {
        const response = await api().get('/api/v1/products/category/laptops?limit=3');
        expect(response.body).toMatchObject({ total: 10, limit: 3 });
        expect(response.body.products.every((product: { category: string }) => product.category === 'laptops')).toBe(true);
        expectError(await api().get('/api/v1/products/category/time-machines'), 404, 'RESOURCE_NOT_FOUND');
    });
});

describe('relationships', () => {
    it.each([
        ['users', 'posts', 'userId'],
        ['users', 'todos', 'userId'],
        ['users', 'carts', 'userId'],
        ['posts', 'comments', 'postId'],
    ] as const)('GET /%s/1/%s returns records whose %s matches', async (parent, child, foreignKey) => {
        const response = await api().get(`/api/v1/${parent}/1/${child}?limit=100`);
        expect(response.status).toBe(200);
        expect(response.body[child].length).toBeGreaterThan(0);
        for (const record of response.body[child]) expect(record[foreignKey]).toBe(1);
        const expected = (fixtures[child] as Record<string, unknown>[]).filter((record) => record[foreignKey] === 1).length;
        expect(response.body.total).toBe(expected);
    });

    it('returns 404 when the parent does not exist', async () => {
        expectError(await api().get('/api/v1/users/999999/posts'), 404, 'RESOURCE_NOT_FOUND');
    });

    it('references only existing seeded records', () => {
        const userIds = new Set(fixtures.users.map((user) => user.id));
        const postIds = new Set(fixtures.posts.map((post) => post.id));
        const productIds = new Set(fixtures.products.map((product) => product.id));
        for (const post of fixtures.posts) expect(userIds.has(post.userId)).toBe(true);
        for (const todo of fixtures.todos) expect(userIds.has(todo.userId)).toBe(true);
        for (const recipe of fixtures.recipes) expect(userIds.has(recipe.userId)).toBe(true);
        for (const comment of fixtures.comments) {
            expect(postIds.has(comment.postId)).toBe(true);
            expect(userIds.has(comment.userId)).toBe(true);
        }
        for (const cart of fixtures.carts) {
            expect(userIds.has(cart.userId)).toBe(true);
            for (const item of cart.products) expect(productIds.has(item.id)).toBe(true);
        }
    });
});

describe('quotes', () => {
    it('returns a random quote from the dataset', async () => {
        const response = await api().get('/api/v1/quotes/random');
        expect(response.status).toBe(200);
        expect(fixtures.quotes).toContainEqual(response.body);
    });
});

describe('images', () => {
    it('serves deterministic SVG placeholders', async () => {
        const response = await api().get('/api/v1/images/users/1').buffer(true);
        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('image/svg+xml');
        expect(Buffer.from(response.body).toString('utf8')).toContain('>EC<');
        expectError(await api().get('/api/v1/images/users/999999'), 404, 'RESOURCE_NOT_FOUND');
        expectError(await api().get('/api/v1/images/cats/1'), 400, 'INVALID_ID');
    });
});
