import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Initialize Supabase with cookie storage; helpers will sync cookies for SSR
  const isProd = process.env.NODE_ENV === 'production'
  const supabase = createMiddlewareClient({
    req,
    res,
    // Try to harden Supabase auth cookies as well
    cookieOptions: {
      lifetime: 60 * 60, // 1 hour
      sameSite: 'strict',
      secure: isProd,
      path: '/',
      httpOnly: true,
    } as any,
  } as any)

  // Touch the session to keep cookies in sync on every request
  const { data: { session } } = await supabase.auth.getSession()

  // Only set our sentinel cookie when a user session exists
  if (session) {
    // 1 hour expiry, HttpOnly, Secure only in prod, CSRF-resistant SameSite
    res.cookies.set('axend_sess', '1', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60,
    })
    // Re-emit Supabase auth cookies with hardened attributes and shorter lifetime if present
    try {
      const incoming = req.cookies.getAll()
      const supaCookies = incoming.filter(c => c.name.startsWith('sb-') || c.name.startsWith('sb:'))
      for (const c of supaCookies) {
        // keep value, override attributes
        res.cookies.set(c.name, c.value, {
          httpOnly: true,
          secure: isProd,
          sameSite: 'strict',
          path: '/',
          maxAge: 60 * 60,
        })
      }
    } catch {}
  } else {
    // No session: ensure sentinel is cleared
    res.cookies.set('axend_sess', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    })
    // Clear Supabase cookies if present to avoid stale tokens
    try {
      const incoming = req.cookies.getAll()
      const supaCookies = incoming.filter(c => c.name.startsWith('sb-') || c.name.startsWith('sb:'))
      for (const c of supaCookies) {
        res.cookies.set(c.name, '', {
          httpOnly: true,
          secure: isProd,
          sameSite: 'strict',
          path: '/',
          maxAge: 0,
        })
      }
    } catch {}
  }

  return res
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
  ],
}
