import { Router } from 'express';
import { getResult, updateResult } from '../db/results.js';

const router = Router();

/**
 * @openapi
 * /api/results/{id}:
 *   get:
 *     summary: Get a single result
 *     tags: [Results]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Result details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Result'
 *       404:
 *         description: Result not found
 *
 *   patch:
 *     summary: Update a result
 *     description: Update fields like verified status or notes for a result.
 *     tags: [Results]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               verified:
 *                 type: boolean
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated result
 *       400:
 *         description: No valid fields to update
 *       404:
 *         description: Result not found
 */
router.get('/:id', (req, res) => {
  try {
    const result = getResult(req.params.id);
    if (!result) return res.status(404).json({ error: 'Result not found' });
    res.json(result);
  } catch (err) {
    console.error('GET /api/results/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', (req, res) => {
  try {
    const existing = getResult(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Result not found' });

    const allowed = ['verified', 'notes'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const updated = updateResult(req.params.id, updates);
    res.json(updated);
  } catch (err) {
    console.error('PATCH /api/results/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
