// ============================================================
// render.js — canvas drawing: sea, land, ports, ship, fog, minimap
// ============================================================

const R = {
  TILE: 26,
  cv: null, ctx: null,
  mini: null, mctx: null,
  terrainMini: null,   // pre-rendered 1px-per-tile terrain
  fogMini: null,       // fog overlay, rebuilt when fogDirty
  fogDirty: true,
  camX: 0, camY: 0,    // top-left tile (float)

  init() {
    this.cv = document.getElementById("sea-canvas");
    this.ctx = this.cv.getContext("2d");
    this.mini = document.getElementById("minimap");
    this.mini.width = World.W; this.mini.height = World.H;
    this.mctx = this.mini.getContext("2d");
    this.resize();
    window.addEventListener("resize", () => this.resize());
    this.bakeTerrainMini();
  },

  resize() {
    const r = this.cv.parentElement.getBoundingClientRect();
    this.cv.width = r.width; this.cv.height = r.height;
    this.ctx.imageSmoothingEnabled = false;
  },

  // ---------- color helpers ----------
  seaColor(x, y) {
    const e = World.elev[World.idx(x, y)];       // 0..~92 for sea
    const t = Math.min(1, e / 92);
    const j = (hash2(x, y, 5) - 0.5) * 10;
    const rr = Math.round(10 + 16 * t + j * 0.3);
    const gg = Math.round(47 + 46 * t + j * 0.5);
    const bb = Math.round(78 + 62 * t + j);
    return `rgb(${rr},${gg},${bb})`;
  },

  landColor(x, y) {
    const i = World.idx(x, y);
    const e = World.elev[i];
    if (World.touchesSea(x, y)) return "#d9c186";             // beach
    if (y < 12) return e > 150 ? "#e8edf2" : "#b9c8b4";       // polar fringe
    const j = (hash2(x, y, 9) - 0.5) * 14;
    if (e > 160) return `rgb(${118 + j | 0},${118 + j | 0},${104 + j | 0})`;  // highlands
    const t = Math.min(1, (e - 90) / 70);
    const rr = 96 - 24 * t + j, gg = 148 - 30 * t + j, bb = 78 - 16 * t + j * 0.5;
    return `rgb(${rr | 0},${gg | 0},${bb | 0})`;
  },

  // ---------- main draw ----------
  draw(time) {
    if (!S) return;
    const ctx = this.ctx, T = this.TILE;
    const vw = this.cv.width / T, vh = this.cv.height / T;
    this.camX = Math.max(0, Math.min(World.W - vw, S.x - vw / 2));
    this.camY = Math.max(0, Math.min(World.H - vh, S.y - vh / 2));
    const x0 = Math.floor(this.camX), y0 = Math.floor(this.camY);
    const x1 = Math.min(World.W - 1, Math.ceil(this.camX + vw));
    const y1 = Math.min(World.H - 1, Math.ceil(this.camY + vh));

    ctx.fillStyle = "#06121f";
    ctx.fillRect(0, 0, this.cv.width, this.cv.height);

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const px = (x - this.camX) * T, py = (y - this.camY) * T;
        if (!S.explored[World.idx(x, y)]) {
          ctx.fillStyle = (hash2(x, y, 3) > 0.985) ? "#0a1828" : "#071321";
          ctx.fillRect(px, py, T + 1, T + 1);
          continue;
        }
        const t = World.tiles[World.idx(x, y)];
        ctx.fillStyle = t === 0 ? this.seaColor(x, y) : this.landColor(x, y);
        ctx.fillRect(px, py, T + 1, T + 1);
        // animated whitecaps on open water
        if (t === 0 && hash2(x, y, 7) > 0.94) {
          const ph = (time / 900 + hash2(x, y, 11) * 6) % 2;
          if (ph < 1) {
            ctx.globalAlpha = 0.25 * Math.sin(ph * Math.PI);
            ctx.fillStyle = "#cfe8ff";
            ctx.fillRect(px + T * 0.2, py + T * 0.45, T * 0.6, 2);
            ctx.globalAlpha = 1;
          }
        }
      }
    }

    // discoveries (found ones, or active-chapter hints stay hidden)
    ctx.textAlign = "center";
    for (const d of World.disc) {
      if (!S.found[d.id]) continue;
      if (d.x < x0 - 1 || d.x > x1 + 1 || d.y < y0 - 1 || d.y > y1 + 1) continue;
      const px = (d.x - this.camX + 0.5) * T, py = (d.y - this.camY + 0.5) * T;
      ctx.fillStyle = "#ffd76a";
      ctx.font = `${T * 0.7}px serif`;
      ctx.fillText("✦", px, py + T * 0.25);
      ctx.font = "11px sans-serif";
      ctx.fillStyle = "rgba(255,215,106,0.75)";
      ctx.fillText(L(d.name), px, py + T * 0.95);
    }

    // ports
    for (const p of World.ports) {
      if (p.hidden && !(S.chapter >= DATA.STORY.length)) continue;
      if (p.x < x0 - 2 || p.x > x1 + 2 || p.y < y0 - 1 || p.y > y1 + 2) continue;
      if (!S.explored[World.idx(p.x, p.y)]) continue;
      const px = (p.x - this.camX) * T, py = (p.y - this.camY) * T;
      // buildings
      ctx.fillStyle = "#a8794a";
      ctx.fillRect(px + T * 0.15, py + T * 0.4, T * 0.3, T * 0.4);
      ctx.fillStyle = "#c9b08a";
      ctx.fillRect(px + T * 0.5, py + T * 0.3, T * 0.32, T * 0.5);
      ctx.fillStyle = "#7a3030";
      ctx.beginPath();
      ctx.moveTo(px + T * 0.1, py + T * 0.42); ctx.lineTo(px + T * 0.3, py + T * 0.2); ctx.lineTo(px + T * 0.5, py + T * 0.42);
      ctx.fill();
      // flag
      ctx.strokeStyle = "#ddd"; ctx.beginPath();
      ctx.moveTo(px + T * 0.85, py + T * 0.75); ctx.lineTo(px + T * 0.85, py + T * 0.15); ctx.stroke();
      ctx.fillStyle = p.id === "aurevia" ? "#ffd76a" : "#d04545";
      ctx.fillRect(px + T * 0.85, py + T * 0.15, T * 0.3, T * 0.18);
      // label
      ctx.font = "bold 12px sans-serif";
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "rgba(0,0,0,0.8)"; ctx.lineWidth = 3;
      ctx.strokeText(L(p.name), px + T * 0.5, py - 4);
      ctx.fillText(L(p.name), px + T * 0.5, py - 4);
      ctx.lineWidth = 1;
    }

    // route preview
    if (S.route && S.route.length) {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      for (let i = 0; i < S.route.length; i += 2) {
        const [rx, ry] = S.route[i];
        ctx.beginPath();
        ctx.arc((rx - this.camX + 0.5) * T, (ry - this.camY + 0.5) * T, 2.2, 0, 7);
        ctx.fill();
      }
      const [tx, ty] = S.route[S.route.length - 1];
      ctx.font = `${T * 0.8}px serif`;
      ctx.fillStyle = "#ffd76a";
      ctx.fillText("⚑", (tx - this.camX + 0.5) * T, (ty - this.camY + 0.6) * T);
    }

    this.drawShip(time);
    this.drawMini();
  },

  drawShip(time) {
    const ctx = this.ctx, T = this.TILE;
    const bob = Math.sin(time / 600) * T * 0.06;
    const px = (S.x - this.camX + 0.5) * T, py = (S.y - this.camY + 0.5) * T + bob;
    const a = (Sea.heading !== undefined ? Sea.heading : -Math.PI / 2);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(a + Math.PI / 2);
    // wake
    ctx.strokeStyle = "rgba(220,240,255,0.35)";
    ctx.beginPath(); ctx.moveTo(-T * 0.18, T * 0.4); ctx.lineTo(-T * 0.3, T * 0.9);
    ctx.moveTo(T * 0.18, T * 0.4); ctx.lineTo(T * 0.3, T * 0.9); ctx.stroke();
    // hull
    ctx.fillStyle = "#5b3a21";
    ctx.beginPath();
    ctx.moveTo(0, -T * 0.45);
    ctx.quadraticCurveTo(T * 0.3, 0, T * 0.18, T * 0.4);
    ctx.lineTo(-T * 0.18, T * 0.4);
    ctx.quadraticCurveTo(-T * 0.3, 0, 0, -T * 0.45);
    ctx.fill();
    // sail
    ctx.fillStyle = "#f2ead8";
    ctx.beginPath();
    ctx.moveTo(0, -T * 0.34); ctx.lineTo(T * 0.26, T * 0.12); ctx.lineTo(-T * 0.26, T * 0.12);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  },

  // ---------- minimap ----------
  bakeTerrainMini() {
    this.terrainMini = document.createElement("canvas");
    this.terrainMini.width = World.W; this.terrainMini.height = World.H;
    const c = this.terrainMini.getContext("2d");
    const img = c.createImageData(World.W, World.H);
    for (let y = 0; y < World.H; y++) {
      for (let x = 0; x < World.W; x++) {
        const i = World.idx(x, y), o = i * 4;
        const t = World.tiles[i];
        let rr, gg, bb;
        if (t === 0) { const f = Math.min(1, World.elev[i] / 92); rr = 12 + 14 * f; gg = 50 + 40 * f; bb = 84 + 52 * f; }
        else { rr = 96; gg = 140; bb = 80; }
        img.data[o] = rr; img.data[o + 1] = gg; img.data[o + 2] = bb; img.data[o + 3] = 255;
      }
    }
    c.putImageData(img, 0, 0);
  },

  rebuildFogMini() {
    if (!this.fogMini) {
      this.fogMini = document.createElement("canvas");
      this.fogMini.width = World.W; this.fogMini.height = World.H;
    }
    const c = this.fogMini.getContext("2d");
    const img = c.createImageData(World.W, World.H);
    for (let i = 0; i < World.W * World.H; i++) {
      const o = i * 4;
      img.data[o] = 5; img.data[o + 1] = 14; img.data[o + 2] = 24;
      img.data[o + 3] = S.explored[i] ? 0 : 235;
    }
    c.putImageData(img, 0, 0);
    this.fogDirty = false;
  },

  drawMini() {
    if (this.fogDirty || !this.fogMini) this.rebuildFogMini();
    const c = this.mctx;
    c.drawImage(this.terrainMini, 0, 0);
    c.drawImage(this.fogMini, 0, 0);
    // ports
    for (const p of World.ports) {
      if (p.hidden && !(S.chapter >= DATA.STORY.length)) continue;
      if (!S.explored[World.idx(p.x, p.y)]) continue;
      c.fillStyle = "#fff";
      c.fillRect(p.x - 1, p.y - 1, 3, 3);
      c.fillStyle = "#d04545";
      c.fillRect(p.x, p.y, 1, 1);
    }
    // viewport box
    const T = this.TILE;
    c.strokeStyle = "rgba(255,255,255,0.5)";
    c.strokeRect(this.camX, this.camY, this.cv.width / T, this.cv.height / T);
    // ship
    c.fillStyle = "#ffd76a";
    c.fillRect(S.x - 1, S.y - 1, 3, 3);
  },

  // click → tile coords (main canvas)
  tileFromClick(e) {
    const r = this.cv.getBoundingClientRect();
    return {
      x: Math.floor(this.camX + (e.clientX - r.left) / this.TILE),
      y: Math.floor(this.camY + (e.clientY - r.top) / this.TILE),
    };
  },

  tileFromMiniClick(e) {
    const r = this.mini.getBoundingClientRect();
    return {
      x: Math.floor((e.clientX - r.left) / r.width * World.W),
      y: Math.floor((e.clientY - r.top) / r.height * World.H),
    };
  },
};
