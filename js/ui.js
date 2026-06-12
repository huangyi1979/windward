// ============================================================
// ui.js — HUD, captain's log, and the modal system (with queue,
// since sea events can chain: discovery → story → rank-up)
// ============================================================

const UI = {
  _queue: [],
  _open: false,

  el(id) { return document.getElementById(id); },

  // ---------- captain's log ----------
  log(msg, cls = "") {
    const box = this.el("log");
    const line = document.createElement("div");
    line.className = "log-line " + cls;
    line.innerHTML = `<span class="log-date">${Game.dateStr()}</span> ${msg}`;
    box.appendChild(line);
    while (box.children.length > 120) box.removeChild(box.firstChild);
    box.scrollTop = box.scrollHeight;
  },

  // ---------- HUD ----------
  hud() {
    if (!S) return;
    const t = Game.shipType();
    const rate = Game.rationRate();
    const foodDays = (S.food / rate).toFixed(0);
    const waterDays = (S.water / rate).toFixed(0);
    this.el("hud-captain").innerHTML = `🧭 <b>${S.captain}</b> <span class="dim">· ${Game.rankTitle()}</span>`;
    this.el("hud-date").innerHTML = `📅 ${Game.dateStr()}`;
    this.el("hud-gold").innerHTML = `🪙 ${S.gold.toLocaleString()}`;
    this.el("hud-fame").innerHTML = `⭐ ${S.fame}`;
    this.el("hud-crew").innerHTML = `👥 ${S.crew}/${t.maxCrew} <span class="${S.morale < 30 ? "bad" : "dim"}">☺${Math.round(S.morale)}</span>`;
    this.el("hud-food").innerHTML = `🍞 ${Math.ceil(S.food)} <span class="dim">(${foodDays}d)</span>`;
    this.el("hud-water").innerHTML = `💧 ${Math.ceil(S.water)} <span class="dim">(${waterDays}d)</span>`;
    this.el("hud-hull").innerHTML = `🛠 ${Math.ceil(S.ship.hull)}/${Game.maxHull()}`;
    this.el("hud-hold").innerHTML = `📦 ${Game.holdUsed()}/${Game.holdMax()}`;
    this.el("hud-food").className = "hud-group " + (S.food < rate * 3 ? "warn" : "");
    this.el("hud-water").className = "hud-group " + (S.water < rate * 3 ? "warn" : "");
    this.el("hud-hull").className = "hud-group " + (S.ship.hull < Game.maxHull() * 0.3 ? "warn" : "");

    const w = Sea.windAt(S.day, S.x, S.y);
    const deg = Math.atan2(w.dy, w.dx) * 180 / Math.PI;
    this.el("wind-arrow").style.transform = `rotate(${deg}deg)`;
    this.el("wind-label").textContent = L(w.name);
    this.el("ship-banner").textContent = `⛵ ${S.ship.name} (${L(t.name)})`;
  },

  // ---------- modals ----------
  modal(opts) {
    if (this._open) { this._queue.push(opts); return; }
    this._open = true;
    this.el("modal-veil").style.display = "flex";
    this.el("modal-content").innerHTML =
      (opts.title ? `<h2>${opts.title}</h2>` : "") + (opts.body || "");
    const btnBox = this.el("modal-buttons");
    btnBox.innerHTML = "";
    const buttons = opts.buttons && opts.buttons.length ? opts.buttons : [{ label: EZ("Continue", "继续") }];
    for (const b of buttons) {
      const el = document.createElement("button");
      el.className = "btn " + (b.cls || "");
      el.innerHTML = b.label;
      el.onclick = () => {
        if (!b.keepOpen) this.closeModal();
        if (b.fn) b.fn();
      };
      btnBox.appendChild(el);
    }
  },

  // Replace contents of an already-open modal (used by combat)
  modalReplace(opts) {
    this._open = true;
    this.el("modal-veil").style.display = "flex";
    this.el("modal-content").innerHTML =
      (opts.title ? `<h2>${opts.title}</h2>` : "") + (opts.body || "");
    const btnBox = this.el("modal-buttons");
    btnBox.innerHTML = "";
    for (const b of (opts.buttons || [])) {
      const el = document.createElement("button");
      el.className = "btn " + (b.cls || "");
      el.innerHTML = b.label;
      el.disabled = !!b.disabled;
      el.onclick = () => {
        if (!b.keepOpen) this.closeModal();
        if (b.fn) b.fn();
      };
      btnBox.appendChild(el);
    }
  },

  closeModal() {
    this._open = false;
    this.el("modal-veil").style.display = "none";
    if (this._queue.length) {
      const next = this._queue.shift();
      // small delay so successive windows feel distinct
      setTimeout(() => this.modal(next), 60);
    }
  },

  modalOpen() { return this._open; },
  busy() { return this._open || Port.isOpen(); },
};
