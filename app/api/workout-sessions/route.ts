import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // body: { action: 'create'|'update', payload: {...} }
    const { action, payload } = body

    if (action === 'create') {
      const { data, error } = await supabaseAdmin.from('workout_sessions').insert(payload).select().single()
      if (error) return NextResponse.json({ error }, { status: 500 })
      return NextResponse.json({ data })
    }

    if (action === 'update') {
      if (!payload.id) return NextResponse.json({ error: 'missing id' }, { status: 400 })
      const id = payload.id
      delete payload.id
      const { data, error } = await supabaseAdmin.from('workout_sessions').update(payload).eq('id', id).select().single()
      if (error) return NextResponse.json({ error }, { status: 500 })
      return NextResponse.json({ data })
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });

    const { data, error } = await supabaseAdmin.from('workout_sessions').delete().eq('id', id).select();
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
