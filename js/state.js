// ============================================================
// state.js — the game state S, new game, save/load, shared helpers
// ============================================================

let S = null;
const SAVE_KEY = "windward-save-v1";

const Game = {

  newGame(name) {
    const home = World.PORT["avelar"];
    S = {
      version: 1,
      captain: (name || EZ("Rowan Tidewalker", "罗文·潮行者")).trim(),
      day: 1, hour: 8,
      gold: 1500, fame: 0,
      ship: { type: "sloop", name: EZ("Maren's Gift", "玛伦的馈赠号"), hull: DATA.SHIP.sloop.hull, cannons: 2, sailTrim: 0 },
      crew: 8, morale: 80,
      food: 10, water: 10,           // barrels; 1 barrel ≈ 8 crew-days, each takes 1 hold space
      cargo: {},                     // goodId -> { qty, paid } (paid = total gold spent on current units)
      x: home.x, y: home.y,
      dockedAt: "avelar",
      explored: new Uint8Array(World.W * World.H),
      found: {},                     // discId -> { reported: bool }
      quests: [], questsDone: 0,
      chapter: 0, storyShown: {},    // chapter = index of ACTIVE story chapter; STORY.length = finished
      marketTaken: {},               // "portId:goodId:day" -> qty bought (limits daily stock)
      stats: { piratesBeaten: 0, portsVisited: { avelar: true }, tilesSailed: 0, goldEarned: 0 },
      lastPort: "avelar",
      gameOver: false, victory: false,
    };
    Game.reveal(home.x, home.y, 11);
  },

  // ---------- derived ----------
  shipType() { return DATA.SHIP[S.ship.type]; },
  maxHull()  { return this.shipType().hull; },
  holdMax()  { return this.shipType().hold; },
  cargoUnits() {
    let u = 0; for (const id in S.cargo) u += S.cargo[id].qty; return u;
  },
  holdUsed() { return this.cargoUnits() + Math.ceil(S.food) + Math.ceil(S.water); },
  holdFree() { return Math.max(0, this.holdMax() - this.holdUsed()); },
  cargoValue() {
    let v = 0; for (const id in S.cargo) v += S.cargo[id].qty * DATA.GOOD[id].base; return v;
  },
  // barrels of food+water consumed per day (each)
  rationRate() { return Math.max(0.4, S.crew / 8); },
  speed() {
    const t = this.shipType();
    let sp = t.speed + S.ship.sailTrim;
    if (S.crew < t.maxCrew * 0.4) sp *= 0.7;   // short-handed
    return sp;
  },
  rankTitle(fame = S.fame) {
    let r = DATA.RANKS[0].title;
    for (const k of DATA.RANKS) if (fame >= k.fame) r = k.title;
    return L(r);
  },
  dateStr() {
    const d = S.day - 1;
    const year = DATA.START_YEAR + Math.floor(d / 360);
    const month = L(DATA.MONTHS[Math.floor((d % 360) / 30)]);
    const dom = (d % 30) + 1;
    return LANG === "zh" ? `${year}年 ${month} ${dom}日` : `${dom} ${month}, ${year}`;
  },

  addGold(n) {
    S.gold = Math.max(0, Math.round(S.gold + n));
    if (n > 0) S.stats.goldEarned += n;
    if (n !== 0) Sound.sfx(n > 0 ? "coin" : "spend");
    UI.hud();
  },

  addFame(n) {
    const before = this.rankTitle();
    S.fame = Math.max(0, S.fame + n);
    const after = this.rankTitle();
    if (after !== before && n > 0) {
      Sound.sfx("fanfare");
      UI.log(EZ(`⭐ You are now known as ${S.captain}, ${after}!`,
                `⭐ 如今人们尊称你为${after}${S.captain}！`), "good");
      UI.modal({
        title: EZ("A Rising Name", "声名鹊起"),
        body: EZ(`<p>Word of your deeds spreads through every harbor on the Meridian.</p>
               <p class="big">You are now a <strong>${after}</strong>.</p>`,
              `<p>你的事迹传遍了子午海的每一座港口。</p>
               <p class="big">你现在是一位<strong>${after}</strong>。</p>`),
        buttons: [{ label: EZ("Onward", "继续前进") }],
      });
    }
    UI.hud();
  },

  addCargo(id, qty, costTotal) {
    if (!S.cargo[id]) S.cargo[id] = { qty: 0, paid: 0 };
    S.cargo[id].qty += qty;
    S.cargo[id].paid += costTotal;
  },
  removeCargo(id, qty) {
    const c = S.cargo[id];
    if (!c) return;
    const avg = c.qty > 0 ? c.paid / c.qty : 0;
    c.qty -= qty;
    c.paid = Math.max(0, c.paid - avg * qty);
    if (c.qty <= 0) delete S.cargo[id];
  },

  reveal(cx, cy, r) {
    const r2 = r * r;
    for (let y = Math.max(0, cy - r); y <= Math.min(World.H - 1, cy + r); y++) {
      for (let x = Math.max(0, cx - r); x <= Math.min(World.W - 1, cx + r); x++) {
        const dx = x - cx, dy = y - cy;
        if (dx * dx + dy * dy <= r2) S.explored[World.idx(x, y)] = 1;
      }
    }
    if (R.fogDirty !== undefined) R.fogDirty = true;
  },

  // ---------- save / load ----------
  save() {
    if (!S || S.gameOver) return;
    try {
      const out = Object.assign({}, S, { explored: rleEncode(S.explored) });
      localStorage.setItem(SAVE_KEY, JSON.stringify(out));
    } catch (e) { console.warn("save failed", e); }
  },

  hasSave() { return !!localStorage.getItem(SAVE_KEY); },

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const obj = JSON.parse(raw);
      obj.explored = rleDecode(obj.explored, World.W * World.H);
      S = obj;
      if (R.fogDirty !== undefined) R.fogDirty = true;
      return true;
    } catch (e) { console.warn("load failed", e); return false; }
  },

  wipeSave() { localStorage.removeItem(SAVE_KEY); },
};

// Run-length encode a Uint8Array of 0/1: "count0,count1,count0,..."
function rleEncode(arr) {
  const runs = [];
  let cur = 0, run = 0;
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i] ? 1 : 0;
    if (v === cur) run++;
    else { runs.push(run); cur = v; run = 1; }
  }
  runs.push(run);
  return runs.join(",");
}
function rleDecode(str, len) {
  const out = new Uint8Array(len);
  let i = 0, cur = 0;
  for (const part of String(str).split(",")) {
    const run = parseInt(part, 10) || 0;
    if (cur) out.fill(1, i, Math.min(len, i + run));
    i += run; cur = 1 - cur;
  }
  return out;
}
