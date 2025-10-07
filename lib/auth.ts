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

    // Lookup coach
    const { data: coach, error: coachErr } = await supabase
      .from('coaches')
      .select('id, coach_code')
      .eq('coach_code', coachCode)
      .limit(1)
      .single()

    if (coachErr || !coach) {
      console.error('[auth.signUpClient] coach lookup error', coachErr)
      throw new Error('Code coach invalide')
    }

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

      // Create client record (retry briefly if FK timing issue)
      const maxAttempts = 3
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const { error: clientError } = await supabase.from('clients').insert({ id: signupData.user.id, coach_id: coach.id, name, email: normalizedEmail })

        if (!clientError) break
        const code = (clientError as any)?.code || ''
        if (code === '23503' && attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 500 * attempt))
          continue
        }

        try {
          console.error('[auth.signUpClient] client insert error', JSON.stringify(clientError))
        } catch (e) {
          console.error('[auth.signUpClient] client insert error', clientError)
        }
        throw new Error(extractErrorMessage(clientError))
      }

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

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(extractErrorMessage(error))
  },

  async getUserProfile(userId: string) {
    try {
      // Try coach profile first
      const { data: coach } = await supabase.from('coaches').select('*, clients(*)').eq('id', userId).single()
      if (coach) return { ...coach, role: 'coach' }

      // Try client with embedded coach relation. Some PostgREST setups may reject
      // complex embed/selects and return 406 Not Acceptable. If that happens,
      // fall back to a simpler query and fetch the coach separately.
      const { data: client, error } = await supabase.from('clients').select('*, coaches(name, email, coach_code)').eq('id', userId).single()

      if (error) {
        try { console.warn('[auth.getUserProfile] embedded select error', JSON.stringify(error)) } catch (e) { console.warn('[auth.getUserProfile] embedded select error', error) }

        const { data: clientSimple, error: clientSimpleErr } = await supabase.from('clients').select('*').eq('id', userId).single()

        if (clientSimpleErr || !clientSimple) {
          try { console.error('[auth.getUserProfile] client simple select failed', JSON.stringify(clientSimpleErr)) } catch (e) { console.error('[auth.getUserProfile] client simple select failed', clientSimpleErr) }
          return null
        }

        let coachData = null
        if (clientSimple.coach_id) {
          const { data: cdata, error: cErr } = await supabase.from('coaches').select('name, email, coach_code').eq('id', clientSimple.coach_id).single()
          if (!cErr) coachData = cdata
        }

        return { ...clientSimple, coaches: coachData ? coachData : null, role: 'client' }
      }

      if (client) return { ...client, role: 'client' }

      return null
    } catch (err) {
      console.error('[auth.getUserProfile] unexpected:', err)
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

      // Build insert payload
      const payload: any = {
        id: user.id,
        coach_id: coach_id,
        name: user.user_metadata?.name || user.user_metadata?.full_name || user.email || 'Client',
        email: user.email,
      }

      // Try insert (handle unique/foreign key errors)
      const { data: inserted, error: insertErr } = await supabase.from('clients').insert(payload)

      if (insertErr) {
        try { console.warn('[auth.ensureClientProfile] insertErr', JSON.stringify(insertErr)) } catch (e) { console.warn('[auth.ensureClientProfile] insertErr', insertErr) }
        return null
      }

      return inserted
    } catch (err) {
      console.error('[auth.ensureClientProfile] unexpected:', err)
      return null
    }
  },
}

export type AuthService = typeof authService
