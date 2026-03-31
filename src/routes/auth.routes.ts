import { Router } from 'express';
import { loginHandler } from '../handlers/auth.handlers.js';
import { validateBody } from '../middleware/validate.js';
import { loginSchema } from '../validation/schemas.js';

export const authRouter = Router();

authRouter.post('/login', validateBody(loginSchema), loginHandler);
