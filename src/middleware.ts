import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimiters } from '~/lib/rate-limit';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply rate limiting to auth endpoints
  if (pathname.startsWith('/api/auth/')) {
    const rateLimitResult = await rateLimiters.auth(request);
    if (rateLimitResult.status === 429) {
      return rateLimitResult;
    }
  }

  // Apply rate limiting to other API endpoints
  if (pathname.startsWith('/api/trpc/')) {
    const rateLimitResult = await rateLimiters.api(request);
    if (rateLimitResult.status === 429) {
      return rateLimitResult;
    }
  }

  return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    '/api/auth/:path*',
    '/api/trpc/:path*',
  ],
};
