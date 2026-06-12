// ============================================================
// combat.js — turn-based naval battles in a modal:
// Cannon Volley / Board / Flee, vs pirates and Captain Redwake
// ============================================================

const Combat = {
  foe: null, lines: [], over: false,

  start(opts = {}) {
    Sea.cancelRoute(true);
    Sound.sfx("ominous");
    this.over = false; this.won = false; this.escaped = false;
    this.lootCargo = null;
    this.lines = [];

    if (opts.redwake) {
      this.foe = {
        name: EZ("Captain Redwake", "红潮船长"),
        shipName: EZ("the Cinder Queen", "“烬后号”"), redwake: true,
        hull: 220, maxHull: 220, crew: 70, maxCrew: 70, cannons: 22, maneuver: 8,
        gold: 5500,
        intro: EZ(`A black brig with cinder-red sails cuts across your bow. A voice like gravel rolls over the
                water: <em>"Maren's whelp! Her pages led me nowhere — maybe her blood will say more. TAKE THEM!"</em>`,
                `一艘挂着烬红色船帆的黑色双桅船横切过你的船头。砂砾般的嗓音滚过水面：
                <em>“玛伦的崽子！她那些破纸什么都没告诉我——也许她的血脉能多说点。给我上！”</em>`),
      };
    } else {
      const danger = opts.danger || 1;
      const s = Math.max(0.6, danger + S.fame / 500 + roll() * 0.9);
      this.foe = {
        name: EZ("Pirate ", "海盗") + L(pick(DATA.PIRATE_NAMES)),
        shipName: L(pick(DATA.PIRATE_SHIPS)),
        hull: Math.round(45 + s * 38), maxHull: 0,
        crew: Math.round(9 + s * 9), maxCrew: 0,
        cannons: Math.round(3 + s * 3.2),
        maneuver: 6 + Math.round(roll() * 4),
        gold: Math.round(150 + s * 420 * (0.7 + roll() * 0.6)),
        intro: EZ(`A ragged sail bears down on you, black flag snapping. They want your hold — and they aren't
                planning to ask twice.`,
                `一面破烂的船帆向你直压过来，黑旗猎猎作响。他们盯上了你的货舱——而且没打算开口问第二遍。`),
      };
      this.foe.maxHull = this.foe.hull; this.foe.maxCrew = this.foe.crew;
    }
    this.say(this.foe.intro);
    this.render();
  },

  say(t) {
    this.lines.push(t);
    if (this.lines.length > 4) this.lines.shift();
  },

  bar(val, max, cls) {
    const p = Math.max(0, Math.min(100, val / max * 100));
    return `<div class="bar"><div class="bar-fill ${cls}" style="width:${p}%"></div><span>${Math.max(0, Math.ceil(val))}/${max}</span></div>`;
  },

  render() {
    const f = this.foe, t = Game.shipType();
    const body = `
      <div class="combat-grid">
        <div class="combatant">
          <h3>⛵ ${S.ship.name}</h3>
          <div class="dim">${L(t.name)} — ${EZ(S.ship.cannons + " guns", S.ship.cannons + " 门炮")}</div>
          ${EZ("Hull", "船体")} ${this.bar(S.ship.hull, Game.maxHull(), "hull")}
          ${EZ("Crew", "船员")} ${this.bar(S.crew, t.maxCrew, "crew")}
        </div>
        <div class="combat-vs">⚔</div>
        <div class="combatant">
          <h3>🏴 ${f.name}</h3>
          <div class="dim">${f.shipName} — ${EZ(f.cannons + " guns", f.cannons + " 门炮")}</div>
          ${EZ("Hull", "船体")} ${this.bar(f.hull, f.maxHull, "hull foe")}
          ${EZ("Crew", "船员")} ${this.bar(f.crew, f.maxCrew, "crew foe")}
        </div>
      </div>
      <div class="combat-log">${this.lines.map(l => `<p>${l}</p>`).join("")}</div>`;

    const buttons = this.over
      ? [{ label: EZ("Continue", "继续"), fn: () => this.finish() }]
      : [
          { label: EZ("💥 Cannon Volley", "💥 舷炮齐射"), keepOpen: true, fn: () => this.volley() },
          { label: EZ("⚔ Close & Board", "⚔ 接舷强登"), keepOpen: true, fn: () => this.board() },
          { label: EZ("💨 Flee", "💨 逃跑"), keepOpen: true, fn: () => this.flee() },
        ];
    UI.modalReplace({
      title: f.redwake ? EZ("⚔ The Cinder Queen Attacks!", "⚔ “烬后号”来袭！") : EZ("⚔ Pirates!", "⚔ 海盗！"),
      body, buttons,
    });
  },

  playerGunnery() { return S.ship.cannons * (0.8 + roll() * 0.9) * 2.6 * (0.6 + S.morale / 200); },
  foeGunnery()    { return this.foe.cannons * (0.8 + roll() * 0.9) * 2.6; },

  volley() {
    if (this.over) return;
    Sound.sfx("cannon");
    const dealt = Math.round(this.playerGunnery());
    this.foe.hull -= dealt;
    this.say(EZ(`Your broadside thunders — <b>${dealt}</b> damage to ${this.foe.name}'s hull.`,
                `你的舷炮轰然齐鸣——对${this.foe.name}的船体造成 <b>${dealt}</b> 点伤害。`));
    if (this.foe.hull <= 0) return this.win(EZ(
      "Their hull splits and the sea rushes in. The black flag comes down with the ship.",
      "敌船船体崩裂，海水汹涌灌入。黑旗随着船一起沉了下去。"));
    this.foeTurn();
  },

  board() {
    if (this.over) return;
    Sound.sfx("clash");
    const atk = S.crew * (0.7 + roll() * 0.8) * (0.5 + S.morale / 120);
    const def = this.foe.crew * (0.7 + roll() * 0.8);
    if (atk > def) {
      const foeLoss = Math.max(2, Math.round(this.foe.crew * (0.25 + roll() * 0.2)));
      const myLoss = roll() < 0.5 ? randInt(0, Math.max(1, Math.round(S.crew * 0.06))) : 0;
      this.foe.crew -= foeLoss; S.crew -= myLoss;
      this.say(EZ(`Grappling hooks bite! Your boarders sweep their deck — they lose <b>${foeLoss}</b> hands${myLoss ? `, you lose ${myLoss}` : ""}.`,
                  `挠钩咬住了敌船！你的登舰队横扫敌方甲板——敌方损失 <b>${foeLoss}</b> 人${myLoss ? `，你方损失 ${myLoss} 人` : ""}。`));
      if (this.foe.crew <= 3) return this.win(EZ(
        "The last defenders throw down their blades and cry for quarter.",
        "最后几名守卫扔下刀剑，高声乞降。"));
    } else {
      const myLoss = Math.max(1, Math.round(S.crew * (0.1 + roll() * 0.12)));
      S.crew -= myLoss;
      this.say(EZ(`The boarding is thrown back! You lose <b>${myLoss}</b> crew in the melee.`,
                  `强登被击退了！你在白刃战中损失了 <b>${myLoss}</b> 名船员。`));
      if (S.crew <= 2) return this.lose();
    }
    if (!this.over && roll() < 0.5) this.foeTurn(); else this.render();
  },

  flee() {
    if (this.over) return;
    const t = Game.shipType();
    const chance = 0.4 + (t.maneuver - this.foe.maneuver) * 0.05 + (Game.speed() - 9) * 0.03;
    if (roll() < chance) {
      this.over = true;
      Sound.sfx("sail");
      this.say(EZ("You crowd on every stitch of canvas and slip away through the swell!",
                  "你张满每一寸船帆，顺着涌浪溜之大吉！"));
      this.escaped = true;
      this.render();
    } else {
      this.say(EZ("They cut the angle and stay on you — and rake your stern as you turn!",
                  "敌船抢占了内角死咬不放——还趁你转向时轰击了你的船尾！"));
      this.foeTurn();
    }
  },

  foeTurn() {
    if (this.over) return;
    Sound.sfx("cannon");
    const dealt = Math.round(this.foeGunnery());
    S.ship.hull -= dealt;
    this.say(EZ(`${this.foe.name} answers — <b>${dealt}</b> damage to your hull.`,
                `${this.foe.name}开炮还击——你的船体受到 <b>${dealt}</b> 点伤害。`));
    if (S.ship.hull <= 0) return this.lose();
    this.render();
    UI.hud();
  },

  win(text) {
    this.over = true; this.escaped = false; this.won = true;
    Sound.sfx("victory");
    const f = this.foe;
    this.say(text);
    let lootMsg = EZ(`You recover <b>🪙 ${f.gold.toLocaleString()}</b> from the captain's strongbox.`,
                     `你从敌方船长的保险箱里搜出了 <b>🪙 ${f.gold.toLocaleString()}</b>。`);
    if (Game.holdFree() >= 4 && roll() < 0.7) {
      const g = pick(DATA.GOODS);
      const qty = Math.min(Game.holdFree(), randInt(3, 10));
      this.lootCargo = { id: g.id, qty };
      lootMsg += EZ(` Their hold yields <b>${qty} × ${L(g.name)}</b>.`,
                    ` 敌方货舱里还有 <b>${qty} 件${L(g.name)}</b>。`);
    }
    this.say(lootMsg);
    this.render();
  },

  lose() {
    this.over = true; this.escaped = false; this.won = false;
    this.say(EZ("The deck tilts. The sea reaches up. Your battle is over...",
                "甲板倾斜，海水扑了上来。这场战斗结束了……"));
    this.render();
  },

  finish() {
    const f = this.foe;
    if (this.won) {
      Game.addGold(f.gold);
      if (this.lootCargo) Game.addCargo(this.lootCargo.id, this.lootCargo.qty, 0);
      this.lootCargo = null;
      S.stats.piratesBeaten++;
      S.morale = Math.min(100, S.morale + 8);
      const fame = f.redwake ? 0 : randInt(6, 14);  // Redwake's fame comes from the story reward
      if (fame) Game.addFame(fame);
      UI.log(EZ(`🏴 Victory over ${f.name}! (+🪙${f.gold.toLocaleString()})`,
                `🏴 战胜了${f.name}！(+🪙${f.gold.toLocaleString()})`), "good");
      Quests.onPirateWin();
      Story.onPirateWin(!!f.redwake);
    } else if (this.escaped) {
      S.morale = Math.max(0, S.morale - 3);
      UI.log(EZ("💨 You escaped the pirates.", "💨 你甩掉了海盗。"));
    } else {
      // defeat — rescued, stripped of cargo and much gold
      if (f.redwake) UI.log(EZ("🏴 Redwake took everything but your life. He is still out there.",
                               "🏴 红潮抢走了你除性命之外的一切。他还在海上逍遥。"), "bad");
      Sea.shipwreck();
    }
    this.won = false;
    UI.hud();
    Game.save();
  },
};
