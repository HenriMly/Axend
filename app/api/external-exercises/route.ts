import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { muscle, name } = body || {};

    const params = new URLSearchParams();
    if (muscle) params.set('muscle', String(muscle));
    if (name) params.set('name', String(name));

    const url = `https://api.api-ninjas.com/v1/exercises?${params.toString()}`;
    if (!process.env.API_NINJAS_KEY) {
      console.warn('[external-exercises] API_NINJAS_KEY is missing');
    } else {
      console.info('[external-exercises] API_NINJAS_KEY is present');
    }
    const res = await fetch(url, {
      headers: {
        'X-Api-Key': process.env.API_NINJAS_KEY || ''
      }
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: 'External API error', details: text }, { status: 502 });
    }

    const data = await res.json();
    // Normalize a bit: ensure array
    return NextResponse.json({ data: Array.isArray(data) ? data : [] });
  } catch (e) {
    console.error('external-exercises error', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
