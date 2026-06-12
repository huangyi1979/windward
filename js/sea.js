// ============================================================
// sea.js — sailing: wind, movement, time, supplies, events,
// discoveries, docking, and click-to-sail routes
// ============================================================

const Sea = {
  heading: -Math.PI / 2,

  // ---------- wind ----------
  // Banded circulation: north westerlies → mid trades → south westerlies,
  // rotated slowly by the calendar so routes shift week to week.
  windAt(day, x, y) {
    const f = y / World.H;
    let base, name;
    if (f < 0.30)      { base = 0;       name = { en:"Boreal Westerlies", zh:"北方西风带" }; }
    else if (f < 0.62) { base = Math.PI; name = { en:"Meridian Trades",   zh:"子午信风带" }; }
    else               { base = 0;       name = { en:"Austral Westerlies",zh:"南方西风带" }; }
    const wobble = Math.sin(day * 0.31 + f * 9) * 0.55 + Math.sin(day * 0.07) * 0.35;
    const a = base + wobble;
    return { dx: Math.cos(a), dy: Math.sin(a), name };
  },

  windFactor(dx, dy) {
    const w = this.windAt(S.day, S.x, S.y);
    const len = Math.hypot(dx, dy) || 1;
    const dot = (dx / len) * w.dx + (dy / len) * w.dy;
    if (dot > 0.7) return 1.35;     // running before the wind
    if (dot > 0.2) return 1.15;     // broad reach
    if (dot > -0.3) return 0.95;    // beam reach
    if (dot > -0.75) return 0.7;    // close-hauled
    return 0.5;                     // beating into it
  },

  // ---------- movement ----------
  tryMove(dx, dy) {
    if (!S || S.gameOver || UI.busy()) return false;
    if (dx === 0 && dy === 0) return false;
    const nx = S.x + dx, ny = S.y + dy;
    if (!World.isSailable(nx, ny)) return false;

    this.heading = Math.atan2(dy, dx);
    const wf = this.windFactor(dx, dy);
    const eff = Math.max(2, Game.speed() * wf);
    let hours = 22 / eff;
    if (dx !== 0 && dy !== 0) hours *= 1.41;

    S.x = nx; S.y = ny;
    S.dockedAt = null;
    S.stats.tilesSailed++;
    Sound.sfx("splash");
    Game.reveal(nx, ny, 7);
    this.advanceTime(hours);
    UI.hud();

    const port = World.portAt(nx, ny);
    if (port) {
      if (port.hidden && S.chapter < DATA.STORY.length) {
        // Radiant Isle shore before the story unlocks the harbor — treat as sea
      } else {
        this.dock(port);
        return true;
      }
    }
    if (!S.gameOver) {
      this.checkDiscoveries();
      this.rollEvent();
    }
    return true;
  },

  // ---------- routes (click-to-sail) ----------
  setRoute(tx, ty) {
    if (!S || S.gameOver) return;
    if (!S.explored[World.idx(tx, ty)]) {
      UI.log(EZ("Those waters are still uncharted — sail closer first.",
                "那片海域尚未探明——先航行到附近再说。"));
      return;
    }
    const port = World.portAt(tx, ty);
    if (!World.isSailable(tx, ty)) return;
    if (tx === S.x && ty === S.y) return;
    const path = World.findPath(S.x, S.y, tx, ty);
    if (!path) { UI.log(EZ("No sea route leads there.", "没有通往那里的海路。"), "bad"); return; }
    S.route = path;
    UI.log(EZ(`Course set${port ? " for " + L(port.name) : ""} — ${path.length} leagues. (Press any direction or ⚓ to belay.)`,
              `已设定航线${port ? "，目的地：" + L(port.name) : ""}——全程 ${path.length} 里格。（按任意方向键或 ⚓ 取消。）`));
  },

  cancelRoute(silent) {
    if (S && S.route) { S.route = null; if (!silent) UI.log(EZ("Course belayed.", "航线已取消。")); }
  },

  // called by the main loop tick while a route is active
  routeStep() {
    if (!S || !S.route || !S.route.length || UI.busy() || S.gameOver) return;
    const [nx, ny] = S.route[0];
    const moved = this.tryMove(nx - S.x, ny - S.y);
    if (!moved) { this.cancelRoute(true); return; }
    if (S.route) {
      S.route.shift();
      if (!S.route.length) {
        S.route = null;
        UI.log(EZ("You arrive at your destination.", "你抵达了目的地。"));
      }
    }
  },

  // ---------- time & upkeep ----------
  advanceTime(hours) {
    S.hour += hours;
    while (S.hour >= 24) {
      S.hour -= 24;
      S.day++;
      this.dailyTick();
    }
  },

  dailyTick() {
    const rate = Game.rationRate();
    S.food = Math.max(0, S.food - rate);
    S.water = Math.max(0, S.water - rate);

    if (!S.dockedAt) S.morale = Math.max(0, S.morale - 1);

    if (S.water <= 0) {
      const lost = Math.max(1, Math.round(S.crew * 0.15));
      S.crew -= lost; S.morale = Math.max(0, S.morale - 18);
      UI.log(EZ(`💀 No water! ${lost} of the crew succumb to thirst!`,
                `💀 没有淡水了！${lost} 名船员渴死了！`), "bad");
    } else if (S.food <= 0) {
      const lost = Math.max(1, Math.round(S.crew * 0.08));
      S.crew -= lost; S.morale = Math.max(0, S.morale - 12);
      UI.log(EZ(`💀 The rations are gone! ${lost} crew lost to starvation!`,
                `💀 口粮吃光了！${lost} 名船员饿死了！`), "bad");
    }

    if (S.morale <= 15 && S.crew > 1 && roll() < 0.25) {
      Sound.sfx("ominous");
      const deserters = Math.max(1, Math.round(S.crew * 0.2));
      S.crew -= deserters;
      S.morale = 35;
      UI.modal({
        title: EZ("Mutiny on the Water", "海上哗变"),
        body: EZ(`<p>Grim faces gather at the mast. ${deserters} hands seize the longboat and row for the
               horizon, cursing your name. The rest stay — for now. Keep them fed and paid in victories.</p>`,
               `<p>阴沉的面孔聚集在桅杆下。${deserters} 名船员夺了长艇，咒骂着你的名字向地平线划去。
               其余的人留了下来——暂时而已。让他们吃饱饭，再用胜利付他们工钱。</p>`),
      });
    }

    if (S.crew <= 0) {
      this.gameOver(EZ("Your last crewman slips away, and the ship drifts crewless beneath an empty sky.",
                       "最后一名船员也离你而去，这艘船在空荡荡的天空下漂流，再无人掌舵。"));
      return;
    }

    if (S.day % 4 === 0) Game.save();
    UI.hud();
  },

  // ---------- discoveries ----------
  checkDiscoveries() {
    for (const d of World.disc) {
      if (S.found[d.id]) continue;
      if (d.hidden && S.chapter < 4) continue;  // Radiant Isle only findable in Chapter V
      const dist = Math.hypot(d.x - S.x, d.y - S.y);
      if (dist <= 2.3) {
        S.found[d.id] = { reported: false };
        this.cancelRoute(true);
        Sound.sfx("chime");
        UI.log(EZ(`✦ Discovery! ${L(d.name)}!`, `✦ 新发现！${L(d.name)}！`), "good");
        UI.modal({
          title: EZ(`✦ Discovery — ${L(d.name)}`, `✦ 地理发现 — ${L(d.name)}`),
          body: EZ(`<p>${L(d.desc)}</p>
                 <p class="dim">The crew crowds the rail, already telling the story bigger than it happened.</p>
                 <p>⭐ Fame +${d.fame} · Report this at any <strong>Trade Guild</strong> for 🪙 ${d.reward.toLocaleString()}.</p>`,
                `<p>${L(d.desc)}</p>
                 <p class="dim">船员们挤在船舷边，故事已经越传越夸张了。</p>
                 <p>⭐ 名声 +${d.fame} · 到任意<strong>商会</strong>报告此发现可获得 🪙 ${d.reward.toLocaleString()}。</p>`),
        });
        Game.addFame(d.fame);
        Quests.onDiscover(d.id);
        Story.onDiscover(d.id);
        Game.save();
      }
    }
  },

  // ---------- random events ----------
  regionDanger() {
    let best = null, bd = 1e9;
    for (const p of World.ports) {
      const d = Math.hypot(p.x - S.x, p.y - S.y);
      if (d < bd) { bd = d; best = p; }
    }
    return DATA.REGIONS[best.region].danger;
  },

  rollEvent() {
    const r = roll();
    const danger = this.regionDanger();
    const wealth = Math.min(2, Game.cargoValue() / 4000 + S.gold / 30000);
    const pPirate = 0.011 * danger * (1 + wealth);
    const pRedwake = (S.chapter === 2) ? 0.012 : 0;   // Chapter III: Redwake hunts you
    const pStorm = 0.011;
    const pFortune = 0.012;
    const pFlavor = 0.045;

    if (r < pRedwake) return Combat.start({ redwake: true });
    if (r < pRedwake + pPirate) return Combat.start({ danger });
    if (r < pRedwake + pPirate + pStorm) return this.storm();
    if (r < pRedwake + pPirate + pStorm + pFortune) return this.fortune();
    if (r < pRedwake + pPirate + pStorm + pFortune + pFlavor) {
      UI.log("🌊 " + L(pick(DATA.SEA_FLAVOR)));
    }
  },

  storm() {
    this.cancelRoute(true);
    Sound.sfx("thunder");
    const dmg = Math.round(Game.maxHull() * (0.06 + roll() * 0.12));
    S.ship.hull = Math.max(0, S.ship.hull - dmg);
    const lostBarrels = roll() < 0.5 ? randInt(1, 3) : 0;
    if (lostBarrels) {
      S.food = Math.max(0, S.food - lostBarrels);
      S.morale = Math.max(0, S.morale - 4);
    }
    UI.modal({
      title: EZ("⛈ Storm!", "⛈ 风暴！"),
      body: EZ(`<p>The sky turns the color of a bruise and the sea stands up in ridges. The crew fights the
             rigging for hours before the squall lets go.</p>
             <p class="bad">Hull −${dmg}${lostBarrels ? ` · ${lostBarrels} barrels of stores washed overboard` : ""}</p>`,
            `<p>天空变成了淤青的颜色，海面掀起一道道山脊。船员们与索具搏斗了几个小时，风暴才肯松手。</p>
             <p class="bad">船体 −${dmg}${lostBarrels ? ` · ${lostBarrels} 桶补给被卷入海中` : ""}</p>`),
    });
    UI.hud();
    if (S.ship.hull <= 0) this.shipwreck();
  },

  fortune() {
    const kind = roll();
    if (kind < 0.45 && Game.holdFree() >= 4) {
      const g = pick(DATA.GOODS.filter(x => x.cat !== "luxury"));
      const qty = Math.min(Game.holdFree(), randInt(3, 8));
      Game.addCargo(g.id, qty, 0);
      UI.log(EZ(`🛟 Flotsam! You haul aboard ${qty} × ${L(g.name)} from a wrecked cargo raft.`,
                `🛟 海上漂流物！你从一只破损的货筏上捞起了 ${qty} 件${L(g.name)}。`), "good");
    } else if (kind < 0.75 && S.crew < Game.shipType().maxCrew) {
      S.crew++; S.morale = Math.min(100, S.morale + 6);
      UI.modal({
        title: EZ("🛟 Castaway", "🛟 海上遇难者"),
        body: EZ(`<p>A weathered sailor clings to a broken spar, very much alive and very loud about it.
               Hauled aboard, fed, and signed on before the soup is finished.</p><p class="good">Crew +1, morale up.</p>`,
              `<p>一名饱经风霜的水手抱着断裂的桅桁，不但活着，嗓门还很大。把他拉上船、喂了顿饭，
               汤还没喝完就签了船员契约。</p><p class="good">船员 +1，士气上升。</p>`),
      });
    } else {
      const g = randInt(60, 220);
      Game.addGold(g);
      UI.log(EZ(`🛟 A drifting sea-chest! Inside: ${g} gold and a very angry crab.`,
                `🛟 一只漂流的海箱！里面有 ${g} 金币，和一只非常愤怒的螃蟹。`), "good");
    }
    UI.hud();
  },

  // ---------- docking ----------
  dock(port) {
    this.cancelRoute(true);
    S.dockedAt = port.id;
    S.lastPort = port.id;
    const firstVisit = !S.stats.portsVisited[port.id];
    S.stats.portsVisited[port.id] = true;
    S.morale = Math.min(100, S.morale + 6);
    Sound.sfx("bell");
    UI.log(EZ(`⚓ Docked at ${L(port.name)}, ${L(DATA.REGIONS[port.region].name)}.`,
              `⚓ 停靠于${L(DATA.REGIONS[port.region].name)}的${L(port.name)}。`));
    if (firstVisit) Game.addFame(5);
    Port.open(port);
    Quests.onDock(port);
    Story.onDock(port.id);
    Game.save();
  },

  // ---------- disasters ----------
  shipwreck() {
    Sound.sfx("defeat");
    const port = World.PORT[S.lastPort] || World.PORT["avelar"];
    S.cargo = {};
    const lost = Math.round(S.gold * 0.4);
    S.gold -= lost;
    S.ship.hull = Math.round(Game.maxHull() * 0.3);
    S.x = port.x; S.y = port.y;
    S.morale = 40;
    S.food = Math.max(S.food, 5); S.water = Math.max(S.water, 5);
    S.route = null;
    UI.modal({
      title: EZ("🌊 Shipwreck!", "🌊 船难！"),
      body: EZ(`<p>The hull gives way. Cold water, splintered planks, a long dark night clinging to wreckage...</p>
             <p>Fisherfolk haul your crew from the surf and tow the battered hull to <strong>${L(port.name)}</strong>.</p>
             <p class="bad">All cargo lost · ${lost.toLocaleString()} gold sank with the hold.</p>`,
            `<p>船体终于支撑不住了。冰冷的海水、碎裂的船板、抱着残骸熬过的漫长黑夜……</p>
             <p>渔民们把你的船员从浪里捞起，把残破的船壳拖到了<strong>${L(port.name)}</strong>。</p>
             <p class="bad">全部货物损失 · ${lost.toLocaleString()} 金币随货舱沉入海底。</p>`),
      buttons: [{ label: EZ("Limp ashore", "蹒跚上岸"), fn: () => Sea.dock(port) }],
    });
  },

  gameOver(text) {
    S.gameOver = true;
    UI.modal({
      title: EZ("The Sea Keeps Its Secrets", "大海守住了它的秘密"),
      body: EZ(`<p>${text}</p><p class="dim">The tale of ${S.captain} ends here... but the Meridian remembers
             every sail. Another captain will rise.</p>`,
            `<p>${text}</p><p class="dim">${S.captain}的故事到此为止……但子午海记得每一面帆。
             新的船长终会扬帆而起。</p>`),
      buttons: [
        { label: EZ("Load Last Save", "读取最近存档"), fn: () => {
            if (Game.load()) { UI.hud(); UI.log(EZ("…the nightmare fades. You wake in your bunk.",
                                                   "……噩梦散去。你在自己的铺位上醒来。")); } } },
        { label: EZ("New Voyage", "新的航程"), fn: () => Main.toTitle() },
      ],
    });
  },

  depart() {
    if (S.dockedAt) {
      Sound.sfx("sail");
      UI.log(EZ(`⛵ ${S.ship.name} puts out from ${L(World.PORT[S.dockedAt].name)}.`,
                `⛵ ${S.ship.name}驶离${L(World.PORT[S.dockedAt].name)}。`));
      S.dockedAt = null;
    }
  },
};
