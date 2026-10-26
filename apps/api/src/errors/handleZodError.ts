import { type ZodError } from 'zod';
import { type IErrorMessage } from '../types/errors.types';

export const zodIssuesToMessages = (error: ZodError, prefix?: string): IErrorMessage[] =>
    error.issues.map((issue) => {
        const segments = issue.path.map(String);
        if (issue.code === 'unrecognized_keys') {
            return {
                path: [prefix, ...segments, issue.keys.join(',')].filter(Boolean).join('.'),
                message: `Unknown field(s): ${issue.keys.join(', ')}`,
            };
        }
        return {
            path: [prefix, ...segments].filter(Boolean).join('.'),
            message: issue.message,
        };
    });
