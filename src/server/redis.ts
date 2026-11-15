import { Redis } from "@upstash/redis";
import { byRank, type ScoreEntry, type ScoreStore } from "./scores";

/**
 * The hosted leaderboard: Upstash Redis, provisioned from the Vercel
 * Marketplace, which sets the connection variables on the project.
 *
 *   kp:seed:<seed>  hash   name key -> entry      (one day's board)
 *   kp:all          hash   <seed>|<name key> -> entry
 *   kp:best         zset   <seed>|<name key>, scored by days then tries
 */
export function redisConfigured(): boolean {
  const env = process.env;
  return (
    (!!env.UPSTASH_REDIS_REST_URL && !!env.UPSTASH_REDIS_REST_TOKEN) ||
    (!!env.KV_REST_API_URL && !!env.KV_REST_API_TOKEN)
  );
}

export function redisStore(): ScoreStore {
  const redis = Redis.fromEnv();
  return {
    async forSeed(seed) {
      const rows = (await redis.hvals(`kp:seed:${seed}`)) as ScoreEntry[];
      return rows ?? [];
    },
    async best(limit) {
      const members = await redis.zrange<string[]>("kp:best", 0, limit - 1);
      if (members.length === 0) return [];
      const rows = await redis.hmget<Record<string, ScoreEntry>>("kp:all", ...members);
      return Object.values(rows ?? {})
        .filter((row): row is ScoreEntry => !!row)
        .sort(byRank);
    },
    async get(seed, key) {
      return (await redis.hget<ScoreEntry>(`kp:seed:${seed}`, key)) ?? null;
    },
    async put(key, entry) {
      const member = `${entry.seed}|${key}`;
      await Promise.all([
        redis.hset(`kp:seed:${entry.seed}`, { [key]: entry }),
        redis.hset("kp:all", { [member]: entry }),
        redis.zadd("kp:best", {
          score: entry.days * 1000 + Math.min(999, entry.attempts),
          member,
        }),
      ]);
    },
  };
}
