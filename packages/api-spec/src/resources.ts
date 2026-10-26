import type { z } from 'zod';
import {
    AVAILABILITY_STATUSES,
    CartSchema,
    CommentSchema,
    CreateCommentBody,
    CreatePostBody,
    CreateProductBody,
    CreateTodoBody,
    CreateUserBody,
    GENDERS,
    MEAL_TYPES,
    PatchCommentBody,
    PatchPostBody,
    PatchProductBody,
    PatchTodoBody,
    PatchUserBody,
    PostSchema,
    ProductSchema,
    QuoteSchema,
    RecipeSchema,
    RECIPE_DIFFICULTIES,
    ReplaceCommentBody,
    ReplacePostBody,
    ReplaceProductBody,
    ReplaceTodoBody,
    ReplaceUserBody,
    TodoSchema,
    UserSchema,
    USER_ROLES,
} from './schemas';

export const RESOURCE_KEYS = ['users', 'products', 'posts', 'comments', 'todos', 'carts', 'recipes', 'quotes'] as const;
export type ResourceKey = (typeof RESOURCE_KEYS)[number];

export type FilterOperator = 'eq' | 'eq-ci' | 'gte' | 'lte';

export interface FilterConfig {
    name: string;
    type: 'string' | 'integer' | 'number' | 'boolean' | 'enum';
    field: string;
    operator: FilterOperator;
    values?: readonly string[];
    description: string;
    example: string;
}

export interface RelationConfig {
    /** Path segment, e.g. `posts` in `/users/{id}/posts`. */
    path: string;
    resource: ResourceKey;
    foreignKey: string;
}

export interface ResourceConfig {
    key: ResourceKey;
    singular: string;
    label: string;
    description: string;
    schema: z.ZodObject;
    fields: string[];
    sortable: string[];
    searchable: string[];
    filters: FilterConfig[];
    relations: RelationConfig[];
    mutable: boolean;
    bodies?: {
        create: z.ZodType;
        replace: z.ZodType;
        patch: z.ZodType;
    };
    examples: {
        search?: string;
        createBody?: Record<string, unknown>;
        replaceBody?: Record<string, unknown>;
        patchBody?: Record<string, unknown>;
    };
}

const fieldsOf = (schema: z.ZodObject) => Object.keys(schema.shape);

const userIdFilter = (resource: string): FilterConfig => ({
    name: 'userId',
    type: 'integer',
    field: 'userId',
    operator: 'eq',
    description: `Only return ${resource} that belong to this user ID.`,
    example: '5',
});

export const resources: Record<ResourceKey, ResourceConfig> = {
    users: {
        key: 'users',
        singular: 'user',
        label: 'Users',
        description:
            'Fictional user profiles with contact details, address, company, and role. Users own posts, todos, comments, carts, and recipes.',
        schema: UserSchema,
        fields: fieldsOf(UserSchema),
        sortable: ['id', 'firstName', 'lastName', 'username', 'age', 'birthDate'],
        searchable: ['firstName', 'lastName', 'username', 'email'],
        filters: [
            { name: 'role', type: 'enum', field: 'role', operator: 'eq', values: USER_ROLES, description: 'Filter by role.', example: 'admin' },
            { name: 'gender', type: 'enum', field: 'gender', operator: 'eq', values: GENDERS, description: 'Filter by gender.', example: 'female' },
            { name: 'city', type: 'string', field: 'address.city', operator: 'eq-ci', description: 'Filter by city (case-insensitive exact match).', example: 'Denver' },
            { name: 'minAge', type: 'integer', field: 'age', operator: 'gte', description: 'Minimum age (inclusive).', example: '30' },
            { name: 'maxAge', type: 'integer', field: 'age', operator: 'lte', description: 'Maximum age (inclusive).', example: '40' },
        ],
        relations: [
            { path: 'posts', resource: 'posts', foreignKey: 'userId' },
            { path: 'todos', resource: 'todos', foreignKey: 'userId' },
            { path: 'carts', resource: 'carts', foreignKey: 'userId' },
        ],
        mutable: true,
        bodies: { create: CreateUserBody, replace: ReplaceUserBody, patch: PatchUserBody },
        examples: {
            search: 'emily',
            createBody: { name: 'Alex Morgan', email: 'alex@example.com' },
            replaceBody: { firstName: 'Emily', lastName: 'Carter-Hayes', email: 'emily.hayes@example.com', age: 35 },
            patchBody: { lastName: 'Hayes' },
        },
    },
    products: {
        key: 'products',
        singular: 'product',
        label: 'Products',
        description: 'A fictional product catalog across categories with pricing, discounts, ratings, and stock levels.',
        schema: ProductSchema,
        fields: fieldsOf(ProductSchema),
        sortable: ['id', 'title', 'price', 'rating', 'stock', 'discountPercentage'],
        searchable: ['title', 'description', 'brand', 'category', 'tags'],
        filters: [
            { name: 'category', type: 'string', field: 'category', operator: 'eq-ci', description: 'Filter by category slug.', example: 'smartphones' },
            { name: 'brand', type: 'string', field: 'brand', operator: 'eq-ci', description: 'Filter by brand (case-insensitive exact match).', example: 'Lumio' },
            {
                name: 'availabilityStatus',
                type: 'enum',
                field: 'availabilityStatus',
                operator: 'eq',
                values: AVAILABILITY_STATUSES,
                description: 'Filter by stock availability.',
                example: 'In Stock',
            },
            { name: 'minPrice', type: 'number', field: 'price', operator: 'gte', description: 'Minimum price (inclusive).', example: '10' },
            { name: 'maxPrice', type: 'number', field: 'price', operator: 'lte', description: 'Maximum price (inclusive).', example: '500' },
            { name: 'minRating', type: 'number', field: 'rating', operator: 'gte', description: 'Minimum rating (inclusive).', example: '4' },
        ],
        relations: [],
        mutable: true,
        bodies: { create: CreateProductBody, replace: ReplaceProductBody, patch: PatchProductBody },
        examples: {
            search: 'phone',
            createBody: { title: 'Trail Runner Water Bottle', category: 'sports-accessories', brand: 'Peakline', price: 18.5, stock: 40 },
            replaceBody: { title: 'Nova X5 Smartphone (2026 Edition)', category: 'smartphones', brand: 'Lumio', price: 649, stock: 25 },
            patchBody: { price: 599.99 },
        },
    },
    posts: {
        key: 'posts',
        singular: 'post',
        label: 'Posts',
        description: 'Short blog-style posts written by seeded users, with tags, reactions, and view counts.',
        schema: PostSchema,
        fields: fieldsOf(PostSchema),
        sortable: ['id', 'title', 'views', 'userId'],
        searchable: ['title', 'body', 'tags'],
        filters: [
            userIdFilter('posts'),
            { name: 'tag', type: 'string', field: 'tags', operator: 'eq-ci', description: 'Only return posts with this tag.', example: 'travel' },
        ],
        relations: [{ path: 'comments', resource: 'comments', foreignKey: 'postId' }],
        mutable: true,
        bodies: { create: CreatePostBody, replace: ReplacePostBody, patch: PatchPostBody },
        examples: {
            search: 'coffee',
            createBody: { title: 'My first API request', body: 'Today I sent my first request to Mock APIs.', userId: 5 },
            replaceBody: { title: 'Updated title', body: 'Completely replaced body text.', userId: 1, tags: ['update'] },
            patchBody: { title: 'Patched title' },
        },
    },
    comments: {
        key: 'comments',
        singular: 'comment',
        label: 'Comments',
        description: 'Comments left by users on posts. Every comment references an existing post and user.',
        schema: CommentSchema,
        fields: fieldsOf(CommentSchema),
        sortable: ['id', 'likes', 'postId', 'userId'],
        searchable: [],
        filters: [
            { name: 'postId', type: 'integer', field: 'postId', operator: 'eq', description: 'Only return comments on this post ID.', example: '1' },
            userIdFilter('comments'),
        ],
        relations: [],
        mutable: true,
        bodies: { create: CreateCommentBody, replace: ReplaceCommentBody, patch: PatchCommentBody },
        examples: {
            createBody: { body: 'Great write-up, thanks for sharing!', postId: 1, userId: 3 },
            replaceBody: { body: 'Edited comment text.', postId: 1, userId: 3 },
            patchBody: { body: 'Edited comment text.' },
        },
    },
    todos: {
        key: 'todos',
        singular: 'todo',
        label: 'Todos',
        description: 'Simple to-do items that belong to users. Ideal for practicing list rendering and toggling state.',
        schema: TodoSchema,
        fields: fieldsOf(TodoSchema),
        sortable: ['id', 'todo', 'userId'],
        searchable: [],
        filters: [
            { name: 'completed', type: 'boolean', field: 'completed', operator: 'eq', description: 'Filter by completion state.', example: 'false' },
            userIdFilter('todos'),
        ],
        relations: [],
        mutable: true,
        bodies: { create: CreateTodoBody, replace: ReplaceTodoBody, patch: PatchTodoBody },
        examples: {
            createBody: { todo: 'Write integration tests', completed: false, userId: 5 },
            replaceBody: { todo: 'Review pull request', completed: true, userId: 1 },
            patchBody: { completed: true },
        },
    },
    carts: {
        key: 'carts',
        singular: 'cart',
        label: 'Carts',
        description: 'Shopping carts that reference seeded users and products, with computed totals and discounts.',
        schema: CartSchema,
        fields: fieldsOf(CartSchema),
        sortable: ['id', 'userId', 'total', 'discountedTotal', 'totalQuantity'],
        searchable: [],
        filters: [userIdFilter('carts')],
        relations: [],
        mutable: false,
        examples: {},
    },
    recipes: {
        key: 'recipes',
        singular: 'recipe',
        label: 'Recipes',
        description: 'Recipes with ingredients, step-by-step instructions, timings, and nutrition information.',
        schema: RecipeSchema,
        fields: fieldsOf(RecipeSchema),
        sortable: ['id', 'name', 'rating', 'prepTimeMinutes', 'cookTimeMinutes', 'caloriesPerServing'],
        searchable: ['name', 'cuisine', 'tags', 'ingredients'],
        filters: [
            { name: 'cuisine', type: 'string', field: 'cuisine', operator: 'eq-ci', description: 'Filter by cuisine.', example: 'Italian' },
            {
                name: 'difficulty',
                type: 'enum',
                field: 'difficulty',
                operator: 'eq',
                values: RECIPE_DIFFICULTIES,
                description: 'Filter by difficulty.',
                example: 'Easy',
            },
            {
                name: 'mealType',
                type: 'enum',
                field: 'mealType',
                operator: 'eq',
                values: MEAL_TYPES,
                description: 'Filter by meal type.',
                example: 'Dinner',
            },
            { name: 'tag', type: 'string', field: 'tags', operator: 'eq-ci', description: 'Only return recipes with this tag.', example: 'vegetarian' },
        ],
        relations: [],
        mutable: false,
        examples: { search: 'pasta' },
    },
    quotes: {
        key: 'quotes',
        singular: 'quote',
        label: 'Quotes',
        description: 'Original, fictional quotes with fictional authors. Read-only.',
        schema: QuoteSchema,
        fields: fieldsOf(QuoteSchema),
        sortable: ['id', 'author'],
        searchable: [],
        filters: [{ name: 'author', type: 'string', field: 'author', operator: 'eq-ci', description: 'Filter by author (case-insensitive exact match).', example: 'Mara Ellison' }],
        relations: [],
        mutable: false,
        examples: {},
    },
};

export const resourceList: ResourceConfig[] = RESOURCE_KEYS.map((key) => resources[key]);
