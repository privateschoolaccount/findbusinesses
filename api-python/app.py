from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.searches import router as searches_router
from routes.results import router as results_router
from routes.stats import router as stats_router

app = FastAPI(
    title='Find Businesses API',
    version='1.0.0',
    description='Search Google Maps for businesses without websites and verify via Google Search.',

    docs_url='/api/docs',
    openapi_url='/api/openapi.json',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(searches_router)
app.include_router(results_router)
app.include_router(stats_router)


@app.get('/health')
async def health():
    return {'status': 'ok'}
