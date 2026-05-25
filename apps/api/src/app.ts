import express from 'express';
import cors from 'cors';
import path from 'path';
import { projectsRouter } from './modules/projects/projects.routes';
import { errorMiddleware } from './middleware/error.middleware';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// API routes
app.use('/api/v1/projects', projectsRouter);

// Serve React static build — active whenever the dist folder exists
const staticPath = path.join(__dirname, '../../web/dist');
import fs from 'fs';
if (fs.existsSync(staticPath)) {
  app.use(express.static(staticPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

app.use(errorMiddleware);

export default app;
