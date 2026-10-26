import { resources, type ResourceKey } from '@mockapis/api-spec';
import { buildDetailQuerySchema, buildListQuerySchema, delayOnlyQuerySchema, idParamsSchema } from './listQuery';

/** Request schemas shared by every resource module (list, search, detail, relations, CRUD). */
export function createResourceValidation(key: ResourceKey) {
    const resource = resources[key];
    const params = idParamsSchema(resource.singular);

    return {
        list: { query: buildListQuerySchema(resource) },
        search: { query: buildListQuerySchema(resource, { filters: false, search: true }) },
        detail: { params, query: buildDetailQuerySchema(resource) },
        relation: (target: ResourceKey) => ({ params, query: buildListQuerySchema(resources[target], { filters: false }) }),
        create: { query: delayOnlyQuerySchema, body: resource.bodies?.create },
        replace: { params, query: delayOnlyQuerySchema, body: resource.bodies?.replace },
        patch: { params, query: delayOnlyQuerySchema, body: resource.bodies?.patch },
        remove: { params, query: delayOnlyQuerySchema },
    };
}
