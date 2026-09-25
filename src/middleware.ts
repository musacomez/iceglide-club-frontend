import { NextRequest, NextResponse } from 'next/server';

// Cheap, cookie-presence-only check so a signed-out visitor is bounced to
// /login before the page even renders. This is NOT the real authorization -
// the Worker API re-validates the JWT (and role) on every single request,
// which is the only security boundary that actually matters.
const PUBLIC_PATHS = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  const hasSession = request.cookies.get('iceglide_session')?.value === '1';
  if (!hasSession && pathname !== '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
