import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      workout_session_id,
      exercise_id,
      exercise_name,
      order,
      sets,
      reps,
      weight,
      rest_seconds,
      notes
    } = body;

    if (!workout_session_id || !exercise_name) {
      return NextResponse.json({ error: 'workout_session_id and exercise_name are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.from('workout_session_exercises').insert([{
      workout_session_id,
      exercise_id,
      exercise_name,
      order,
      sets,
      reps,
      weight,
      rest_seconds,
      notes
    }]).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
