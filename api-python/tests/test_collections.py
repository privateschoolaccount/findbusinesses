import os
import shutil
import tempfile
import unittest

from fastapi.testclient import TestClient

# Use a temp database so we don't touch the dev DB
_test_dir = tempfile.mkdtemp()
os.environ['DATABASE_PATH'] = os.path.join(_test_dir, 'test.db')

from app import app
from database import (
    get_db,
    create_collection,
    get_collection,
    list_collections,
    update_collection,
    delete_collection,
    add_businesses_to_collection,
    remove_business_from_collection,
    list_collection_businesses,
    close_db,
)

client = TestClient(app)

RESULT_IDS: list[str] = []


def setUpModule():
    """Create a search + results for association tests (once per module)."""
    global RESULT_IDS
    db = get_db()
    db.execute(
        'INSERT OR IGNORE INTO searches (id, query, location) VALUES (?, ?, ?)',
        ('test-search-coll', 'test-biz', 'test-city'),
    )
    for i in range(3):
        rid = f'test-result-coll-{i}'
        statuses = ['no_website', 'has_website', 'pending_verification']
        db.execute(
            """INSERT OR IGNORE INTO results
               (id, search_id, name, address, status, website_verified, website_confirmed)
               VALUES (?, ?, ?, ?, ?, 0, 0)""",
            (rid, 'test-search-coll', f'Biz {i}', f'Addr {i}', statuses[i]),
        )
        RESULT_IDS.append(rid)
    db.commit()


def tearDownModule():
    db = get_db()
    db.execute('DELETE FROM collection_businesses')
    db.execute('DELETE FROM collections')
    db.execute('DELETE FROM results WHERE search_id = ?', ('test-search-coll',))
    db.execute('DELETE FROM searches WHERE id = ?', ('test-search-coll',))
    db.commit()
    close_db()
    shutil.rmtree(_test_dir, ignore_errors=True)


# ── DAO tests ──


class TestCollectionsDAO(unittest.TestCase):
    def setUp(self):
        db = get_db()
        db.execute('DELETE FROM collection_businesses')
        db.execute('DELETE FROM collections')
        db.commit()

    # -- CRUD --

    def test_create_collection(self):
        c = create_collection('Test SaaS', 'SF', ['SaaS', 'Tech'])
        self.assertGreater(c['id'], 0)
        self.assertEqual(c['name'], 'Test SaaS')
        self.assertEqual(c['location'], 'SF')
        self.assertEqual(c['tags'], ['SaaS', 'Tech'])
        self.assertEqual(c['totalLeads'], 0)
        self.assertEqual(c['noWebsite'], 0)
        self.assertEqual(c['newLeads'], 0)
        self.assertIn('created_at', c)
        self.assertIn('updated_at', c)

    def test_get_collection(self):
        c = create_collection('Get Test')
        got = get_collection(c['id'])
        self.assertIsNotNone(got)
        self.assertEqual(got['id'], c['id'])
        self.assertEqual(got['name'], 'Get Test')

    def test_get_collection_unknown(self):
        self.assertIsNone(get_collection(99999))

    def test_list_collections(self):
        create_collection('A')
        create_collection('B')
        lst = list_collections()
        self.assertGreaterEqual(len(lst), 2)
        names = [c['name'] for c in lst]
        self.assertIn('A', names)
        self.assertIn('B', names)
        # ordered by updated_at DESC
        for i in range(1, len(lst)):
            self.assertGreaterEqual(lst[i - 1]['updated_at'], lst[i]['updated_at'])

    def test_update_collection(self):
        c = create_collection('Original')
        old_updated = c['updated_at']
        updated = update_collection(c['id'], name='Changed', tags=['X', 'Y'])
        self.assertEqual(updated['name'], 'Changed')
        self.assertEqual(updated['tags'], ['X', 'Y'])
        self.assertGreaterEqual(updated['updated_at'], old_updated)

    def test_delete_collection(self):
        c = create_collection('Delete Me')
        delete_collection(c['id'])
        self.assertIsNone(get_collection(c['id']))

    # -- Business associations --

    def test_add_businesses_updates_counts(self):
        c = create_collection('Biz Test')
        add_businesses_to_collection(c['id'], RESULT_IDS)
        enriched = get_collection(c['id'])
        self.assertEqual(enriched['totalLeads'], 3)
        self.assertEqual(enriched['noWebsite'], 1)  # only RESULT_IDS[0] has status='no_website'

    def test_list_collection_businesses_pagination(self):
        c = create_collection('Pagination')
        add_businesses_to_collection(c['id'], RESULT_IDS)

        p1 = list_collection_businesses(c['id'], page=1, limit=2)
        self.assertEqual(p1['total'], 3)
        self.assertEqual(len(p1['rows']), 2)
        self.assertEqual(p1['page'], 1)
        self.assertEqual(p1['limit'], 2)

        p2 = list_collection_businesses(c['id'], page=2, limit=2)
        self.assertEqual(len(p2['rows']), 1)

    def test_remove_business_updates_counts(self):
        c = create_collection('Remove Biz')
        add_businesses_to_collection(c['id'], RESULT_IDS)
        remove_business_from_collection(c['id'], RESULT_IDS[0])

        lst = list_collection_businesses(c['id'])
        self.assertEqual(lst['total'], 2)

        enriched = get_collection(c['id'])
        self.assertEqual(enriched['totalLeads'], 2)
        self.assertEqual(enriched['noWebsite'], 0)  # the one with no_website was removed

    def test_delete_collection_cascade(self):
        c = create_collection('Cascade')
        add_businesses_to_collection(c['id'], RESULT_IDS)
        self.assertEqual(list_collection_businesses(c['id'])['total'], 3)
        delete_collection(c['id'])
        self.assertEqual(list_collection_businesses(c['id'])['total'], 0)


# ── HTTP endpoint tests ──


class TestCollectionsHTTP(unittest.TestCase):
    def setUp(self):
        db = get_db()
        db.execute('DELETE FROM collection_businesses')
        db.execute('DELETE FROM collections')
        db.commit()

    def test_post_creates_collection(self):
        resp = client.post('/api/collections', json={
            'name': 'HTTP Coll', 'location': 'NYC', 'tags': ['FinTech'],
        })
        self.assertEqual(resp.status_code, 201)
        body = resp.json()
        self.assertGreater(body['id'], 0)
        self.assertEqual(body['name'], 'HTTP Coll')
        self.assertEqual(body['location'], 'NYC')
        self.assertEqual(body['tags'], ['FinTech'])
    def test_post_returns_400_when_name_missing(self):
        resp = client.post('/api/collections', json={'location': 'X'})
        self.assertEqual(resp.status_code, 400)

    def test_get_list_returns_array(self):
        client.post('/api/collections', json={'name': 'A'})
        client.post('/api/collections', json={'name': 'B'})
        resp = client.get('/api/collections')
        self.assertEqual(resp.status_code, 200)
        self.assertIsInstance(resp.json(), list)
        self.assertGreaterEqual(len(resp.json()), 2)

    def test_get_by_id_returns_collection(self):
        created = client.post('/api/collections', json={'name': 'Get Me'}).json()
        resp = client.get(f'/api/collections/{created["id"]}')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()['name'], 'Get Me')

    def test_get_by_id_returns_404(self):
        resp = client.get('/api/collections/99999')
        self.assertEqual(resp.status_code, 404)

    def test_patch_updates_collection(self):
        created = client.post('/api/collections', json={'name': 'Original'}).json()
        resp = client.patch(f'/api/collections/{created["id"]}', json={
            'name': 'Updated',
        })
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()['name'], 'Updated')

    def test_delete_removes_collection(self):
        created = client.post('/api/collections', json={'name': 'Delete Me'}).json()
        resp = client.delete(f'/api/collections/{created["id"]}')
        self.assertEqual(resp.status_code, 204)
        self.assertEqual(client.get(f'/api/collections/{created["id"]}').status_code, 404)

    def test_post_businesses_adds_results(self):
        created = client.post('/api/collections', json={'name': 'Biz Coll'}).json()
        resp = client.post(f'/api/collections/{created["id"]}/businesses', json={
            'resultIds': RESULT_IDS,
        })
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json()['success'])

        get = client.get(f'/api/collections/{created["id"]}')
        self.assertEqual(get.json()['totalLeads'], len(RESULT_IDS))

    def test_get_businesses_paginated(self):
        created = client.post('/api/collections', json={'name': 'Paginated'}).json()
        client.post(f'/api/collections/{created["id"]}/businesses', json={'resultIds': RESULT_IDS})

        resp = client.get(f'/api/collections/{created["id"]}/businesses?page=1&limit=2')
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertEqual(body['total'], len(RESULT_IDS))
        self.assertEqual(len(body['rows']), 2)
        self.assertEqual(body['page'], 1)
        self.assertEqual(body['limit'], 2)

    def test_delete_business_removes_result(self):
        created = client.post('/api/collections', json={'name': 'Remove Biz'}).json()
        client.post(f'/api/collections/{created["id"]}/businesses', json={'resultIds': RESULT_IDS})

        resp = client.delete(f'/api/collections/{created["id"]}/businesses/{RESULT_IDS[0]}')
        self.assertEqual(resp.status_code, 204)

        lst = client.get(f'/api/collections/{created["id"]}/businesses').json()
        self.assertEqual(lst['total'], len(RESULT_IDS) - 1)


if __name__ == '__main__':
    unittest.main()
