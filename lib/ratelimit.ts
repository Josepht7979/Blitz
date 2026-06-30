import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

/**
 * Limits how often one IP can submit a score (anti-spam for a public board).
 * If you don't want rate limiting, the leaderboard route degrades gracefully
 * when this throws.
 */
export const submitLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"), // 10 submissions / minute / IP
  prefix: "rl:submit",
});
