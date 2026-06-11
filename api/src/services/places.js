const PLACES_API_BASE = 'https://places.googleapis.com/v1';

function getApiKey() {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error('GOOGLE_PLACES_API_KEY environment variable is not set');
  return key;
}

export async function searchText(query, location, radius = 5000) {
  const apiKey = getApiKey();

  const body = {
    textQuery: `${query} in ${location}`,
    pageSize: 20,
    locationBias: {
      circle: {
        center: { latitude: 0, longitude: 0 },
        radius,
      },
    },
  };

  const response = await fetch(`${PLACES_API_BASE}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.types,places.location',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google Places API error (${response.status}): ${err}`);
  }

  const data = await response.json();

  if (!data.places) return [];

  return data.places.map(place => ({
    placeId: place.id,
    name: place.displayName?.text || 'Unknown',
    address: place.formattedAddress || null,
    phone: place.nationalPhoneNumber || null,
    website: place.websiteUri || null,
    rating: place.rating ?? null,
    totalRatings: place.userRatingCount ?? null,
    categories: place.types || [],
    lat: place.location?.latitude ?? null,
    lng: place.location?.longitude ?? null,
  }));
}
