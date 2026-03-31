import { Router } from 'express';
import { deleteUserHandler } from '../handlers/users.handlers.js';

export const usersRouter = Router();

usersRouter.delete('/users/:id', deleteUserHandler);
