// ============================================================
// lang.js — bilingual support (English / 中文).
// Two helpers used everywhere:
//   L(v)        — v is {en,zh} (or a plain string); returns the
//                 current language's text
//   EZ(en, zh)  — inline pair for one-off UI strings
// ============================================================

let LANG = (function () {
  try {
    const saved = localStorage.getItem("windward-lang");
    if (saved === "en" || saved === "zh") return saved;
  } catch (e) {}
  if (typeof navigator !== "undefined" && (navigator.language || "").toLowerCase().startsWith("zh")) return "zh";
  return "en";
})();

function L(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  return v[LANG] != null ? v[LANG] : v.en;
}

function EZ(en, zh) { return LANG === "zh" ? zh : en; }

function setLang(lang) {
  LANG = lang === "zh" ? "zh" : "en";
  try { localStorage.setItem("windward-lang", LANG); } catch (e) {}
  applyStaticLang();
}

// Translate the static chrome (title screen, fixed buttons, document title)
function applyStaticLang() {
  const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
  document.title = EZ("Windward — A Tale of the Meridian Sea", "御风志 — 子午海传说");
  set("t-subtitle", EZ("A Tale of the Meridian Sea", "子午海传说"));
  set("t-flavor", EZ(
    `Your aunt Maren Tidewalker has left you her old sloop, a half-burned journal, and one final letter:
     <em>“Find what I could not. The sea remembers Aurevia.”</em>`,
    `你的姑母玛伦·潮行者留给你一艘旧单桅船、一本烧掉一半的航海日志，和最后一封信：
     <em>“去找到我没能找到的东西。大海还记得奥雷维亚。”</em>`));
  set("t-name-label", EZ("Captain's name", "船长姓名"));
  set("btn-new-game", EZ("⛵ New Voyage", "⛵ 新的航程"));
  set("btn-continue", EZ("📜 Continue Voyage", "📜 继续航程"));
  set("t-credits", EZ("All lands, ports, and legends herein are works of fiction.",
                      "本作中的陆地、港口与传说均属虚构。"));
  set("btn-set-sail", EZ("⛵ Set Sail", "⛵ 启航"));
  const inp = document.getElementById("captain-name");
  if (inp) inp.placeholder = EZ("e.g. Rowan Tidewalker", "例如：罗文·潮行者");
  // language buttons highlight
  document.querySelectorAll(".lang-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.lang === LANG);
  });
}
