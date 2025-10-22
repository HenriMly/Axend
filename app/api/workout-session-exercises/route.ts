import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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

    // Require sentinel cookie set by middleware for authenticated requests
    const cookieStore = await cookies();
    const sentinel = cookieStore.get('axend_sess');
    if (!sentinel) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
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
