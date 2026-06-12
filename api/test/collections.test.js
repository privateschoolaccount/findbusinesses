import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import os from 'os';
import path from 'path';
import fs from 'fs';
import http from 'http';

// Use a temp database so we don't touch the dev DB
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'collections-test-'));
const testDbPath = path.join(testDir, 'test.db');
process.env.DATABASE_PATH = testDbPath;

const {
  createCollection, getCollection, listCollections,
  updateCollection, deleteCollection,
  addBusinessesToCollection, removeBusinessFromCollection,
  listCollectionBusinesses,
} = await import('../src/db/collections.js');

const { getDb, closeDb } = await import('../src/db/index.js');

const app = (await import('../src/app.js')).default;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function createTestSearchAndResults() {
  const db = getDb();
  const searchId = 'test-search-coll';
  db.prepare(
    'INSERT OR IGNORE INTO searches (id, query, location) VALUES (?, ?, ?)',
  ).run(searchId, 'test-biz', 'test-city');

  const ids = [];
  for (let i = 0; i < 3; i++) {
    const rid = `test-result-coll-${Date.now()}-${i}`;
    const statuses = ['no_website', 'has_website', 'pending_verification'];
    db.prepare(
      `INSERT OR IGNORE INTO results
       (id, search_id, name, address, status, website_verified, website_confirmed)
       VALUES (?, ?, ?, ?, ?, 0, 0)`,
    ).run(rid, searchId, `Biz ${i}`, `Addr ${i}`, statuses[i]);
    ids.push(rid);
  }
  return ids;
}

let server;
let port;

function httpRequest(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: '127.0.0.1',
      port,
      path: urlPath,
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('collections', () => {
  after(() => {
    closeDb();
    try { fs.rmSync(testDir, { recursive: true, force: true }); } catch {}
  });

  describe('DAO', () => {
    let resultIds;
    let collId;

    before(() => {
      resultIds = createTestSearchAndResults();
    });

  it('createCollection returns the new collection with correct fields', () => {
    const c = createCollection({ name: 'Test SaaS', location: 'SF', tags: ['SaaS', 'Tech'] });
    assert.ok(c.id > 0);
    assert.equal(c.name, 'Test SaaS');
    assert.equal(c.location, 'SF');
    assert.deepEqual(c.tags, ['SaaS', 'Tech']);
    assert.equal(c.totalLeads, 0);
    assert.equal(c.noWebsite, 0);
    assert.equal(c.newLeads, 0);
    assert.ok(c.created_at);
    assert.ok(c.updated_at);
    collId = c.id;
  });

  it('getCollection returns the collection', () => {
    const c = getCollection(collId);
    assert.ok(c);
    assert.equal(c.id, collId);
    assert.equal(c.name, 'Test SaaS');
  });

  it('getCollection returns null for unknown id', () => {
    assert.equal(getCollection(99999), null);
  });

  it('listCollections returns all collections ordered by updated_at DESC', () => {
    const list = listCollections();
    assert.ok(list.length >= 1);
    assert.ok(list.some((c) => c.id === collId));
    // most recently updated first
    for (let i = 1; i < list.length; i++) {
      assert.ok(list[i - 1].updated_at >= list[i].updated_at);
    }
  });

  it('updateCollection updates fields and bumps updated_at', () => {
    const old = getCollection(collId);
    const u = updateCollection(collId, { name: 'Updated SaaS', tags: ['SaaS', 'Enterprise'] });
    assert.equal(u.name, 'Updated SaaS');
    assert.deepEqual(u.tags, ['SaaS', 'Enterprise']);
    assert.ok(u.updated_at >= old.updated_at);
  });

  it('addBusinessesToCollection associates results and updates counts', () => {
    addBusinessesToCollection(collId, resultIds);
    const c = getCollection(collId);
    assert.equal(c.totalLeads, 3);
    assert.equal(c.noWebsite, 1);  // only first one has status='no_website'
  });

  it('listCollectionBusinesses returns paginated results', () => {
    const page1 = listCollectionBusinesses(collId, { page: 1, limit: 2 });
    assert.equal(page1.total, 3);
    assert.equal(page1.rows.length, 2);
    assert.equal(page1.page, 1);
    assert.equal(page1.limit, 2);

    const page2 = listCollectionBusinesses(collId, { page: 2, limit: 2 });
    assert.equal(page2.rows.length, 1);
  });

  it('removeBusinessFromCollection removes association and updates counts', () => {
    removeBusinessFromCollection(collId, resultIds[0]);
    const list = listCollectionBusinesses(collId);
    assert.equal(list.total, 2);
    // resultIds[0] is 'no_website', so noWebsite should drop to 0
    const c = getCollection(collId);
    assert.equal(c.totalLeads, 2);
    assert.equal(c.noWebsite, 0);
  });

  it('deleteCollection removes the collection', () => {
    deleteCollection(collId);
    assert.equal(getCollection(collId), null);
  });

  it('deleteCollection cascade removes collection_businesses', () => {
    // Re-create and add businesses, then delete — check businesses gone
    const c = createCollection({ name: 'Cascade Test' });
    addBusinessesToCollection(c.id, resultIds);
    assert.equal(listCollectionBusinesses(c.id).total, 3);
    deleteCollection(c.id);
    assert.equal(listCollectionBusinesses(c.id).total, 0);
  });
  });

  describe('HTTP API', () => {
    let collId;
    let resultIds;

    before(async () => {
      resultIds = createTestSearchAndResults();

      await new Promise((resolve, reject) => {
        server = http.createServer(app);
        server.listen(0, '127.0.0.1', () => {
          port = server.address().port;
          resolve();
        });
        server.on('error', reject);
      });
    });

    after(() => {
      if (server) server.close();
    });

  it('POST /api/collections — creates a collection', async () => {
    const res = await httpRequest('POST', '/api/collections', {
      name: 'HTTP Coll',
      location: 'NYC',
      tags: ['FinTech'],
    });
    assert.equal(res.status, 201);
    assert.ok(res.body.id > 0);
    assert.equal(res.body.name, 'HTTP Coll');
    assert.equal(res.body.location, 'NYC');
    assert.deepEqual(res.body.tags, ['FinTech']);
    collId = res.body.id;
  });

  it('POST /api/collections — 400 on missing name', async () => {
    const res = await httpRequest('POST', '/api/collections', { location: 'X' });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it('GET /api/collections — returns array', async () => {
    const res = await httpRequest('GET', '/api/collections');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length >= 1);
  });

  it('GET /api/collections/:id — returns single collection', async () => {
    const res = await httpRequest('GET', `/api/collections/${collId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.id, collId);
    assert.equal(res.body.name, 'HTTP Coll');
  });

  it('GET /api/collections/:id — 404 for unknown id', async () => {
    const res = await httpRequest('GET', '/api/collections/99999');
    assert.equal(res.status, 404);
  });

  it('PATCH /api/collections/:id — updates collection', async () => {
    const res = await httpRequest('PATCH', `/api/collections/${collId}`, {
      name: 'Updated HTTP Coll',
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.name, 'Updated HTTP Coll');
  });

  it('DELETE /api/collections/:id — deletes collection', async () => {
    const res = await httpRequest('DELETE', `/api/collections/${collId}`);
    assert.equal(res.status, 204);

    const check = await httpRequest('GET', `/api/collections/${collId}`);
    assert.equal(check.status, 404);
  });

  it('POST /api/collections/:id/businesses — adds businesses', async () => {
    // Create a fresh collection
    const create = await httpRequest('POST', '/api/collections', { name: 'Biz Coll' });
    const id = create.body.id;

    const res = await httpRequest('POST', `/api/collections/${id}/businesses`, { resultIds });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    // Verify count
    const get = await httpRequest('GET', `/api/collections/${id}`);
    assert.equal(get.body.totalLeads, resultIds.length);
  });

  it('GET /api/collections/:id/businesses — paginated results', async () => {
    const create = await httpRequest('POST', '/api/collections', { name: 'Paginated Coll' });
    const id = create.body.id;
    await httpRequest('POST', `/api/collections/${id}/businesses`, { resultIds });

    const res = await httpRequest('GET', `/api/collections/${id}/businesses?page=1&limit=2`);
    assert.equal(res.status, 200);
    assert.equal(res.body.total, resultIds.length);
    assert.equal(res.body.rows.length, 2);
    assert.equal(res.body.page, 1);
    assert.equal(res.body.limit, 2);
  });

  it('DELETE /api/collections/:id/businesses/:resultId — removes business', async () => {
    const create = await httpRequest('POST', '/api/collections', { name: 'Remove Coll' });
    const id = create.body.id;
    await httpRequest('POST', `/api/collections/${id}/businesses`, { resultIds });

    const del = await httpRequest('DELETE', `/api/collections/${id}/businesses/${resultIds[0]}`);
    assert.equal(del.status, 204);

    const list = await httpRequest('GET', `/api/collections/${id}/businesses`);
    assert.equal(list.body.total, resultIds.length - 1);
  });
  });
});
