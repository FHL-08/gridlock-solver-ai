// Simple in-memory rate limiter for edge functions
// For production, consider using Redis or Upstash for distributed rate limiting

interface RateLimitEntry {
  requests: number[];
}

const rateLimits = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const fiveMinutesAgo = now - 300000;
  
  for (const [key, entry] of rateLimits.entries()) {
    entry.requests = entry.requests.filter(time => time > fiveMinutesAgo);
    if (entry.requests.length === 0) {
      rateLimits.delete(key);
    }
  }
}, 300000);

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param limit - Maximum requests allowed per window
 * @param windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @returns true if request is allowed, false if rate limit exceeded
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const entry = rateLimits.get(identifier) || { requests: [] };
  
  // Filter out requests outside the current window
  entry.requests = entry.requests.filter(time => now - time < windowMs);
  
  // Check if limit exceeded
  if (entry.requests.length >= limit) {
    return false;
  }
  
  // Add current request
  entry.requests.push(now);
  rateLimits.set(identifier, entry);
  
  return true;
}

/**
 * Get client identifier from request (IP address or fallback)
 * @param req - Request object
 * @returns Client identifier string
 */
export function getClientIdentifier(req: Request): string {
  // Try to get real IP from various headers
  const headers = req.headers;
  return (
    headers.get('cf-connecting-ip') || // Cloudflare
    headers.get('x-real-ip') || // Nginx
    headers.get('x-forwarded-for')?.split(',')[0] || // Standard proxy
    'unknown'
  );
}

/**
 * Create a rate limit error response
 * @param retryAfter - Seconds until rate limit resets
 * @returns Response object with 429 status
 */
export function createRateLimitResponse(corsHeaders: Record<string, string>, retryAfter: number = 60): Response {
  return new Response(
    JSON.stringify({ 
      error: 'Rate limit exceeded. Please try again later.',
      retryAfter 
    }),
    { 
      status: 429,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString()
      }
    }
  );
}
