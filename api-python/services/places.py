from httpx import AsyncClient

from config import settings

PLACES_API_BASE = 'https://places.googleapis.com/v1'
MAX_PAGES = 3


def _get_api_key() -> str:
    if not settings.google_places_api_key:
        raise ValueError('GOOGLE_PLACES_API_KEY environment variable is not set')
    return settings.google_places_api_key


def _parse_place(place: dict) -> dict:
    return {
        'placeId': place['id'],
        'name': place.get('displayName', {}).get('text', 'Unknown'),
        'address': place.get('formattedAddress'),
        'phone': place.get('nationalPhoneNumber'),
        'website': place.get('websiteUri'),
        'rating': place.get('rating'),
        'totalRatings': place.get('userRatingCount'),
        'categories': place.get('types', []),
        'lat': place.get('location', {}).get('latitude'),
        'lng': place.get('location', {}).get('longitude'),
    }


async def search_text(query: str, location: str, radius: int = 5000) -> list[dict]:
    api_key = _get_api_key()
    all_places: list[dict] = []

    body = {
        'textQuery': f'{query} in {location}',
        'pageSize': 20,
        'locationBias': {
            'circle': {
                'center': {'latitude': 0, 'longitude': 0},
                'radius': radius,
            },
        },
    }

    async with AsyncClient() as client:
        for _ in range(MAX_PAGES):
            response = await client.post(
                f'{PLACES_API_BASE}/places:searchText',
                headers={
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': api_key,
                    'X-Goog-FieldMask': (
                        'places.id,places.displayName,places.formattedAddress,'
                        'places.nationalPhoneNumber,places.websiteUri,places.rating,'
                        'places.userRatingCount,places.types,places.location,'
                        'nextPageToken'
                    ),
                },
                json=body,
            )

            if response.status_code != 200:
                raise RuntimeError(f'Google Places API error ({response.status_code}): {response.text}')

            data = response.json()
            all_places.extend(_parse_place(p) for p in data.get('places', []))

            next_page_token = data.get('nextPageToken')
            if not next_page_token:
                break

            body['pageToken'] = next_page_token

    return all_places
