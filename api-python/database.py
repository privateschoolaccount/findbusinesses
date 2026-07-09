import json
import sqlite3
from pathlib import Path

from config import settings

_db: sqlite3.Connection | None = None


def get_db() -> sqlite3.Connection:
    global _db
    if _db is None:
        Path(settings.database_path).parent.mkdir(parents=True, exist_ok=True)
        _db = sqlite3.connect(settings.database_path, check_same_thread=False)
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

        CREATE TABLE IF NOT EXISTS collections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            location TEXT,
            tags TEXT,
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


# ── collections ──


def create_collection(name: str, location: str | None = None, tags: list[str] | None = None) -> dict:
    db = get_db()
    cur = db.execute(
        'INSERT INTO collections (name, location, tags) VALUES (?, ?, ?)',
        (name, location, json.dumps(tags) if tags else None),
    )
    db.commit()
    return get_collection(cur.lastrowid)


def get_collection(id: int) -> dict | None:
    db = get_db()
    row = row_to_dict(db.execute('SELECT * FROM collections WHERE id = ?', (id,)).fetchone())
    if row is None:
        return None
    return _enrich_collection(row)


def list_collections() -> list[dict]:
    db = get_db()
    rows = [dict(r) for r in db.execute('SELECT * FROM collections ORDER BY updated_at DESC').fetchall()]
    return [_enrich_collection(r) for r in rows]


def update_collection(id: int, **fields) -> dict | None:
    if not fields:
        return get_collection(id)
    db = get_db()
    if 'tags' in fields and isinstance(fields['tags'], list):
        fields['tags'] = json.dumps(fields['tags'])
    fields['updated_at'] = 'datetime(\'now\')'
    set_clause = ', '.join(f'{k} = ?' for k in fields)
    values = list(fields.values()) + [id]
    db.execute(f'UPDATE collections SET {set_clause} WHERE id = ?', values)
    db.commit()
    return get_collection(id)


def delete_collection(id: int):
    db = get_db()
    db.execute('DELETE FROM collections WHERE id = ?', (id,))
    db.commit()


def _enrich_collection(row: dict) -> dict:
    db = get_db()
    agg = dict(db.execute('''
        SELECT
            COUNT(*) AS totalLeads,
            SUM(CASE WHEN r.status = 'no_website' THEN 1 ELSE 0 END) AS noWebsite,
            SUM(CASE WHEN cb.added_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) AS newLeads
        FROM collection_businesses cb
        JOIN results r ON r.id = cb.result_id
        WHERE cb.collection_id = ?
    ''', (row['id'],)).fetchone())

    if row.get('tags') and isinstance(row['tags'], str):
        row['tags'] = json.loads(row['tags'])
    else:
        row['tags'] = None
    row['totalLeads'] = agg['totalLeads'] or 0
    row['noWebsite'] = agg['noWebsite'] or 0
    row['newLeads'] = agg['newLeads'] or 0
    return row


def add_businesses_to_collection(collection_id: int, result_ids: list[str]):
    db = get_db()
    if not result_ids:
        return
    placeholders = ','.join('?' * len(result_ids))
    valid_ids = [
        row['id'] for row in db.execute(
            f'SELECT id FROM results WHERE id IN ({placeholders})',
            result_ids,
        ).fetchall()
    ]
    if not valid_ids:
        return
    for rid in valid_ids:
        db.execute(
            'INSERT OR IGNORE INTO collection_businesses (collection_id, result_id) VALUES (?, ?)',
            (collection_id, rid),
        )
    db.execute('UPDATE collections SET updated_at = datetime("now") WHERE id = ?', (collection_id,))
    db.commit()


def remove_business_from_collection(collection_id: int, result_id: str):
    db = get_db()
    db.execute(
        'DELETE FROM collection_businesses WHERE collection_id = ? AND result_id = ?',
        (collection_id, result_id),
    )
    db.execute('UPDATE collections SET updated_at = datetime("now") WHERE id = ?', (collection_id,))
    db.commit()


def list_collection_businesses(collection_id: int, page: int = 1, limit: int = 20) -> dict:
    db = get_db()
    offset = (page - 1) * limit

    total = db.execute(
        'SELECT COUNT(*) AS count FROM collection_businesses WHERE collection_id = ?',
        (collection_id,),
    ).fetchone()['count']

    rows = db.execute(
        '''SELECT r.*, cb.added_at AS added_at
           FROM collection_businesses cb
           JOIN results r ON r.id = cb.result_id
           WHERE cb.collection_id = ?
           ORDER BY cb.added_at DESC
           LIMIT ? OFFSET ?''',
        (collection_id, limit, offset),
    ).fetchall()

    return {
        'rows': [_format_result(dict(r)) for r in rows],
        'total': total,
        'page': page,
        'limit': limit,
    }


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
