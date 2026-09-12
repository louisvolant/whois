// backend/src/worker.js
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { whoisDomain, whoisIp } from 'whoiser';

const app = new Hono();

// Enable CORS for all routes
app.use('*', cors({
  origin: (origin) => origin || '*',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-CSRF-Token'],
}));

// Helper: extract domain name from input URL or string
function extractDomain(input) {
  if (!input) return null;

  let cleaned = input.trim().toLowerCase();

  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    try {
      const url = new URL('http://' + cleaned);
      return url.hostname;
    } catch {
      return cleaned;
    }
  }

  try {
    const url = new URL(cleaned);
    return url.hostname;
  } catch {
    return null;
  }
}

// Helper: merge WHOIS result objects
function mergeWhois(results) {
  if (typeof results !== 'object' || results === null) return results;

  let merged = {};
  const values = Object.values(results).filter(part => typeof part === 'object' && part !== null);
  values.forEach(part => {
    Object.assign(merged, part);
  });
  return merged;
}

// Helper: extract raw text from WHOIS results
function getRaw(results) {
  if (typeof results !== 'object' || results === null) return '';

  if (results.__raw) return results.__raw;

  return Object.values(results)
    .map(part => part.__raw || '')
    .filter(Boolean)
    .join('\n\n---\n\n');
}

// Endpoint: CSRF Token (stateless stub for frontend compatibility)
app.get('/api/csrf-token', (c) => {
  return c.json({ csrfToken: 'cf-csrf-session' });
});

// Endpoint: Get Client IP
app.get('/api/ip', (c) => {
  const cfIp = c.req.header('cf-connecting-ip');
  const forwarded = c.req.header('x-forwarded-for');
  const clientIp = cfIp || (forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1');

  c.header('Cache-Control', 'no-store');
  return c.json({ ip: clientIp });
});

// Endpoint: WHOIS by IP
app.get('/api/whois/:ip', async (c) => {
  const ip = c.req.param('ip');

  if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
    return c.json({
      raw: 'This is a localhost address. No WHOIS data exists for local interfaces.'
    });
  }

  try {
    const result = await whoisIp(ip, { raw: true });
    const raw = getRaw(result);

    // Cache successful lookups at Cloudflare edge for 2 minutes
    c.header('Cache-Control', 'public, max-age=120');
    return c.json({ raw });
  } catch (err) {
    console.error('Whois IP error:', err);
    return c.json({ error: 'Whois lookup failed', message: err.message }, 500);
  }
});

// Endpoint: WHOIS by Domain
app.get('/api/domain-whois', async (c) => {
  const input = c.req.query('domain');
  const domain = extractDomain(input);

  if (!domain) {
    return c.json({ error: 'Invalid domain' }, 400);
  }

  try {
    const data = await whoisDomain(domain, { follow: 3 });
    const parsed = mergeWhois(data);

    // Cache successful lookups at Cloudflare edge for 2 minutes
    c.header('Cache-Control', 'public, max-age=120');
    return c.json({ domain, whois: parsed });
  } catch (err) {
    console.error(`WHOIS error for ${domain}:`, err);
    return c.json({ error: 'WHOIS lookup failed', message: err.message }, 500);
  }
});

export default app;
