import { NextRequest, NextResponse } from 'next/server'

// Minimal AI recommend endpoint using OpenRouter (FREE model)
// POST body: { history: Array<{ tmdbId: number, type: 'movie'|'tv' }>, favorites: Array<{ tmdbId: number, type: 'movie'|'tv' }> }
// Returns: { ids: Array<{ tmdbId: number, type: 'movie' }> } // movies only, ranked best->good

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY
  const { history, favorites } = await req.json().catch(() => ({ history: [], favorites: [] }))

  if (!apiKey) {
    // No key: politely return empty so client uses TMDB fallback
    return NextResponse.json({ ids: [] })
  }

  const recent = Array.isArray(history) ? history.slice(0, 30) : []
  const favs = Array.isArray(favorites) ? favorites.slice(0, 30) : []
  const sys = `Je bent een aanbevelings-assistent voor speelfilms (geen series). Je output is ALLEEN JSON met dit schema:
{"ids": [{"tmdbId": number, "type": "movie"}]}

Regels:
- Stel precies 10 items voor in 'ids' als het kan, anders zo veel mogelijk.
- Gebruik uitsluitend TMDB IDs en type altijd "movie".
- Sorteer van best passend naar ook passend.
- Geef meer gewicht aan favorieten en aan titels die zijn uitgekeken.
- Houd rekening met variatie in genres/jaartallen zodat het niet te eenzijdig wordt.`

  const user = `Gegevens gebruiker:\nFavorieten: ${JSON.stringify(favs)}\nGeschiedenis (laatste eerst): ${JSON.stringify(recent)}`

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        // Deze headers helpen OpenRouter met rate limits en toewijzing
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost',
        'X-Title': 'KittenMovies',
      },
      body: JSON.stringify({
        // Dwing gratis model af; NIET overschrijven naar betaalde varianten
        model: 'x-ai/grok-4-fast:free',
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: user },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ ids: [], error: text }, { status: 200 })
    }
    const data = await res.json()
    const content: string = data.choices?.[0]?.message?.content || '{}'
    let parsed: any
    try { parsed = JSON.parse(content) } catch { parsed = { ids: [] } }
    const ids = Array.isArray(parsed.ids) ? parsed.ids.slice(0, 8) : []
    return NextResponse.json({ ids })
  } catch (e: any) {
    return NextResponse.json({ ids: [], error: String(e) }, { status: 200 })
  }
}
