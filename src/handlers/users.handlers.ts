import type { Request, Response } from 'express';
import { deleteUserById } from '../store/sqliteStore.js';

export function deleteUserHandler(req: Request, res: Response): void {
    const userIdParam = req.params.id;
    const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;

    if (!userId) {
        res.status(400).json({ error: 'user id is required' });
        return;
    }

    deleteUserById(userId);
    res.status(204).send();
}
