import express from 'express';
import cors from 'cors';
import apiRouter from './routes/api.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', apiRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
