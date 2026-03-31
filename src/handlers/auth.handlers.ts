import type { Request, Response } from 'express';
import { createUser } from '../store/sqliteStore.js';
import type { LoginResponse } from '../types.js';

export function loginHandler(req: Request, res: Response): void {
    const { username, role } = req.body;
    const user = createUser(username, role);

    const response: LoginResponse = {
        userId: user.userId,
        role: user.role,
    };

    res.status(200).json(response);
}
