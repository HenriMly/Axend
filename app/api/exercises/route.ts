import supabaseAdmin from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    if (!action) return NextResponse.json({ error: 'Missing action' }, { status: 400 });

    if (action === 'create') {
      // payload should include program_id, name, coach_id (optional but recommended)
        if (!payload || !payload.name || !payload.program_id) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

        // If a workout_id is present, create a workout_exercises join row directly
        if (payload.workout_id) {
          try {
            const wePayload: any = {
              workout_id: payload.workout_id,
              exercise_id: payload.exercise_external_id || payload.exercise_id || payload.name,
              exercise_name: payload.name,
              exercise_category: payload.category || payload.exercise_category || null,
              exercise_equipment: payload.equipment || payload.exercise_equipment || null,
              order_in_workout: payload.order_in_workout || 1,
              sets: payload.sets || 3,
              reps: payload.reps || '12',
              weight: payload.weight || null,
              rest_time: payload.rest_time || 60,
              notes: payload.notes || ''
            };

            const { data: weData, error: weError } = await supabaseAdmin.from('workout_exercises').insert(wePayload).select().single();
            if (weError) {
              console.error('workout_exercises insert error', weError);
              const errMsg = weError?.message || JSON.stringify(weError);
              return NextResponse.json({ error: errMsg }, { status: 500 });
            }
            return NextResponse.json({ data: weData });
          } catch (e) {
            console.error('workout_exercises create exception', e);
            return NextResponse.json({ error: String(e) }, { status: 500 });
          }
        }

      // Optionally enforce ownership: if coach_id provided, verify program belongs to coach
      if (payload.coach_id) {
        const { data: program, error: progErr } = await supabaseAdmin.from('programs').select('coach_id').eq('id', payload.program_id).single();
        if (progErr) return NextResponse.json({ error: 'Program lookup failed' }, { status: 500 });
        if (program.coach_id !== payload.coach_id) return NextResponse.json({ error: 'Not authorized to add exercise to this program' }, { status: 403 });
      }

      const { data, error } = await supabaseAdmin.from('exercises').insert(payload).select().single();
      if (error) {
        console.error('exercises create error', error);
        const errMsg = error?.message || JSON.stringify(error);
        return NextResponse.json({ error: errMsg }, { status: 500 });
      }
      return NextResponse.json({ data });
    }

    if (action === 'update') {
      if (!payload || !payload.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
      const id = payload.id;
      const updates = { ...payload };
      delete (updates as any).id;

      // Optionally verify ownership if coach_id provided
      if (payload.coach_id) {
        const { data: existing, error: exErr } = await supabaseAdmin.from('exercises').select('program_id').eq('id', id).single();
        if (exErr) return NextResponse.json({ error: 'Exercise lookup failed' }, { status: 500 });
        const { data: program, error: progErr } = await supabaseAdmin.from('programs').select('coach_id').eq('id', existing.program_id).single();
        if (progErr) return NextResponse.json({ error: 'Program lookup failed' }, { status: 500 });
        if (program.coach_id !== payload.coach_id) return NextResponse.json({ error: 'Not authorized to update this exercise' }, { status: 403 });
      }

      const { data, error } = await supabaseAdmin.from('exercises').update(updates).eq('id', id).select().single();
      if (error) {
        console.error('exercises update error', error);
        const errMsg = error?.message || JSON.stringify(error);
        return NextResponse.json({ error: errMsg }, { status: 500 });
      }
      return NextResponse.json({ data });
    }

    if (action === 'list') {
      // Accept optional filters: program_id, coach_id
      const where: any = {};
      if (payload?.program_id) where.program_id = payload.program_id;
      if (payload?.coach_id) where.coach_id = payload.coach_id;

      let query = supabaseAdmin.from('exercises').select('*');
      if (where.program_id) query = query.eq('program_id', where.program_id);
      if (where.coach_id) query = query.eq('coach_id', where.coach_id);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) {
        console.error('exercises list error', error);
        const errMsg = error?.message || JSON.stringify(error);
        return NextResponse.json({ error: errMsg }, { status: 500 });
      }
      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    console.error('exercises POST error', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id, coach_id } = body;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    // If coach_id provided, verify ownership via program->coach
    if (coach_id) {
      const { data: existing, error: exErr } = await supabaseAdmin.from('exercises').select('program_id').eq('id', id).single();
      if (exErr) return NextResponse.json({ error: 'Exercise lookup failed' }, { status: 500 });
      const { data: program, error: progErr } = await supabaseAdmin.from('programs').select('coach_id').eq('id', existing.program_id).single();
      if (progErr) return NextResponse.json({ error: 'Program lookup failed' }, { status: 500 });
      if (program.coach_id !== coach_id) return NextResponse.json({ error: 'Not authorized to delete this exercise' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin.from('exercises').delete().eq('id', id).select();
    if (error) {
      console.error('exercises delete error', error);
      const errMsg = error?.message || JSON.stringify(error);
      return NextResponse.json({ error: errMsg }, { status: 500 });
    }
    return NextResponse.json({ data });
  } catch (e) {
    console.error('exercises DELETE error', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
