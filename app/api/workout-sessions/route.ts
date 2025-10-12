import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseAdmin'

function serializeError(err: any) {
  if (!err) return 'unknown error'
  if (typeof err === 'string') return err
  if (err && typeof err.message === 'string') return err.message
  try {
    return JSON.parse(JSON.stringify(err))
  } catch (e) {
    return String(err)
  }
}

function safeSerialize(obj: any) {
  try {
    // Try plain JSON first
    return JSON.parse(JSON.stringify(obj));
  } catch (e) {
    try {
      // Fallback to string
      return String(obj);
    } catch (e2) {
      return 'unserializable error';
    }
  }
}
function errorText(obj: any) {
  try {
    if (!obj) return 'unknown error';
    if (typeof obj === 'string') return obj;
    // If it's already a simple object, try JSON stringify
    try {
      const j = JSON.stringify(obj);
      if (j && j !== '{}' ) return j;
    } catch (e) {
      // ignore
    }
    // If safeSerialize returns a primitive or object, coerce to string
    const s = safeSerialize(obj);
    return typeof s === 'string' ? s : JSON.stringify(s);
  } catch (e) {
    return String(obj);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // body: { action: 'create'|'update', payload: {...} }
    const { action, payload } = body

    if (action === 'create') {
      const { data, error } = await supabaseAdmin.from('workout_sessions').insert(payload).select().single()
        if (error) {
          console.error('[workout-sessions][create] error:', error)
          return NextResponse.json({ ok: false, error: errorText(error) }, { status: 500 })
        }
      return NextResponse.json({ ok: true, data: data ?? null })
    }

    if (action === 'update') {
      if (!payload.id) return NextResponse.json({ error: 'missing id' }, { status: 400 })
      const id = payload.id
      delete payload.id
      const { data, error } = await supabaseAdmin.from('workout_sessions').update(payload).eq('id', id).select().single()
        if (error) {
          console.error('[workout-sessions][update] error for id', id, error)
          return NextResponse.json({ ok: false, error: errorText(error) }, { status: 500 })
        }
      return NextResponse.json({ ok: true, data: data ?? null })
    }

    // Complete with detailed exercises and sets
    if (action === 'complete_with_details') {
      const { session_id, duration_minutes, notes, exercises } = payload || {}
      if (!session_id) return NextResponse.json({ error: 'missing session_id' }, { status: 400 })

      // Update session status/duration/notes first
  const updatePayload: any = { status: 'completed' }
      if (typeof duration_minutes !== 'undefined') updatePayload.duration_minutes = duration_minutes
      if (typeof notes !== 'undefined') updatePayload.notes = notes
  // include exercises count if available
  if (Array.isArray(exercises)) updatePayload.exercises_count = exercises.length

      // Try RPC first for atomic insert (if the function exists in DB)
      try {
        const rpcPayload = {
          p_session_id: session_id,
          p_duration_minutes: typeof duration_minutes !== 'undefined' ? duration_minutes : null,
          p_notes: typeof notes !== 'undefined' ? notes : null,
          p_exercises: Array.isArray(exercises) ? JSON.stringify(exercises) : null
        }
        const { data: rpcRes, error: rpcErr } = await supabaseAdmin.rpc('complete_workout_session', rpcPayload as any)
        if (!rpcErr && rpcRes) {
          const rpcOk = Array.isArray(rpcRes) ? (rpcRes[0]?.ok ?? false) : (rpcRes?.ok ?? false)
          if (rpcOk) {
            const { data: updatedSession, error: updErr2 } = await supabaseAdmin.from('workout_sessions').select().eq('id', session_id).single()
            if (updErr2) {
              console.error('[workout-sessions][complete_with_details] rpc succeeded but failed fetch session', session_id, updErr2)
              return NextResponse.json({ ok: true, data: { session: null, note: 'rpc_succeeded_but_failed_fetch_session' } })
            }
            return NextResponse.json({ ok: true, data: { session: updatedSession, rpc: true } })
          }
          console.error('[workout-sessions][complete_with_details] rpc returned failure', rpcRes)
        } else if (rpcErr) {
          console.error('[workout-sessions][complete_with_details] rpc call error', rpcErr)
        }
      } catch (e) {
        console.error('[workout-sessions][complete_with_details] rpc call threw', e)
      }

      // Fallback: do the update + inserts in JS (existing logic)
      const { data: updatedSession, error: updErr } = await supabaseAdmin.from('workout_sessions').update(updatePayload).eq('id', session_id).select().single()
      if (updErr) {
        console.error('[workout-sessions][complete_with_details] failed update session', session_id, updErr)
          return NextResponse.json({ ok: false, error: errorText(updErr) }, { status: 500 })
      }

      // Insert session exercises (if provided)
      let insertedExercises: any[] = []
      if (Array.isArray(exercises) && exercises.length > 0) {
        const exercisesInsert = exercises.map((ex: any) => ({
          workout_session_id: session_id,
          workout_exercise_id: ex.workout_exercise_id || null,
          exercise_id: ex.exercise_id || null,
          exercise_name: ex.exercise_name || ex.exercise_name || ex.name || null,
          "order": ex.order_in_workout || ex.order || null,
          sets: typeof ex.sets !== 'undefined' ? ex.sets : (ex.planned_sets || null),
          reps: ex.reps || ex.planned_reps || null,
          weight: ex.weight || ex.planned_weight || null,
          rest_seconds: ex.rest_time || ex.planned_rest_seconds || null,
          notes: ex.notes || ex.instructions || null
        }))

        const { data: ie, error: ieErr } = await supabaseAdmin.from('workout_session_exercises').insert(exercisesInsert).select()
        if (ieErr) {
          console.error('[workout-sessions][complete_with_details] failed insert exercises', ieErr)
          // Fallback: persist full JSON into workout_sessions.exercises to avoid data loss
          try {
            const fallbackPayload: any = { exercises: exercises }
            const { data: fallbackData, error: fallbackErr } = await supabaseAdmin.from('workout_sessions').update(fallbackPayload).eq('id', session_id).select().single()
            if (fallbackErr) {
              console.error('[workout-sessions][complete_with_details] fallback update failed', fallbackErr)
                return NextResponse.json({ ok: false, error: { original: errorText(ieErr), fallback_error: errorText(fallbackErr) } }, { status: 500 })
            }
            console.log('[workout-sessions][complete_with_details] fallback saved into workout_sessions.exercises')
            return NextResponse.json({ ok: true, data: { session: updatedSession, fallback_saved: true } })
          } catch (e) {
            console.error('[workout-sessions][complete_with_details] fallback unexpected error', e)
              return NextResponse.json({ ok: false, error: errorText(ieErr) }, { status: 500 })
          }
        }
        insertedExercises = ie || []

        // Prepare and insert sets if any completedSets were provided
        const setsToInsert: any[] = []
        for (let i = 0; i < exercises.length; i++) {
          const completed = exercises[i].completedSets || []
          const inserted = insertedExercises[i]
          if (!inserted) continue
          for (let j = 0; j < completed.length; j++) {
            const cs = completed[j]
            setsToInsert.push({
              session_exercise_id: inserted.id,
              set_number: cs.setNumber || (j + 1),
              reps_completed: typeof cs.repsCompleted !== 'undefined' ? cs.repsCompleted : (cs.reps || null),
              weight_used: typeof cs.weightUsed !== 'undefined' ? cs.weightUsed : (cs.weight || null),
              duration_seconds: cs.durationSeconds || cs.duration || null
            })
          }
        }

        if (setsToInsert.length > 0) {
          const { data: insertedSets, error: setsErr } = await supabaseAdmin.from('workout_session_sets').insert(setsToInsert).select()
          if (setsErr) {
            console.error('[workout-sessions][complete_with_details] failed insert sets', setsErr)
            return NextResponse.json({ ok: false, error: errorText(setsErr) }, { status: 500 })
          }

          // Mirror inserted sets into legacy `workout_sets` table if it exists
          try {
            // Build rows for workout_sets; map workout_exercise_id if available
            const workoutSetsRows: any[] = []
            for (let k = 0; k < insertedSets.length; k++) {
              const s = insertedSets[k]
              // find the original exercise payload that corresponds to this session_exercise_id
              const originalEx = exercises.find((ex: any) => {
                // match by workout_exercise_id if present, or by exercise_name/order
                if (ex.workout_exercise_id && ex.workout_exercise_id === (insertedExercises.find((ie:any)=> ie.id === s.session_exercise_id)?.workout_exercise_id)) return true
                return false
              }) || null

              const workoutExerciseId = originalEx?.workout_exercise_id || insertedExercises.find((ie:any)=> ie.id === s.session_exercise_id)?.workout_exercise_id || null

              workoutSetsRows.push({
                workout_exercise_id: workoutExerciseId || s.session_exercise_id,
                reps: s.reps_completed ?? null,
                weight: s.weight_used ?? null,
                completed: true,
                rest_seconds: s.duration_seconds ?? null
              })
            }

            if (workoutSetsRows.length > 0) {
              // try insert, ignore error if table missing
              const { error: mirrorErr } = await supabaseAdmin.from('workout_sets').insert(workoutSetsRows)
              if (mirrorErr) {
                console.warn('[workout-sessions][complete_with_details] could not mirror into workout_sets:', mirrorErr)
              }
            }
          } catch (e) {
            console.warn('[workout-sessions][complete_with_details] mirror into workout_sets failed:', e)
          }
        }
      }

      return NextResponse.json({ ok: true, data: { session: updatedSession, exercises: insertedExercises } })
    }

    return NextResponse.json({ ok: false, error: 'unknown action' }, { status: 400 })
  } catch (err) {
    console.error('[workout-sessions][POST] unexpected error', err)
      return NextResponse.json({ ok: false, error: errorText(err) }, { status: 500 })
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
