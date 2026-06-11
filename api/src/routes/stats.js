import { Router } from 'express';
import { getStats } from '../db/results.js';

const router = Router();

/**
 * @openapi
 * /api/stats:
 *   get:
 *     summary: Get aggregate statistics
 *     description: Overall stats across all searches and results.
 *     tags: [Stats]
 *     responses:
 *       200:
 *         description: Statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_searches:
 *                   type: integer
 *                 completed_searches:
 *                   type: integer
 *                 total_results:
 *                   type: integer
 *                 without_website:
 *                   type: integer
 *                 with_website:
 *                   type: integer
 *                 pending_verification:
 *                   type: integer
 *                 verified_count:
 *                   type: integer
 */
router.get('/', (req, res) => {
  try {
    const stats = getStats();
    res.json(stats);
  } catch (err) {
    console.error('GET /api/stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
