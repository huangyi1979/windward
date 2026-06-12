// Node sanity check for world generation. Run: node test/gen-test.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const ctx = { module: { exports: {} }, console };
vm.createContext(ctx);
for (const f of ["rng.js", "data.js", "world.js"]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js", f), "utf8"), ctx, { filename: f });
}
const World = vm.runInContext("World", ctx);
const DATA = vm.runInContext("DATA", ctx);
World.gen();

let land = 0;
for (let i = 0; i < World.tiles.length; i++) if (World.tiles[i] !== 0) land++;
console.log(`Map ${World.W}x${World.H}, land fraction: ${(land / World.tiles.length * 100).toFixed(1)}%`);

let fail = 0;
const home = World.PORT["avelar"];
for (const p of World.ports) {
  const spec = DATA.PORT_SPECS.find(s => s.id === p.id);
  const drift = Math.hypot(p.x - spec.x, p.y - spec.y);
  const path = p.id === "avelar" ? [] : World.findPath(home.x, home.y, p.x, p.y);
  const ok = path !== null;
  if (!ok || drift > 12) fail++;
  console.log(`${ok ? "OK " : "FAIL"} port ${p.name.en.padEnd(12)} at (${p.x},${p.y}) drift=${drift.toFixed(1)} dist=${path ? path.length : "UNREACHABLE"}`);
}
for (const d of World.disc) {
  const spec = DATA.DISCOVERY_SPECS.find(s => s.id === d.id);
  const drift = Math.hypot(d.x - spec.x, d.y - spec.y);
  const reachable = World.findPath(home.x, home.y, d.x, d.y) !== null;
  if (!reachable || drift > 14) { fail++; console.log(`FAIL disc ${d.name.en} at (${d.x},${d.y}) drift=${drift.toFixed(1)} reach=${reachable}`); }
}
console.log(fail === 0 ? "ALL CHECKS PASSED" : `${fail} FAILURES`);

// ASCII render to eyeball the map
let art = "";
for (let y = 0; y < World.H; y += 2) {
  for (let x = 0; x < World.W; x += 2) {
    let c = " ";
    let hasPort = false, hasLand = false;
    for (const [ax, ay] of [[x,y],[x+1,y],[x,y+1],[x+1,y+1]]) {
      const t = World.tiles[World.idx(ax, ay)];
      if (t === 2) hasPort = true;
      if (t === 1) hasLand = true;
    }
    c = hasPort ? "P" : hasLand ? "#" : "·";
    art += c;
  }
  art += "\n";
}
fs.writeFileSync(path.join(__dirname, "map.txt"), art);
console.log("ASCII map written to test/map.txt");
