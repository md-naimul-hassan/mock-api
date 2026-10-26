import type { DemoTokenPayload } from '../helpers/jwtHelper';

declare global {
    namespace Express {
        interface Request {
            requestId: string;
            /** Parsed and validated request parts (Express 5 `req.query` is read-only). */
            validated: {
                params?: unknown;
                query?: unknown;
                body?: unknown;
            };
            demoUser?: DemoTokenPayload;
        }
    }
}

export {};
