import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const cfIp = request.headers.get('cf-connecting-ip');
  const forwarded = request.headers.get('x-forwarded-for');
  const clientIp = cfIp || (forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1');

  return NextResponse.json(
    { ip: clientIp },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
