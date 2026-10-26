import { z } from 'zod';

const requiredMessage = (field: string, type: string) => (issue: { input?: unknown }) =>
    issue.input === undefined ? `${field} is required` : `${field} must be ${type}`;

const text = (field: string, max: number) =>
    z
        .string({ error: requiredMessage(field, 'a string') })
        .trim()
        .min(1, `${field} must not be empty`)
        .max(max, `${field} must be at most ${max} characters`);

const positiveId = (field: string) =>
    z
        .number({ error: requiredMessage(field, 'a number') })
        .int(`${field} must be an integer`)
        .positive(`${field} must be a positive integer`)
        .max(1_000_000_000, `${field} is too large`);

const atLeastOneField = (body: object) => Object.keys(body).length > 0;

const tags = z
    .array(z.string().trim().min(1).max(40), { error: 'tags must be an array of strings' })
    .max(10, 'tags can contain at most 10 items');

// ---------------------------------------------------------------------------
// Resource schemas (public response shapes)
// ---------------------------------------------------------------------------

export const GENDERS = ['female', 'male', 'non-binary'] as const;
export const USER_ROLES = ['admin', 'moderator', 'user'] as const;
export const AVAILABILITY_STATUSES = ['In Stock', 'Low Stock', 'Out of Stock'] as const;
export const RECIPE_DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;
export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'] as const;

export const AddressSchema = z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
});

export const CompanySchema = z.object({
    name: z.string(),
    department: z.string(),
    title: z.string(),
});

export const UserSchema = z.object({
    id: z.number().int(),
    firstName: z.string(),
    lastName: z.string(),
    username: z.string(),
    email: z.string(),
    phone: z.string(),
    age: z.number().int(),
    gender: z.enum(GENDERS),
    birthDate: z.string(),
    image: z.string(),
    role: z.enum(USER_ROLES),
    address: AddressSchema,
    company: CompanySchema,
});

export const ProductSchema = z.object({
    id: z.number().int(),
    title: z.string(),
    description: z.string(),
    category: z.string(),
    brand: z.string(),
    price: z.number(),
    discountPercentage: z.number(),
    rating: z.number(),
    stock: z.number().int(),
    sku: z.string(),
    tags: z.array(z.string()),
    availabilityStatus: z.enum(AVAILABILITY_STATUSES),
    thumbnail: z.string(),
});

export const PostSchema = z.object({
    id: z.number().int(),
    title: z.string(),
    body: z.string(),
    userId: z.number().int(),
    tags: z.array(z.string()),
    reactions: z.object({ likes: z.number().int(), dislikes: z.number().int() }),
    views: z.number().int(),
});

export const CommentSchema = z.object({
    id: z.number().int(),
    body: z.string(),
    postId: z.number().int(),
    userId: z.number().int(),
    likes: z.number().int(),
});

export const TodoSchema = z.object({
    id: z.number().int(),
    todo: z.string(),
    completed: z.boolean(),
    userId: z.number().int(),
});

export const CartProductSchema = z.object({
    id: z.number().int(),
    title: z.string(),
    price: z.number(),
    quantity: z.number().int(),
    total: z.number(),
    discountPercentage: z.number(),
    discountedTotal: z.number(),
    thumbnail: z.string(),
});

export const CartSchema = z.object({
    id: z.number().int(),
    userId: z.number().int(),
    products: z.array(CartProductSchema),
    total: z.number(),
    discountedTotal: z.number(),
    totalProducts: z.number().int(),
    totalQuantity: z.number().int(),
});

export const RecipeSchema = z.object({
    id: z.number().int(),
    name: z.string(),
    cuisine: z.string(),
    difficulty: z.enum(RECIPE_DIFFICULTIES),
    mealType: z.array(z.enum(MEAL_TYPES)),
    tags: z.array(z.string()),
    ingredients: z.array(z.string()),
    instructions: z.array(z.string()),
    prepTimeMinutes: z.number().int(),
    cookTimeMinutes: z.number().int(),
    servings: z.number().int(),
    caloriesPerServing: z.number().int(),
    rating: z.number(),
    reviewCount: z.number().int(),
    userId: z.number().int(),
    image: z.string(),
});

export const QuoteSchema = z.object({
    id: z.number().int(),
    quote: z.string(),
    author: z.string(),
});

export const ErrorSchema = z.object({
    message: z.string(),
    status: z.number().int(),
    code: z.string(),
    path: z.string(),
    requestId: z.string(),
    errors: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
});

export const AuthUserSchema = UserSchema.pick({
    id: true,
    username: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
}).extend({
    image: z.string().nullable(),
});

export const AuthTokensSchema = z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    tokenType: z.literal('Bearer'),
    expiresIn: z.number().int(),
    demo: z.literal(true),
    notice: z.string(),
});

export const AuthResponseSchema = AuthTokensSchema.extend({ user: AuthUserSchema });

// ---------------------------------------------------------------------------
// Request body schemas (used by the API for validation and by OpenAPI)
// ---------------------------------------------------------------------------

const userBodyBase = z.strictObject({
    name: text('name', 100).optional(),
    firstName: text('firstName', 50).optional(),
    lastName: text('lastName', 50).optional(),
    username: z
        .string({ error: requiredMessage('username', 'a string') })
        .regex(/^[a-zA-Z0-9._-]{3,30}$/, 'username must be 3-30 characters: letters, numbers, ".", "_" or "-"')
        .optional(),
    email: z.email({ error: (issue) => (issue.input === undefined ? 'email is required' : 'email must be a valid email address') }),
    age: z.number({ error: 'age must be a number' }).int('age must be an integer').min(1).max(120).optional(),
    gender: z.enum(GENDERS, { error: `gender must be one of: ${GENDERS.join(', ')}` }).optional(),
    phone: z.string({ error: 'phone must be a string' }).trim().min(3).max(30).optional(),
});

const requireNameOrFirstName = <T extends { name?: string; firstName?: string }>(body: T) =>
    Boolean(body.name || body.firstName);

export const CreateUserBody = userBodyBase.refine(requireNameOrFirstName, {
    message: 'Provide either name or firstName',
    path: ['name'],
});
export const ReplaceUserBody = CreateUserBody;
export const PatchUserBody = userBodyBase.partial().refine(atLeastOneField, { message: 'Provide at least one field to update', when: (payload) => payload.issues.length === 0 });

const productBodyBase = z.strictObject({
    title: text('title', 120),
    description: text('description', 1000).optional(),
    category: z
        .string({ error: 'category must be a string' })
        .regex(/^[a-z0-9-]{2,40}$/, 'category must be a lowercase slug such as "smartphones"')
        .optional(),
    brand: text('brand', 60).optional(),
    price: z
        .number({ error: requiredMessage('price', 'a number') })
        .nonnegative('price must be zero or greater')
        .max(1_000_000, 'price must be at most 1000000'),
    discountPercentage: z.number({ error: 'discountPercentage must be a number' }).min(0).max(100).optional(),
    stock: z.number({ error: 'stock must be a number' }).int('stock must be an integer').min(0).max(1_000_000).optional(),
    tags: tags.optional(),
});
export const CreateProductBody = productBodyBase;
export const ReplaceProductBody = productBodyBase;
export const PatchProductBody = productBodyBase.partial().refine(atLeastOneField, { message: 'Provide at least one field to update', when: (payload) => payload.issues.length === 0 });

const postBodyBase = z.strictObject({
    title: text('title', 200),
    body: text('body', 5000),
    userId: positiveId('userId'),
    tags: tags.optional(),
});
export const CreatePostBody = postBodyBase;
export const ReplacePostBody = postBodyBase;
export const PatchPostBody = postBodyBase.partial().refine(atLeastOneField, { message: 'Provide at least one field to update', when: (payload) => payload.issues.length === 0 });

const todoBodyBase = z.strictObject({
    todo: text('todo', 300),
    completed: z.boolean({ error: 'completed must be a boolean' }).optional(),
    userId: positiveId('userId'),
});
export const CreateTodoBody = todoBodyBase;
export const ReplaceTodoBody = todoBodyBase;
export const PatchTodoBody = todoBodyBase.partial().refine(atLeastOneField, { message: 'Provide at least one field to update', when: (payload) => payload.issues.length === 0 });

const commentBodyBase = z.strictObject({
    body: text('body', 2000),
    postId: positiveId('postId'),
    userId: positiveId('userId'),
});
export const CreateCommentBody = commentBodyBase;
export const ReplaceCommentBody = commentBodyBase;
export const PatchCommentBody = commentBodyBase.partial().refine(atLeastOneField, { message: 'Provide at least one field to update', when: (payload) => payload.issues.length === 0 });

const expiresInMins = z
    .number({ error: 'expiresInMins must be a number' })
    .int('expiresInMins must be an integer')
    .min(1, 'expiresInMins must be at least 1')
    .max(1440, 'expiresInMins must be at most 1440 (24 hours)')
    .optional();

export const LoginBody = z
    .strictObject({
        username: text('username', 100).optional(),
        email: z.email({ error: 'email must be a valid email address' }).optional(),
        password: z
            .string({ error: requiredMessage('password', 'a string') })
            .min(1, 'password is required')
            .max(128),
        expiresInMins,
    })
    .refine((body) => Boolean(body.username || body.email), {
        message: 'username or email is required',
        path: ['username'],
    });

export const RegisterBody = z.strictObject({
    firstName: text('firstName', 50),
    lastName: text('lastName', 50),
    username: z
        .string({ error: requiredMessage('username', 'a string') })
        .regex(/^[a-zA-Z0-9._-]{3,30}$/, 'username must be 3-30 characters: letters, numbers, ".", "_" or "-"'),
    email: z.email({ error: (issue) => (issue.input === undefined ? 'email is required' : 'email must be a valid email address') }),
    password: z
        .string({ error: requiredMessage('password', 'a string') })
        .min(8, 'password must be at least 8 characters')
        .max(72, 'password must be at most 72 characters'),
});

export const RefreshBody = z.strictObject({
    refreshToken: z.string({ error: requiredMessage('refreshToken', 'a string') }).min(1, 'refreshToken is required').max(4096),
    expiresInMins,
});

export type User = z.infer<typeof UserSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type Post = z.infer<typeof PostSchema>;
export type Comment = z.infer<typeof CommentSchema>;
export type Todo = z.infer<typeof TodoSchema>;
export type Cart = z.infer<typeof CartSchema>;
export type CartProduct = z.infer<typeof CartProductSchema>;
export type Recipe = z.infer<typeof RecipeSchema>;
export type Quote = z.infer<typeof QuoteSchema>;
export type ApiErrorBody = z.infer<typeof ErrorSchema>;
export type AuthUser = z.infer<typeof AuthUserSchema>;
