import { Redis } from "@upstash/redis";

// Reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from the environment.
// Create a free database at https://console.upstash.com and copy the REST creds.
export const redis = Redis.fromEnv();

// Leaderboard key. `group` lets you run private leagues per church/youth-group
// (the paid "group licensing" feature) while "global" is the public board.
export function lbKey(category: string, group?: string) {
  const g = (group && group.trim()) ? group.trim().toLowerCase() : "global";
  return `lb:${g}:${category}`;
}
