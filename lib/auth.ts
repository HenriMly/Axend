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
      console.log('🚀 Création du compte utilisateur...');
      const res = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { name, role: 'client', coach_id: coach.id },
          emailRedirectTo: undefined, // Pas d'email de confirmation
        },
      })

      if (res.error) {
        const msg = extractErrorMessage(res.error)
        console.error('[auth.signUpClient] supabase error:', res.error)
        throw new Error(msg)
      }

      const signupData = res.data
      console.log('✅ Utilisateur auth créé:', signupData.user?.id);

      // Si pas d'utilisateur créé, erreur
      if (!signupData?.user) {
        throw new Error('Erreur lors de la création du compte utilisateur');
      }

      const userAuthId = signupData.user.id;
      console.log('🔑 ID Auth à utiliser:', userAuthId);

      // Créer le client avec seulement les champs requis (laisser les defaults)
      console.log('📝 Création du profil client...');
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert({
          id: userAuthId,
          coach_id: coach.id,
          name,
          email: normalizedEmail
          // Laisser joined_date, created_at, updated_at utiliser leurs defaults
          // current_weight, target_weight, age, height sont nullable donc OK
        })
        .select()
        .single();

      if (clientError) {
        console.error('[auth.signUpClient] client creation error', clientError);
        console.error('[auth.signUpClient] error details:', {
          message: clientError.message,
          code: clientError.code,
          details: clientError.details,
          hint: clientError.hint
        });
        throw new Error(`Erreur lors de la création du profil client: ${clientError.message}`);
      }

      console.log('🎉 Client créé avec succès:', clientData);
      console.log('🔍 Vérification IDs - Auth:', userAuthId, 'Client:', clientData.id);
      console.log('✅ IDs correspondent ?', userAuthId === clientData.id);
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

      // Vérifier que l'utilisateur est bien un client - CHERCHER PAR EMAIL
      if (data.user) {
        console.log('[auth.signInClient] Recherche client par EMAIL:', normalizedEmail);
        const { data: clientProfile, error: clientLookupError } = await supabase
          .from('clients')
          .select('id, name, email, coach_id')
          .eq('email', normalizedEmail)
          .single()

        console.log('[auth.signInClient] Résultat recherche client:', {
          found: !!clientProfile,
          profile: clientProfile,
          error: clientLookupError
        });

        if (!clientProfile) {
          console.error('[auth.signInClient] Client non trouvé dans la table clients pour email:', normalizedEmail);
          console.error('[auth.signInClient] Lookup error:', clientLookupError);
          
          // Déconnecter l'utilisateur s'il n'est pas un client
          await supabase.auth.signOut()
          throw new Error('Ce compte n\'est pas un compte client. Veuillez utiliser le formulaire coach.')
        }

        console.log('✅ [auth.signInClient] Client trouvé ! Connexion réussie:', clientProfile.name);
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

      // Try client with embedded coach relation - d'abord par ID puis par email
      console.log('[auth.getUserProfile] Trying client lookup with embedded coach...');
      let { data: client, error } = await supabase.from('clients').select('*, coaches(name, email, coach_code)').eq('id', userId).single()

      // Si pas trouvé par ID, essayer par email auth
      if (!client && error?.code === 'PGRST116') {
        console.log('[auth.getUserProfile] ID lookup failed, trying by email...');
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser?.user?.email) {
          const { data: clientByEmail, error: emailError } = await supabase
            .from('clients')
            .select('*, coaches(name, email, coach_code)')
            .eq('email', authUser.user.email)
            .single();
          
          client = clientByEmail;
          error = emailError;
          console.log('[auth.getUserProfile] Email lookup result:', { client, error });
        }
      }

      console.log('[auth.getUserProfile] Final client result:', { client, error });
      
      if (error) {
        console.warn('[auth.getUserProfile] embedded client select error:', error.code, error.message);

        // Fallback: simple client select - d'abord par ID puis par email  
        console.log('[auth.getUserProfile] Trying simple client lookup...');
        let { data: clientSimple, error: clientSimpleErr } = await supabase.from('clients').select('*').eq('id', userId).single()

        // Si pas trouvé par ID, essayer par email
        if (!clientSimple && clientSimpleErr?.code === 'PGRST116') {
          console.log('[auth.getUserProfile] Simple ID lookup failed, trying by email...');
          const { data: authUser } = await supabase.auth.getUser();
          if (authUser?.user?.email) {
            const { data: clientByEmailSimple, error: emailSimpleError } = await supabase
              .from('clients')
              .select('*')
              .eq('email', authUser.user.email)
              .single();
            
            clientSimple = clientByEmailSimple;
            clientSimpleErr = emailSimpleError;
            console.log('[auth.getUserProfile] Simple email lookup result:', { clientSimple, clientSimpleErr });
          }
        }

        console.log('[auth.getUserProfile] Final simple client result:', { clientSimple, clientSimpleErr });

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
        const result = { ...client, role: 'client' };
        console.log('[auth.getUserProfile] Returning embedded client result:', result);
        return result;
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
