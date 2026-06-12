import asyncio
import uuid
from datetime import datetime, timezone

from database import create_search, create_result, get_search, update_search, update_result
from services.places import search_text
from services.custom_search import verify_website


async def run_search(query: str, location: str, radius: int = 5000, type: str | None = None,
                     search_id: str | None = None) -> dict:
    if search_id is None:
        search_id = str(uuid.uuid4())
        create_search(search_id, query, location, radius, type)
    update_search(search_id, status='processing')

    try:
        places = await search_text(query, location, radius)

        with_website = 0
        without_website = 0
        pending_verification = 0
        result_ids: dict[str, str] = {}

        for place in places:
            if place.get('website'):
                with_website += 1
                continue

            result_id = str(uuid.uuid4())
            create_result(
                id=result_id, search_id=search_id,
                name=place['name'], address=place.get('address'),
                phone=place.get('phone'), place_id=place.get('placeId'),
                website=None,
                status='pending_verification', verification_method='google_maps',
                rating=place.get('rating'), total_ratings=place.get('totalRatings'),
                categories=place.get('categories'), lat=place.get('lat'), lng=place.get('lng'),
            )
            result_ids[place['placeId']] = result_id
            pending_verification += 1

        verifiable = [p for p in places if not p.get('website')]

        for place in verifiable:
            try:
                verification = await asyncio.to_thread(verify_website, place['name'], location)
                rid = result_ids.get(place['placeId'])
                if not rid:
                    continue

                if verification['hasWebsite']:
                    site_url = verification['matches'][0]['link'] if verification['matches'] else None
                    update_result(
                        rid,
                        website=site_url,
                        website_verified=1,
                        website_confirmed=0,
                        status='has_website',
                        verification_method='google_search',
                    )
                    pending_verification -= 1
                    with_website += 1
                elif verification.get('networkSite'):
                    update_result(
                        rid,
                        network_site=verification['networkSite'],
                        website_verified=1,
                        website_confirmed=0,
                        status='no_website',
                        verification_method='google_search',
                    )
                    pending_verification -= 1
                    without_website += 1
                else:
                    update_result(
                        rid,
                        website_verified=1,
                        website_confirmed=1,
                        status='no_website',
                        verification_method='google_search',
                    )
                    pending_verification -= 1
                    without_website += 1
            except Exception:
                rid = result_ids.get(place['placeId'])
                if rid:
                    update_result(
                        rid,
                        status='no_website',
                        verification_method='google_maps',
                        notes='Google Search verification failed, defaulting to no_website',
                    )
                pending_verification -= 1
                without_website += 1

            update_search(search_id,
                          with_website=with_website,
                          without_website=without_website,
                          pending_verification=pending_verification)

        now = datetime.now(timezone.utc).isoformat()
        update_search(search_id,
                      status='completed',
                      total_found=len(places),
                      with_website=with_website,
                      without_website=without_website,
                      pending_verification=pending_verification,
                      completed_at=now)

        return get_search(search_id)

    except Exception as err:
        update_search(search_id, status='failed', error=str(err))
        raise
