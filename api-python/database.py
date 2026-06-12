import json
import sqlite3
from pathlib import Path

from config import settings

_db: sqlite3.Connection | None = None


def get_db() -> sqlite3.Connection:
    global _db
    if _db is None:
        Path(settings.database_path).parent.mkdir(parents=True, exist_ok=True)
        _db = sqlite3.connect(settings.database_path)
        _db.row_factory = sqlite3.Row
        _db.execute('PRAGMA journal_mode = WAL')
        _db.execute('PRAGMA foreign_keys = ON')
        _migrate(_db)
    return _db


def close_db():
    global _db
    if _db:
        _db.close()
        _db = None


def _migrate(db: sqlite3.Connection):
    db.executescript('''
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
    ''')

    try:
        db.execute('ALTER TABLE results ADD COLUMN network_site TEXT')
    except sqlite3.OperationalError:
        pass


def row_to_dict(row: sqlite3.Row | None) -> dict | None:
    if row is None:
        return None
    return dict(row)


# ── searches ──

def create_search(id: str, query: str, location: str, radius: int = 5000, type: str | None = None) -> dict:
    db = get_db()
    db.execute(
        'INSERT INTO searches (id, query, location, radius, type, status) VALUES (?, ?, ?, ?, ?, ?)',
        (id, query, location, radius, type, 'pending'),
    )
    db.commit()
    return get_search(id)


def get_search(id: str) -> dict | None:
    db = get_db()
    row = db.execute('SELECT * FROM searches WHERE id = ?', (id,)).fetchone()
    return row_to_dict(row)


def list_searches(page: int = 1, limit: int = 20, status: str | None = None) -> dict:
    db = get_db()
    conditions = []
    params: list = []

    if status:
        conditions.append('status = ?')
        params.append(status)

    where = f'WHERE {' AND '.join(conditions)}' if conditions else ''
    offset = (page - 1) * limit

    total = db.execute(f'SELECT COUNT(*) as count FROM searches {where}', params).fetchone()['count']
    rows = db.execute(
        f'SELECT * FROM searches {where} ORDER BY created_at DESC LIMIT ? OFFSET ?',
        (*params, limit, offset),
    ).fetchall()

    return {'rows': [dict(r) for r in rows], 'total': total, 'page': page, 'limit': limit}


def update_search(id: str, **fields) -> dict | None:
    if not fields:
        return get_search(id)
    db = get_db()
    set_clause = ', '.join(f'{k} = ?' for k in fields)
    values = list(fields.values()) + [id]
    db.execute(f'UPDATE searches SET {set_clause} WHERE id = ?', values)
    db.commit()
    return get_search(id)


# ── results ──

def create_result(id: str, search_id: str, name: str, address: str | None = None,
                  phone: str | None = None, place_id: str | None = None,
                  website: str | None = None, network_site: str | None = None,
                  status: str = 'pending_verification',
                  verification_method: str = 'google_maps',
                  rating: float | None = None, total_ratings: int | None = None,
                  categories: list[str] | None = None, lat: float | None = None,
                  lng: float | None = None) -> dict:
    db = get_db()
    db.execute(
        '''INSERT INTO results
           (id, search_id, name, address, phone, place_id, website, network_site,
            status, verification_method, rating, total_ratings,
            categories, lat, lng)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (id, search_id, name, address, phone, place_id, website, network_site,
         status, verification_method, rating, total_ratings,
         json.dumps(categories) if categories else None, lat, lng),
    )
    db.commit()
    return get_result(id)


def get_result(id: str) -> dict | None:
    db = get_db()
    row = db.execute('SELECT * FROM results WHERE id = ?', (id,)).fetchone()
    return _format_result(row_to_dict(row))


def list_results(search_id: str, page: int = 1, limit: int = 20, status: str | None = None) -> dict:
    db = get_db()
    conditions = ['search_id = ?']
    params: list = [search_id]

    if status:
        conditions.append('status = ?')
        params.append(status)

    where = ' AND '.join(conditions)
    offset = (page - 1) * limit

    total = db.execute(f'SELECT COUNT(*) as count FROM results WHERE {where}', params).fetchone()['count']
    rows = db.execute(
        f'''SELECT * FROM results WHERE {where}
            ORDER BY
              CASE status
                WHEN 'no_website' THEN 0
                WHEN 'pending_verification' THEN 1
                WHEN 'has_website' THEN 2
                ELSE 3
              END,
              rating DESC, name ASC
            LIMIT ? OFFSET ?''',
        (*params, limit, offset),
    ).fetchall()

    return {
        'rows': [_format_result(dict(r)) for r in rows],
        'total': total,
        'page': page,
        'limit': limit,
    }


def update_result(id: str, **fields) -> dict | None:
    if not fields:
        return get_result(id)
    db = get_db()
    set_clause = ', '.join(f'{k} = ?' for k in fields)
    values = list(fields.values()) + [id]
    db.execute(f'UPDATE results SET {set_clause} WHERE id = ?', values)
    db.commit()
    return get_result(id)


def get_stats() -> dict:
    db = get_db()
    return dict(db.execute('''
        SELECT
            (SELECT COUNT(*) FROM searches) AS total_searches,
            (SELECT COUNT(*) FROM searches WHERE status = 'completed') AS completed_searches,
            (SELECT COUNT(*) FROM results) AS total_results,
            (SELECT COUNT(*) FROM results WHERE status = 'no_website') AS without_website,
            (SELECT COUNT(*) FROM results WHERE status = 'has_website') AS with_website,
            (SELECT COUNT(*) FROM results WHERE status = 'pending_verification') AS pending_verification,
            (SELECT COUNT(*) FROM results WHERE website_verified = 1) AS verified_count
    ''').fetchone())


def _format_result(row: dict | None) -> dict | None:
    if row is None:
        return None
    if row.get('categories') and isinstance(row['categories'], str):
        row['categories'] = json.loads(row['categories'])
    else:
        row['categories'] = None
    row['website_verified'] = bool(row['website_verified'])
    row['website_confirmed'] = bool(row['website_confirmed'])
    return row
