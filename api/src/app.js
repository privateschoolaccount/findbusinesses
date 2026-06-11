import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import apiRouter from './routes/api.js';
import { swaggerSpec } from './swagger.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/openapi.json', (_req, res) => {
  res.json(swaggerSpec);
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Find Businesses API Docs',
}));

app.use('/api', apiRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
