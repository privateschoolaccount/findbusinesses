import { getDb } from './index.js';

export function createResult({ id, searchId, name, address, phone, placeId, website, networkSite, status, verificationMethod, rating, totalRatings, categories, lat, lng }) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO results (id, search_id, name, address, phone, place_id, website, network_site, status, verification_method, rating, total_ratings, categories, lat, lng)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, searchId, name, address || null, phone || null, placeId || null, website || null, networkSite || null, status || 'pending_verification', verificationMethod || 'google_maps', rating ?? null, totalRatings ?? null, categories ? JSON.stringify(categories) : null, lat ?? null, lng ?? null);
  return getResult(id);
}

export function getResult(id) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM results WHERE id = ?').get(id);
  return row ? formatResult(row) : null;
}

export function listResults(searchId, { page = 1, limit = 20, status } = {}) {
  const db = getDb();
  const conditions = ['search_id = ?'];
  const params = [searchId];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  const where = conditions.join(' AND ');
  const offset = (page - 1) * limit;

  const total = db.prepare(`SELECT COUNT(*) as count FROM results WHERE ${where}`).get(...params).count;
  const rows = db.prepare(`SELECT * FROM results WHERE ${where} ORDER BY CASE status WHEN 'no_website' THEN 0 WHEN 'pending_verification' THEN 1 WHEN 'has_website' THEN 2 ELSE 3 END, rating DESC, name ASC LIMIT ? OFFSET ?`).all(...params, limit, offset);

  return { rows: rows.map(formatResult), total, page, limit };
}

export function updateResult(id, fields) {
  const db = getDb();
  const setClauses = [];
  const params = [];

  for (const [key, value] of Object.entries(fields)) {
    setClauses.push(`${key} = ?`);
    params.push(value);
  }

  if (setClauses.length === 0) return getResult(id);

  params.push(id);
  db.prepare(`UPDATE results SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);
  return getResult(id);
}

export function getStats() {
  const db = getDb();
  return db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM searches) AS total_searches,
      (SELECT COUNT(*) FROM searches WHERE status = 'completed') AS completed_searches,
      (SELECT COUNT(*) FROM results) AS total_results,
      (SELECT COUNT(*) FROM results WHERE status = 'no_website') AS without_website,
      (SELECT COUNT(*) FROM results WHERE status = 'has_website') AS with_website,
      (SELECT COUNT(*) FROM results WHERE status = 'pending_verification') AS pending_verification,
      (SELECT COUNT(*) FROM results WHERE website_verified = 1) AS verified_count
  `).get();
}

function formatResult(row) {
  return {
    ...row,
    categories: row.categories ? JSON.parse(row.categories) : null,
    website_verified: !!row.website_verified,
    website_confirmed: !!row.website_confirmed,
  };
}
