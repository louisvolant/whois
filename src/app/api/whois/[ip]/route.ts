import { NextRequest, NextResponse } from 'next/server';
import { whoisIp } from 'whoiser';

export const dynamic = 'force-dynamic';

function getRaw(results: unknown): string {
  if (typeof results !== 'object' || results === null) return '';
  const r = results as Record<string, unknown>;
  if (r.__raw && typeof r.__raw === 'string') return r.__raw;

  return Object.values(r)
    .map((part) =>
      part && typeof part === 'object' && '__raw' in part
        ? (part as { __raw?: string }).__raw || ''
        : ''
    )
    .filter(Boolean)
    .join('\n\n---\n\n');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ip: string }> }
) {
  const { ip } = await params;

  if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
    return NextResponse.json({
      raw: 'This is a localhost address. No WHOIS data exists for local interfaces.',
    });
  }

  try {
    const result = await whoisIp(ip);
    const raw = getRaw(result);

    return NextResponse.json(
      { raw },
      {
        headers: {
          'Cache-Control': 'public, max-age=120',
        },
      }
    );
  } catch (err: unknown) {
    console.error(`WHOIS error for IP ${ip}:`, err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Whois lookup failed', message },
      { status: 500 }
    );
  }
}
