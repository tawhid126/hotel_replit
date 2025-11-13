import { NextRequest, NextResponse } from 'next/server';
import { resetRateLimit } from '~/lib/rate-limit';

/**
 * Development-only endpoint to clear rate limits
 * WARNING: Remove this in production!
 */
export async function POST(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { identifier } = body;

    if (identifier) {
      // Reset specific identifier
      resetRateLimit(identifier);
      return NextResponse.json({ 
        success: true, 
        message: `Rate limit cleared for ${identifier}` 
      });
    } else {
      // Clear all rate limits by resetting the store
      // This requires exposing the store, so we'll just return a message
      return NextResponse.json({ 
        success: true, 
        message: 'To clear all, restart the dev server' 
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}

// Simple GET to clear rate limits without body
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  return NextResponse.json({ 
    success: true, 
    message: 'Rate limit store cannot be cleared via GET. Restart dev server or wait 1 minute.',
    tip: 'Rate limits reset automatically after the time window expires.'
  });
}
