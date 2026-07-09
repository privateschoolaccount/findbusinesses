import csv
import io
import json
import uuid

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

from database import (
    create_collection,
    get_collection,
    list_collections,
    update_collection,
    delete_collection,
    add_businesses_to_collection,
    remove_business_from_collection,
    list_collection_businesses,
    get_db,
)
from models import (
    CollectionCreate,
    CollectionUpdate,
    CollectionResponse,
    AddBusinessesRequest,
)

router = APIRouter(prefix='/api/collections', tags=['Collections'])


@router.get('', response_model=list[CollectionResponse],
    summary='List all collections',
    description='Returns all collections with aggregated lead counts.')
async def list_collections_endpoint():
    return list_collections()


@router.post('', response_model=CollectionResponse, status_code=201,
    summary='Create a new collection',
    description='Create a named collection with optional location and tags.')
async def create_collection_endpoint(body: CollectionCreate):
    if not body.name or not body.name.strip():
        raise HTTPException(400, 'name is required')
    return create_collection(name=body.name.strip(), location=body.location, tags=body.tags)


@router.get('/{collection_id}', response_model=CollectionResponse,
    summary='Get a collection by ID',
    description='Returns collection details with aggregated lead counts.')
async def get_collection_endpoint(collection_id: int):
    collection = get_collection(collection_id)
    if not collection:
        raise HTTPException(404, 'Collection not found')
    return collection


@router.patch('/{collection_id}', response_model=CollectionResponse,
    summary='Update a collection',
    description='Update name, location, tags, or status of a collection.')
async def update_collection_endpoint(collection_id: int, body: CollectionUpdate):
    collection = get_collection(collection_id)
    if not collection:
        raise HTTPException(404, 'Collection not found')
    fields = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    return update_collection(collection_id, **fields)


@router.delete('/{collection_id}', status_code=204,
    summary='Delete a collection',
    description='Permanently deletes a collection and its business associations.')
async def delete_collection_endpoint(collection_id: int):
    collection = get_collection(collection_id)
    if not collection:
        raise HTTPException(404, 'Collection not found')
    delete_collection(collection_id)


@router.get('/{collection_id}/export/ghl-csv',
    summary='Export collection as GoHighLevel CSV',
    description='Downloads a GoHighLevel-compatible CSV of all contacts in this collection.')
async def export_ghl_csv_endpoint(collection_id: int):
    collection = get_collection(collection_id)
    if not collection:
        raise HTTPException(404, 'Collection not found')

    db = get_db()
    rows = db.execute(
        '''SELECT r.*
           FROM collection_businesses cb
           JOIN results r ON r.id = cb.result_id
           WHERE cb.collection_id = ?
           ORDER BY cb.added_at DESC''',
        (collection_id,),
    ).fetchall()

    if not rows:
        raise HTTPException(404, 'No businesses in this collection')

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        'First Name', 'Last Name', 'Email', 'Phone', 'Company Name',
        'Address', 'Website', 'Tags', 'Notes', 'Source',
    ])

    collection_tags = collection.get('tags') or []

    for row in rows:
        row = dict(row)
        name = row.get('name') or ''
        address = row.get('address') or ''
        phone = row.get('phone') or ''
        website = row.get('website') or row.get('network_site') or ''
        notes = row.get('notes') or ''
        categories = row.get('categories')
        if isinstance(categories, str):
            categories = json.loads(categories)

        tags = list(collection_tags)
        if categories:
            tags.extend(categories)
        tags_str = ', '.join(tags)

        first_name = ''
        last_name = ''
        email = ''
        
        if not first_name and not email and not phone:
            first_name = f'Temporary {uuid.uuid4()}'

        writer.writerow([
            first_name,
            last_name,
            email,
            phone,
            name,
            address,
            website,
            tags_str,
            notes,
            'FindBusinesses',
        ])

    output.seek(0)
    filename = f"{collection['name'].replace(' ', '_')}_ghl_import.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type='text/csv',
        headers={'Content-Disposition': f'attachment; filename="{filename}"'},
    )


@router.get('/{collection_id}/businesses',
    summary='List businesses in a collection',
    description='Paginated list of results associated with this collection.')
async def list_businesses_endpoint(
    collection_id: int,
    page: int = Query(1, ge=1, description='Page number'),
    limit: int = Query(20, ge=1, le=100, description='Results per page (max 100)'),
):
    collection = get_collection(collection_id)
    if not collection:
        raise HTTPException(404, 'Collection not found')
    return list_collection_businesses(collection_id, page=page, limit=limit)


@router.post('/{collection_id}/businesses',
    summary='Add businesses to a collection',
    description='Associate one or more result IDs with this collection.')
async def add_businesses_endpoint(collection_id: int, body: AddBusinessesRequest):
    collection = get_collection(collection_id)
    if not collection:
        raise HTTPException(404, 'Collection not found')
    if not body.resultIds:
        raise HTTPException(400, 'resultIds array is required')
    add_businesses_to_collection(collection_id, body.resultIds)
    return {'success': True}


@router.delete('/{collection_id}/businesses/{result_id}', status_code=204,
    summary='Remove a business from a collection',
    description='Remove a single result from the collection.')
async def remove_business_endpoint(collection_id: int, result_id: str):
    collection = get_collection(collection_id)
    if not collection:
        raise HTTPException(404, 'Collection not found')
    remove_business_from_collection(collection_id, result_id)
