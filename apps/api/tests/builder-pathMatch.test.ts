import { describe, expect, it } from 'vitest';
import { matchEndpointPath, rankEndpointMatch } from '../src/app/modules/builder/builder.pathMatch';

describe('builder path matching', () => {
    it('matches concrete and param segments', () => {
        expect(matchEndpointPath('/api/users', '/api/users')).toEqual({});
        expect(matchEndpointPath('/api/users/:id', '/api/users/12')).toEqual({ id: '12' });
        expect(matchEndpointPath('/api/users/:id', '/api/users')).toBeNull();
        expect(matchEndpointPath('/api/users', '/api/users/12')).toBeNull();
    });

    it('ranks concrete paths above param paths', () => {
        expect(rankEndpointMatch('/api/users/me')).toBeGreaterThan(rankEndpointMatch('/api/users/:id'));
    });
});
