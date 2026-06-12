// ============================================================
// quests.js — Trade Guild contracts: deliver, procure, hunt, survey
// ============================================================

const Quests = {
  MAX_ACTIVE: 3,

  // Deterministic daily offers per port (so reopening the guild doesn't reroll)
  offers(port) {
    const seedRng = mulberry32((port.id.length * 7919 + port.x * 131 + port.y) ^ (S.day * 2654435761));
    const out = [];
    const others = World.ports.filter(p => p.id !== port.id && !p.hidden);
    for (let k = 0; k < 3; k++) {
      const r = seedRng();
      if (r < 0.38) {
        // DELIVER: guild provides the cargo, pays on arrival
        const dest = others[Math.floor(seedRng() * others.length)];
        const good = DATA.GOODS[Math.floor(seedRng() * 14)];   // bulk goods only
        const dist = Math.hypot(dest.x - port.x, dest.y - port.y);
        const qty = Math.max(6, Math.round((10 + seedRng() * 25)));
        const reward = Math.round(qty * good.base * 0.45 + dist * 14);
        out.push({ type: "deliver", key: `d:${port.id}:${k}:${S.day}`, good: good.id, qty,
                   dest: dest.id, reward, fame: 8 });
      } else if (r < 0.68) {
        // PROCURE: bring goods to THIS port, buy them wherever you like
        const good = DATA.GOODS[Math.floor(seedRng() * DATA.GOODS.length)];
        const qty = Math.max(4, Math.round(6 + seedRng() * 18));
        const reward = Math.round(qty * good.base * 1.9);
        out.push({ type: "procure", key: `p:${port.id}:${k}:${S.day}`, good: good.id, qty,
                   dest: port.id, reward, fame: 10 });
      } else if (r < 0.85) {
        // HUNT: defeat any pirate
        const reward = Math.round(700 + seedRng() * 900 + S.fame * 1.5);
        out.push({ type: "hunt", key: `h:${port.id}:${k}:${S.day}`, reward, fame: 14 });
      } else {
        // SURVEY: find a specific undiscovered landmark
        const unfound = World.disc.filter(d => !S.found[d.id] && !d.hidden);
        if (!unfound.length) { k--; continue; }
        const d = unfound[Math.floor(seedRng() * unfound.length)];
        const reward = Math.round(d.reward * 0.6);
        out.push({ type: "survey", key: `s:${port.id}:${k}:${S.day}`, disc: d.id, reward, fame: 16 });
      }
    }
    return out;
  },

  // human-readable offer text (built at render time so it follows the language)
  offerText(o, port) {
    const r = o.reward.toLocaleString();
    if (o.type === "deliver") {
      const g = L(DATA.GOOD[o.good].name), dest = L(World.PORT[o.dest].name);
      return EZ(`Carry <b>${o.qty} × ${g}</b> (guild cargo) to <b>${dest}</b>. Pays 🪙${r} on delivery.`,
                `将 <b>${o.qty} 件${g}</b>（商会货物）运往<b>${dest}</b>。送达后支付 🪙${r}。`);
    }
    if (o.type === "procure") {
      const g = L(DATA.GOOD[o.good].name);
      return EZ(`Bring <b>${o.qty} × ${g}</b> here to <b>${L(port.name)}</b>. Pays 🪙${r}.`,
                `采购 <b>${o.qty} 件${g}</b>送到本港（<b>${L(port.name)}</b>）。报酬 🪙${r}。`);
    }
    if (o.type === "hunt") {
      return EZ(`Pirates plague the trade lanes. Defeat <b>any pirate ship</b>. Bounty: 🪙${r}.`,
                `海盗为害商路。击败<b>任意一艘海盗船</b>。赏金：🪙${r}。`);
    }
    const d = World.DISC[o.disc];
    return EZ(`Scholars seek <b>${L(d.name)}</b>. Rumored near ${this.hint(port, d)}. Find it: 🪙${r} (plus the usual report fee).`,
              `学者们寻求<b>${L(d.name)}</b>的下落。据传${this.hint(port, d)}。找到它：🪙${r}（另有常规报告酬金）。`);
  },

  hint(port, d) {
    const dx = d.x - port.x, dy = d.y - port.y;
    const ewEn = dx > 12 ? "east" : dx < -12 ? "west" : "";
    const nsEn = dy > 12 ? "south" : dy < -12 ? "north" : "";
    const ewZh = dx > 12 ? "东" : dx < -12 ? "西" : "";
    const nsZh = dy > 12 ? "南" : dy < -12 ? "北" : "";
    const dist = Math.hypot(dx, dy);
    if (!(nsEn + ewEn)) return EZ("these very waters", "就在附近海域");
    const farEn = dist > 70 ? "far to the " : dist > 30 ? "to the " : "a short sail to the ";
    const farZh = dist > 70 ? "在遥远的" : dist > 30 ? "在" : "在不远的";
    return EZ(farEn + nsEn + ewEn, `${farZh}${ewZh ? nsZh + ewZh : nsZh}方`);
  },

  accept(offer) {
    if (S.quests.length >= this.MAX_ACTIVE) {
      UI.log(EZ("You already hold three guild contracts.", "你已经接了三份商会契约。"), "bad");
      return false;
    }
    if (S.quests.some(q => q.key === offer.key)) return false;
    if (offer.type === "deliver") {
      if (Game.holdFree() < offer.qty) {
        UI.log(EZ(`Not enough hold space (${offer.qty} needed).`, `货舱空间不足（需要 ${offer.qty} 格）。`), "bad");
        return false;
      }
      Game.addCargo(offer.good, offer.qty, 0);
      offer.guildCargo = true;
    }
    S.quests.push(Object.assign({ acceptedDay: S.day }, offer));
    UI.log(EZ(`📜 Contract accepted: ${this.shortText(offer)}`, `📜 已接受契约：${this.shortText(offer)}`));
    return true;
  },

  abandon(q) {
    S.quests = S.quests.filter(x => x.key !== q.key);
    if (q.type === "deliver") {
      // guild cargo is forfeit
      const have = S.cargo[q.good] ? S.cargo[q.good].qty : 0;
      Game.removeCargo(q.good, Math.min(have, q.qty));
      Game.addGold(-Math.min(S.gold, 200));
      UI.log(EZ(`📜 Contract broken — guild cargo forfeited and a 200 gold penalty paid.`,
                `📜 契约毁弃——商会货物被没收，并支付了 200 金币违约金。`), "bad");
    } else {
      UI.log(EZ(`📜 Contract abandoned.`, `📜 已放弃契约。`));
    }
  },

  shortText(q) {
    if (q.type === "deliver" || q.type === "procure")
      return EZ(`${q.qty} ${L(DATA.GOOD[q.good].name)} → ${L(World.PORT[q.dest].name)}`,
                `${q.qty} 件${L(DATA.GOOD[q.good].name)} → ${L(World.PORT[q.dest].name)}`);
    if (q.type === "hunt")   return EZ("defeat a pirate", "击败一艘海盗船");
    if (q.type === "survey") return EZ(`find ${L(World.DISC[q.disc].name)}`, `找到${L(World.DISC[q.disc].name)}`);
    return "?";
  },

  complete(q) {
    S.quests = S.quests.filter(x => x.key !== q.key);
    S.questsDone++;
    Sound.sfx("quest");
    Game.addGold(q.reward);
    Game.addFame(q.fame);
    UI.modal({
      title: EZ("📜 Contract Fulfilled", "📜 契约达成"),
      body: `<p>${
        q.type === "hunt"   ? EZ("The bounty is paid in full, no questions asked.", "赏金如数付清，没人多问一句。") :
        q.type === "survey" ? EZ("The scholars are beside themselves with joy.", "学者们欣喜若狂。") :
                              EZ("The goods change hands and the guild seal is stamped.", "货物交割完毕，商会印章落定。")
      }</p><p class="good">🪙 +${q.reward.toLocaleString()} · ⭐ +${q.fame}</p>`,
    });
    Game.save();
  },

  // deliveries & procurement check on docking
  onDock(port) {
    for (const q of [...S.quests]) {
      if ((q.type === "deliver" || q.type === "procure") && q.dest === port.id) {
        const have = S.cargo[q.good] ? S.cargo[q.good].qty : 0;
        if (have >= q.qty) {
          Game.removeCargo(q.good, q.qty);
          this.complete(q);
        }
      }
    }
  },

  onPirateWin() {
    const q = S.quests.find(x => x.type === "hunt");
    if (q) this.complete(q);
  },

  onDiscover(discId) {
    const q = S.quests.find(x => x.type === "survey" && x.disc === discId);
    if (q) this.complete(q);
  },

  // unreported discovery rewards
  unreported() {
    return World.disc.filter(d => S.found[d.id] && !S.found[d.id].reported);
  },

  reportAll() {
    const list = this.unreported();
    if (!list.length) return 0;
    let total = 0;
    for (const d of list) { total += d.reward; S.found[d.id].reported = true; }
    Game.addGold(total);
    Game.addFame(list.length * 2);
    UI.log(EZ(`✦ Reported ${list.length} ${list.length > 1 ? "discoveries" : "discovery"} to the guild cartographers: +🪙${total.toLocaleString()}`,
              `✦ 向商会制图师报告了 ${list.length} 项地理发现：+🪙${total.toLocaleString()}`), "good");
    Game.save();
    return total;
  },
};
