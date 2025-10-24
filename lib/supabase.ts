import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// During build time, env vars might not be available - only validate at runtime
if (typeof window !== 'undefined' || process.env.NODE_ENV === 'production') {
  if (!supabaseUrl) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
      'Please check your .env.local file and make sure it contains your Supabase project URL. ' +
      'You can find it in your Supabase dashboard > Settings > API.'
    )
  }

  if (!supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
      'Please check your .env.local file and make sure it contains your Supabase project URL. ' +
      'You can find it in your Supabase dashboard > Settings > API.'
    )
  }
}

// Use fallback values during build time
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: {
        getItem: (key: string) => {
          if (typeof window === 'undefined') return null
          try {
            const cookies = document.cookie.split(';')
            const cookie = cookies.find(c => c.trim().startsWith(`${key}=`))
            return cookie ? decodeURIComponent(cookie.split('=')[1]) : null
          } catch {
            return null
          }
        },
        setItem: (key: string, value: string) => {
          if (typeof window === 'undefined') return
          const isProd = process.env.NODE_ENV === 'production'
          document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=strict; ${isProd ? 'secure;' : ''}`
        },
        removeItem: (key: string) => {
          if (typeof window === 'undefined') return
          document.cookie = `${key}=; path=/; max-age=0;`
        },
      },
    },
  }
)

// Helper to get session from cookies (for SSR)
export async function getSessionFromCookies() {
  if (typeof window === 'undefined') return null

  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error('[getSessionFromCookies] Error:', error)
    return null
  }
}

// Types pour TypeScript
export interface Database {
  public: {
    Tables: {
      coaches: {
        Row: {
          id: string
          coach_code: string
          name: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          coach_code: string
          name: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_code?: string
          name?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          coach_id: string
          name: string
          email: string
          current_weight: number | null
          target_weight: number | null
          age: number | null
          height: number | null
          joined_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          coach_id: string
          name: string
          email: string
          current_weight?: number | null
          target_weight?: number | null
          age?: number | null
          height?: number | null
          joined_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          name?: string
          email?: string
          current_weight?: number | null
          target_weight?: number | null
          age?: number | null
          height?: number | null
          joined_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      programs: {
        Row: {
          id: string
          coach_id: string
          client_id: string | null
          name: string
          description: string | null
          frequency: string | null
          duration: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          client_id?: string | null
          name: string
          description?: string | null
          frequency?: string | null
          duration?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          client_id?: string | null
          name?: string
          description?: string | null
          frequency?: string | null
          duration?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      workouts: {
        Row: {
          id: string
          client_id: string
          program_id: string | null
          date: string
          duration: number | null
          completed: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          program_id?: string | null
          date: string
          duration?: number | null
          completed?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          program_id?: string | null
          date?: string
          duration?: number | null
          completed?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      measurements: {
        Row: {
          id: string
          client_id: string
          date: string
          weight: number | null
          body_fat: number | null
          muscle_mass: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          date: string
          weight?: number | null
          body_fat?: number | null
          muscle_mass?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          date?: string
          weight?: number | null
          body_fat?: number | null
          muscle_mass?: number | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
