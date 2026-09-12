import { NextRequest, NextResponse } from 'next/server';
import { whoisDomain } from 'whoiser';

export const dynamic = 'force-dynamic';

function extractDomain(input: string | null): string | null {
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

function mergeWhois(results: unknown): Record<string, unknown> {
  if (typeof results !== 'object' || results === null) return {};

  const merged: Record<string, unknown> = {};
  const values = Object.values(results as Record<string, unknown>).filter(
    (part): part is Record<string, unknown> => typeof part === 'object' && part !== null
  );
  values.forEach((part) => {
    Object.assign(merged, part);
  });
  return merged;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domainInput = searchParams.get('domain');
  const domain = extractDomain(domainInput);

  if (!domain) {
    return NextResponse.json({ error: 'Invalid domain' }, { status: 400 });
  }

  try {
    const data = await whoisDomain(domain, { follow: 2 });
    const parsed = mergeWhois(data);

    return NextResponse.json(
      { domain, whois: parsed },
      {
        headers: {
          'Cache-Control': 'public, max-age=120',
        },
      }
    );
  } catch (err: unknown) {
    console.error(`WHOIS error for ${domain}:`, err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'WHOIS lookup failed', message },
      { status: 500 }
    );
  }
}
