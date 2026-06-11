import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { createSearch, getSearch, listSearches, updateSearch } from '../db/searches.js';
import { listResults } from '../db/results.js';
import { runSearch } from '../services/searchEngine.js';

const router = Router();

function paginate(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  return { page, limit };
}

/**
 * @openapi
 * /api/searches:
 *   post:
 *     summary: Create a new business search
 *     description: Searches Google Maps for businesses matching the query at the given location, then verifies which have no website via Google Search.
 *     tags: [Searches]
 *     parameters:
 *       - in: query
 *         name: wait
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: If "true", blocks until search completes and returns results. Defaults to async (returns 202).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query, location]
 *             properties:
 *               query:
 *                 type: string
 *                 example: "pizza"
 *               location:
 *                 type: string
 *                 example: "New York, NY"
 *               radius:
 *                 type: integer
 *                 default: 5000
 *                 description: Search radius in meters
 *                 example: 5000
 *               type:
 *                 type: string
 *                 description: Business category filter
 *     responses:
 *       202:
 *         description: Search accepted (async mode)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 status:
 *                   type: string
 *                 query:
 *                   type: string
 *                 location:
 *                   type: string
 *       200:
 *         description: Search results (sync mode with ?wait=true)
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *
 *   get:
 *     summary: List all searches
 *     description: Returns paginated list of searches, optionally filtered by status.
 *     tags: [Searches]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Max 100
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed]
 *     responses:
 *       200:
 *         description: Paginated list of searches
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rows:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Search'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *
 * /api/searches/{id}:
 *   get:
 *     summary: Get search details
 *     tags: [Searches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Search details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Search'
 *       404:
 *         description: Search not found
 *
 * /api/searches/{id}/results:
 *   get:
 *     summary: Get search results
 *     description: Paginated list of results for a specific search, optionally filtered by status.
 *     tags: [Searches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Max 100
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [has_website, no_website, pending_verification]
 *     responses:
 *       200:
 *         description: Paginated results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rows:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Result'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       404:
 *         description: Search not found
 */
router.post('/', async (req, res) => {
  try {
    const { query, location, radius, type } = req.body;

    if (!query || !location) {
      return res.status(400).json({ error: 'query and location are required' });
    }

    const wait = req.query.wait === 'true';

    if (wait) {
      const search = await runSearch({ query, location, radius, type });
      const results = listResults(search.id, { page: 1, limit: 100 });
      return res.json({ ...search, results });
    }

    const id = uuid();
    createSearch({ id, query, location, radius, type });
    updateSearch(id, { status: 'processing' });

    runSearch({ query, location, radius, type }).catch(() => {});

    res.status(202).json({ id, status: 'processing', query, location });
  } catch (err) {
    console.error('POST /api/searches error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/', (req, res) => {
  try {
    const { page, limit } = paginate(req.query);
    const result = listSearches({ page, limit, status: req.query.status || undefined });
    res.json(result);
  } catch (err) {
    console.error('GET /api/searches error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const search = getSearch(req.params.id);
    if (!search) return res.status(404).json({ error: 'Search not found' });
    res.json(search);
  } catch (err) {
    console.error('GET /api/searches/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/results', (req, res) => {
  try {
    const search = getSearch(req.params.id);
    if (!search) return res.status(404).json({ error: 'Search not found' });

    const { page, limit } = paginate(req.query);
    const result = listResults(req.params.id, { page, limit, status: req.query.status || undefined });
    res.json(result);
  } catch (err) {
    console.error('GET /api/searches/:id/results error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
