import { supabase } from './supabase'

export const dataService = {
  // ===== COACH SERVICES =====
  
  // Get all clients for a coach
  async getCoachClients(coachId: string) {
    console.log('[dataService.getCoachClients] Starting with coachId:', coachId);
    
    // Try the rich select (may fail on some PostgREST setups)
    try {
      console.log('[dataService.getCoachClients] Attempting complex select...');
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          measurements(date, weight),
          programs(name)
        `)
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false })

      console.log('[dataService.getCoachClients] Complex select result:', { data, error });

      if (error) throw error

      // Process data to add last workout and current programs
      const processedClients = data.map(client => ({
        ...client,
        lastWorkout: null, // À corriger plus tard quand la relation workouts sera créée
        programs: client.programs?.map((p: any) => p.name) || ['Programme personnalisé'],
        workoutCount: 0 // À corriger plus tard
      }));
      
      console.log('[dataService.getCoachClients] Complex select success, returning:', processedClients);
      return processedClients;
    } catch (err) {
      // Fallback: fetch clients + workouts/measurements only, then fetch programs separately
      console.warn('[dataService.getCoachClients] complex select failed, falling back:', err)

      const { data: clientsSimple, error: clientsErr } = await supabase
        .from('clients')
        .select(`
          *,
          measurements(date, weight)
        `)
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false })

      if (clientsErr) throw clientsErr

      // Fetch programs for this coach (group by client_id)
      const { data: programsList, error: programsErr } = await supabase
        .from('programs')
        .select('id, name, client_id')
        .eq('coach_id', coachId)

      if (programsErr) {
        console.warn('[dataService.getCoachClients] failed to fetch programs', programsErr)
      }

  const programMap: Record<string, string[]> = {} as Record<string, string[]>
      (programsList || []).forEach((p: any) => {
        if (!p.client_id) return
        programMap[p.client_id] = programMap[p.client_id] || []
        programMap[p.client_id].push(p.name)
      })

      return (clientsSimple || []).map(client => ({
        ...client,
        lastWorkout: null, // À corriger plus tard quand la relation workouts sera créée
        programs: programMap[client.id] || ['Programme personnalisé'],
        workoutCount: 0 // À corriger plus tard
      }))
    }
  },

  // Get detailed client data
  async getClientDetail(clientId: string) {
    console.log('[dataService.getClientDetail] Loading client:', clientId);
    
    const { data: client, error } = await supabase
      .from('clients')
      .select(`
        *,
        coaches(name, email, coach_code),
        measurements(*)
      `)
      .eq('id', clientId)
      .single()

    if (error) {
      console.error('[dataService.getClientDetail] Error:', error);
      throw error;
    }

    // Récupérer tous les programmes (anciens et nouveaux) séparément
    try {
      console.log('[dataService.getClientDetail] Loading all programs for client:', clientId);
      
      // Récupérer tous les programmes (simple query pour compatibilité)
      const { data: allPrograms, error: progError } = await supabase
        .from('programs')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (progError) {
        console.warn('[dataService.getClientDetail] Programs query failed:', progError);
        client.programs = [];
      } else {
        client.programs = allPrograms || [];
        console.log('[dataService.getClientDetail] Programs loaded:', client.programs.length);
      }
    } catch (programError) {
      console.error('[dataService.getClientDetail] Failed to load programs:', programError);
      client.programs = []; // Fallback vide
    }

    console.log('[dataService.getClientDetail] Success:', client);
    return client
  },

  // ===== CLIENT SERVICES =====
  
  // Get client's own data
  async getClientData(clientId: string) {
    console.log('[dataService.getClientData] Loading client data:', clientId);
    
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        coaches(name, email, coach_code),
        programs(*),
        measurements(*)
      `)
      .eq('id', clientId)
      .single()

    if (error) {
      console.error('[dataService.getClientData] Error:', error);
      throw error;
    }

    console.log('[dataService.getClientData] Success:', data);
    return data
  },

  // ===== PROGRAM SERVICES =====
  
  // Create a new program
  async createProgram(coachId: string, clientId: string | null, programData: {
    name: string
    description?: string
    frequency?: string
    duration?: string
  }) {
    console.log('[dataService.createProgram] Starting with:', { coachId, clientId, programData });
    
    const insertData = {
      coach_id: coachId,
      client_id: clientId,
      ...programData
    };
    
    console.log('[dataService.createProgram] Insert data:', insertData);
    
    const { data, error } = await supabase
      .from('programs')
      .insert(insertData)
      .select()
      .single()

    console.log('[dataService.createProgram] Result:', { data, error });
    
    if (error) {
      console.error('[dataService.createProgram] Error:', error);
      throw error;
    }
    
    console.log('[dataService.createProgram] Success:', data);
    return data
  },

  // Get programs for a client (old system - compatibility)
  async getClientPrograms(clientId: string) {
    const { data, error } = await supabase
      .from('programs')
      .select(`
        *,
        exercises(*)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Get programs with full advanced structure
  async getClientProgramsAdvanced(clientId: string) {
    const { data, error } = await supabase
      .from('programs')
      .select(`
        *,
        program_days(
          *,
          workouts(
            *,
            workout_exercises(*)
          )
        )
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Get today's workout for a client (for workout interface)
  async getTodayWorkout(clientId: string) {
    console.log('[dataService.getTodayWorkout] Loading today workout for client:', clientId);
    
    const today = new Date();
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay(); // Convert Sunday from 0 to 7
    
    const { data, error } = await supabase
      .from('programs')
      .select(`
        id,
        name,
        program_days!inner(
          id,
          day_of_week,
          day_name,
          is_rest_day,
          workouts(
            id,
            name,
            time_slot,
            estimated_duration,
            workout_exercises(
              id,
              exercise_id,
              exercise_name,
              exercise_category,
              exercise_equipment,
              sets,
              reps,
              weight,
              rest_time,
              notes,
              order_in_workout
            )
          )
        )
      `)
      .eq('client_id', clientId)
      .eq('program_days.day_of_week', dayOfWeek)
      .eq('program_days.is_rest_day', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[dataService.getTodayWorkout] Error:', error);
      throw error;
    }

    console.log('[dataService.getTodayWorkout] Result:', data);
    return data;
  },

  // Update a program
  async updateProgram(programId: string, updates: { name?: string; description?: string; frequency?: string; duration?: string; }) {
    const { data, error } = await supabase
      .from('programs')
      .update(updates)
      .eq('id', programId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete a program
  async deleteProgram(programId: string) {
    const { data, error } = await supabase
      .from('programs')
      .delete()
      .eq('id', programId)
      .select()

    if (error) throw error
    return data
  },

  // ===== WORKOUT SERVICES =====
  
  // Create a workout session
  async createWorkout(workoutData: {
    client_id: string
    program_id?: string
    date: string
    duration?: number
    notes?: string
  }) {
    const { data, error } = await supabase
      .from('workouts')
      .insert(workoutData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Get workouts for a client
  async getClientWorkouts(clientId: string, limit?: number) {
    let query = supabase
      .from('workouts')
      .select(`
        *,
        workout_exercises(
          *,
          workout_sets(*)
        )
      `)
      .eq('client_id', clientId)
      .order('date', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  },

  // Complete a workout
  async completeWorkout(workoutId: string) {
    const { data, error } = await supabase
      .from('workouts')
      .update({ completed: true })
      .eq('id', workoutId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // ===== MEASUREMENT SERVICES =====
  
  // Add a measurement
  async addMeasurement(measurementData: {
    client_id: string
    date: string
    weight?: number
    body_fat?: number
    muscle_mass?: number
  }) {
    const { data, error } = await supabase
      .from('measurements')
      .upsert(measurementData, {
        onConflict: 'client_id,date'
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Get measurements for a client
  async getClientMeasurements(clientId: string, limit?: number) {
    let query = supabase
      .from('measurements')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  },

  // ===== STATS SERVICES =====
  
  // Get coach dashboard stats
  async getCoachStats(coachId: string) {
    // Get total clients
    const { count: totalClients } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId)

    // Get active clients (workout in last 7 days)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const { data: activeClients } = await supabase
      .from('workouts')
      .select('client_id')
      .gte('date', weekAgo.toISOString().split('T')[0])
      .in('client_id', 
        await supabase
          .from('clients')
          .select('id')
          .eq('coach_id', coachId)
          .then(({ data }) => data?.map(c => c.id) || [])
      )

    const uniqueActiveClients = new Set(activeClients?.map(w => w.client_id)).size

    // Get total programs
    const { count: totalPrograms } = await supabase
      .from('programs')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId)

    return {
      totalClients: totalClients || 0,
      activeClients: uniqueActiveClients,
      totalPrograms: totalPrograms || 0,
      successRate: 87 // TODO: Calculate real success rate
    }
  },

  // ===== ADVANCED PROGRAM SERVICES =====
  
  // Create advanced program with days, workouts and exercises
  async createAdvancedProgram(coachId: string, clientId: string, programData: any) {
    try {
      // 1. Create the main program
      const { data: program, error: programError } = await supabase
        .from('programs')
        .insert({
          coach_id: coachId,
          client_id: clientId,
          name: programData.name,
          description: programData.description,
          weeks: programData.weeks,
          goal: programData.goal
        })
        .select()
        .single();

      if (programError) throw programError;

      // 2. Create program days
      const programDaysData = programData.days.map((day: any) => ({
        program_id: program.id,
        day_of_week: day.day_of_week,
        day_name: day.day_name,
        is_rest_day: day.is_rest_day
      }));

      const { data: createdDays, error: daysError } = await supabase
        .from('program_days')
        .insert(programDaysData)
        .select();

      if (daysError) throw daysError;

      // 3. Create workouts for non-rest days
      const workoutsData: any[] = [];
      programData.days.forEach((day: any, dayIndex: number) => {
        if (!day.is_rest_day && day.workouts.length > 0) {
          const createdDay = createdDays[dayIndex];
          day.workouts.forEach((workout: any) => {
            workoutsData.push({
              program_day_id: createdDay.id,
              name: workout.name,
              time_slot: workout.time_slot,
              estimated_duration: workout.estimated_duration
            });
          });
        }
      });

      if (workoutsData.length > 0) {
        const { data: createdWorkouts, error: workoutsError } = await supabase
          .from('workouts')
          .insert(workoutsData)
          .select();

        if (workoutsError) throw workoutsError;

        // 4. Create workout exercises (if any)
        const exercisesData: any[] = [];
        let workoutIndex = 0;
        programData.days.forEach((day: any) => {
          if (!day.is_rest_day && day.workouts.length > 0) {
            day.workouts.forEach((workout: any) => {
              if (workout.exercises.length > 0) {
                const createdWorkout = createdWorkouts[workoutIndex];
                workout.exercises.forEach((exercise: any) => {
                  exercisesData.push({
                    workout_id: createdWorkout.id,
                    exercise_id: exercise.exercise_id,
                    exercise_name: exercise.exercise_name,
                    exercise_category: exercise.exercise_category,
                    exercise_equipment: exercise.exercise_equipment,
                    order_in_workout: exercise.order_in_workout,
                    sets: exercise.sets,
                    reps: exercise.reps,
                    weight: exercise.weight,
                    rest_time: exercise.rest_time,
                    notes: exercise.notes
                  });
                });
              }
              workoutIndex++;
            });
          }
        });

        if (exercisesData.length > 0) {
          const { error: exercisesError } = await supabase
            .from('workout_exercises')
            .insert(exercisesData);

          if (exercisesError) throw exercisesError;
        }
      }

      return program;
    } catch (error) {
      console.error('Error creating advanced program:', error);
      console.error('Error details:', (error as any)?.message, (error as any)?.code, (error as any)?.details);
      throw error;
    }
  },

  // Update advanced program
  async updateAdvancedProgram(programId: string, programData: any) {
    try {
      // 1. Update main program
      const { error: programError } = await supabase
        .from('programs')
        .update({
          name: programData.name,
          description: programData.description,
          weeks: programData.weeks,
          goal: programData.goal
        })
        .eq('id', programId);

      if (programError) throw programError;

      // 2. Delete existing days (cascade will handle workouts and exercises)
      const { error: deleteDaysError } = await supabase
        .from('program_days')
        .delete()
        .eq('program_id', programId);

      if (deleteDaysError) throw deleteDaysError;

      // 3. Recreate days with new structure
      const programDaysData = programData.days.map((day: any) => ({
        program_id: programId,
        day_of_week: day.day_of_week,
        day_name: day.day_name,
        is_rest_day: day.is_rest_day
      }));

      const { data: createdDays, error: daysError } = await supabase
        .from('program_days')
        .insert(programDaysData)
        .select();

      if (daysError) throw daysError;

      // 4. Create workouts for non-rest days
      const workoutsData: any[] = [];
      programData.days.forEach((day: any, dayIndex: number) => {
        if (!day.is_rest_day && day.workouts.length > 0) {
          const createdDay = createdDays[dayIndex];
          day.workouts.forEach((workout: any) => {
            workoutsData.push({
              program_day_id: createdDay.id,
              name: workout.name,
              time_slot: workout.time_slot,
              estimated_duration: workout.estimated_duration
            });
          });
        }
      });

      if (workoutsData.length > 0) {
        const { data: createdWorkouts, error: workoutsError } = await supabase
          .from('workouts')
          .insert(workoutsData)
          .select();

        if (workoutsError) throw workoutsError;

        // 5. Create workout exercises (if any)
        const exercisesData: any[] = [];
        let workoutIndex = 0;
        programData.days.forEach((day: any) => {
          if (!day.is_rest_day && day.workouts.length > 0) {
            day.workouts.forEach((workout: any) => {
              if (workout.exercises.length > 0) {
                const createdWorkout = createdWorkouts[workoutIndex];
                workout.exercises.forEach((exercise: any) => {
                  exercisesData.push({
                    workout_id: createdWorkout.id,
                    exercise_id: exercise.exercise_id,
                    exercise_name: exercise.exercise_name,
                    exercise_category: exercise.exercise_category,
                    exercise_equipment: exercise.exercise_equipment,
                    order_in_workout: exercise.order_in_workout,
                    sets: exercise.sets,
                    reps: exercise.reps,
                    weight: exercise.weight,
                    rest_time: exercise.rest_time,
                    notes: exercise.notes
                  });
                });
              }
              workoutIndex++;
            });
          }
        });

        if (exercisesData.length > 0) {
          const { error: exercisesError } = await supabase
            .from('workout_exercises')
            .insert(exercisesData);

          if (exercisesError) throw exercisesError;
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating advanced program:', error);
      throw error;
    }
  },

  // Get full program with days, workouts and exercises
  async getAdvancedProgram(programId: string) {
    try {
      const { data: program, error: programError } = await supabase
        .from('programs')
        .select(`
          *,
          program_days (
            *,
            workouts (
              *,
              workout_exercises (*)
            )
          )
        `)
        .eq('id', programId)
        .single();

      if (programError) throw programError;
      return program;
    } catch (error) {
      console.error('Error fetching advanced program:', error);
      throw error;
    }
  }
}