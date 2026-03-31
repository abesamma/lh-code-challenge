import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodSchema } from 'zod';

export function validateBody<T>(schema: ZodSchema<T>) {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({ error: 'Invalid request body', details: error.flatten() });
                return;
            }

            next(error);
        }
    };
}

export function parseQuery<T>(schema: ZodSchema<T>, query: Request['query']): T {
    const raw = {
        from: typeof query.from === 'string' ? query.from : undefined,
        to: typeof query.to === 'string' ? query.to : undefined,
    };

    return schema.parse(raw);
}
