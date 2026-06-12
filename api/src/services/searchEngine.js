import { v4 as uuid } from 'uuid';
import { createSearch, updateSearch, getSearch } from '../db/searches.js';
import { createResult, updateResult, getResult } from '../db/results.js';
import { searchText } from './places.js';
import { verifyWebsite } from './customSearch.js';

export async function runSearch({ query, location, radius = 5000, type }) {
  const id = uuid();
  createSearch({ id, query, location, radius, type });
  updateSearch(id, { status: 'processing' });

  try {
    const places = await searchText(query, location, radius);

    let withWebsite = 0;
    let withoutWebsite = 0;
    let pendingVerification = 0;

    const resultIds = {};

    for (const place of places) {
      if (place.website) {
        withWebsite++;
        continue;
      }

      const resultId = uuid();
      createResult({
        id: resultId,
        searchId: id,
        ...place,
        status: 'pending_verification',
        verificationMethod: 'google_maps',
      });
      resultIds[place.placeId] = resultId;
      pendingVerification++;
    }

    const verifiable = places.filter(p => !p.website);
    for (const place of verifiable) {
      try {
        const verification = await verifyWebsite(place.name, location);
        const resultId = resultIds[place.placeId];
        if (!resultId) continue;

        if (verification.hasWebsite) {
          const siteUrl = verification.matches[0]?.link || null;
          updateResult(resultId, {
            website: siteUrl,
            website_verified: 1,
            website_confirmed: 0,
            status: 'has_website',
            verification_method: 'google_search',
          });
          pendingVerification--;
          withWebsite++;
        } else if (verification.networkSite) {
          updateResult(resultId, {
            network_site: verification.networkSite,
            website_verified: 1,
            website_confirmed: 0,
            status: 'no_website',
            verification_method: 'google_search',
          });
          pendingVerification--;
          withoutWebsite++;
        } else {
          updateResult(resultId, {
            website_verified: 1,
            website_confirmed: 1,
            status: 'no_website',
            verification_method: 'google_search',
          });
          pendingVerification--;
          withoutWebsite++;
        }
      } catch {
        const resultId = resultIds[place.placeId];
        if (resultId) {
          updateResult(resultId, {
            status: 'no_website',
            verification_method: 'google_maps',
            notes: 'Google Search verification failed, defaulting to no_website',
          });
        }
        pendingVerification--;
        withoutWebsite++;
      }

      updateSearch(id, {
        with_website: withWebsite,
        without_website: withoutWebsite,
        pending_verification: pendingVerification,
      });
    }

    updateSearch(id, {
      status: 'completed',
      total_found: places.length,
      with_website: withWebsite,
      without_website: withoutWebsite,
      pending_verification: pendingVerification,
      completed_at: new Date().toISOString(),
    });

    return getSearch(id);
  } catch (err) {
    updateSearch(id, { status: 'failed', error: err.message });
    throw err;
  }
}
