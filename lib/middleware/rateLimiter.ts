import { RateLimiter } from 'limiter'

const rateLimitWindow = parseInt(process.env.RATE_LIMIT_WINDOW || '900') // 15 minutes default
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')

// Store for tracking requests per IP/user
const limiters = new Map<string, RateLimiter>()

export function getRateLimiter(key: string) {
  if (!limiters.has(key)) {
    limiters.set(
      key,
      new RateLimiter({ tokensPerInterval: maxRequests, interval: rateLimitWindow * 1000 })
    )
  }
  return limiters.get(key)!
}

export async function checkRateLimit(key: string): Promise<boolean> {
  const limiter = getRateLimiter(key)
  return limiter.tryRemoveTokens(1)
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded ? forwarded.split(',')[0].trim() : 'unknown'
}
