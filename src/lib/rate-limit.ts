import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (for production, use Redis or similar)
const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key]!.resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  message?: string; // Error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
}

/**
 * Rate limiting middleware for Next.js API routes
 * 
 * @param options - Rate limit configuration
 * @returns Middleware function
 * 
 * @example
 * // Limit to 5 requests per minute
 * const limiter = rateLimit({
 *   windowMs: 60 * 1000, // 1 minute
 *   max: 5,
 *   message: 'Too many requests, please try again later'
 * });
 */
export function rateLimit(options: RateLimitOptions) {
  return async (req: NextRequest) => {
    // Get client identifier (IP + user agent for better uniqueness)
    const identifier = getClientIdentifier(req);
    
    const now = Date.now();
    const windowMs = options.windowMs;
    const max = options.max;

    // Get or create rate limit entry
    let entry = store[identifier];
    
    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired one
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      store[identifier] = entry;
    }

    // Increment count
    entry.count++;

    // Check if limit exceeded
    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      
      return NextResponse.json(
        {
          error: options.message || 'Too many requests',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString(),
          },
        }
      );
    }

    // Add rate limit headers
    const remaining = max - entry.count;
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', max.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', entry.resetTime.toString());

    return response;
  };
}

/**
 * Get unique client identifier from request
 */
function getClientIdentifier(req: NextRequest): string {
  // Try to get real IP from various headers (for proxies/CDNs)
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfIp = req.headers.get('cf-connecting-ip'); // Cloudflare
  
  const ip = forwarded?.split(',')[0] || realIp || cfIp || req.ip || 'unknown';
  
  // Combine with user agent for better uniqueness
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  return `${ip}:${userAgent}`;
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  /**
   * Strict rate limit for auth endpoints
   * 20 requests per minute (increased for development)
   */
  auth: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20,
    message: 'Too many login attempts. Please try again after 1 minute.',
  }),

  /**
   * Standard rate limit for API endpoints
   * 100 requests per minute
   */
  api: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    message: 'Too many API requests. Please slow down.',
  }),

  /**
   * Generous rate limit for general requests
   * 300 requests per 5 minutes
   */
  general: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 300,
    message: 'Too many requests. Please try again later.',
  }),

  /**
   * Very strict rate limit for sensitive operations
   * 3 requests per 5 minutes
   */
  sensitive: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3,
    message: 'Too many requests. Please wait before trying again.',
  }),
};

/**
 * Check rate limit and return result
 * Useful for manual rate limiting in API routes
 */
export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
}> {
  const now = Date.now();
  const windowMs = options.windowMs;
  const max = options.max;

  let entry = store[identifier];
  
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
    store[identifier] = entry;
  }

  entry.count++;

  return {
    allowed: entry.count <= max,
    remaining: Math.max(0, max - entry.count),
    resetTime: entry.resetTime,
  };
}

/**
 * Reset rate limit for a specific identifier
 * Useful for testing or manual reset
 */
export function resetRateLimit(identifier: string): void {
  delete store[identifier];
}
