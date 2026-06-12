import { lightpanda } from '@lightpanda/browser';
import puppeteer from 'puppeteer-core';

const LP_HOST = process.env.LIGHTPANDA_HOST || '127.0.0.1';
const LP_PORT = parseInt(process.env.LIGHTPANDA_PORT || '9222', 10);

const NETWORK_SITE_DOMAINS = [
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
];

function isNetworkSite(url) {
  try {
    const parsed = new URL(url);
    let domain = parsed.hostname.toLowerCase();
    if (domain.startsWith('www.')) domain = domain.slice(4);
    if (NETWORK_SITE_DOMAINS.some(site => domain === site || domain.endsWith('.' + site))) {
      return true;
    }
    const path = parsed.pathname.replace(/^\/+|\/+$/g, '');
    if (path && path.includes('/')) {
      return true;
    }
    if (path.length > 10) {
      return true;
    }
    const parts = domain.split('.');
    if (parts.length > 2) {
      const subdomain = parts.slice(0, -2).join('.');
      if (subdomain.includes('-')) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

function decodeBingUrl(href) {
  if (!href || !href.includes('bing.com/ck/a')) return href || '';
  const uMatch = href.match(/[?&]u=([^&]+)/);
  if (!uMatch) return href;
  try {
    return decodeURIComponent(atob(uMatch[1].slice(2)));
  } catch {
    return href;
  }
}

export async function verifyWebsite(businessName, location) {
  const proc = await lightpanda.serve({
    host: LP_HOST,
    port: LP_PORT,
    timeout: 0,
  });

  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint: `ws://${LP_HOST}:${LP_PORT}`,
    });

    const page = await browser.newPage();
    const query = `"${businessName}" ${location}`;
    const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;

    await page.goto(url, { waitUntil: 'networkidle0' });

    const items = await page.evaluate(() => {
      const results = document.querySelectorAll('li.b_algo');
      return Array.from(results).map(el => {
        const linkEl = el.querySelector('h2 a');
        const citeEl = el.querySelector('cite');
        const snippetEl = el.querySelector('.b_caption p');
        return {
          title: linkEl?.textContent?.trim() || '',
          link: linkEl?.getAttribute('href') || citeEl?.textContent?.trim() || '',
          snippet: snippetEl?.textContent?.trim() || '',
        };
      });
    });

    await browser.close();

    const matches = items
      .filter(m => m.title && m.link)
      .map(m => ({
        title: m.title,
        link: decodeBingUrl(m.link),
        snippet: m.snippet,
      }));

    if (matches.length === 0) {
      return { hasWebsite: false, confidence: 'low', matches: [] };
    }

    const nameParts = businessName.toLowerCase().split(' ').filter(p => p.length > 2);

    let officialSite = null;
    let networkSite = null;

    for (const m of matches) {
      const title = m.title.toLowerCase();
      const snippet = (m.snippet || '').toLowerCase();

      const nameInTitle = nameParts.some(p => title.includes(p));
      const nameInSnippet = nameParts.some(p => snippet.includes(p));

      if (!(nameInTitle || nameInSnippet)) continue;

      if (isNetworkSite(m.link)) {
        if (!networkSite) networkSite = m;
      } else {
        officialSite = m;
        break;
      }
    }

    if (officialSite) {
      return {
        hasWebsite: true,
        confidence: matches.length >= 3 ? 'high' : 'medium',
        matches: [officialSite],
      };
    }

    if (networkSite) {
      return {
        hasWebsite: false,
        confidence: 'low',
        networkSite: networkSite.link,
        matches: [networkSite],
      };
    }

    return { hasWebsite: false, confidence: 'low', matches: [] };
  } finally {
    proc.stdout?.destroy();
    proc.stderr?.destroy();
    proc.kill();
  }
}
