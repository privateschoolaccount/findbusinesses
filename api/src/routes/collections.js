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
 *     tags: [Collections]
 *     responses:
 *       200:
 *         description: Array of collections
 *   post:
 *     summary: Create a new collection
 *     tags: [Collections]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Created collection
 *
 * /api/collections/{id}:
 *   get:
 *     summary: Get a collection by ID
 *     tags: [Collections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Collection details
 *   patch:
 *     summary: Update a collection
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
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [saved, researching]
 *     responses:
 *       200:
 *         description: Updated collection
 *   delete:
 *     summary: Delete a collection
 *     tags: [Collections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Deleted
 *
 * /api/collections/{id}/businesses:
 *   get:
 *     summary: List businesses in a collection
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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated businesses
 *   post:
 *     summary: Add businesses to a collection
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
 *             type: object
 *             required: [resultIds]
 *             properties:
 *               resultIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Businesses added
 *
 * /api/collections/{id}/businesses/{resultId}:
 *   delete:
 *     summary: Remove a business from a collection
 *     tags: [Collections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: resultId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Removed
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
    for (const key of ['name', 'location', 'tags', 'status']) {
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
