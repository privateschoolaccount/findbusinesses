const CSE_BASE = 'https://www.googleapis.com/customsearch/v1';

function getConfig() {
  const key = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_CUSTOM_SEARCH_CX;
  if (!key) throw new Error('GOOGLE_CUSTOM_SEARCH_API_KEY environment variable is not set');
  if (!cx) throw new Error('GOOGLE_CUSTOM_SEARCH_CX environment variable is not set');
  return { key, cx };
}

export async function verifyWebsite(businessName, location) {
  const { key, cx } = getConfig();
  const query = encodeURIComponent(`"${businessName}" ${location}`);

  const url = `${CSE_BASE}?key=${key}&cx=${cx}&q=${query}&num=5`;

  const response = await fetch(url);

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google Custom Search error (${response.status}): ${err}`);
  }

  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    return { hasWebsite: false, confidence: 'low', matches: [] };
  }

  const matches = data.items.map(item => ({
    title: item.title,
    link: item.link,
    snippet: item.snippet,
  }));

  const officialSite = matches.find(m => {
    const title = m.title.toLowerCase();
    const link = m.link.toLowerCase();
    const snippet = (m.snippet || '').toLowerCase();
    const nameParts = businessName.toLowerCase().split(' ').filter(p => p.length > 2);

    const nameInTitle = nameParts.some(p => title.includes(p));
    const nameInLink = nameParts.some(p => link.includes(p));
    const nameInSnippet = nameParts.some(p => snippet.includes(p));

    const isBizDir = /(yellowpages|yelp|facebook|linkedin|instagram|twitter|manta|bbb\.org|merchantcircle|mapquest)/.test(link);

    const officialSignal = (nameInTitle || nameInSnippet) && !isBizDir;

    return officialSignal;
  });

  return {
    hasWebsite: !!officialSite,
    confidence: (() => {
      if (officialSite && matches.length >= 3) return 'high';
      if (officialSite) return 'medium';
      return 'low';
    })(),
    matches: officialSite ? [officialSite] : [],
  };
}
