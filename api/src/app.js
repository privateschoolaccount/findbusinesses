import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import apiRouter from './routes/api.js';
import { swaggerSpec } from './swagger.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/openapi.json', (req, res) => {
  const spec = {
    ...swaggerSpec,
    servers: [{ url: `${req.protocol}://${req.get('host')}`, description: 'Current server' }],
  };
  res.json(spec);
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(null, {
  swaggerUrl: '/api/openapi.json',
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Find Businesses API Docs',
}));

app.use('/api', apiRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
