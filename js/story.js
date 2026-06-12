// ============================================================
// story.js — the search for Aurevia, in five chapters
// S.chapter = index of the ACTIVE chapter (DATA.STORY.length = done)
// ============================================================

const Story = {

  current() { return S.chapter < DATA.STORY.length ? DATA.STORY[S.chapter] : null; },
  done() { return S.chapter >= DATA.STORY.length; },

  // Show the active chapter's opening text once
  showChapterIntro() {
    const ch = this.current();
    if (!ch || S.storyShown[ch.id]) return;
    S.storyShown[ch.id] = true;
    UI.modal({
      title: L(ch.title),
      body: `${L(ch.text)}<div class="objective">🧭 ${EZ("Objective", "目标")}: ${L(ch.objective)}</div>`,
      buttons: [{ label: EZ("Hoist the colors", "升起旗帜") }],
    });
  },

  objectiveText() {
    const ch = this.current();
    if (!ch) return EZ("The Meridian is yours. Sail it as you please.", "子午海已是你的天地，随心航行吧。");
    return L(ch.objective);
  },

  advance() {
    const ch = this.current();
    if (!ch) return;
    Sound.sfx("fanfare");
    S.chapter++;
    Game.addGold(ch.rewardGold);
    UI.modal({
      title: L(ch.title) + EZ(" — Complete", " · 完成"),
      body: `${L(ch.doneText)}<p class="good">🪙 +${ch.rewardGold.toLocaleString()} · ⭐ +${ch.rewardFame}</p>`,
      buttons: [{ label: S.chapter < DATA.STORY.length ? EZ("Read on…", "继续读下去……") : EZ("🌟 A Legend Is Made", "🌟 传奇就此铸成") }],
    });
    Game.addFame(ch.rewardFame);
    if (S.chapter < DATA.STORY.length) {
      // queue the next chapter's intro right behind the completion modal
      const next = DATA.STORY[S.chapter];
      S.storyShown[next.id] = true;
      UI.modal({
        title: L(next.title),
        body: `${L(next.text)}<div class="objective">🧭 ${EZ("Objective", "目标")}: ${L(next.objective)}</div>`,
      });
    } else {
      S.victory = true;
      R.fogDirty = true;   // Aurevia appears on the map
      UI.modal({
        title: EZ("🌅 Aurevia Found", "🌅 奥雷维亚现世"),
        body: EZ(`<p>The hidden harbor of <strong>Aurevia</strong> now appears on every chart you own — and its
               lighthouse will guide you in. The port is open to you, Harbormaster.</p>
               <p class="dim">You may keep sailing, trading, and discovering as long as the wind holds.</p>`,
              `<p>隐秘之港<strong>奥雷维亚</strong>已被标注在你的每一张海图上——它的灯塔会为你引航。
               港务长，这座港口永远向你敞开。</p>
               <p class="dim">只要风还在吹，你就可以继续航行、贸易与探索。</p>`),
      });
    }
    Game.save();
  },

  onDock(portId) {
    if (S.chapter === 0 && portId === "brindlemark") this.advance();
  },

  onDiscover(discId) {
    if (S.chapter === 1 && discId === "sunkenbell") this.advance();
    else if (S.chapter === 3 && discId === "drownedlibrary") this.advance();
    else if (S.chapter === 4 && discId === "radiantisle") this.advance();
  },

  onPirateWin(wasRedwake) {
    if (S.chapter === 2 && wasRedwake) this.advance();
  },

  // tavern gossip nudges for the active chapter
  rumor() {
    const hints = [
      EZ(`"Brindlemark's guildmaster, Odessa? Sharp as a marlinspike. North coast of Velmara — can't miss the timber walls."`,
         `“布林德马克的会长奥德莎？精明得像根解索针。在维尔玛拉北岸——那木头城墙你不会看漏的。”`),
      EZ(`"Old Vel? Drowned cathedral, they say — west of Caelhaven, where the water goes quiet. Some nights you can hear the bell."`,
         `“旧维尔？据说是座沉没的大教堂——在凯尔港以西，海水安静下来的地方。有些夜里能听见钟声。”`),
      EZ(`"Redwake's been seen on the open Meridian, burning question-askers. Sail the wide blue long enough and he'll find YOU."`,
         `“有人在子午公海上见过红潮，他专烧爱打听的船。你在大洋上漂得够久，他自然会找上‘你’。”`),
      EZ(`"A library under the sea? South of Qansari's coast, the sponge-divers swear. Marble columns in the green deep."`,
         `“海底的书馆？采海绵的潜水夫们赌咒说就在坎萨里海岸以南。碧绿深水里立着大理石柱。”`),
      EZ(`"South, captain. Past Zafriya's latitude, past everything. They say a golden light still burns down there."`,
         `“往南，船长。过了扎芙莉亚的纬度，把一切都甩在身后。他们说那里还燃着一盏金色的灯。”`),
    ];
    return hints[S.chapter] !== undefined && S.chapter < 5
      ? hints[S.chapter]
      : EZ(`"Aurevia found, eh? Buy us a round, Harbormaster!"`, `“找到奥雷维亚了？港务长，请大家喝一轮吧！”`);
  },
};
