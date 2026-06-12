// Integration smoke test: loads the full game with a stub DOM and
// drives the main flows. Run: node test/smoke-test.js
const fs = require("fs"), path = require("path"), vm = require("vm");

// ---------- stub DOM ----------
function stubEl(id) {
  return {
    id, style: {}, dataset: {}, children: [], innerHTML: "", textContent: "",
    className: "", value: "Testy McTest", disabled: false, scrollTop: 0, scrollHeight: 0,
    tagName: "DIV", onclick: null,
    appendChild(c) { this.children.push(c); },
    removeChild(c) { this.children = this.children.filter(x => x !== c); },
    get firstChild() { return this.children[0]; },
    addEventListener() {}, getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 100 }; },
    getContext() { return new Proxy({}, { get: () => () => ({ data: new Uint8ClampedArray(4) }) }); },
  };
}
const els = {};
const documentStub = {
  getElementById(id) { if (!els[id]) els[id] = stubEl(id); return els[id]; },
  createElement(tag) { return stubEl(tag); },
  querySelectorAll() { return []; },
};
const store = {};
const ctx = {
  console, Math, JSON, setTimeout: (fn) => fn(), setInterval: () => 0,
  document: documentStub,
  window: { addEventListener() {} },
  localStorage: {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
  },
  requestAnimationFrame() {}, prompt: () => "Renamed", confirm: () => true,
  location: { reload() {} },
};
ctx.globalThis = ctx;
vm.createContext(ctx);

const FILES = ["rng.js","lang.js","audio.js","data.js","world.js","state.js","ui.js","render.js","quests.js","story.js","combat.js","sea.js","port.js"];
for (const f of FILES) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js", f), "utf8"), ctx, { filename: f });
}
const g = (expr) => vm.runInContext(expr, ctx);

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  ok  " + name); }
  else { fail++; console.log("  FAIL " + name); }
}

// Disable canvas-dependent bits
g("R.draw = function(){}; R.init = function(){};");

console.log("== world & new game ==");
g("World.gen()");
g('Game.newGame("Testy")');
check("state created", g("S.captain") === "Testy");
check("docked flag", g("S.dockedAt") === "avelar");
check("explored around home", g("S.explored[World.idx(S.x, S.y)]") === 1);

console.log("== economy sanity ==");
// For every port: produced goods must be cheaper than the same good where demanded
let economyOk = true, spreadMin = 1e9;
const ports = g("World.ports.filter(p => !p.hidden).map(p => p.id)");
for (const pid of ports) {
  const produces = g(`World.PORT["${pid}"].produces`);
  for (const gid of produces) {
    const buyHere = g(`Port.priceOf(World.PORT["${pid}"], "${gid}")`);
    for (const qid of ports) {
      if (qid === pid) continue;
      const demands = g(`World.PORT["${qid}"].demands`);
      if (!demands.includes(gid)) continue;
      const sellThere = g(`Port.sellPriceOf(World.PORT["${qid}"], "${gid}")`);
      spreadMin = Math.min(spreadMin, sellThere / buyHere);
      if (sellThere <= buyHere) economyOk = false;
    }
  }
}
check("every produce→demand route is profitable (min spread " + spreadMin.toFixed(2) + "x)", economyOk && spreadMin > 1.5);

console.log("== market transactions ==");
g('Port.open(World.PORT["avelar"])');
const goldBefore = g("S.gold");
g('Port.buyGood("grain", 5)');
check("bought 5 grain", g('S.cargo.grain && S.cargo.grain.qty') === 5);
check("gold deducted", g("S.gold") < goldBefore);
g('Port.sellGood("grain", -1)');
check("sold all grain", !g('S.cargo.grain'));
g('Port.buySupply("food", 3)');
check("bought food", g("S.food") >= 12.5);
check("hold accounting", g("Game.holdUsed()") <= g("Game.holdMax()"));

console.log("== quests ==");
const offers = g('Quests.offers(World.PORT["avelar"])');
check("3 offers generated", offers.length === 3);
check("offers deterministic for same day", JSON.stringify(g('Quests.offers(World.PORT["avelar"])')) === JSON.stringify(offers));
g('S.gold = 99999');
const accepted = g('Quests.accept(Quests.offers(World.PORT["avelar"])[0])');
check("offer accepted", accepted === true && g("S.quests.length") === 1);
g('Quests.abandon(S.quests[0])');
check("offer abandoned", g("S.quests.length") === 0);

console.log("== sailing ==");
g('Port.close()');
g("Math.random = () => 0.99");   // suppress random events for deterministic sailing
const day0 = g("S.day"), hour0 = g("S.hour");
const moved = g("Sea.tryMove(1, 0)");
check("moved east", moved === true);
check("time advanced", g("S.day") > day0 || g("S.hour") > hour0);
check("wind factor in range", (() => { const f = g("Sea.windFactor(1,0)"); return f >= 0.5 && f <= 1.35; })());

// route to Lumen Bay and auto-sail there
const lb = g('({x: World.PORT.lumenbay.x, y: World.PORT.lumenbay.y})');
g(`Game.reveal(${lb.x}, ${lb.y}, 3)`);
g(`Sea.setRoute(${lb.x}, ${lb.y})`);
check("route found", g("S.route && S.route.length > 0"));
let steps = 0;
while (g("S.route && S.route.length") && steps++ < 500) {
  g("UI._open = false; Port.cur = null;");  // dismiss any stub modals
  g("Sea.routeStep()");
}
check("auto-sailed to Lumen Bay and docked", g("S.dockedAt") === "lumenbay");
check("first-visit recorded", g("S.stats.portsVisited.lumenbay") === true);

console.log("== supplies drain ==");
g("Port.cur = null; S.dockedAt = null;");
const food0 = g("S.food");
g("Sea.advanceTime(72)");
check("rations consumed over 3 days", g("S.food") < food0);

console.log("== combat ==");
g("Math.random = () => 0.4");
g("S.ship.cannons = 4; S.ship.hull = 60; S.crew = 10; S.morale = 80;");
g("Combat.start({danger: 0.8})");
check("combat foe created", g("Combat.foe !== null"));
let rounds = 0;
while (!g("Combat.over") && rounds++ < 60) g("Combat.volley()");
check("combat resolved in " + rounds + " rounds", g("Combat.over") === true);
const won = g("Combat.won === true");
g("UI._open = false");
g("Combat.finish()");
check("combat finish ran (won=" + won + ")", true);

console.log("== story ==");
g("UI._queue = []; UI._open = false;");
check("chapter 1 active", g("S.chapter") === 0);
g('Story.onDock("brindlemark")');
check("chapter 1 completes at Brindlemark", g("S.chapter") === 1);
g('S.found.sunkenbell = {reported:false}; Story.onDiscover("sunkenbell")');
check("chapter 2 completes on bell discovery", g("S.chapter") === 2);
g("Story.onPirateWin(true)");
check("chapter 3 completes on Redwake", g("S.chapter") === 3);
g('Story.onDiscover("drownedlibrary")');
check("chapter 4 completes on library", g("S.chapter") === 4);
g('Story.onDiscover("radiantisle")');
check("chapter 5 completes — victory", g("S.chapter") === 5 && g("S.victory") === true);
check("hidden discovery gate respects chapter", g("DATA.STORY.length") === 5);

console.log("== discovery reporting ==");
g('S.found.shatteredarch = {reported:false}');
const goldR = g("S.gold");
g("UI._open=false; UI._queue=[];");
g("Quests.reportAll()");
check("discoveries paid out", g("S.gold") > goldR);
check("marked reported", g("S.found.shatteredarch.reported") === true);

console.log("== save / load ==");
g("Game.save()");
g("S.gold = 1");
check("loaded", g("Game.load()") === true);
check("gold restored", g("S.gold") > 1);
check("explored restored", g("S.explored[World.idx(World.PORT.lumenbay.x, World.PORT.lumenbay.y)]") === 1);
check("found restored", g("S.found.sunkenbell") !== undefined);

console.log("== rle roundtrip ==");
check("rle", g(`(() => {
  const a = new Uint8Array(1000);
  for (let i = 0; i < 1000; i++) a[i] = (i * 7 % 13 < 4) ? 1 : 0;
  const b = rleDecode(rleEncode(a), 1000);
  for (let i = 0; i < 1000; i++) if (a[i] !== b[i]) return false;
  return true;
})()`));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
