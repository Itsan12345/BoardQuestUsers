import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

type RateLimitInfo = {
  count: number;
  lastReset: number;
};
const rateLimitMap = new Map<string, RateLimitInfo>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 180; // Max 180 requests per minute per IP

function applyRateLimit(request: NextRequest) {
  // Disable rate limiting during local development to avoid HMR / Dev polling limit
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '127.0.0.1';
  const now = Date.now();

  // Prune map to prevent memory leak in long running isolates
  if (rateLimitMap.size > 1000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now - value.lastReset > RATE_LIMIT_WINDOW) {
        rateLimitMap.delete(key);
      }
    }
  }

  let limitInfo = rateLimitMap.get(ip);
  if (!limitInfo || now - limitInfo.lastReset > RATE_LIMIT_WINDOW) {
    limitInfo = { count: 0, lastReset: now };
  }

  limitInfo.count++;
  rateLimitMap.set(ip, limitInfo);

  return limitInfo.count <= MAX_REQUESTS;
}

export function middleware(request: NextRequest) {
  // Apply Rate Limiting
  const isAllowed = applyRateLimit(request);
  if (!isAllowed) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  const userId = request.cookies.get('user_id')?.value;
  const { pathname } = request.nextUrl;

  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/onboarding', '/forgot-password'];
  const isPublicRoute = publicRoutes.includes(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.');

  // If trying to access a protected route without a user ID
  if (!userId && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is logged in, prevent access to auth pages
  if (userId && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and api
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
