// ============================================================
// world.js — the Meridian Sea. Fixed-seed generation: every
// voyage shares the same hand-shaped, noise-detailed world.
// Ports/discoveries snap to the nearest coast/sea, and all sea
// is one connected ocean (lakes are filled), so every port is
// guaranteed reachable.
// ============================================================

const World = {
  W: 208, H: 136, SEED: 711712,
  tiles: null,   // Uint8: 0 sea, 1 land, 2 port
  elev: null,    // Uint8 0..255 for shading
  ports: [],     // specs + snapped x,y
  disc: [],      // discovery specs + snapped x,y
  portMap: new Map(),  // "x,y" -> port
};

// Hand-placed continental masses (ellipses); fbm noise roughens the coasts.
World.BLOBS = [
  { cx:50,  cy:38,  rx:24, ry:28 },   // Velmara (NW continent)
  { cx:104, cy:11,  rx:32, ry:11 },   // Norvik (north coast)
  { cx:196, cy:55,  rx:20, ry:32 },   // Jade Reaches (east)
  { cx:118, cy:83,  rx:27, ry:17 },   // Saridian Reach (south-central)
  { cx:12,  cy:82,  rx:13, ry:38 },   // The Emberveil (far west)
  { cx:162, cy:102, rx:7,  ry:6 },    // Coralspan isles...
  { cx:178, cy:112, rx:6,  ry:5 },
  { cx:146, cy:117, rx:6,  ry:5 },
  { cx:170, cy:120, rx:4,  ry:3.5 },
  { cx:84,  cy:56,  rx:4.5,ry:4 },    // Lumen Bay isle
  { cx:104, cy:125, rx:3.5,ry:3 },    // Aurevia (Radiant Isle)
  { cx:144, cy:29,  rx:3.5,ry:3 },    // Whisper Strait flanks
  { cx:155, cy:39,  rx:3.5,ry:3 },
  { cx:36,  cy:110, rx:3,  ry:2.5 },  // Starfall Crater Isle
  { cx:62,  cy:92,  rx:3,  ry:2.5 },  // scattered islets
  { cx:130, cy:50,  rx:3,  ry:2.5 },
  { cx:74,  cy:30,  rx:3,  ry:2.5 },
];

World.idx = (x, y) => y * World.W + x;
World.inBounds = (x, y) => x >= 0 && y >= 0 && x < World.W && y < World.H;
World.isSea  = (x, y) => World.inBounds(x, y) && World.tiles[World.idx(x, y)] === 0;
World.isPort = (x, y) => World.inBounds(x, y) && World.tiles[World.idx(x, y)] === 2;
// Ships may occupy sea tiles and port tiles
World.isSailable = (x, y) => World.inBounds(x, y) && World.tiles[World.idx(x, y)] !== 1;
World.portAt = (x, y) => World.portMap.get(x + "," + y) || null;

World.gen = function () {
  const W = this.W, H = this.H, N = W * H;
  this.tiles = new Uint8Array(N);
  this.elev = new Uint8Array(N);

  // --- 1. heightfield: continent mask × roughening noise ---
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let mask = 0;
      for (const b of this.BLOBS) {
        const dx = (x - b.cx) / b.rx, dy = (y - b.cy) / b.ry;
        const v = 1 - (dx * dx + dy * dy);
        if (v > mask) mask = v;
      }
      const n = fbm(x, y, this.SEED);
      const h = mask * (0.55 + 0.85 * n);
      const border = (x < 2 || y < 2 || x >= W - 2 || y >= H - 2);
      const land = !border && h > 0.40;
      const i = this.idx(x, y);
      this.tiles[i] = land ? 1 : 0;
      this.elev[i] = Math.max(0, Math.min(255, Math.round(h * 230)));
    }
  }

  // --- 2. flood-fill the ocean from (0,0); fill enclosed lakes ---
  const main = new Uint8Array(N);
  const queue = new Int32Array(N);
  let qh = 0, qt = 0;
  queue[qt++] = 0; main[0] = 1;
  while (qh < qt) {
    const i = queue[qh++], x = i % W, y = (i / W) | 0;
    const nb = [[1,0],[-1,0],[0,1],[0,-1]];
    for (const [dx, dy] of nb) {
      const nx = x + dx, ny = y + dy;
      if (!this.inBounds(nx, ny)) continue;
      const j = this.idx(nx, ny);
      if (!main[j] && this.tiles[j] === 0) { main[j] = 1; queue[qt++] = j; }
    }
  }
  for (let i = 0; i < N; i++) {
    if (this.tiles[i] === 0 && !main[i]) { this.tiles[i] = 1; this.elev[i] = 100; }
  }

  // --- 3. snap ports to nearest coastal land tile (touching the ocean) ---
  this.ports = []; this.portMap = new Map();
  for (const spec of DATA.PORT_SPECS) {
    const spot = this.nearestMatch(spec.x, spec.y, (x, y) => {
      if (this.tiles[this.idx(x, y)] !== 1) return false;
      if (this.portMap.has(x + "," + y)) return false;
      return this.touchesSea(x, y);
    });
    const port = Object.assign({}, spec, { x: spot.x, y: spot.y });
    this.tiles[this.idx(spot.x, spot.y)] = 2;
    this.portMap.set(spot.x + "," + spot.y, port);
    this.ports.push(port);
  }
  this.PORT = {}; this.ports.forEach(p => this.PORT[p.id] = p);

  // --- 4. snap discoveries to nearest open-sea tile ---
  this.disc = [];
  for (const spec of DATA.DISCOVERY_SPECS) {
    const spot = this.nearestMatch(spec.x, spec.y, (x, y) => this.tiles[this.idx(x, y)] === 0);
    this.disc.push(Object.assign({}, spec, { x: spot.x, y: spot.y }));
  }
  this.DISC = {}; this.disc.forEach(d => this.DISC[d.id] = d);
};

World.touchesSea = function (x, y) {
  return this.isSea(x + 1, y) || this.isSea(x - 1, y) || this.isSea(x, y + 1) || this.isSea(x, y - 1);
};

// Spiral-free BFS outward from (sx,sy) until predicate matches.
World.nearestMatch = function (sx, sy, fn) {
  sx = Math.max(0, Math.min(this.W - 1, sx));
  sy = Math.max(0, Math.min(this.H - 1, sy));
  const seen = new Uint8Array(this.W * this.H);
  let frontier = [[sx, sy]];
  seen[this.idx(sx, sy)] = 1;
  while (frontier.length) {
    const next = [];
    for (const [x, y] of frontier) {
      if (fn(x, y)) return { x, y };
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
        const nx = x + dx, ny = y + dy;
        if (!this.inBounds(nx, ny)) continue;
        const j = this.idx(nx, ny);
        if (!seen[j]) { seen[j] = 1; next.push([nx, ny]); }
      }
    }
    frontier = next;
  }
  return { x: sx, y: sy }; // unreachable in practice
};

// BFS path over sailable tiles, 8-directional. Returns [[x,y],...] excluding start, or null.
World.findPath = function (sx, sy, tx, ty) {
  if (!this.isSailable(tx, ty)) return null;
  const W = this.W, N = W * this.H;
  const prev = new Int32Array(N).fill(-2);
  const queue = new Int32Array(N);
  let qh = 0, qt = 0;
  const si = this.idx(sx, sy), ti = this.idx(tx, ty);
  prev[si] = -1; queue[qt++] = si;
  const DIRS = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  while (qh < qt) {
    const i = queue[qh++];
    if (i === ti) break;
    const x = i % W, y = (i / W) | 0;
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy;
      if (!this.isSailable(nx, ny)) continue;
      const j = this.idx(nx, ny);
      if (prev[j] === -2) { prev[j] = i; queue[qt++] = j; }
    }
  }
  if (prev[ti] === -2) return null;
  const path = [];
  let i = ti;
  while (i !== si) { path.push([i % W, (i / W) | 0]); i = prev[i]; }
  path.reverse();
  return path;
};

if (typeof module !== "undefined") module.exports = World;
