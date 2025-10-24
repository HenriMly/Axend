import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer()

  const { data: { session }, error } = await supabase.auth.getSession()

  const cookies = req.cookies.getAll()

  // Format pour affichage
  const cookieList = cookies.map(c => ({
    name: c.name,
    value: c.value.length > 50 ? c.value.substring(0, 50) + '...' : c.value, // Tronquer les longues valeurs
  }))

  return NextResponse.json({
    message: 'Debug cookies et session',
    session: {
      exists: !!session,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        role: session.user.user_metadata?.role
      } : null,
      error: error?.message
    },
    cookies: cookieList,
    total: cookieList.length,
    timestamp: new Date().toISOString()
  })
}
