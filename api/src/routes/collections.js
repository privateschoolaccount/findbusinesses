import { Router } from 'express';
import {
  createCollection,
  getCollection,
  listCollections,
  updateCollection,
  deleteCollection,
  addBusinessesToCollection,
  removeBusinessFromCollection,
  listCollectionBusinesses,
} from '../db/collections.js';

const router = Router();

/**
 * @openapi
 * /api/collections:
 *   get:
 *     summary: List all collections
 *     description: Returns all collections with aggregated lead counts (totalLeads, noWebsite, newLeads). Ordered by most recently updated first.
 *     tags: [Collections]
 *     responses:
 *       200:
 *         description: Array of collections
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Collection'
 *   post:
 *     summary: Create a new collection
 *     description: Create a named collection with optional target location and business category tags.
 *     tags: [Collections]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CollectionCreate'
 *     responses:
 *       201:
 *         description: Created collection
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Collection'
 *       400:
 *         description: name is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *
 * /api/collections/{id}:
 *   get:
 *     summary: Get a collection by ID
 *     description: Returns a single collection with aggregated lead counts.
 *     tags: [Collections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Collection auto-increment ID
 *     responses:
 *       200:
 *         description: Collection details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Collection'
 *       404:
 *         description: Collection not found
 *   patch:
 *     summary: Update a collection
 *     description: Update name, location, or tags of a collection.
 *     tags: [Collections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CollectionUpdate'
 *     responses:
 *       200:
 *         description: Updated collection
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Collection'
 *       404:
 *         description: Collection not found
 *   delete:
 *     summary: Delete a collection
 *     description: Permanently deletes a collection and its business associations (CASCADE).
 *     tags: [Collections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Deleted successfully (no content)
 *       404:
 *         description: Collection not found
 *
 * /api/collections/{id}/businesses:
 *   get:
 *     summary: List businesses in a collection
 *     description: Paginated list of result objects associated with this collection, ordered by most recently added.
 *     tags: [Collections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (1-based)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Results per page (max 100)
 *     responses:
 *       200:
 *         description: Paginated list of results
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
 *         description: Collection not found
 *   post:
 *     summary: Add businesses to a collection
 *     description: Associate one or more result IDs with this collection. Duplicates are silently ignored.
 *     tags: [Collections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddBusinessesRequest'
 *     responses:
 *       200:
 *         description: Businesses added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       400:
 *         description: resultIds array is required or empty
 *       404:
 *         description: Collection not found
 *
 * /api/collections/{id}/businesses/{resultId}:
 *   delete:
 *     summary: Remove a business from a collection
 *     description: Remove a single result association from the collection. Does not delete the result itself.
 *     tags: [Collections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Collection ID
 *       - in: path
 *         name: resultId
 *         required: true
 *         schema:
 *           type: string
 *         description: Result UUID to remove
 *     responses:
 *       204:
 *         description: Removed successfully (no content)
 *       404:
 *         description: Collection not found
 */

router.get('/', (req, res) => {
  try {
    const collections = listCollections();
    res.json(collections);
  } catch (err) {
    console.error('GET /api/collections error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, location, tags } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    const collection = createCollection({ name: name.trim(), location: location || null, tags: tags || null });
    res.status(201).json(collection);
  } catch (err) {
    console.error('POST /api/collections error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const collection = getCollection(parseInt(req.params.id));
    if (!collection) return res.status(404).json({ error: 'Collection not found' });
    res.json(collection);
  } catch (err) {
    console.error('GET /api/collections/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', (req, res) => {
  try {
    const fields = {};
    for (const key of ['name', 'location', 'tags']) {
      if (req.body[key] !== undefined) fields[key] = req.body[key];
    }
    const collection = updateCollection(parseInt(req.params.id), fields);
    if (!collection) return res.status(404).json({ error: 'Collection not found' });
    res.json(collection);
  } catch (err) {
    console.error('PATCH /api/collections/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const collection = getCollection(parseInt(req.params.id));
    if (!collection) return res.status(404).json({ error: 'Collection not found' });
    deleteCollection(parseInt(req.params.id));
    res.status(204).end();
  } catch (err) {
    console.error('DELETE /api/collections/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/businesses', (req, res) => {
  try {
    const collection = getCollection(parseInt(req.params.id));
    if (!collection) return res.status(404).json({ error: 'Collection not found' });

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const result = listCollectionBusinesses(parseInt(req.params.id), { page, limit });
    res.json(result);
  } catch (err) {
    console.error('GET /api/collections/:id/businesses error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/businesses', (req, res) => {
  try {
    const collection = getCollection(parseInt(req.params.id));
    if (!collection) return res.status(404).json({ error: 'Collection not found' });

    const { resultIds } = req.body;
    if (!resultIds || !Array.isArray(resultIds) || resultIds.length === 0) {
      return res.status(400).json({ error: 'resultIds array is required' });
    }

    addBusinessesToCollection(parseInt(req.params.id), resultIds);
    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/collections/:id/businesses error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id/businesses/:resultId', (req, res) => {
  try {
    const collection = getCollection(parseInt(req.params.id));
    if (!collection) return res.status(404).json({ error: 'Collection not found' });

    removeBusinessFromCollection(parseInt(req.params.id), req.params.resultId);
    res.status(204).end();
  } catch (err) {
    console.error('DELETE /api/collections/:id/businesses/:resultId error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
