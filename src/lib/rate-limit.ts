import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

const limiters = new Map<string, Ratelimit>();

function getLimiter(key: string, tokens: number, window: `${number} ${"s" | "m" | "h" | "d"}`): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  if (limiters.has(key)) return limiters.get(key)!;
  const limiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(tokens, window),
    analytics: true,
    prefix: `kashef:${key}`,
  });
  limiters.set(key, limiter);
  return limiter;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

const DEFAULTS = { ok: true, remaining: 999, reset: 0 };

/**
 * Apply rate limit. Returns { ok: false } if exceeded.
 * Falls back to allow-all if Upstash isn't configured.
 */
export async function checkRateLimit(
  identifier: string,
  options: { key: string; tokens: number; window: `${number} ${"s" | "m" | "h" | "d"}` }
): Promise<RateLimitResult> {
  const limiter = getLimiter(options.key, options.tokens, options.window);
  if (!limiter) return DEFAULTS;

  try {
    const { success, remaining, reset } = await limiter.limit(identifier);
    return {
      ok: success,
      remaining,
      reset,
      retryAfter: success ? undefined : Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
    };
  } catch {
    return DEFAULTS;
  }
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "anonymous";
}

// Preset limits
export const LIMITS = {
  faceSearch: { key: "face-search", tokens: 5, window: "1 m" as const },
  apiGeneral: { key: "api-general", tokens: 100, window: "1 m" as const },
  authAttempt: { key: "auth-attempt", tokens: 10, window: "5 m" as const },
  fileUpload: { key: "file-upload", tokens: 50, window: "1 m" as const },
  ticketCreate: { key: "ticket-create", tokens: 5, window: "10 m" as const },
};
