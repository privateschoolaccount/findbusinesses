from fastapi import APIRouter

from database import get_stats
from models import StatsResponse

router = APIRouter(prefix='/api/stats', tags=['Stats'])


@router.get('', response_model=StatsResponse,
    summary='Get aggregate statistics',
    description='Overall statistics across all searches and results.')
async def stats_endpoint():
    return get_stats()
