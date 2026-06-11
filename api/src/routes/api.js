import { Router } from 'express';
import searchesRouter from './searches.js';
import resultsRouter from './results.js';
import statsRouter from './stats.js';

const router = Router();

router.use('/searches', searchesRouter);
router.use('/results', resultsRouter);
router.use('/stats', statsRouter);

export default router;
