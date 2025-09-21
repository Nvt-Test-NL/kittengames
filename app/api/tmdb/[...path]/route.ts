import { NextRequest, NextResponse } from 'next/server'

const TMDB_BASE = 'https://api.themoviedb.org/3'

export async function GET(req: NextRequest, { params }: { params: { path?: string[] } }) {
  const token = process.env.TMDB_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'TMDB token not configured' }, { status: 500 })
  }

  const pathSegments = params.path?.join('/') ?? ''
  const url = new URL(`${TMDB_BASE}/${pathSegments}`)

  // Forward all query parameters
  req.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value)
  })

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
      },
      // Prevent caching dynamic calls; adjust if you want ISR
      cache: 'no-store',
    })

    const body = await res.text()
    return new NextResponse(body, {
      status: res.status,
      headers: {
        'content-type': res.headers.get('content-type') || 'application/json',
        'cache-control': 'no-store',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: 'Proxy request failed', detail: String(err) }, { status: 502 })
  }
}
