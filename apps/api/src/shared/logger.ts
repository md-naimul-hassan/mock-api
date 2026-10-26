import pino from 'pino';
import config from '../config';

const usePretty = !config.is_production && !config.is_test && process.stdout.isTTY;

export const logger = pino({
    level: config.log_level,
    base: { service: 'mockapis-api' },
    redact: {
        paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.headers["x-api-key"]',
            'req.headers["proxy-authorization"]',
            'res.headers["set-cookie"]',
            '*.password',
            '*.refreshToken',
            '*.accessToken',
        ],
        censor: '[redacted]',
    },
    ...(usePretty ? { transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } } } : {}),
});

export const errorLogger = logger;
