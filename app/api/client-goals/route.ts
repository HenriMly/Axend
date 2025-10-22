import supabaseAdmin from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sentinel = cookieStore.get('axend_sess');
    if (!sentinel) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const body = await req.json();
    const { action, payload } = body;

    if (!action || !payload) return NextResponse.json({ error: 'Missing action or payload' }, { status: 400 });

    if (action === 'create') {
      // payload should include client_id, coach_id, title
      const { client_id, coach_id } = payload;
      if (!client_id || !coach_id) return NextResponse.json({ error: 'client_id and coach_id required' }, { status: 400 });

      // Enforce ownership: ensure coach owns the client
      const { data: client, error: clientErr } = await supabaseAdmin.from('clients').select('coach_id').eq('id', client_id).single();
      if (clientErr) return NextResponse.json({ error: 'Client lookup failed' }, { status: 500 });
      if (client.coach_id !== coach_id) return NextResponse.json({ error: 'Not authorized for this client' }, { status: 403 });

      const { data, error } = await supabaseAdmin.from('client_goals').insert(payload).select().single();
      if (error) return NextResponse.json({ error }, { status: 500 });
      return NextResponse.json({ data });
    }

    if (action === 'update') {
      const { id, coach_id, ...updates } = payload;
      if (!id || !coach_id) return NextResponse.json({ error: 'id and coach_id required' }, { status: 400 });

      // Verify ownership
      const { data: existing, error: exErr } = await supabaseAdmin.from('client_goals').select('coach_id').eq('id', id).single();
      if (exErr) return NextResponse.json({ error: 'Goal lookup failed' }, { status: 500 });
      if (existing.coach_id !== coach_id) return NextResponse.json({ error: 'Not authorized to update this goal' }, { status: 403 });

      const { data, error } = await supabaseAdmin.from('client_goals').update(updates).eq('id', id).select().single();
      if (error) return NextResponse.json({ error }, { status: 500 });
      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    console.error('client-goals POST error', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const cookieStore = await cookies();
    const sentinel = cookieStore.get('axend_sess');
    if (!sentinel) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const body = await req.json();
    const { id, coach_id } = body;
    if (!id || !coach_id) return NextResponse.json({ error: 'id and coach_id required' }, { status: 400 });

    // Verify ownership
    const { data: existing, error: exErr } = await supabaseAdmin.from('client_goals').select('coach_id').eq('id', id).single();
    if (exErr) return NextResponse.json({ error: 'Goal lookup failed' }, { status: 500 });
    if (existing.coach_id !== coach_id) return NextResponse.json({ error: 'Not authorized to delete this goal' }, { status: 403 });

    const { data, error } = await supabaseAdmin.from('client_goals').delete().eq('id', id).select();
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ data });
  } catch (e) {
    console.error('client-goals DELETE error', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
