import re
from urllib.parse import quote, unquote, urlparse

from scrapling.fetchers import StealthyFetcher

NETWORK_SITE_DOMAINS = [
    'facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'linkedin.com',
    'tiktok.com', 'pinterest.com', 'snapchat.com', 'reddit.com', 'tumblr.com',
    'youtube.com', 'youtu.be', 'threads.net', 'mastodon.social',
    'yelp.com', 'yellowpages.com', 'whitepages.com', 'superpages.com',
    'manta.com', 'merchantcircle.com', 'bbb.org', 'chamberofcommerce.com',
    'citysearch.com', 'kudzu.com', 'hotfrog.com', 'cylex.us.com',
    'mapquest.com', 'angieslist.com', 'angi.com', 'porch.com',
    'homeadvisor.com', 'find-us-here.com', 'brownbook.net',
    'trustpilot.com', 'sitejabber.com',
    'thumbtack.com', 'nextdoor.com', 'bark.com', 'fiverr.com',
    'upwork.com', 'taskrabbit.com', 'craigslist.org', 'gigsalad.com',
    'care.com', 'rover.com',
    'tripadvisor.com', 'foursquare.com', 'opentable.com', 'zomato.com',
    'booking.com', 'expedia.com', 'hotels.com',
    'squarespace.com', 'wix.com', 'weebly.com', 'wordpress.com',
    'blogspot.com', 'blogger.com', 'jimdo.com',
    'strikingly.com', 'godaddysites.com',
    'about.me', 'linktr.ee', 'bio.link', 'beacons.ai', 'hubspot.com',
    'restaurantguru.com', 'indeed.com',
]


def is_network_site(url: str) -> bool:
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        if domain.startswith('www.'):
            domain = domain[4:]
        for site in NETWORK_SITE_DOMAINS:
            if domain == site or domain.endswith('.' + site):
                return True
        path = parsed.path.strip('/')
        if path and '/' in path:
            return True
        if len(path) > 10:
            return True
        parts = domain.split('.')
        if len(parts) > 2:
            subdomain = '.'.join(parts[:-2])
            if '-' in subdomain:
                return True
        return False
    except Exception:
        return False


def decode_google_url(href: str) -> str:
    if not href:
        return ''
    if '/url?q=' in href:
        m = re.search(r'[?&]q=([^&]+)', href)
        if m:
            return unquote(m.group(1))
    return href


def verify_website(business_name: str, location: str) -> dict:
    query = f'"{business_name}" {location}'
    url = f'https://www.google.com/search?q={quote(query)}'

    page = StealthyFetcher.fetch(
        url,
        headless=True,
        network_idle=True,
        google_search=True,
    )

    body = page.body
    if not body or (isinstance(body, (str, bytes)) and len(body) < 500):
        return {'hasWebsite': False, 'confidence': 'low', 'matches': []}

    items = []
    for h3 in page.css('a h3'):
        a_tag = h3.parent
        if not a_tag or a_tag.tag.lower() != 'a':
            continue

        title = h3.text.strip() if h3.text else ''
        raw_link = a_tag.attrib.get('href', '')
        link = decode_google_url(raw_link)

        if not title or not link.startswith('http'):
            continue

        cite_el = a_tag.css('cite')
        cite = cite_el[0].text.strip() if cite_el and cite_el[0].text else ''

        items.append({'title': title, 'link': link, 'snippet': cite})

    if not items:
        return {'hasWebsite': False, 'confidence': 'low', 'matches': []}

    name_parts = [p for p in business_name.lower().split() if len(p) > 2]

    official_site = None
    network_site = None

    for m in items:
        title_lower = m['title'].lower()
        link_lower = m['link'].lower()
        snippet_lower = m['snippet'].lower()

        name_in_title = any(p in title_lower for p in name_parts)
        name_in_snippet = any(p in snippet_lower for p in name_parts)

        if not (name_in_title or name_in_snippet):
            continue

        if is_network_site(m['link']):
            if network_site is None:
                network_site = m
        else:
            official_site = m
            break

    if official_site:
        return {
            'hasWebsite': True,
            'confidence': 'high' if len(items) >= 3 else 'medium',
            'matches': [official_site],
        }

    if network_site:
        return {
            'hasWebsite': False,
            'confidence': 'low',
            'networkSite': network_site['link'],
            'matches': [network_site],
        }

    return {'hasWebsite': False, 'confidence': 'low', 'matches': []}
