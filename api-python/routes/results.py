from fastapi import APIRouter, HTTPException

from database import get_result, update_result
from models import ResultResponse, ResultUpdate

router = APIRouter(prefix='/api/results', tags=['Results'])


@router.get('/{result_id}', response_model=ResultResponse,
    summary='Get a single result',
    description='Returns details for a single business result by ID.')
async def get_result_endpoint(result_id: str = ...):
    result = get_result(result_id)
    if not result:
        raise HTTPException(404, 'Result not found')
    return result


@router.patch('/{result_id}', response_model=ResultResponse,
    summary='Update a result',
    description='Update verified status or notes for a business result.')
async def update_result_endpoint(result_id: str, body: ResultUpdate):
    existing = get_result(result_id)
    if not existing:
        raise HTTPException(404, 'Result not found')

    allowed = {'verified', 'notes'}
    updates = body.model_dump(exclude_none=True)
    updates = {k: v for k, v in updates.items() if k in allowed}

    if not updates:
        raise HTTPException(400, 'No valid fields to update')

    db_updates = {}
    if 'verified' in updates:
        db_updates['website_verified'] = 1 if updates['verified'] else 0
        db_updates['website_confirmed'] = 1 if updates['verified'] else 0
    if 'notes' in updates:
        db_updates['notes'] = updates['notes']

    updated = update_result(result_id, **db_updates)
    return updated
