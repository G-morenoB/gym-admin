import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Usa getUser() en lugar de getSession() — más seguro
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Sin sesión → redirige al login
  if (!user && (path.startsWith('/admin') || path.startsWith('/recepcion'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    const rol = user.user_metadata?.rol

    // Recepcionista intenta entrar al admin
    if (path.startsWith('/admin') && rol !== 'admin') {
      return NextResponse.redirect(new URL('/recepcion/qr', request.url))
    }

    // Admin intenta entrar a recepción
    if (path.startsWith('/recepcion') && rol !== 'recepcion') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/recepcion/:path*']
}