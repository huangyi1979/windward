// ============================================================
// main.js — boot, title screen, input, and the game loop
// ============================================================

const Main = {
  keys: {},

  boot() {
    World.gen();
    R.init();
    applyStaticLang();

    // language picker (title screen); also reachable from the in-game menu
    document.querySelectorAll(".lang-btn").forEach(b => {
      b.addEventListener("click", () => Main.switchLang(b.dataset.lang));
    });

    // title screen
    if (Game.hasSave()) UI.el("btn-continue").style.display = "block";
    UI.el("btn-new-game").onclick = () => {
      if (Game.hasSave() && !confirm(EZ("Start a new voyage? Your previous saved voyage will be erased.",
                                        "开始新的航程？之前保存的航程将被清除。"))) return;
      Game.wipeSave();
      Game.newGame(UI.el("captain-name").value || EZ("Rowan Tidewalker", "罗文·潮行者"));
      this.startPlay(true);
    };
    UI.el("btn-continue").onclick = () => {
      if (Game.load()) this.startPlay(false);
    };

    // keyboard
    window.addEventListener("keydown", (e) => {
      if (!S || UI.el("game-screen").style.display === "none") return;
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      this.keys[e.key.toLowerCase()] = true;
      if (e.key === "Escape") {
        if (UI.modalOpen()) return;            // modal buttons decide
        if (Port.isOpen()) { Port.close(); return; }
        Sea.cancelRoute();
      }
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        Sea.cancelRoute(true);
      }
    });
    window.addEventListener("keyup", (e) => { this.keys[e.key.toLowerCase()] = false; });
    window.addEventListener("blur", () => { this.keys = {}; });

    // click-to-sail
    R.cv.addEventListener("click", (e) => {
      if (!S || UI.busy() || S.gameOver) return;
      const t = R.tileFromClick(e);
      if (World.inBounds(t.x, t.y)) Sea.setRoute(t.x, t.y);
    });
    R.mini.addEventListener("click", (e) => {
      if (!S || UI.busy() || S.gameOver) return;
      const t = R.tileFromMiniClick(e);
      if (World.inBounds(t.x, t.y)) Sea.setRoute(t.x, t.y);
    });

    // on-screen pad (also handy on touch devices)
    document.querySelectorAll("#sail-controls button").forEach(b => {
      b.addEventListener("click", () => {
        const [dx, dy] = b.dataset.d.split(",").map(Number);
        if (dx === 0 && dy === 0) { Sea.cancelRoute(); return; }
        Sea.cancelRoute(true);
        Sea.tryMove(dx, dy);
      });
    });

    UI.el("btn-set-sail").onclick = () => Port.close();
    UI.el("btn-menu").onclick = () => this.menu();

    // sound: browsers require a user gesture before audio can start
    const unlock = () => Sound.init();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    UI.el("btn-sound").textContent = Sound.muted ? "🔇" : "🔊";
    UI.el("btn-sound").onclick = () => {
      Sound.init();
      UI.el("btn-sound").textContent = Sound.toggle() ? "🔇" : "🔊";
    };

    // movement + route ticker
    setInterval(() => {
      if (!S || S.gameOver) return;
      if (S.route && S.route.length && !UI.busy()) { Sea.routeStep(); return; }
      if (UI.busy()) return;
      let dx = 0, dy = 0;
      if (this.keys["arrowup"] || this.keys["w"]) dy -= 1;
      if (this.keys["arrowdown"] || this.keys["s"]) dy += 1;
      if (this.keys["arrowleft"] || this.keys["a"]) dx -= 1;
      if (this.keys["arrowright"] || this.keys["d"]) dx += 1;
      if (dx || dy) Sea.tryMove(dx, dy);
    }, 150);

    // render loop
    const frame = (time) => { if (S) R.draw(time); requestAnimationFrame(frame); };
    requestAnimationFrame(frame);

    window.addEventListener("beforeunload", () => Game.save());
  },

  switchLang(lang) {
    setLang(lang);
    // refresh whatever is on screen in the new language
    if (S) {
      UI.hud();
      if (Port.isOpen()) Port.render();
    }
  },

  startPlay(isNew) {
    UI.el("title-screen").style.display = "none";
    UI.el("game-screen").style.display = "flex";
    R.resize();
    R.fogDirty = true;
    UI.hud();
    if (isNew) {
      UI.log(EZ(`⚓ ${S.captain} takes command of ${S.ship.name} in Avelar harbor.`,
                `⚓ ${S.captain}在阿维拉港接管了${S.ship.name}。`));
      UI.modal({
        title: EZ("Welcome Aboard, Captain", "欢迎登船，船长"),
        body: EZ(`<p><strong>Sail</strong> with WASD/arrow keys, or <strong>click anywhere on the sea</strong>
               (or the little map) to set a course. Sail into a town to dock.</p>
               <p><strong>Trade</strong>: buy goods marked <i>local</i> cheap, sell them where they're
               <i>in demand</i>. Taverns sell the best tips.</p>
               <p><strong>Watch your stores</strong> — the crew eats and drinks every day at sea. Barrels
               share space with cargo.</p>
               <p><strong>Explore</strong>: strange landmarks earn fame and gold. Report them at any Trade Guild.</p>`,
              `<p><strong>航行</strong>：用 WASD/方向键，或<strong>点击海面任意位置</strong>（或小地图）设定航线。
               驶入城镇即可停靠。</p>
               <p><strong>贸易</strong>：低价买进标着<i>特产</i>的货物，运到<i>热销</i>的港口卖掉。
               酒馆里能打听到最好的情报。</p>
               <p><strong>看好补给</strong>——船员在海上每天都要吃喝。补给桶和货物共用货舱。</p>
               <p><strong>探索</strong>：奇异的地标能换来名声与金币。到任意商会报告你的发现。</p>`),
        buttons: [{ label: EZ("Read Aunt Maren's letter", "读姑母玛伦的信"), fn: () => Story.showChapterIntro() }],
      });
      const home = World.PORT["avelar"];
      Sea.dock(home);
    } else {
      UI.log(EZ(`⚓ Welcome back, ${Game.rankTitle()} ${S.captain}.`,
                `⚓ 欢迎回来，${Game.rankTitle()}${S.captain}。`));
      if (S.dockedAt) Port.open(World.PORT[S.dockedAt]);
    }
  },

  toTitle() {
    Game.save();
    location.reload();
  },

  menu() {
    const st = S.stats;
    UI.modal({
      title: EZ("☰ Captain's Cabin", "☰ 船长室"),
      body: `<p><b>${S.captain}</b>${EZ(", " + Game.rankTitle(), "，" + Game.rankTitle())} — ⭐${S.fame}</p>
        <p class="dim">${EZ(
          `Voyage day ${S.day} · ${st.tilesSailed} leagues sailed · ${Object.keys(st.portsVisited).length} ports visited ·
           ${Object.keys(S.found).length}/${World.disc.length} discoveries · ${st.piratesBeaten} pirates beaten ·
           ${S.questsDone} contracts fulfilled · 🪙${st.goldEarned.toLocaleString()} earned lifetime`,
          `航行第 ${S.day} 天 · 已航行 ${st.tilesSailed} 里格 · 到访 ${Object.keys(st.portsVisited).length} 座港口 ·
           地理发现 ${Object.keys(S.found).length}/${World.disc.length} · 击败海盗 ${st.piratesBeaten} 次 ·
           完成契约 ${S.questsDone} 份 · 累计入账 🪙${st.goldEarned.toLocaleString()}`)}</p>
        <div class="objective">🧭 ${Story.objectiveText()}</div>
        <p class="dim">${EZ("Language", "语言")}: <button class="btn btn-small" onclick="Main.switchLang('en');Main.menu()">English</button>
          <button class="btn btn-small" onclick="Main.switchLang('zh');Main.menu()">中文</button></p>
        <p class="dim">${EZ("Saving happens automatically when you dock and every few days at sea.",
                            "停靠港口时会自动存档，海上航行每隔几天也会自动存档。")}</p>`,
      buttons: [
        { label: EZ("💾 Save", "💾 存档"), fn: () => { Game.save(); UI.log(EZ("💾 Voyage saved.", "💾 航程已保存。")); } },
        { label: EZ("📖 How to Play", "📖 玩法说明"), fn: () => Main.help() },
        { label: EZ("🏠 Save & Quit to Title", "🏠 存档并返回标题"), fn: () => Main.toTitle() },
        { label: EZ("Back", "返回") },
      ],
    });
  },

  help() {
    UI.modal({
      title: EZ("📖 The Sailor's Primer", "📖 水手入门"),
      body: EZ(`
        <p><b>Sailing</b> — WASD / arrows, the compass pad, or click the sea (or minimap) to auto-sail.
        The wind compass (top right) shows the prevailing wind: run with it and you fly; beat against it and you crawl.</p>
        <p><b>Trading</b> — every port produces some goods cheaply (<i>local</i>) and pays a premium for others
        (<i>in demand</i>). Prices drift with the calendar. Tavern regulars sell genuine tips.</p>
        <p><b>Supplies</b> — rations and water are barrels in your hold. Roughly 1 barrel of each feeds 8 crew
        for a day. Running dry kills crew fast.</p>
        <p><b>Exploration</b> — sail near landmarks to discover them (⭐ fame at once, 🪙 when reported at a guild).
        Fog lifts as you sail.</p>
        <p><b>Combat</b> — pirates want fat, slow holds. Volley breaks hulls, boarding takes crews, fleeing favors
        fast, nimble ships. Defeat is not death — but it is expensive.</p>
        <p><b>The Guild</b> — contracts, bounties, and your story objective live here.</p>`,
        `
        <p><b>航行</b> —— WASD / 方向键、罗盘按键，或点击海面（或小地图）自动航行。
        右上角的风向罗盘显示主导风向：顺风快如飞，逆风慢如爬。</p>
        <p><b>贸易</b> —— 每座港口都有便宜的本地<i>特产</i>，也有愿出高价收购的<i>热销</i>货。
        价格随日历波动。酒馆常客会透露真实可靠的行情。</p>
        <p><b>补给</b> —— 口粮和淡水是货舱里的桶。每桶大约够 8 名船员吃喝一天。断粮断水会迅速折损船员。</p>
        <p><b>探索</b> —— 驶近地标即可发现（⭐ 名声立刻到手，到商会报告再领 🪙）。航行会驱散迷雾。</p>
        <p><b>战斗</b> —— 海盗盯的是又肥又慢的货舱。齐射破船体，强登拼人数，逃跑靠快船。
        战败不会丧命——但代价不菲。</p>
        <p><b>商会</b> —— 契约、悬赏和你的故事目标都在这里。</p>`),
      buttons: [{ label: EZ("Back", "返回") }],
    });
  },
};

window.addEventListener("DOMContentLoaded", () => Main.boot());
