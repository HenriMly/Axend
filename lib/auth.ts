import { supabase } from './supabase'

function normalizeEmail(email?: string) {
  return (email || '').trim().toLowerCase()
}

function extractErrorMessage(err: any) {
  if (!err) return 'Unknown error'
  if (typeof err === 'string') return err
  if (err.message) return err.message
  if (err.error) return extractErrorMessage(err.error)
  try { return JSON.stringify(err) } catch { return String(err) }
}

export const authService = {
  async signUpCoach(email: string, password: string, name: string) {
    const normalizedEmail = normalizeEmail(email)
    try {
      const redirectTo = (typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL) || undefined
      const res = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { name, role: 'coach' },
          emailRedirectTo: redirectTo,
        },
      })

      if (res.error) {
        const msg = extractErrorMessage(res.error)
        console.error('[auth.signUpCoach] supabase error:', res.error)
        throw new Error(msg)
      }

      return res.data
    } catch (err) {
      console.error('[auth.signUpCoach] unexpected:', err)
      throw new Error(extractErrorMessage(err))
    }
  },

  async signUpClient(email: string, password: string, name: string, coachCode: string) {
    const normalizedEmail = normalizeEmail(email)

    // Chercher le coach directement (RLS désactivé temporairement)
    console.log('🔍 Recherche coach...');
    const { data: coachData, error: coachErr } = await supabase
      .from('coaches')
      .select('id, name, coach_code')
      .eq('coach_code', coachCode)
      .single();

    if (coachErr || !coachData) {
      console.error('[auth.signUpClient] coach lookup error', coachErr);
      throw new Error('Code coach invalide');
    }

    const coach = coachData;
    console.log('🎯 Coach trouvé:', coach);

    try {
      const redirectTo = (typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL) || undefined
      const res = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { name, role: 'client', coach_id: coach.id },
          emailRedirectTo: redirectTo,
        },
      })

      if (res.error) {
        const msg = extractErrorMessage(res.error)
        console.error('[auth.signUpClient] supabase error:', res.error)
        throw new Error(msg)
      }

      const signupData = res.data

      // If user object wasn't returned, bail out (confirmation flow or magic link)
      if (!signupData?.user) return signupData

      // If the user hasn't confirmed their email yet, do NOT create the client row now.
      if (!signupData.user.email_confirmed_at) {
        console.info('[auth.signUpClient] user created but not confirmed; skipping client insert until confirmation')
        return signupData
      }

      // Créer le client directement (RLS désactivé temporairement)
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert({
          id: signupData.user.id,
          name,
          email: normalizedEmail,
          coach_id: coach.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (clientError) {
        console.error('[auth.signUpClient] client creation error', clientError);
        throw new Error('Erreur lors de la création du profil client');
      }

      const createResult = { success: true, client: clientData };

      return signupData
    } catch (err) {
      console.error('[auth.signUpClient] unexpected:', err)
      throw new Error(extractErrorMessage(err))
    }
  },

  async signIn(email: string, password: string) {
    const normalizedEmail = normalizeEmail(email)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
      if (error) {
        const msg = extractErrorMessage(error)
        console.error('[auth.signIn] supabase error:', error)
        throw new Error(msg)
      }
      return data
    } catch (err) {
      console.error('[auth.signIn] unexpected:', err)
      throw new Error(extractErrorMessage(err))
    }
  },

  async signInCoach(email: string, password: string) {
    const normalizedEmail = normalizeEmail(email)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
      if (error) {
        const msg = extractErrorMessage(error)
        console.error('[auth.signInCoach] supabase error:', error)
        throw new Error(msg)
      }

      // Vérifier que l'utilisateur est bien un coach
      if (data.user) {
        const { data: coachProfile } = await supabase
          .from('coaches')
          .select('id, name')
          .eq('id', data.user.id)
          .single()

        if (!coachProfile) {
          // Déconnecter l'utilisateur s'il n'est pas un coach
          await supabase.auth.signOut()
          throw new Error('Ce compte n\'est pas un compte coach. Veuillez utiliser le formulaire client.')
        }
      }

      return data
    } catch (err) {
      console.error('[auth.signInCoach] unexpected:', err)
      throw new Error(extractErrorMessage(err))
    }
  },

  async signInClient(email: string, password: string) {
    const normalizedEmail = normalizeEmail(email)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
      if (error) {
        const msg = extractErrorMessage(error)
        console.error('[auth.signInClient] supabase error:', error)
        throw new Error(msg)
      }

      // Vérifier que l'utilisateur est bien un client
      if (data.user) {
        const { data: clientProfile } = await supabase
          .from('clients')
          .select('id, name')
          .eq('id', data.user.id)
          .single()

        if (!clientProfile) {
          // Déconnecter l'utilisateur s'il n'est pas un client
          await supabase.auth.signOut()
          throw new Error('Ce compte n\'est pas un compte client. Veuillez utiliser le formulaire coach.')
        }
      }

      return data
    } catch (err) {
      console.error('[auth.signInClient] unexpected:', err)
      throw new Error(extractErrorMessage(err))
    }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(extractErrorMessage(error))
  },

  async getUserProfile(userId: string) {
    console.log('[auth.getUserProfile] Starting lookup for userId:', userId);
    try {
      // Try coach profile first - use simple select to avoid relation issues
      const { data: coach, error: coachError } = await supabase.from('coaches').select('*').eq('id', userId).single()
      
      if (coachError) {
        console.log('[auth.getUserProfile] Coach lookup error:', coachError.code, coachError.message);
        if (coachError.code !== 'PGRST116') {
          // It's not a "0 rows" error, log it as a real error
          console.error('[auth.getUserProfile] Unexpected coach error:', coachError);
        }
      } else if (coach) {
        console.log('[auth.getUserProfile] Found coach profile:', coach.name);
        return { ...coach, role: 'coach' };
      }

      // Try client with embedded coach relation
      console.log('[auth.getUserProfile] Trying client lookup with embedded coach...');
      const { data: client, error } = await supabase.from('clients').select('*, coaches(name, email, coach_code)').eq('id', userId).single()

      if (error) {
        console.warn('[auth.getUserProfile] embedded client select error:', error.code, error.message);

        // Fallback: simple client select
        console.log('[auth.getUserProfile] Trying simple client lookup...');
        const { data: clientSimple, error: clientSimpleErr } = await supabase.from('clients').select('*').eq('id', userId).single()

        if (clientSimpleErr) {
          // Si l'erreur est "0 rows" (PGRST116), c'est normal - l'utilisateur n'a pas de profil client
          if (clientSimpleErr.code === 'PGRST116') {
            console.info('[auth.getUserProfile] user has no client profile yet')
            return null
          }
          // Autre erreur plus grave
          console.error('[auth.getUserProfile] client simple select failed:', clientSimpleErr);
          return null
        }

        if (!clientSimple) {
          console.info('[auth.getUserProfile] no client data returned')
          return null
        }

        // Fetch coach data separately if needed
        let coachData = null
        if (clientSimple.coach_id) {
          console.log('[auth.getUserProfile] Fetching coach data for client...');
          const { data: cdata, error: cErr } = await supabase.from('coaches').select('name, email, coach_code').eq('id', clientSimple.coach_id).single()
          if (!cErr) coachData = cdata
        }

        console.log('[auth.getUserProfile] Returning client profile with coach data');
        return { ...clientSimple, coaches: coachData ? coachData : null, role: 'client' }
      }

      if (client) {
        console.log('[auth.getUserProfile] Found client profile:', client.name);
        return { ...client, role: 'client' };
      }

      console.log('[auth.getUserProfile] No profile found for user');
      return null
    } catch (err) {
      console.error('[auth.getUserProfile] unexpected error:', err)
      throw new Error(extractErrorMessage(err))
    }
  },

  // Ensure a clients row exists for a given user (used after email confirmation)
  async ensureClientProfile(user: any) {
    if (!user || !user.id) return null

    try {
      // Check existing
      const { data: existing, error: existingErr } = await supabase.from('clients').select('id').eq('id', user.id).single()

      if (!existingErr && existing) return existing

      // If user metadata contains coach_id, use it
      const coach_id = user.user_metadata?.coach_id || user.user_metadata?.coachId || null

      // Build insert payload - coach_id peut être null
      const payload: any = {
        id: user.id,
        coach_id: coach_id, // peut être null, c'est OK 
        name: user.user_metadata?.name || user.user_metadata?.full_name || user.email || 'Client',
        email: user.email,
        created_at: new Date().toISOString()
      }

      console.log('[ensureClientProfile] Creating client with payload:', payload);

      // Try insert (handle unique/foreign key errors)
      const { data: inserted, error: insertErr } = await supabase.from('clients').insert(payload).select().single()

      if (insertErr) {
        try { 
          console.warn('[auth.ensureClientProfile] insertErr', JSON.stringify(insertErr)) 
        } catch (e) { 
          console.warn('[auth.ensureClientProfile] insertErr', insertErr) 
        }
        
        // Si l'erreur est "déjà existe", c'est pas grave
        if (insertErr.code === '23505') {
          console.log('[ensureClientProfile] Client already exists, fetching...');
          const { data: existingClient } = await supabase.from('clients').select('*').eq('id', user.id).single();
          return existingClient;
        }
        return null
      }

      console.log('[ensureClientProfile] Client created successfully:', inserted);
      return inserted
    } catch (err) {
      console.error('[auth.ensureClientProfile] unexpected:', err)
      return null
    }
  },
}

export type AuthService = typeof authService
