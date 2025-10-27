import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import supabaseAdmin from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cookieStore = await cookies();
    const sentinel = cookieStore.get('axend_sess');
    if (!sentinel) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    // body: { workout_id, exercise }
    const { workout_id, exercise } = body;
    if (!workout_id || !exercise) {
      return NextResponse.json({ error: 'Missing workout_id or exercise' }, { status: 400 });
    }
    const insertData = {
      workout_id,
      exercise_id: exercise.exercise_id || null,
      exercise_name: exercise.exercise_name || exercise.name || null,
      exercise_category: exercise.exercise_category || null,
      exercise_equipment: exercise.exercise_equipment || null,
      order_in_workout: exercise.order_in_workout || exercise.order || null,
      sets: typeof exercise.sets !== 'undefined' ? exercise.sets : 3,
      reps: exercise.reps || '12',
      weight: exercise.weight || null,
      rest_time: exercise.rest_time || 60,
      notes: exercise.notes || null
    };
    const { data, error } = await supabaseAdmin.from('workout_exercises').insert(insertData).select().single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
