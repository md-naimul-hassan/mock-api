import { resources, type ResourceKey } from '@mockapis/api-spec';
import { resourceModels } from '../DB/models';
import ApiError from '../errors/ApiErrors';
import { type IErrorMessage } from '../types/errors.types';
import type { ListQuery } from './listQuery';
import QueryBuilder, { publicProjection } from './QueryBuilder';

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/** Generic read operations shared by every resource module. */
export function createResourceService(key: ResourceKey) {
    const resource = resources[key];
    const model = resourceModels[key];

    const list = async (query: ListQuery, baseFilter: Record<string, unknown> = {}) => {
        const { items, total, skip, limit } = await new QueryBuilder(model, resource, query, baseFilter).search().applyFilters().execute();
        return { [key]: items, total, skip, limit };
    };

    const getById = async (id: number, select?: string[]) => {
        const record = await model.findOne({ id }, publicProjection(select)).lean();
        if (!record) throw ApiError.notFound(`${capitalize(resource.singular)} with id ${id} not found`);
        return record as Record<string, unknown>;
    };

    const exists = async (id: number) => (await model.exists({ id })) !== null;

    const assertExists = async (id: number) => {
        if (!(await exists(id))) throw ApiError.notFound(`${capitalize(resource.singular)} with id ${id} not found`);
    };

    const nextId = async () => {
        const last = await model.findOne({}, { id: 1, _id: 0 }).sort({ id: -1 }).lean<{ id: number }>();
        return (last?.id ?? 0) + 1;
    };

    return { resource, model, list, getById, exists, assertExists, nextId };
}

export type ResourceService = ReturnType<typeof createResourceService>;

/** Ensures foreign keys in a simulated mutation point at seeded records (422 otherwise). */
export async function assertReferences(body: Record<string, unknown>, references: { field: string; resource: ResourceKey }[]) {
    const errors: IErrorMessage[] = [];
    for (const { field, resource } of references) {
        const value = body[field];
        if (typeof value !== 'number') continue;
        const found = (await resourceModels[resource].exists({ id: value })) !== null;
        if (!found) errors.push({ path: field, message: `No ${resources[resource].singular} exists with id ${value}` });
    }
    if (errors.length > 0) throw ApiError.validation('Request body references records that do not exist', errors);
}
