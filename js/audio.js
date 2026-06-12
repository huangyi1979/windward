// ============================================================
// audio.js — synthesized sound: ocean ambience + effects.
// Everything is generated with WebAudio oscillators and filtered
// noise; no audio files. Initialized on first user gesture
// (browser autoplay policy). Named Sound to avoid the built-in
// window.Audio constructor.
// ============================================================

const Sound = {
  ctx: null, master: null,
  muted: typeof localStorage !== "undefined" && localStorage.getItem("windward-muted") === "1",
  _noiseBuf: null,
  _last: {},   // throttle per-effect

  init() {
    if (this.ctx) { if (this.ctx.state === "suspended") this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.5;
    this.master.connect(this.ctx.destination);
    this.startAmbience();
    // universal soft blip on any button press
    document.addEventListener("click", (e) => {
      if (e.target.closest && e.target.closest("button")) this.sfx("click");
    });
  },

  toggle() {
    this.muted = !this.muted;
    try { localStorage.setItem("windward-muted", this.muted ? "1" : "0"); } catch (e) {}
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  },

  noiseBuffer() {
    if (this._noiseBuf) return this._noiseBuf;
    const len = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this._noiseBuf = buf;
    return buf;
  },

  // ---------- continuous ocean ambience ----------
  startAmbience() {
    const c = this.ctx;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuffer();
    src.loop = true;
    const lp = c.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 380; lp.Q.value = 0.4;
    const amb = c.createGain();
    amb.gain.value = 0.10;
    // two slow LFOs make the swell irregular, like real surf
    for (const [rate, depth] of [[0.07, 0.045], [0.045, 0.03]]) {
      const lfo = c.createOscillator();
      lfo.frequency.value = rate;
      const lg = c.createGain();
      lg.gain.value = depth;
      lfo.connect(lg); lg.connect(amb.gain);
      lfo.start();
    }
    src.connect(lp); lp.connect(amb); amb.connect(this.master);
    src.start();
  },

  // ---------- primitives ----------
  tone(freq, dur, { type = "sine", vol = 0.12, when = 0, slide = 0 } = {}) {
    const c = this.ctx, t = c.currentTime + when;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.05);
  },

  burst(dur, { freq = 800, type = "lowpass", vol = 0.2, when = 0, q = 0.8, sweep = 0 } = {}) {
    const c = this.ctx, t = c.currentTime + when;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuffer();
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(40, freq + sweep), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t); src.stop(t + dur + 0.05);
  },

  // ---------- effect library ----------
  sfx(name) {
    if (!this.ctx || this.muted) return;
    const minGap = { click: 60, coin: 70, spend: 70, splash: 220, cannon: 120 }[name] || 0;
    const now = performance.now();
    if (minGap && now - (this._last[name] || 0) < minGap) return;
    this._last[name] = now;

    switch (name) {
      case "click":
        this.tone(640, 0.05, { type: "triangle", vol: 0.05 }); break;
      case "coin":
        this.tone(960, 0.08, { vol: 0.1 });
        this.tone(1440, 0.1, { vol: 0.09, when: 0.06 }); break;
      case "spend":
        this.tone(740, 0.08, { vol: 0.08 });
        this.tone(520, 0.1, { vol: 0.07, when: 0.06 }); break;
      case "splash":
        this.burst(0.13, { freq: 700 + Math.random() * 500, vol: 0.05, sweep: -300 }); break;
      case "sail":
        this.burst(0.6, { freq: 500, type: "bandpass", q: 1.2, vol: 0.13, sweep: 700 }); break;
      case "bell": // docking / harbor bell
        this.tone(523, 1.1, { vol: 0.14 });
        this.tone(1046, 0.8, { vol: 0.05 });
        this.tone(659, 0.9, { vol: 0.05, when: 0.02 }); break;
      case "chime": // discovery
        [880, 1108, 1318, 1760].forEach((f, i) => this.tone(f, 0.55, { vol: 0.1, when: i * 0.09 })); break;
      case "fanfare": // rank up / story chapter
        [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.4, { type: "triangle", vol: 0.12, when: i * 0.13 }));
        this.tone(1046, 0.8, { type: "triangle", vol: 0.1, when: 0.52 }); break;
      case "quest":
        this.tone(784, 0.12, { vol: 0.11 });
        this.tone(1046, 0.3, { vol: 0.11, when: 0.1 }); break;
      case "cannon":
        this.burst(0.45, { freq: 220, vol: 0.4, sweep: -150 });
        this.tone(60, 0.35, { vol: 0.3, slide: -25 }); break;
      case "clash": // boarding melee
        this.burst(0.12, { freq: 2600, type: "highpass", vol: 0.16 });
        this.burst(0.15, { freq: 3300, type: "bandpass", q: 3, vol: 0.12, when: 0.07 });
        this.burst(0.1, { freq: 2200, type: "highpass", vol: 0.1, when: 0.16 }); break;
      case "thunder":
        this.burst(1.9, { freq: 110, vol: 0.45, sweep: -60 });
        this.burst(0.5, { freq: 300, vol: 0.2, when: 0.15, sweep: -200 }); break;
      case "victory":
        [392, 523, 659, 784].forEach((f, i) => this.tone(f, 0.35, { type: "triangle", vol: 0.13, when: i * 0.12 }));
        this.tone(1046, 0.9, { type: "triangle", vol: 0.12, when: 0.5 }); break;
      case "defeat":
        [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.45, { type: "sawtooth", vol: 0.07, when: i * 0.18 })); break;
      case "ominous":
        this.tone(110, 1.3, { type: "sawtooth", vol: 0.09 });
        this.tone(104, 1.3, { type: "sawtooth", vol: 0.09 }); break;
      case "creak":
        this.burst(0.3, { freq: 900, type: "bandpass", q: 6, vol: 0.05, sweep: 250 }); break;
    }
  },
};
