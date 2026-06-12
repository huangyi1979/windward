// ============================================================
// port.js — everything ashore: Harbor, Market, Shipyard, Tavern,
// Trade Guild. Prices drift daily; producers sell cheap, buyers
// pay dear — the heart of the trading game.
// ============================================================

const Port = {
  cur: null, tab: "harbor",
  FOOD_PRICE: 4, WATER_PRICE: 2, CREW_PRICE: 25, REPAIR_PRICE: 2, CANNON_PRICE: 180, TRIM_PRICE: 2200,

  isOpen() { return !!this.cur; },

  open(port) {
    this.cur = port;
    this.tab = "harbor";
    // prune stale market-purchase records
    for (const k in S.marketTaken) if (!k.endsWith(":" + S.day)) delete S.marketTaken[k];
    UI.el("port-veil").style.display = "flex";
    UI.el("btn-set-sail").innerHTML = EZ("⛵ Set Sail", "⛵ 启航");
    this.render();
  },

  close() {
    this.cur = null;
    UI.el("port-veil").style.display = "none";
    Sea.depart();
    UI.hud();
  },

  render() {
    if (!this.cur) return;
    const port = this.cur;
    UI.el("port-name").textContent = `⚓ ${L(port.name)}`;
    UI.el("port-desc").textContent = `${L(DATA.REGIONS[port.region].name)} — ${L(port.desc)}`;
    const tabs = [
      ["harbor", EZ("⚓ Harbor", "⚓ 码头")], ["market", EZ("⚖ Market", "⚖ 市场")],
      ["shipyard", EZ("🔨 Shipyard", "🔨 船坞")], ["tavern", EZ("🍺 Tavern", "🍺 酒馆")],
      ["guild", EZ("📜 Guild", "📜 商会")],
    ];
    UI.el("port-tabs").innerHTML = tabs.map(([id, label]) =>
      `<button class="tab-btn ${this.tab === id ? "active" : ""}" onclick="Port.show('${id}')">${label}</button>`).join("");
    UI.el("port-quickstats").innerHTML =
      `🪙 ${S.gold.toLocaleString()} &nbsp; 📦 ${Game.holdUsed()}/${Game.holdMax()} &nbsp; 👥 ${S.crew} &nbsp; 🛠 ${Math.ceil(S.ship.hull)}/${Game.maxHull()}`;
    UI.el("port-hint").textContent = "🧭 " + Story.objectiveText();
    this["render_" + this.tab]();
    UI.hud();
  },

  show(tab) { this.tab = tab; this.render(); },

  // ============ MARKET PRICING ============
  priceOf(port, goodId) {
    const g = DATA.GOOD[goodId];
    let f = 1.0;
    if (port.produces.includes(goodId)) f = 0.55;
    else if (port.demands.includes(goodId)) f = 1.75;
    const phase = hash2(port.x * 31 + port.y, DATA.GOODS.indexOf(g), 1234);
    const drift = 1 + 0.20 * Math.sin(S.day / 8.5 + phase * Math.PI * 2);
    return Math.max(2, Math.round(g.base * f * drift));
  },
  sellPriceOf(port, goodId) { return Math.max(1, Math.round(this.priceOf(port, goodId) * 0.97)); },

  baseStock(port, goodId) {
    if (port.produces.includes(goodId)) return 45 + Math.floor(hash2(S.day, port.x + DATA.GOODS.findIndex(g => g.id === goodId), 77) * 50);
    if (port.demands.includes(goodId)) return 0;
    const h = hash2(S.day + port.y, DATA.GOODS.findIndex(g => g.id === goodId) * 7 + port.x, 99);
    return h > 0.55 ? 4 + Math.floor(h * 22) : 0;
  },
  stockOf(port, goodId) {
    const taken = S.marketTaken[`${port.id}:${goodId}:${S.day}`] || 0;
    return Math.max(0, this.baseStock(port, goodId) - taken);
  },

  // ============ HARBOR ============
  render_harbor() {
    const p = this.cur;
    const rate = Game.rationRate().toFixed(1);
    const produces = p.produces.map(g => L(DATA.GOOD[g].name)).join(EZ(", ", "、")) || EZ("nothing", "无");
    const demands = p.demands.map(g => L(DATA.GOOD[g].name)).join(EZ(", ", "、")) || EZ("nothing", "无");
    UI.el("port-body").innerHTML = `
      <div class="panel-cols">
        <div class="panel">
          <h3>${EZ("Ship's Stores", "船上补给")}</h3>
          <p class="dim">${EZ(`The crew of ${S.crew} drinks ${rate} barrels of water and eats ${rate} of rations a day.
          Each barrel takes one space in the hold.`,
          `${S.crew} 名船员每天要喝掉 ${rate} 桶淡水、吃掉 ${rate} 桶口粮。每桶占用一格货舱空间。`)}</p>
          <table class="shop-table">
            <tr><td>🍞 ${EZ("Rations", "口粮")} <span class="dim">${EZ(`(have ${Math.ceil(S.food)})`, `（现有 ${Math.ceil(S.food)}）`)}</span></td>
              <td>🪙${this.FOOD_PRICE}${EZ("/barrel", "/桶")}</td>
              <td>${this.qbtns("Port.buySupply('food',%n)", [1, 10, -1])}</td></tr>
            <tr><td>💧 ${EZ("Water", "淡水")} <span class="dim">${EZ(`(have ${Math.ceil(S.water)})`, `（现有 ${Math.ceil(S.water)}）`)}</span></td>
              <td>🪙${this.WATER_PRICE}${EZ("/barrel", "/桶")}</td>
              <td>${this.qbtns("Port.buySupply('water',%n)", [1, 10, -1])}</td></tr>
          </table>
          <button class="btn" onclick="Port.fillStores()">${EZ("⚖ Provision for a long voyage (fill ~40% of hold)", "⚖ 为远航备货（约占货舱四成）")}</button>
          <p class="dim">${EZ("Hold free", "货舱剩余")}: ${Game.holdFree()}</p>
        </div>
        <div class="panel">
          <h3>${EZ("Harborside", "港口风物")}</h3>
          <p class="dim">${L(DATA.REGIONS[p.region].blurb)}</p>
          <p>${EZ("Cheap here", "本地特产（便宜）")}: <b>${produces}</b><br>
             ${EZ("Pays well for", "高价收购")}: <b>${demands}</b></p>
          <button class="btn" onclick="Port.restDay()">${EZ("🌙 Rest one day (markets shift, crew recovers)", "🌙 休整一天（行情变动，船员恢复）")}</button>
        </div>
      </div>`;
  },

  qbtns(tpl, amounts) {
    return amounts.map(n =>
      `<button class="btn btn-small" onclick="${tpl.replace("%n", n)}">${n === -1 ? EZ("Max", "最大") : "+" + n}</button>`).join("");
  },

  buySupply(kind, qty) {
    const price = kind === "food" ? this.FOOD_PRICE : this.WATER_PRICE;
    const maxAfford = Math.floor(S.gold / price);
    if (qty === -1) qty = Math.min(Game.holdFree(), maxAfford);
    qty = Math.min(qty, Game.holdFree(), maxAfford);
    if (qty <= 0) { UI.log(EZ("No room or no gold for more barrels.", "没有空间或金币再买桶装补给了。"), "bad"); return; }
    Game.addGold(-qty * price);
    if (kind === "food") S.food += qty; else S.water += qty;
    this.render();
  },

  fillStores() {
    const target = Math.floor(Game.holdMax() * 0.2);   // 20% food + 20% water
    const needF = Math.max(0, target - Math.ceil(S.food));
    const needW = Math.max(0, target - Math.ceil(S.water));
    this.buySupply("food", Math.min(needF, Game.holdFree()));
    this.buySupply("water", Math.min(needW, Game.holdFree()));
  },

  restDay() {
    Sea.advanceTime(24);
    S.morale = Math.min(100, S.morale + 5);
    UI.log(EZ("🌙 The crew sleeps ashore. Gulls argue about breakfast.", "🌙 船员们睡在岸上。海鸥为早饭吵个不停。"));
    Game.save();
    this.render();
  },

  // ============ MARKET ============
  render_market() {
    const p = this.cur;
    let buyRows = "";
    for (const g of DATA.GOODS) {
      const stock = this.stockOf(p, g.id);
      if (stock <= 0) continue;
      const price = this.priceOf(p, g.id);
      const cheap = p.produces.includes(g.id);
      const have = S.cargo[g.id] ? S.cargo[g.id].qty : 0;
      buyRows += `<tr>
        <td>${L(g.name)} ${cheap ? `<span class="tag-cheap">${EZ("local", "特产")}</span>` : ""}</td>
        <td class="${cheap ? "good" : ""}">🪙${price}</td>
        <td class="dim">${stock}</td><td class="dim">${have || ""}</td>
        <td>${this.qbtns(`Port.buyGood('${g.id}',%n)`, [1, 10, -1])}</td></tr>`;
    }
    let sellRows = "";
    for (const id in S.cargo) {
      const c = S.cargo[id];
      if (c.qty <= 0) continue;
      const sp = this.sellPriceOf(p, id);
      const avg = c.qty ? c.paid / c.qty : 0;
      const profitCls = sp > avg * 1.15 ? "good" : sp < avg * 0.95 ? "bad" : "";
      const wanted = p.demands.includes(id);
      sellRows += `<tr>
        <td>${L(DATA.GOOD[id].name)} ${wanted ? `<span class="tag-want">${EZ("in demand!", "热销！")}</span>` : ""}</td>
        <td class="${profitCls}">🪙${sp}</td>
        <td class="dim">${EZ("paid ~", "成本约")}${Math.round(avg)}</td><td>${c.qty}</td>
        <td>${this.qbtns(`Port.sellGood('${id}',%n)`, [1, 10, -1])}</td></tr>`;
    }
    UI.el("port-body").innerHTML = `
      <div class="panel-cols">
        <div class="panel">
          <h3>${EZ("For Sale Here", "本港有售")} <span class="dim">${EZ(`(hold free: ${Game.holdFree()})`, `（货舱剩余：${Game.holdFree()}）`)}</span></h3>
          <table class="shop-table"><tr class="thead"><td>${EZ("Good", "货物")}</td><td>${EZ("Price", "价格")}</td><td>${EZ("Stock", "库存")}</td><td>${EZ("Have", "持有")}</td><td></td></tr>
          ${buyRows || `<tr><td colspan=5 class='dim'>${EZ("Nothing on the docks today.", "今天码头上没什么货。")}</td></tr>`}</table>
        </div>
        <div class="panel">
          <h3>${EZ("Your Hold", "你的货舱")}</h3>
          <table class="shop-table"><tr class="thead"><td>${EZ("Good", "货物")}</td><td>${EZ("Sells at", "售价")}</td><td>${EZ("Cost", "成本")}</td><td>${EZ("Qty", "数量")}</td><td></td></tr>
          ${sellRows || `<tr><td colspan=5 class='dim'>${EZ("Your hold carries only ambition.", "你的货舱里只装着雄心壮志。")}</td></tr>`}</table>
          <p class="dim">${EZ(`Tip: goods marked <span class="tag-cheap">local</span> are cheap here — sell them where
          they're <span class="tag-want">in demand!</span> Taverns know who pays best.`,
          `提示：标着<span class="tag-cheap">特产</span>的货物在本地便宜——把它们卖到<span class="tag-want">热销！</span>的港口去。酒馆里的人最清楚谁出价最高。`)}</p>
        </div>
      </div>`;
  },

  buyGood(id, qty) {
    const p = this.cur;
    const price = this.priceOf(p, id);
    const stock = this.stockOf(p, id);
    const maxAfford = Math.floor(S.gold / price);
    if (qty === -1) qty = Math.min(stock, Game.holdFree(), maxAfford);
    qty = Math.min(qty, stock, Game.holdFree(), maxAfford);
    if (qty <= 0) { UI.log(EZ("Can't buy that — check gold, stock, and hold space.", "买不了——查查金币、库存和货舱空间。"), "bad"); return; }
    Game.addGold(-qty * price);
    Game.addCargo(id, qty, qty * price);
    const k = `${p.id}:${id}:${S.day}`;
    S.marketTaken[k] = (S.marketTaken[k] || 0) + qty;
    this.render();
  },

  sellGood(id, qty) {
    const c = S.cargo[id];
    if (!c || c.qty <= 0) return;
    if (qty === -1) qty = c.qty;
    qty = Math.min(qty, c.qty);
    const sp = this.sellPriceOf(this.cur, id);
    Game.removeCargo(id, qty);
    Game.addGold(qty * sp);
    this.render();
  },

  // ============ SHIPYARD ============
  render_shipyard() {
    const p = this.cur;
    const t = Game.shipType();
    const missing = Math.max(0, Game.maxHull() - Math.ceil(S.ship.hull));
    const repairCost = missing * this.REPAIR_PRICE;
    const canCannon = S.ship.cannons < t.maxCannons;
    const range = p.size >= 3 ? DATA.SHIPS.length : p.size === 2 ? 6 : 3;
    const forSale = DATA.SHIPS.slice(0, range).filter(sh => sh.id !== S.ship.type);
    const tradeIn = Math.round(DATA.SHIP[S.ship.type].price * 0.55);

    let shipCards = forSale.map(sh => {
      const net = sh.price - tradeIn;
      return `<div class="ship-card">
        <h4>${L(sh.name)} — 🪙${sh.price.toLocaleString()}</h4>
        <p class="dim">${L(sh.desc)}</p>
        <p>📦${sh.hold} · 👥${sh.maxCrew} · 🛠${sh.hull} · 💨${sh.speed} · 🎯${sh.maneuver} · 💥${sh.maxCannons}${EZ(" guns", " 门炮")}</p>
        <button class="btn ${net <= S.gold ? "btn-gold" : ""}" onclick="Port.buyShip('${sh.id}')">
          ${EZ(`Buy (🪙${net.toLocaleString()} after trade-in)`, `购买（折抵后 🪙${net.toLocaleString()}）`)}</button>
      </div>`;
    }).join("");

    UI.el("port-body").innerHTML = `
      <div class="panel-cols">
        <div class="panel">
          <h3>${EZ("Your Ship", "你的座舰")} — ${S.ship.name} <span class="dim">(${L(t.name)})</span></h3>
          <p>🛠 ${EZ("Hull", "船体")} ${Math.ceil(S.ship.hull)}/${t.hull} · 💥 ${S.ship.cannons}/${t.maxCannons} ${EZ("cannons", "门炮")} · 💨 ${EZ("speed", "航速")} ${t.speed}${S.ship.sailTrim ? "+" + S.ship.sailTrim : ""}</p>
          <button class="btn" onclick="Port.repair()" ${missing ? "" : "disabled"}>${EZ(`🔧 Repair all (🪙${repairCost.toLocaleString()})`, `🔧 全面修理（🪙${repairCost.toLocaleString()}）`)}</button>
          <button class="btn" onclick="Port.buyCannon()" ${canCannon ? "" : "disabled"}>${EZ(`💥 Mount a cannon (🪙${this.CANNON_PRICE})`, `💥 加装一门火炮（🪙${this.CANNON_PRICE}）`)}</button>
          <button class="btn" onclick="Port.buyTrim()" ${S.ship.sailTrim ? "disabled" : ""}>${EZ(`⛵ Re-cut the sails, +1 speed (🪙${this.TRIM_PRICE.toLocaleString()})`, `⛵ 重裁船帆，航速 +1（🪙${this.TRIM_PRICE.toLocaleString()}）`)}</button>
          <button class="btn" onclick="Port.renameShip()">${EZ("✏ Rename ship", "✏ 为船改名")}</button>
        </div>
        <div class="panel">
          <h3>${EZ("Hulls for Sale", "出售舰船")} <span class="dim">${EZ(`(trade-in value: 🪙${tradeIn.toLocaleString()})`, `（旧船折抵：🪙${tradeIn.toLocaleString()}）`)}</span></h3>
          ${shipCards || `<p class='dim'>${EZ("This yard only does repairs.", "这家船坞只做修理生意。")}</p>`}
        </div>
      </div>`;
  },

  repair() {
    const missing = Math.max(0, Game.maxHull() - Math.ceil(S.ship.hull));
    const cost = missing * this.REPAIR_PRICE;
    if (cost > S.gold) { UI.log(EZ("Not enough gold for full repairs.", "金币不够付全修的钱。"), "bad"); return; }
    Game.addGold(-cost);
    S.ship.hull = Game.maxHull();
    UI.log(EZ("🔧 The yard makes her sound again.", "🔧 船坞把她修得结结实实。"));
    this.render();
  },

  buyCannon() {
    if (S.gold < this.CANNON_PRICE || S.ship.cannons >= Game.shipType().maxCannons) return;
    Game.addGold(-this.CANNON_PRICE);
    S.ship.cannons++;
    this.render();
  },

  buyTrim() {
    if (S.gold < this.TRIM_PRICE || S.ship.sailTrim) return;
    Game.addGold(-this.TRIM_PRICE);
    S.ship.sailTrim = 1;
    UI.log(EZ("⛵ New canvas, better lines — she's faster now.", "⛵ 新帆布、好线条——她现在更快了。"));
    this.render();
  },

  renameShip() {
    const name = prompt(EZ("Name your ship:", "为你的船命名："), S.ship.name);
    if (name && name.trim()) { S.ship.name = name.trim().slice(0, 24); UI.hud(); this.render(); }
  },

  buyShip(typeId) {
    const sh = DATA.SHIP[typeId];
    const tradeIn = Math.round(DATA.SHIP[S.ship.type].price * 0.55);
    const net = sh.price - tradeIn;
    if (S.gold < net) { UI.log(EZ("The yard master eyes your purse and shakes his head.", "船坞老板瞄了一眼你的钱袋，摇了摇头。"), "bad"); return; }
    if (Game.cargoUnits() + Math.ceil(S.food) + Math.ceil(S.water) > sh.hold) {
      UI.log(EZ("Your cargo and stores wouldn't fit in that hull — sell some first.", "你的货物和补给装不进那艘船——先卖掉一些吧。"), "bad"); return;
    }
    UI.modal({
      title: EZ("Change of Flagship", "更换座舰"),
      body: EZ(`<p>Trade <strong>${S.ship.name}</strong> for a brand-new <strong>${L(sh.name)}</strong>
             for 🪙${net.toLocaleString()} (after trade-in)?</p>
             <p class="dim">Crew beyond ${sh.maxCrew} berths will be paid off ashore. Cannons carry over up to ${sh.maxCannons}.</p>`,
            `<p>要用<strong>${S.ship.name}</strong>折抵，以 🪙${net.toLocaleString()} 换购一艘全新的
             <strong>${L(sh.name)}</strong>吗？</p>
             <p class="dim">超过 ${sh.maxCrew} 个铺位的船员将在岸上结清工钱遣散。火炮最多保留 ${sh.maxCannons} 门。</p>`),
      buttons: [
        { label: EZ("Buy her", "就买她了"), cls: "btn-gold", fn: () => {
          Game.addGold(-net);
          const keepName = S.ship.name;
          S.ship = { type: typeId, name: keepName, hull: sh.hull,
                     cannons: Math.min(S.ship.cannons, sh.maxCannons), sailTrim: 0 };
          S.crew = Math.min(S.crew, sh.maxCrew);
          UI.log(EZ(`⛵ ${keepName} is now a ${L(sh.name)}!`, `⛵ ${keepName}现在是一艘${L(sh.name)}了！`), "good");
          Game.save(); UI.hud(); Port.render();
        }},
        { label: EZ("Not today", "改天再说") },
      ],
    });
  },

  // ============ TAVERN ============
  tavernName() {
    return L(DATA.TAVERN_NAMES[Math.floor(hash2(this.cur.x, this.cur.y, 55) * DATA.TAVERN_NAMES.length)]);
  },

  crewAvailable() {
    return 2 + Math.floor(hash2(S.day, this.cur.x * 3 + this.cur.y, 88) * (4 + this.cur.size * 4));
  },

  render_tavern() {
    const t = Game.shipType();
    const avail = this.crewAvailable();
    const roundCost = Math.max(5, S.crew * 2);
    UI.el("port-body").innerHTML = `
      <div class="panel-cols">
        <div class="panel">
          <h3>🍺 ${this.tavernName()}</h3>
          <p class="dim">${EZ("Smoke, dice, fiddle music, and the finest lies on the Meridian.",
                              "烟雾、骰子、提琴声，还有全子午海最高明的吹牛。")}</p>
          <table class="shop-table">
            <tr><td>${EZ("Sign on hands", "招募水手")} <span class="dim">${EZ(`(${avail} looking for work, 👥${S.crew}/${t.maxCrew})`, `（${avail} 人待雇，👥${S.crew}/${t.maxCrew}）`)}</span></td>
                <td>🪙${this.CREW_PRICE}${EZ(" each", "/人")}</td>
                <td>${this.qbtns("Port.hireCrew(%n)", [1, 5, -1])}</td></tr>
          </table>
          <button class="btn" onclick="Port.buyRound()">${EZ(`🍻 Buy the crew a round (🪙${roundCost}, morale +10)`, `🍻 请船员们喝一轮（🪙${roundCost}，士气 +10）`)}</button>
          <p class="dim">${EZ("Morale", "士气")}: ${Math.round(S.morale)}/100 ${S.morale < 30 ? EZ("— ⚠ they're muttering about mutiny", "— ⚠ 他们正在嘀咕哗变的事") : ""}</p>
        </div>
        <div class="panel">
          <h3>${EZ("Gossip &amp; Rumors", "流言与传闻")}</h3>
          <button class="btn" onclick="Port.hearRumor()">${EZ("👂 Listen to the regulars", "👂 听听常客们聊什么")}</button>
          <button class="btn" onclick="Port.askStory()">${EZ("🗺 Ask about Aurevia", "🗺 打听奥雷维亚")}</button>
          <div id="rumor-box" class="rumor-box"></div>
        </div>
      </div>`;
  },

  hireCrew(qty) {
    const t = Game.shipType();
    const avail = this.crewAvailable();
    const maxAfford = Math.floor(S.gold / this.CREW_PRICE);
    const room = t.maxCrew - S.crew;
    if (qty === -1) qty = Math.min(avail, room, maxAfford);
    qty = Math.min(qty, avail, room, maxAfford);
    if (qty <= 0) { UI.log(EZ("No berths, no takers, or no gold.", "要么没铺位，要么没人来，要么没钱。"), "bad"); return; }
    Game.addGold(-qty * this.CREW_PRICE);
    S.crew += qty;
    UI.log(EZ(`👥 ${qty} new hands sign the articles.`, `👥 ${qty} 名新水手签下了船员契约。`));
    this.render();
  },

  buyRound() {
    const cost = Math.max(5, S.crew * 2);
    if (S.gold < cost) return;
    Game.addGold(-cost);
    S.morale = Math.min(100, S.morale + 10);
    UI.log(EZ("🍻 A toast to the captain! Morale rises.", "🍻 为船长干杯！士气上升了。"));
    this.render();
  },

  hearRumor() {
    const p = this.cur;
    const box = UI.el("rumor-box");
    const r = roll();
    if (r < 0.55) {
      // genuine trade tip: best margin from this port's produce
      let best = null;
      for (const gid of p.produces) {
        for (const q of World.ports) {
          if (q.id === p.id || q.hidden) continue;
          const margin = this.sellPriceOf(q, gid) - this.priceOf(p, gid);
          if (!best || margin > best.margin) best = { gid, port: q, margin };
        }
      }
      if (best && best.margin > 0) {
        const sp = this.sellPriceOf(best.port, best.gid);
        box.innerHTML = `<p>${EZ(
          `"${L(DATA.GOOD[best.gid].name)}, captain. Buy it here and they'll pay 🪙${sp} a crate in <b>${L(best.port.name)}</b> — that's ${best.margin} clear per unit, these days."`,
          `“${L(DATA.GOOD[best.gid].name)}，船长。在这儿买进，<b>${L(best.port.name)}</b>那边一件能卖 🪙${sp}——这阵子每件净赚 ${best.margin}。”`)}</p>`;
        return;
      }
      // no profitable produce today — fall through to a discovery hint
    }
    const unfound = World.disc.filter(d => !S.found[d.id] && !d.hidden)
      .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
    if (unfound.length) {
      const d = unfound[Math.floor(roll() * Math.min(3, unfound.length))];
      box.innerHTML = `<p>${EZ(
        `"Strange waters ${Quests.hint(p, d)}, they say. Something the mapmakers would pay dearly to set eyes on..."`,
        `“听说${Quests.hint(p, d)}有片古怪的海域。制图师们要是能亲眼见到，肯出大价钱……”`)}</p>`;
    } else {
      box.innerHTML = `<p>${EZ(
        `"You've seen more of the Meridian than anyone alive, captain. Buy us a round and tell US a story."`,
        `“船长，这片子午海你见过的比谁都多。请我们喝一轮，换你讲个故事吧。”`)}</p>`;
    }
  },

  askStory() {
    UI.el("rumor-box").innerHTML = `<p>${Story.rumor()}</p>`;
  },

  // ============ GUILD ============
  render_guild() {
    const p = this.cur;
    const ch = Story.current();
    const unreported = Quests.unreported();
    const reportSum = unreported.reduce((s, d) => s + d.reward, 0);
    const offers = Quests.offers(p);

    const offerHtml = offers.map((o, i) => {
      const taken = S.quests.some(q => q.key === o.key);
      return `<div class="quest-card">
        <p>${Quests.offerText(o, p)}</p>
        <button class="btn btn-small ${taken ? "" : "btn-gold"}" ${taken || S.quests.length >= Quests.MAX_ACTIVE ? "disabled" : ""}
          onclick='Port.acceptOffer(${i})'>${taken ? EZ("✓ Accepted", "✓ 已接受") : EZ("Accept", "接受")}</button>
      </div>`;
    }).join("");

    const activeHtml = S.quests.map((q, i) => {
      let progress = "";
      if (q.type === "deliver" || q.type === "procure") {
        const have = S.cargo[q.good] ? S.cargo[q.good].qty : 0;
        progress = ` <span class="dim">${EZ(
          `(${Math.min(have, q.qty)}/${q.qty} aboard${q.type === "deliver" ? ", deliver to " + L(World.PORT[q.dest].name) : ""})`,
          `（已装载 ${Math.min(have, q.qty)}/${q.qty}${q.type === "deliver" ? "，送往" + L(World.PORT[q.dest].name) : ""}）`)}</span>`;
      }
      return `<div class="quest-card active-quest">
        <p>📜 ${Quests.shortText(q)}${progress} — 🪙${q.reward.toLocaleString()}</p>
        <button class="btn btn-small" onclick="Port.abandonQuest(${i})">${EZ("Abandon", "放弃")}</button>
      </div>`;
    }).join("") || `<p class='dim'>${EZ("No contracts in hand.", "手头没有契约。")}</p>`;

    UI.el("port-body").innerHTML = `
      <div class="panel-cols">
        <div class="panel">
          <h3>${EZ("Meridian Trade Guild", "子午商会")}</h3>
          <div class="objective">🧭 ${ch ? L(ch.title) + ": " + L(ch.objective) : EZ("The story of Aurevia is complete.", "奥雷维亚的故事已经完结。")}</div>
          <button class="btn ${unreported.length ? "btn-gold" : ""}" ${unreported.length ? "" : "disabled"}
            onclick="Port.reportDisc()">${EZ(
              `✦ Report ${unreported.length} discover${unreported.length === 1 ? "y" : "ies"} (🪙${reportSum.toLocaleString()})`,
              `✦ 报告 ${unreported.length} 项地理发现（🪙${reportSum.toLocaleString()}）`)}</button>
          <h3 style="margin-top:14px">${EZ(`Your Contracts (${S.quests.length}/${Quests.MAX_ACTIVE})`, `你的契约（${S.quests.length}/${Quests.MAX_ACTIVE}）`)}</h3>
          ${activeHtml}
        </div>
        <div class="panel">
          <h3>${EZ("Contracts Posted Today", "今日发布的契约")}</h3>
          ${offerHtml}
        </div>
      </div>`;
  },

  acceptOffer(i) {
    const offers = Quests.offers(this.cur);
    if (offers[i] && Quests.accept(offers[i])) this.render();
  },

  abandonQuest(i) {
    const q = S.quests[i];
    if (q) { Quests.abandon(q); this.render(); }
  },

  reportDisc() {
    Quests.reportAll();
    this.render();
  },
};
