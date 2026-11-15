/**
 * Stateless, seeded randomness.
 *
 * Every random number is derived from the run seed and a key (day, slot,
 * purpose), never from a running counter. Two players on the same seed meet
 * the same luck on the same day whatever they did before, and the server can
 * replay a run exactly from its list of moves.
 */

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type KeyPart = string | number;

/** A stream of numbers in [0, 1) for one seed and key. */
export function stream(seed: string, ...key: KeyPart[]): () => number {
  return mulberry32(xmur3(`${seed}|${key.join("|")}`)());
}

/** One number in [0, 1) for one seed and key. */
export function rand(seed: string, ...key: KeyPart[]): number {
  return stream(seed, ...key)();
}

/** A number in [min, max) for one seed and key. */
export function between(
  min: number,
  max: number,
  seed: string,
  ...key: KeyPart[]
): number {
  return min + (max - min) * rand(seed, ...key);
}

/** Poisson sample by Knuth's method; fine for the small rates used here. */
export function poisson(lambda: number, next: () => number): number {
  if (lambda <= 0) return 0;
  if (lambda > 30) {
    // Normal approximation keeps the loop short for big launches.
    const u = Math.max(next(), 1e-9);
    const v = next();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * z));
  }
  const limit = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= next();
  } while (p > limit);
  return k - 1;
}

/** Fisher-Yates shuffle driven by a stream. Returns a new array. */
export function shuffle<T>(items: readonly T[], next: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Picks an index from a list of weights. */
export function weighted(weights: readonly number[], roll: number): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i] / total;
    if (roll < acc) return i;
  }
  return weights.length - 1;
}
