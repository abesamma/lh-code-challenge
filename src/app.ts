import express from 'express';
import { roleContext } from './middleware/auth.js';
import { appointmentsRouter } from './routes/appointments.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { usersRouter } from './routes/users.routes.js';

export const app = express();

app.use(express.json());
app.use(roleContext);

const apiRouter = express.Router();
apiRouter.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});
apiRouter.use(authRouter);
apiRouter.use(usersRouter);
apiRouter.use(appointmentsRouter);

app.use('/api', apiRouter);
app.use(apiRouter);

app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
});
