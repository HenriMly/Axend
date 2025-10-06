import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}

export const authService = {
  // Sign up as coach
  async signUpCoach(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: 'coach'
        },
        emailRedirectTo: undefined // Disable email confirmation for development
      }
    })

    if (error) throw error

    // Check if user needs email confirmation
    if (data.user && !data.user.email_confirmed_at && data.user.identities?.length === 0) {
      throw new Error('Veuillez vérifier votre email avant de vous connecter')
    }

    // The coach record will be created automatically by the database trigger
    return data
  },

  // Sign up as client
  async signUpClient(email: string, password: string, name: string, coachCode: string) {
    // First, find the coach
    console.log('Searching for coach with code:', coachCode);
    
    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select('id, coach_code, name')
      .eq('coach_code', coachCode)
      .single()

    console.log('Coach search result:', { coach, coachError });

    if (coachError || !coach) {
      // Also try to list all coaches for debugging
      const { data: allCoaches } = await supabase
        .from('coaches')
        .select('coach_code, name')
        .limit(5);
      
      console.log('Available coaches:', allCoaches);
      throw new Error(`Code coach invalide. Codes disponibles: ${allCoaches?.map(c => c.coach_code).join(', ') || 'aucun'}`)
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: 'client',
          coach_id: coach.id // Store coach_id in metadata for the trigger
        }
      }
    })

    if (error) throw error

    // Create client record manually since trigger can't access coach lookup
    if (data.user) {
      const { error: clientError } = await supabase
        .from('clients')
        .insert({
          id: data.user.id,
          coach_id: coach.id,
          name,
          email
        })

      if (clientError) throw clientError
    }

    return data
  },

  // Sign in
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      // Handle email confirmation error with helpful message
      if (error.message === 'Email not confirmed') {
        throw new Error(
          'Votre email n\'a pas été confirmé. ' +
          'Vérifiez votre boîte mail ou contactez l\'administrateur. ' +
          'En développement, l\'administrateur peut désactiver la confirmation d\'email dans les paramètres Supabase.'
        )
      }
      throw error
    }
    return data
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Get user profile (coach or client)
  async getUserProfile(userId: string) {
    // Try to get coach first
    const { data: coach } = await supabase
      .from('coaches')
      .select('*, clients(*)')
      .eq('id', userId)
      .single()

    if (coach) {
      return { ...coach, role: 'coach' }
    }

    // If not coach, try client
    const { data: client } = await supabase
      .from('clients')
      .select('*, coaches(name, email, coach_code)')
      .eq('id', userId)
      .single()

    if (client) {
      return { ...client, role: 'client' }
    }

    throw new Error('Profil utilisateur non trouvé')
  }
}