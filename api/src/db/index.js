import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', '..', 'data', 'findbusinesses.db');

let db;

export function getDb() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    migrate();
  }
  return db;
}

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS searches (
      id TEXT PRIMARY KEY,
      query TEXT NOT NULL,
      location TEXT NOT NULL,
      radius INTEGER DEFAULT 5000,
      type TEXT,
      status TEXT DEFAULT 'pending',
      total_found INTEGER DEFAULT 0,
      with_website INTEGER DEFAULT 0,
      without_website INTEGER DEFAULT 0,
      pending_verification INTEGER DEFAULT 0,
      error TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS results (
      id TEXT PRIMARY KEY,
      search_id TEXT NOT NULL REFERENCES searches(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      place_id TEXT,
      website TEXT,
      network_site TEXT,
      website_verified INTEGER DEFAULT 0,
      website_confirmed INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending_verification',
      verification_method TEXT DEFAULT 'google_maps',
      rating REAL,
      total_ratings INTEGER,
      categories TEXT,
      lat REAL,
      lng REAL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_results_search_id ON results(search_id);
    CREATE INDEX IF NOT EXISTS idx_results_status ON results(status);
    CREATE INDEX IF NOT EXISTS idx_searches_status ON searches(status);

    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT,
      tags TEXT,
      status TEXT DEFAULT 'saved',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS collection_businesses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
      result_id TEXT NOT NULL REFERENCES results(id) ON DELETE CASCADE,
      added_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_cb_collection_id ON collection_businesses(collection_id);
    CREATE INDEX IF NOT EXISTS idx_cb_result_id ON collection_businesses(result_id);
  `);

  try {
    db.exec('ALTER TABLE results ADD COLUMN network_site TEXT');
  } catch {
    // column already exists
  }
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
