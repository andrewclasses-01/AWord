// =============================================================
// TEMPLATE: TOURNAMENT — Đợt 548 (17/10/2026). Template #22.
//
// Đây KHÔNG phải một trò chơi. Trận đấu thật của giải chạy trên web
// andrewclasses.com (nw/tran.html, máy chủ trận đấu). Tournament ở AWord là
// BỘ CẤU HÌNH để thầy dựng thông số GIẢI ĐẤU "A SHOW SPEED" cho một lớp (bộ từ,
// cách chơi, phút mỗi trận, độ khó…) + màn cho học sinh khi mở link bài giao.
// App myLesson đọc `assignments/{mã}` (đọc công khai) rồi tự đổi sang tài liệu
// `giaiDau/{id}` — hợp đồng: D:\OTHERS\CLAUDE\GIAI DAU THE - thiet ke\HOP DONG DU LIEU - 3 kho.md mục 2.
//
// KHOÁ OPTIONS (CHỐT, không đổi tên):
//   tnGame 'aShowSpeed' · tnHinh 'cap' · tnPhut 2|3|5 · tnLv 'easy'|'medium'|'hard'
//   tnGoiY bool · tnGiong bool · tnBien 'eng1'|'eng2'|'vi1'|'vi2'|''
//   và của A Show Speed (đúng tên khoá wordshake): wsMode 'one'|'list'|'free' · wsTiles 8|12|16 · wsOnlyList bool
// NỘI DUNG: content.items[{word, clue, clues?, voice?, voices?}] — copy từ act WORDS nguồn
//   (core/convert.js), `activity.sourceActId` = id act WORDS nguồn.
//
// ⛔ KHÔNG BAO GIỜ gọi ui.finish() / ui.onSubmit(): Tournament không ghi `results`/`scores`
//   (khoá cố định theo luật AWord — thêm khoá là hỏng nộp bài). Học sinh chỉ thấy thẻ giải,
//   nút sang trang Giải đấu và nút "Luyện với máy" (= A Show Speed chơi đơn với đúng cấu hình
//   này, mở bằng engine như một ván thường KHÔNG có `session` ⇒ không nộp gì).
// ⛔ KHÔNG đặt `noAssignment`: Tournament PHẢI giao được (luồng ?giao=<số act> của myLesson).
// =============================================================

import { registerTemplate, getTemplate } from "../../core/registry.js";
import { el } from "../../core/utils.js";
import { OPT_VER } from "../../core/options-migrate.js";
import "../wordshake/wordshake.js";   // đăng ký "wordshake" ⇒ dùng lại buildExtraOptions + luyện với máy
import { openTournamentEditor } from "./tournament-editor.js";

export const GIAI_DAU_URL = "https://andrewclasses.com/nw/giaidau.html";

const LV = [["easy", "Easy"], ["medium", "Medium"], ["hard", "Hard"]];
const PHUT = [2, 3, 5];
const BIEN = [["eng1", "ENG1"], ["eng2", "ENG2"], ["vi1", "VI1"], ["vi2", "VI2"]];
const MODE_TXT = { one: "One word", list: "Word list", free: "Free words" };
const TILES = [8, 12, 16];

// ---- đọc cấu hình, luôn ra giá trị hợp lệ (act cũ/thiếu khoá vẫn mở được) ----
export function cfgOf(o) {
  o = o || {};
  return {
    game: "aShowSpeed",
    hinh: "cap",
    phut: PHUT.includes(+o.tnPhut) ? +o.tnPhut : 3,
    lv: LV.some(x => x[0] === o.tnLv) ? o.tnLv : "easy",
    goiY: o.tnGoiY !== false,
    giong: o.tnGiong === true,
    bien: BIEN.some(x => x[0] === o.tnBien) ? o.tnBien : "",
    mode: ["one", "list", "free"].includes(o.wsMode) ? o.wsMode : "one",
    tiles: TILES.includes(+o.wsTiles) ? +o.wsTiles : 12,
    onlyList: o.wsOnlyList !== false
  };
}

const wordsOf = a => ((a && a.content && a.content.items) || []).filter(it => it && String(it.word || "").trim());

// ---- A Show Speed chơi đơn với đúng cấu hình này ("Luyện với máy") ----
export function practiceActivity(activity) {
  const c = cfgOf(activity.options);
  const items = wordsOf(activity).map(it => {
    const clue = (c.bien && it.clues && it.clues[c.bien]) || it.clue || "";
    const x = { word: String(it.word).trim(), clue };
    if (c.giong) {
      const v = c.bien && it.voices && it.voices[c.bien];
      const vo = (v && v.voice) ? v : (!c.bien && it.voice ? { voice: it.voice, voiceId: it.voiceId } : null);
      if (vo) { x.voice = vo.voice; x.voiceId = vo.voiceId || ""; x.hideText = false; }
    }
    return x;
  });
  const options = { shuffleQuestions: true, showAnswers: true, wsMode: c.mode, wsTiles: c.tiles, wsOnlyList: c.onlyList, wsTank: false, timer: "countDown", timerTotalSeconds: c.phut * 60 };
  if (!c.giong) options.contentMode = "text";
  return {
    id: "conv_wordshake_" + Math.floor(Math.random() * 1e9),
    schemaVersion: 1, type: "wordshake",
    title: activity.title || "", instruction: "Make the word from the letters.",
    theme: activity.theme || "classic",
    optVer: OPT_VER, options,
    content: { withClues: items.some(i => i.clue), items },
    _converted: true
  };
}

// Mở A Show Speed bằng engine ngay trên trang này. Không có `session` ⇒ không nộp kết quả nào.
async function luyenVoiMay(activity, root) {
  const [eng, reg] = await Promise.all([import("../../core/engine.js"), import("../../core/registry.js")]);
  await reg.ensureTemplate("wordshake");
  const act = practiceActivity(activity);
  // A Show Speed lấy số phút từ màn START của nó (nhớ theo máy) — đặt sẵn số phút của giải
  try { localStorage.setItem("aword-showspeed-act-time", String(cfgOf(activity.options).phut * 60)); } catch (e) {}
  const host = document.getElementById("app") || root.closest(".aw-page")?.parentElement || root.parentElement;
  eng.startGame(host, act, { onExit: () => location.reload(), noLastTpl: true });
}

const TROPHY = '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10h24v14a12 12 0 0 1-24 0z"/><path d="M20 15H11q0 12 11 14M44 15h9q0 12-11 14"/><path d="M32 36v10M22 54h20M26 46h12v8H26z"/></svg>';

const tournamentTemplate = {
  type: "tournament",
  scorable: false,
  itemsKey: "items",
  name: "Tournament",
  hideTimerOption: true,
  hideShowAnswers: true,
  hasSloganSlot: true,
  checkOrder: ["shuffle"],
  edit: openTournamentEditor,

  toPrintItems(activity) {
    return wordsOf(activity).map(it => ({ clue: it.clue || "", answer: it.word || "" }));
  },

  buildExtraOptions({ panel, draft, addCheck, mkCell, mkSeg }) {
    // Mặc định cho khoá thiếu — draft là đúng object sẽ được ghi vào activity.options
    draft.tnGame = "aShowSpeed"; draft.tnHinh = "cap";
    const c = cfgOf(draft);
    draft.tnPhut = c.phut; draft.tnLv = c.lv; draft.tnGoiY = c.goiY; draft.tnGiong = c.giong;
    // bộ gợi ý mặc định = bộ đang chọn ở hàng ENG1/ENG2/VI1/VI2 của form (nếu act WORDS)
    draft.tnBien = c.bien || (BIEN.some(x => x[0] === draft.contentVariant) ? draft.contentVariant : "");

    // "sắp có": nút mờ không bấm được, đứng sau các lựa chọn dùng được
    const soon = (seg, labels) => {
      labels.forEach(t => {
        const b = el("button", "aw-seg-btn aw-tn-soon", t); b.type = "button"; b.disabled = true; b.title = "Sắp có";
        seg.append(b);
      });
      seg.style.setProperty("--n", String(seg.querySelectorAll(".aw-seg-btn").length));
    };

    const game = mkCell({ label: "Game", wide: true });
    const gs = mkSeg([{ value: "aShowSpeed", label: "A SHOW SPEED" }], "aShowSpeed", () => {});
    soon(gs, ["Trò khác"]);
    game.ctl.append(gs);

    const hinh = mkCell({ label: "Hình thức", wide: true });
    const hs = mkSeg([{ value: "cap", label: "Đấu cặp" }], "cap", () => {});
    soon(hs, ["Đấu đội", "Hai đội đấu chéo"]);
    hinh.ctl.append(hs);
    panel.append(game.cell, hinh.cell);

    // Cách chơi / số ô / Word list only: dùng lại nguyên bộ nút của A Show Speed (đúng khoá wsMode/wsTiles/wsOnlyList)
    const ws = getTemplate("wordshake");
    if (ws && ws.buildExtraOptions) {
      ws.buildExtraOptions({ panel, draft, addCheck: (label, checked, onChange, opts = {}) =>
        opts.key === "wsTank" ? null : addCheck(label, checked, onChange, opts) });
    }

    const phut = mkCell({ label: "Phút mỗi trận" });
    phut.ctl.append(mkSeg(PHUT.map(n => ({ value: n, label: String(n) })), c.phut, v => { draft.tnPhut = v; }));
    const lv = mkCell({ label: "Độ khó" });
    lv.ctl.append(mkSeg(LV.map(([v, t]) => ({ value: v, label: t })), c.lv, v => { draft.tnLv = v; }));
    const bien = mkCell({ label: "Bộ gợi ý", wide: true });
    bien.ctl.append(mkSeg(BIEN.map(([v, t]) => ({ value: v, label: t })), draft.tnBien, v => { draft.tnBien = v; }));
    panel.append(phut.cell, lv.cell, bien.cell);

    addCheck("Gợi ý lật chữ", c.goiY, v => { draft.tnGoiY = v; },
      { key: "tnGoiY", title: "Sau một lúc không ra từ, game tự lật dần từng chữ gợi ý" });
    addCheck("Giọng đọc", c.giong, v => { draft.tnGiong = v; },
      { key: "tnGiong", title: "Đọc gợi ý thành tiếng (chỉ khi bộ gợi ý có giọng: ENG1/ENG2)" });
  },
  optionsNeedRestart() { return true; },

  mount(root, activity, ui) {
    if (ui.sloganSlot) ui.sloganSlot.textContent = "TOURNAMENT IN ANDREW CLASSES";
    const c = cfgOf(activity.options);
    const n = wordsOf(activity).length;
    root.innerHTML = "";
    const wrap = el("div", "aw-tn-root");
    root.append(wrap);

    const card = el("div", "aw-tn-card");
    const trophy = el("div", "aw-tn-trophy");
    trophy.innerHTML = TROPHY;
    card.append(trophy, el("div", "aw-tn-kicker", "TOURNAMENT · A SHOW SPEED"));
    card.append(el("h2", "aw-tn-title", activity.title || "Giải đấu"));

    const chips = el("div", "aw-tn-chips");
    const chip = (k, v) => { const d = el("div", "aw-tn-chip"); d.append(el("b", "", v), el("span", "", k)); chips.append(d); };
    chip("mỗi trận", c.phut + " phút");
    chip("độ khó", (LV.find(x => x[0] === c.lv) || LV[0])[1]);
    chip("cách chơi", MODE_TXT[c.mode]);
    chip("hình thức", "Đấu cặp");
    if (n) chip("bộ từ", n + " từ");
    card.append(chips);

    card.append(el("div", "aw-tn-note", "Giải đấu diễn ra trên andrewclasses.com"),
      el("div", "aw-tn-sub", "Vào trang Giải đấu để đấu cặp với bạn cùng lớp và leo bảng xếp hạng."));

    const btns = el("div", "aw-tn-btns");
    const go = el("a", "aw-tn-btn is-main", "Mở trang Giải đấu");
    go.href = GIAI_DAU_URL; go.target = "_blank"; go.rel = "noopener";
    const pr = el("button", "aw-tn-btn", "Luyện với máy");
    pr.type = "button";
    if (!n) { pr.disabled = true; pr.title = "Giải chưa có từ nào"; }
    pr.addEventListener("click", () => {
      if (pr.disabled) return;
      pr.disabled = true; pr.textContent = "Đang mở…";
      luyenVoiMay(activity, root).catch(e => { console.error(e); pr.disabled = false; pr.textContent = "Luyện với máy"; });
    });
    btns.append(go, pr);
    card.append(btns);
    wrap.append(card);
    return function cleanup() {};
  }
};

registerTemplate(tournamentTemplate);
