import express from 'express';
import cors from 'cors';
import { projectsRouter } from './modules/projects/projects.routes';
import { errorMiddleware } from './middleware/error.middleware';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/v1/projects', projectsRouter);

app.use(errorMiddleware);

export default app;
