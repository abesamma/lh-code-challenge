import type { NextFunction, Request, Response } from 'express';
import type { Role } from '../types.js';

const ROLE_HEADER = 'x-role';

export function roleContext(req: Request, res: Response, next: NextFunction): void {
    const roleHeaderValue = req.headers[ROLE_HEADER];
    const role = Array.isArray(roleHeaderValue) ? roleHeaderValue[0] : roleHeaderValue;

    if (role === 'admin' || role === 'clinician' || role === 'patient') {
        res.locals.role = role;
    }

    next();
}

export function requireRole(...roles: Role[]) {
    return (_req: Request, res: Response, next: NextFunction): void => {
        const role = res.locals.role as Role | undefined;

        if (!role || !roles.includes(role)) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        next();
    };
}
