import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// System-Routen, die übersprungen werden sollen
const systemRoutes = [
  '/api',
  '/_next',
  '/_static',
  '/_vercel',
  '/favicon.ico',
  '/sitemap.xml',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Überspringe System-Routen
  if (systemRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Temporär: Erlaube alle Routen
  return NextResponse.next()
}

// Matche alle Routen außer statische Assets und API
export const config = {
  matcher: [
    /*
     * Match alle Pfade außer:
     * 1. /api (API routes)
     * 2. /_next (Next.js internals)
     * 3. /_static (static files)
     * 4. /_vercel (Vercel internals)
     * 5. /public (public files)
     * 6. alle Dateien mit Erweiterung (z.B. favicon.ico)
     */
    '/((?!api|_next|_static|_vercel|public|.*\\..*|$).*)',
  ],
}
