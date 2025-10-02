import { supabase } from './supabase'

export const dataService = {
  // ===== COACH SERVICES =====
  
  // Get all clients for a coach
  async getCoachClients(coachId: string) {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        workouts(id, date, completed),
        measurements(date, weight)
      `)
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Process data to add last workout and current programs
    return data.map(client => ({
      ...client,
      lastWorkout: client.workouts?.[0]?.date || null,
      programs: ['Programme personnalisé'], // TODO: Get real programs
      workoutCount: client.workouts?.length || 0
    }))
  },

  // Get detailed client data
  async getClientDetail(clientId: string) {
    const { data: client, error } = await supabase
      .from('clients')
      .select(`
        *,
        coaches(name, email, coach_code),
        programs(*),
        workouts(
          *,
          workout_exercises(
            *,
            workout_sets(*)
          )
        ),
        measurements(*)
      `)
      .eq('id', clientId)
      .single()

    if (error) throw error

    return client
  },

  // ===== CLIENT SERVICES =====
  
  // Get client's own data
  async getClientData(clientId: string) {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        coaches(name, email, coach_code),
        programs(*),
        workouts(
          *,
          workout_exercises(
            *,
            workout_sets(*)
          )
        ),
        measurements(*)
      `)
      .eq('id', clientId)
      .single()

    if (error) throw error
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
    const { data, error } = await supabase
      .from('programs')
      .insert({
        coach_id: coachId,
        client_id: clientId,
        ...programData
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Get programs for a client
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
  }
}