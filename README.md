# ⚓ Windward — A Tale of the Meridian Sea

A browser-based sailing, trading, and exploration game in the spirit of classic
age-of-sail adventures. Pure HTML/CSS/JavaScript — no build step, no
dependencies, no asset files. All world names, characters, story, and data are
original works of fiction.

**Fully bilingual (English / 中文)** — pick a language on the title screen or
switch any time from the in-game menu (☰). The choice is remembered, and it
defaults to Chinese when your browser language is Chinese.

## Play

Serve the folder and open it in any modern browser:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

(Opening `index.html` directly also works, but serving over HTTP keeps your
save in a stable place.) Progress saves automatically to localStorage when you
dock and every few days at sea. Sound starts on your first click — toggle it
with the 🔊 button.

## The Game

You are a young captain who has inherited a battered sloop and a mystery: your
aunt Maren spent thirty years hunting **Aurevia**, a golden haven that vanished
from every chart three centuries ago. Follow her trail across a five-chapter
story — or ignore it and build a trading empire instead.

- **Sail** with WASD/arrows, the on-screen compass pad, or click the sea or
  minimap to auto-sail. Wind matters: run before it and you fly, beat against
  it and you crawl. Three latitude wind belts shift with the calendar.
- **Trade** across 16 ports in 7 regions. Every port sells its local produce
  cheap and pays a premium for what it craves. Prices drift daily; tavern
  regulars sell genuine arbitrage tips.
- **Provision** carefully — rations and water are barrels that share hold
  space with cargo, and the crew eats every day.
- **Explore** a fog-covered 208×136 world with 21 discoverable landmarks.
  Sighting one earns fame; reporting it at any Trade Guild earns gold.
- **Fight or flee** pirates in turn-based battles: cannon volleys break hulls,
  boarding takes crews, and fast ships can simply leave.
- **Take contracts** at the guild: deliveries, procurement, pirate bounties,
  and survey commissions.
- **Upgrade** through 9 ship classes from the Harbor Sloop to the Royal
  Galleon, with cannons, sail trim, and repairs at every shipyard.
- **Rise** through six ranks of fame from Deckhand to Legend of the Meridian.
- **Listen** — the ocean ambience and all 16 sound effects are synthesized
  live with WebAudio; there are no audio files.

Defeat is never the end — beaten captains wash ashore poorer but alive.

## Code Layout

| File | Role |
|---|---|
| `js/rng.js` | Seeded PRNG, value-noise, dice helpers |
| `js/lang.js` | Language layer: `L()` / `EZ()` helpers, persistence |
| `js/audio.js` | Synthesized WebAudio: ocean ambience + 16 effects |
| `js/data.js` | All content: goods, ports, ships, discoveries, story (en/zh) |
| `js/world.js` | Fixed-seed map generation, pathfinding (BFS), port snapping |
| `js/state.js` | Game state, save/load (RLE-compressed fog) |
| `js/ui.js` | HUD, captain's log, queued modal system |
| `js/render.js` | Canvas renderer: sea, land, ports, ship, fog, minimap |
| `js/sea.js` | Wind model, movement, time, supplies, events, docking |
| `js/combat.js` | Turn-based naval combat |
| `js/quests.js` | Guild contract generation and tracking |
| `js/story.js` | The five-chapter Aurevia questline |
| `js/port.js` | Port UI: harbor, market, shipyard, tavern, guild |
| `js/main.js` | Boot, title screen, input, game loop |

## Tests

```bash
node test/gen-test.js     # world generation: port placement & reachability
node test/smoke-test.js   # integration: trading, sailing, combat, story, saves
```

## How This Project Was Made

The entire game was designed, written, and tested autonomously by **Claude
Code** (Anthropic's Claude Fable 5) in a single session, from one prompt:
*"build a fun, easy-to-play, comprehensive browser sailing/trading/exploration
game inspired by Uncharted Waters, with everything original."* A human chose
the direction (add sound, add Chinese, rename the project); the agent made
every design and implementation decision. The process, in order:

1. **Design before code.** The agent fixed the architecture up front: vanilla
   JS with plain `<script>` tags (no build step), one global module per
   concern, and a single state object `S` that serializes straight to
   localStorage. All names — ports, regions, goods, characters, the Aurevia
   storyline — were invented fresh rather than borrowed.

2. **World generation, verified before anything was built on it.** The map is
   procedural (hand-placed continent ellipses roughened by value noise) but
   uses a fixed seed, so every player gets the same world. Reliability tricks:
   inland lakes are filled so the ocean is one connected body, ports BFS-snap
   to the nearest coast, and a Node test (`test/gen-test.js`) proved every
   port reachable from the home port — plus an ASCII map render for
   eyeballing — *before* any gameplay code existed.

3. **Systems written against a contract.** Economy (produce ≈ 0.55× base,
   demand ≈ 1.75×, sinusoidal daily drift), wind belts, supplies-as-cargo,
   combat math, quest generation, and the story state machine were each built
   as small modules with the cross-module API decided in advance.

4. **Tested without a browser first.** `test/smoke-test.js` loads the real
   game files into a Node `vm` with a ~50-line stub DOM and drives 37 checks:
   buying/selling, quest determinism, auto-sail pathfinding to a real port,
   supply drain, a full combat, the entire five-chapter story chain, and a
   save/load round trip. It caught a real design bug — the starter ship's
   supplies left only 2 hold slots for cargo — before a human ever played.

5. **Then verified in a real browser.** Playwright + headless Chromium drove
   the actual game — title → new game → dock → trade → set sail → combat —
   taking screenshots at each step and asserting zero console errors. The
   agent read the screenshots back to check layout, colors, fog, and HUD.

6. **Sound synthesized, not sampled.** All audio is generated WebAudio:
   filtered-noise surf with two slow LFOs for ambience; oscillator envelopes
   and noise bursts for cannons, bells, coins, storms, and fanfares. Zero
   audio files; ~200 lines.

7. **Localization as data, not keys.** Every display string in `data.js` is
   an `{en, zh}` pair resolved by `L()`; one-off UI strings use inline
   `EZ("English", "中文")` pairs. No string-key dictionary to drift out of
   sync. Chinese rendering was verified through the DOM in headless Chromium
   (the test container had no CJK fonts, so screenshots alone couldn't prove
   it).

Final tally: ~3,200 lines of JS/CSS/HTML, ~250 lines of tests,
0 dependencies, 0 asset files.
