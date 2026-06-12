import { getDb } from './index.js';

export function createCollection({ name, location, tags }) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO collections (name, location, tags)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(name, location || null, tags ? JSON.stringify(tags) : null);
  return getCollection(result.lastInsertRowid);
}

export function getCollection(id) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM collections WHERE id = ?').get(id);
  if (!row) return null;
  return enrichCollection(row);
}

export function listCollections() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM collections ORDER BY updated_at DESC').all();
  return rows.map(enrichCollection);
}

export function updateCollection(id, fields) {
  const db = getDb();
  const setClauses = [];
  const params = [];

  if (fields.tags && Array.isArray(fields.tags)) {
    fields.tags = JSON.stringify(fields.tags);
  }

  for (const [key, value] of Object.entries(fields)) {
    setClauses.push(`${key} = ?`);
    params.push(value);
  }

  setClauses.push('updated_at = datetime(\'now\')');

  if (setClauses.length === 0) return getCollection(id);

  params.push(id);
  db.prepare(`UPDATE collections SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);
  return getCollection(id);
}

export function deleteCollection(id) {
  const db = getDb();
  db.prepare('DELETE FROM collections WHERE id = ?').run(id);
}

function enrichCollection(row) {
  const db = getDb();
  const agg = db.prepare(`
    SELECT
      COUNT(*) AS totalLeads,
      SUM(CASE WHEN r.status = 'no_website' THEN 1 ELSE 0 END) AS noWebsite,
      SUM(CASE WHEN cb.added_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) AS newLeads
    FROM collection_businesses cb
    JOIN results r ON r.id = cb.result_id
    WHERE cb.collection_id = ?
  `).get(row.id);

  return {
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : null,
    totalLeads: agg.totalLeads || 0,
    noWebsite: agg.noWebsite || 0,
    newLeads: agg.newLeads || 0,
  };
}

export function addBusinessesToCollection(collectionId, resultIds) {
  const db = getDb();
  const stmt = db.prepare('INSERT OR IGNORE INTO collection_businesses (collection_id, result_id) VALUES (?, ?)');
  const insertMany = db.transaction((ids) => {
    for (const resultId of ids) {
      stmt.run(collectionId, resultId);
    }
  });
  insertMany(resultIds);
  db.prepare('UPDATE collections SET updated_at = datetime(\'now\') WHERE id = ?').run(collectionId);
}

export function removeBusinessFromCollection(collectionId, resultId) {
  const db = getDb();
  db.prepare('DELETE FROM collection_businesses WHERE collection_id = ? AND result_id = ?').run(collectionId, resultId);
  db.prepare('UPDATE collections SET updated_at = datetime(\'now\') WHERE id = ?').run(collectionId);
}

export function listCollectionBusinesses(collectionId, { page = 1, limit = 20 } = {}) {
  const db = getDb();
  const offset = (page - 1) * limit;

  const total = db.prepare('SELECT COUNT(*) AS count FROM collection_businesses WHERE collection_id = ?').get(collectionId).count;
  const rows = db.prepare(`
    SELECT r.*, cb.added_at AS added_at
    FROM collection_businesses cb
    JOIN results r ON r.id = cb.result_id
    WHERE cb.collection_id = ?
    ORDER BY cb.added_at DESC
    LIMIT ? OFFSET ?
  `).all(collectionId, limit, offset);

  return { rows, total, page, limit };
}
