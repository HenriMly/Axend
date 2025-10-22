import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

export async function getSupabaseServer() {
  const cookieStore = await cookies()
  const isProd = process.env.NODE_ENV === 'production'

  const baseOpts: CookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60, // 1 hour
  }

  const client = createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options?: CookieOptions) {
        // force secure, httpOnly, sameSite strict, 1h maxAge
        ;(cookieStore as any).set(name, value, { ...baseOpts, ...(options || {}) })
      },
      remove(name: string, options?: CookieOptions) {
        ;(cookieStore as any).set(name, '', { ...baseOpts, ...(options || {}), maxAge: 0 })
      },
    },
  })

  return client
}
