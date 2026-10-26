import type { Model } from 'mongoose';
import type { ResourceConfig } from '@mockapis/api-spec';
import { escapeRegex } from '../util/text';
import type { ListQuery } from './listQuery';

type Filter = Record<string, unknown>;

export const publicProjection = (select?: string[]): Record<string, 0 | 1> =>
    select ? Object.fromEntries([['_id', 0], ['id', 1], ...select.map((field) => [field, 1])]) : { _id: 0 };

/** Translates validated list-query parameters into a MongoDB query for one resource. */
class QueryBuilder {
    private filter: Filter;

    constructor(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        private readonly model: Model<any>,
        private readonly resource: ResourceConfig,
        private readonly query: ListQuery,
        baseFilter: Filter = {},
    ) {
        this.filter = { ...baseFilter };
    }

    search() {
        if (this.query.q && this.resource.searchable.length > 0) {
            const pattern = new RegExp(escapeRegex(this.query.q), 'i');
            this.filter.$or = this.resource.searchable.map((field) => ({ [field]: pattern }));
        }
        return this;
    }

    applyFilters() {
        for (const filter of this.resource.filters) {
            const value = this.query[filter.name];
            if (value === undefined) continue;
            const existing = (this.filter[filter.field] as Filter | undefined) ?? {};
            switch (filter.operator) {
                case 'eq':
                    this.filter[filter.field] = value;
                    break;
                case 'eq-ci':
                    this.filter[filter.field] = new RegExp(`^${escapeRegex(String(value))}$`, 'i');
                    break;
                case 'gte':
                    this.filter[filter.field] = { ...existing, $gte: value };
                    break;
                case 'lte':
                    this.filter[filter.field] = { ...existing, $lte: value };
                    break;
            }
        }
        return this;
    }

    async execute() {
        const { sortBy, order, skip, limit, select } = this.query;
        const direction = order === 'desc' ? -1 : 1;
        const sort: Record<string, 1 | -1> = sortBy === 'id' ? { id: direction } : { [sortBy]: direction, id: 1 };

        const [items, total] = await Promise.all([
            this.model.find(this.filter, publicProjection(select)).sort(sort).skip(skip).limit(limit).lean(),
            this.model.countDocuments(this.filter),
        ]);
        return { items, total, skip, limit };
    }
}

export default QueryBuilder;
