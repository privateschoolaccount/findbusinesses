import { Router } from 'express';
import searchesRouter from './searches.js';
import resultsRouter from './results.js';
import statsRouter from './stats.js';
import collectionsRouter from './collections.js';

const router = Router();

router.use('/searches', searchesRouter);
router.use('/results', resultsRouter);
router.use('/stats', statsRouter);
router.use('/collections', collectionsRouter);

export default router;
