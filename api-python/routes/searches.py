import asyncio
import uuid

from fastapi import APIRouter, HTTPException, Query

from database import create_search, get_search, list_searches, list_results, update_search
from models import SearchCreate, SearchResponse, SearchListResponse, ResultListResponse
from services.search_engine import run_search

router = APIRouter(prefix='/api/searches', tags=['Searches'])


@router.post('', response_model=SearchResponse | dict, status_code=201,
    summary='Create a new business search',
    description='Search Google Maps for businesses matching the query at the given location, then verify which have no website. Returns immediately (202) for async processing, or blocks and returns results if ?wait=true.')
async def create_search_endpoint(body: SearchCreate, wait: bool = Query(False, description='If true, blocks until search completes and returns results inline.')):
    if not body.query or not body.location:
        raise HTTPException(400, 'query and location are required')

    if wait:
        search = await run_search(body.query, body.location, body.radius, body.type)
        results = list_results(search['id'], page=1, limit=100)
        return {**search, 'results': results['rows']}

    search_id = str(uuid.uuid4())
    create_search(search_id, body.query, body.location, body.radius, body.type)
    update_search(search_id, status='processing')

    asyncio.ensure_future(run_search(body.query, body.location, body.radius, body.type, search_id=search_id))

    return {'id': search_id, 'status': 'processing', 'query': body.query, 'location': body.location}


@router.get('', response_model=SearchListResponse,
    summary='List all searches',
    description='Returns a paginated list of searches, optionally filtered by status.')
async def list_searches_endpoint(
    page: int = Query(1, ge=1, description='Page number'),
    limit: int = Query(20, ge=1, le=100, description='Results per page (max 100)'),
    status: str | None = Query(None, description='Filter by status: pending, processing, completed, failed'),
):
    return list_searches(page=page, limit=limit, status=status)


@router.get('/{search_id}', response_model=SearchResponse,
    summary='Get search details',
    description='Returns details for a single search by ID.')
async def get_search_endpoint(search_id: str = ...):
    search = get_search(search_id)
    if not search:
        raise HTTPException(404, 'Search not found')
    return search


@router.get('/{search_id}/results', response_model=ResultListResponse,
    summary='Get search results',
    description='Returns a paginated list of results for a specific search. No-website results are sorted to the top. Optionally filter by status.')
async def get_search_results_endpoint(
    search_id: str = ...,
    page: int = Query(1, ge=1, description='Page number'),
    limit: int = Query(20, ge=1, le=100, description='Results per page (max 100)'),
    status: str | None = Query(None, description='Filter by status: has_website, no_website, pending_verification'),
):
    search = get_search(search_id)
    if not search:
        raise HTTPException(404, 'Search not found')
    return list_results(search_id, page=page, limit=limit, status=status)
