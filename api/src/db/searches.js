import { getDb } from './index.js';

export function createSearch({ id, query, location, radius = 5000, type }) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO searches (id, query, location, radius, type, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `);
  stmt.run(id, query, location, radius, type || null);
  return getSearch(id);
}

export function getSearch(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM searches WHERE id = ?').get(id) || null;
}

export function listSearches({ page = 1, limit = 20, status } = {}) {
  const db = getDb();
  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const total = db.prepare(`SELECT COUNT(*) as count FROM searches ${where}`).get(...params).count;
  const rows = db.prepare(`SELECT * FROM searches ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);

  return { rows, total, page, limit };
}

export function updateSearch(id, fields) {
  const db = getDb();
  const setClauses = [];
  const params = [];

  for (const [key, value] of Object.entries(fields)) {
    setClauses.push(`${key} = ?`);
    params.push(value);
  }

  if (setClauses.length === 0) return getSearch(id);

  params.push(id);
  db.prepare(`UPDATE searches SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);
  return getSearch(id);
}
