// ============================================================
// rng.js — deterministic random helpers (seeded world + game rolls)
// ============================================================

// Mulberry32 PRNG — returns a function producing floats in [0,1)
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Deterministic integer hash → [0,1). Used for noise lattice & per-port phases.
function hash2(ix, iy, seed) {
  let h = seed >>> 0;
  h = Math.imul(h ^ (ix * 374761393), 668265263);
  h = Math.imul(h ^ (iy * 1274126177), 2246822519);
  h ^= h >>> 13; h = Math.imul(h, 3266489917); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function smoothstep(t) { return t * t * (3 - 2 * t); }

// Single octave of value noise at frequency 1/cell
function valueNoise(x, y, cell, seed) {
  const gx = Math.floor(x / cell), gy = Math.floor(y / cell);
  const fx = smoothstep((x % cell) / cell), fy = smoothstep((y % cell) / cell);
  const a = hash2(gx, gy, seed),     b = hash2(gx + 1, gy, seed);
  const c = hash2(gx, gy + 1, seed), d = hash2(gx + 1, gy + 1, seed);
  return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
}

// Fractal noise, 4 octaves, ~[0,1]
function fbm(x, y, seed) {
  return (valueNoise(x, y, 28, seed) * 0.50 +
          valueNoise(x, y, 14, seed + 101) * 0.27 +
          valueNoise(x, y, 7,  seed + 202) * 0.15 +
          valueNoise(x, y, 3.5, seed + 303) * 0.08);
}

// In-game dice (non-deterministic is fine for play rolls)
function roll() { return Math.random(); }
function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
