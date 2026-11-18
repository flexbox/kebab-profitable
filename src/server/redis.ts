import { Redis } from "@upstash/redis";
import { byRank, type ScoreEntry, type ScoreStore } from "./scores";

/**
 * The hosted leaderboard: Upstash Redis, provisioned from the Vercel
 * Marketplace, which sets the connection variables on the project.
 *
 *   kp:seed:<seed>      hash    name key -> entry   (one day's board)
 *   kp:all              hash    name key -> entry   (each player's best run)
 *   kp:best             zset    name key, scored by days then cash
 *   kp:hits:<key>:<n>   counter submissions in one window; it expires by itself
 */
export function redisConfigured(): boolean {
  const env = process.env;
  return (
    (!!env.UPSTASH_REDIS_REST_URL && !!env.UPSTASH_REDIS_REST_TOKEN) ||
    (!!env.KV_REST_API_URL && !!env.KV_REST_API_TOKEN)
  );
}

const CASH_CAP = 9_999_999;

/** One number that sorts like byRank does, short of the time of saving. */
export function bestScore(entry: ScoreEntry): number {
  const cash = Math.max(0, Math.min(CASH_CAP, Math.round(entry.cash)));
  return entry.days * (CASH_CAP + 1) + (CASH_CAP - cash);
}

export function redisStore(): ScoreStore {
  const redis = Redis.fromEnv();
  return {
    async forSeed(seed) {
      const rows = (await redis.hvals(`kp:seed:${seed}`)) as ScoreEntry[];
      return rows ?? [];
    },
    async get(seed, key) {
      return (await redis.hget<ScoreEntry>(`kp:seed:${seed}`, key)) ?? null;
    },
    async put(key, entry) {
      await redis.hset(`kp:seed:${entry.seed}`, { [key]: entry });
    },
    async best(limit) {
      const members = await redis.zrange<string[]>("kp:best", 0, limit - 1);
      if (members.length === 0) return [];
      const rows = await redis.hmget<Record<string, ScoreEntry>>("kp:all", ...members);
      return Object.values(rows ?? {})
        .filter((row): row is ScoreEntry => !!row)
        .sort(byRank);
    },
    async getBest(key) {
      return (await redis.hget<ScoreEntry>("kp:all", key)) ?? null;
    },
    async putBest(key, entry) {
      await Promise.all([
        redis.hset("kp:all", { [key]: entry }),
        redis.zadd("kp:best", { score: bestScore(entry), member: key }),
      ]);
    },
    async hit(key, seconds, now) {
      const bucket = `kp:hits:${key}:${Math.floor(now / (seconds * 1000))}`;
      const count = await redis.incr(bucket);
      if (count === 1) await redis.expire(bucket, seconds);
      return count;
    },
  };
}
