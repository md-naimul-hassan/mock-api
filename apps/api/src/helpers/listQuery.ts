import { z } from 'zod';
import { MAX_DELAY_MS, PAGINATION, type FilterConfig, type ResourceConfig } from '@mockapis/api-spec';
import config from '../config';

const single = (name: string) =>
    z.string({
        error: (issue) => (issue.input === undefined ? `${name} is required` : `${name} must be provided once (repeated parameters are not supported)`),
    });

export const intParam = (name: string, min: number, max: number) =>
    single(name)
        .regex(/^-?\d+$/, `${name} must be an integer`)
        .transform(Number)
        .pipe(z.number().min(min, `${name} must be at least ${min}`).max(max, `${name} must be at most ${max}`));

const numberParam = (name: string) =>
    single(name)
        .regex(/^-?\d+(\.\d+)?$/, `${name} must be a number`)
        .transform(Number);

const booleanParam = (name: string) =>
    z.enum(['true', 'false'], { error: `${name} must be "true" or "false"` }).transform((value) => value === 'true');

export const delayParam = intParam('delay', 0, MAX_DELAY_MS);

const filterSchema = (filter: FilterConfig): z.ZodType => {
    switch (filter.type) {
        case 'integer':
            return intParam(filter.name, 1, 1_000_000_000);
        case 'number':
            return numberParam(filter.name);
        case 'boolean':
            return booleanParam(filter.name);
        case 'enum':
            return z.enum(filter.values as [string, ...string[]], { error: `${filter.name} must be one of: ${filter.values?.join(', ')}` });
        default:
            return single(filter.name).trim().min(1, `${filter.name} must not be empty`).max(100, `${filter.name} is too long`);
    }
};

export const selectParam = (resource: ResourceConfig) =>
    single('select')
        .max(500, 'select is too long')
        .transform((value, ctx) => {
            const fields = [...new Set(value.split(',').map((field) => field.trim()).filter(Boolean))];
            if (fields.length === 0) {
                ctx.addIssue({ code: 'custom', message: 'select must list at least one field' });
                return z.NEVER;
            }
            const unknown = fields.filter((field) => !resource.fields.includes(field));
            if (unknown.length > 0) {
                ctx.addIssue({ code: 'custom', message: `Unknown field(s) in select: ${unknown.join(', ')}. Allowed: ${resource.fields.join(', ')}` });
                return z.NEVER;
            }
            return fields;
        });

export type ListQuery = {
    limit: number;
    skip: number;
    select?: string[];
    sortBy: string;
    order: 'asc' | 'desc';
    delay?: number;
    q?: string;
    [filter: string]: unknown;
};

type ListQueryOptions = { filters?: boolean; search?: boolean };

/** Builds a strict query schema: unknown parameters are rejected with 400 INVALID_PARAMETER. */
export function buildListQuerySchema(resource: ResourceConfig, options: ListQueryOptions = {}) {
    const { filters = true, search = false } = options;
    const shape: Record<string, z.ZodType> = {
        limit: intParam('limit', 1, config.pagination.max_limit).default(config.pagination.default_limit),
        skip: intParam('skip', 0, PAGINATION.maxSkip).default(0),
        select: selectParam(resource).optional(),
        sortBy: z.enum(resource.sortable as [string, ...string[]], { error: `sortBy must be one of: ${resource.sortable.join(', ')}` }).default('id'),
        order: z.enum(['asc', 'desc'], { error: 'order must be "asc" or "desc"' }).default('asc'),
        delay: delayParam.optional(),
    };
    if (search) {
        shape.q = z
            .string({ error: (issue) => (issue.input === undefined ? 'q is required' : 'q must be provided once') })
            .trim()
            .min(1, 'q must not be empty')
            .max(100, 'q must be at most 100 characters');
    }
    if (filters) {
        for (const filter of resource.filters) shape[filter.name] = filterSchema(filter).optional();
    }
    return z.strictObject(shape) as unknown as z.ZodType<ListQuery>;
}

export function buildDetailQuerySchema(resource: ResourceConfig) {
    return z.strictObject({
        select: selectParam(resource).optional(),
        delay: delayParam.optional(),
    });
}

export const delayOnlyQuerySchema = z.strictObject({ delay: delayParam.optional() });

export const idParamsSchema = (singular: string) =>
    z.object({
        id: z
            .string()
            .regex(/^[1-9]\d{0,9}$/, `Invalid ${singular} id. IDs are positive integers, e.g. /1`)
            .transform(Number),
    });
