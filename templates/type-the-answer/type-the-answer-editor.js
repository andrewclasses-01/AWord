// =============================================================
// TYPE THE ANSWER EDITOR — the form a teacher uses to create or edit a
// Type the answer activity.
//
//   openTypeTheAnswerEditor(container, activity, { onSave, onCancel, header, footer })
//     • same contract as templates/quiz/quiz-editor.js / templates/anagram/anagram-editor.js
//     • onSave(updatedActivity) -> called when the teacher presses Save
//       (already validated); may return a Promise.
//     • onCancel() -> called when the teacher presses Cancel.
//
// It edits a DEEP CLONE of `activity`, so Cancel leaves the original untouched.
//
// SCOPE (matches the other 2 editors): this page edits ONLY the title + the
// questions (prompt + accepted answers). Theme is always Classic; default
// options live in Settings; per-act options are tweaked from the in-game
// Options panel. Mode is fixed to "qa" (Spelling test is a separate, bigger
// feature — not built yet, see GHI CHU TYPE-THE-ANSWER.md).
//
// LAYOUT (30/7/2026, per Teacher Andrew's screenshot): each question is a row
// with the QUESTION box on the LEFT and its ANSWERS stacked on the RIGHT (one
// question -> many accepted answers). "+ Add alternative answer" sits right
// under the last answer box of that same question. Reuses the shared
// `.aw-ed-*` editor classes from core/app.css (same ones Quiz/Anagram use);
// the 2-column layout itself is a few new rules in this template's own
// `type-the-answer.css`, under `.aw-tta-ed-*` — core/ untouched.
// =============================================================

import { el } from "../../core/utils.js";

const MAX_ITEMS = 50;          // Wordwall's real cap for this template (per Teacher Andrew, 30/7)
const MAX_ALTERNATES = 5;      // alternate accepted answers per question, on top of the main one

// ⭐ Đợt 304 (thầy, 08/9/2026) — "khi chữ dài quá ô thì … xuống dòng 2 ngay trong ô.
// Đảm bảo luôn quan sát được hết text". Mọi ô của editor này nay là <textarea> cao
// theo nội dung: cứ gõ tới đâu ô cao thêm tới đó, không bao giờ có chữ bị cắt hay
// phải cuộn ngang. Cùng khuôn `autoGrow` của `templates/crossword/crossword-editor.js`.
// ⚠️ `height:auto` TRƯỚC khi đọc `scrollHeight` — không có bước đó thì ô chỉ cao lên
// được chứ không bao giờ thấp lại khi thầy xoá bớt chữ.
// ⚠️⚠️ PHẢI CỘNG BỀ DÀY VIỀN. `.aw-ed-input` (core) khai `box-sizing:border-box`, mà
// `scrollHeight` thì tính CẢ padding nhưng KHÔNG tính viền — gán thẳng
// `height = scrollHeight` là phần chữ bị hụt đúng bằng viền trên + viền dưới. Đo thật
// ở bàn thử Đợt 304: ô câu hỏi (viền 2,5px) hụt **2px**, tức dòng cuối bị liếm mất chân
// chữ. Cộng viền vào thì hụt về 0 ở mọi ô. (Ô đáp án viền mỏng hơn nên gần như không
// thấy — đúng kiểu lỗi sống sót nhiều bản vì "nhìn thì có sao đâu".)
function autoGrow(ta) {
  if (!ta) return;
  ta.style.height = "auto";
  const cs = getComputedStyle(ta);
  const border = cs.boxSizing === "border-box"
    ? (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0)
    : 0;
  ta.style.height = (ta.scrollHeight + border + 2) + "px";
}
// Ô nào cũng giữ đúng MỘT dòng dữ liệu (prompt / một đáp án), nên Enter không được
// chèn xuống dòng: chữ vẫn tự xuống dòng khi chạm mép ô, còn "\n" thật thì lúc chơi
// chỉ hiện ra như một dấu cách — lưu vào chỉ tổ làm phép so đáp án lệch.
function noEnter(ta) {
  ta.addEventListener("keydown", e => { if (e.key === "Enter") e.preventDefault(); });
}

export function openTypeTheAnswerEditor(container, activity, { onSave, onCancel, header, footer } = {}) {
  const isNew = !(activity && activity.id);
  const data = normalize(activity);
  // ⛔⛔ BẪY TDZ — ĐÃ CẮN THẬT 08/9/2026 (cùng loại với Đợt 305). Biến này PHẢI khai ở
  // đây, TRÊN mọi lời gọi hàm: `buildBulkBar()` chạy ĐỒNG BỘ ngay lúc dựng trang và nó
  // gán vào `nutBangTra`. Khai `let` xuống dưới thì ném `ReferenceError: Cannot access
  // 'nutBangTra' before initialization` — mà ném từ giữa lúc dựng nên **nửa sau của
  // trang soạn im lặng không hiện ra**, không báo gì cả.
  let nutBangTra = null;   // nút ⚙ ở thanh trên cùng; nhãn đếm số dòng đã soạn

  container.innerHTML = "";
  const page = el("div", "aw-ed");
  if (header) page.append(header);

  // ---- Sticky action bar: act-type badge + heading | Cancel / Save ----
  const head = el("div", "aw-ed-head");
  const headL = el("div", "aw-ed-headleft");
  headL.append(el("span", "aw-ed-typebadge", "TYPE THE ANSWER"));
  headL.append(el("div", "aw-ed-heading", isNew ? "New activity" : "Edit content"));
  head.append(headL);
  const actions = el("div", "aw-ed-headactions");
  const cancelBtn = el("button", "aw-btn", "Cancel");
  const saveBtn = el("button", "aw-btn aw-btn-primary", "Save");
  cancelBtn.type = "button"; saveBtn.type = "button";
  actions.append(cancelBtn, saveBtn);
  head.append(actions);
  page.append(head);

  // ---- Error / info banner ----
  const errBar = el("div", "aw-ed-error");
  errBar.style.display = "none";
  page.append(errBar);

  // ---- Scrolling body ----
  const body = el("div", "aw-ed-body");
  page.append(body);

  // ===== META: activity title only =====
  const meta = el("div", "aw-ed-meta");
  const titleInput = el("input", "aw-ed-input");
  titleInput.value = data.title;
  titleInput.placeholder = "e.g. Unit 3 — Vocabulary";
  titleInput.oninput = () => { data.title = titleInput.value; clearError(); };
  meta.append(field("Activity Title", titleInput));
  body.append(meta);

  // ===== QUESTIONS =====
  body.append(el("div", "aw-ed-sectionhead", "Questions"));
  body.append(buildBulkBar());
  const qWrap = el("div", "aw-ed-questions");
  body.append(qWrap);
  renderQuestions();

  if (footer) page.append(footer);

  container.append(page);
  titleInput.focus();
  // ⚠️ CHỖ NÀY MỚI ĐO ĐƯỢC, không phải lúc `renderQuestions()` ở trên: trước
  // `container.append(page)` cả trang còn NGOÀI tài liệu, `scrollHeight` của một ô
  // chưa có bề ngang thật thì trả về số vô nghĩa. Đo lại 3 mốc theo đúng luật của
  // core (`HUONG DAN CORE.md` — font web tải muộn là một cú nhảy kích thước):
  // ngay bây giờ · khung hình kế · lúc font đã sẵn sàng.
  growAll();
  requestAnimationFrame(growAll);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(growAll).catch(() => {});
  // Đổi bề ngang cửa sổ là đổi số dòng của mọi ô (và ở dưới 760px thì hai cột xếp
  // chồng lại) — phải đo lại, không thì ô giữ nguyên chiều cao cũ và cắt mất chữ.
  // Tự gỡ mình khi trang editor đã bị thay bằng thứ khác, để không rò bộ nhớ.
  window.addEventListener("resize", onWindowResize);
  function onWindowResize() {
    if (!page.isConnected) { window.removeEventListener("resize", onWindowResize); return; }
    growAll();
  }
  // Cao lại TẤT CẢ ô của bảng soạn. Rẻ (mỗi ô 2 phép gán style) nên cứ gọi thoải mái.
  function growAll() {
    page.querySelectorAll(".aw-tta-ed-qtext, .aw-tta-ed-atext").forEach(autoGrow);
  }

  function veNhanNut() {
    if (!nutBangTra) return;
    const n = (data.content.goiY || []).filter(r => String(r.go || "").trim()).length;
    nutBangTra.textContent = n ? `⚙ Hướng dẫn khi sai — ${n} dòng` : "⚙ Hướng dẫn khi sai";
    nutBangTra.classList.toggle("co-dong", n > 0);
  }

  // ---------- questions rendering ----------
  function renderQuestions() {
    qWrap.innerHTML = "";
    data.content.items.forEach((it, qi) => qWrap.append(questionCard(it, qi)));
    const addQ = el("button", "aw-ed-addq", "+ Add question");
    addQ.type = "button";
    addQ.disabled = data.content.items.length >= MAX_ITEMS;
    addQ.onclick = () => {
      if (data.content.items.length < MAX_ITEMS) { data.content.items.push(blankItem()); renderQuestions(); }
    };
    qWrap.append(addQ);
    const count = el("div", "aw-ed-qcount", `${data.content.items.length} / ${MAX_ITEMS} questions`);
    qWrap.append(count);
    // Lần dựng đầu tiên trang còn chưa vào tài liệu nên phép đo chưa đúng — chỗ đó
    // được đo lại ngay sau `container.append(page)`. Mọi lần dựng lại sau (thêm câu,
    // xoá đáp án, dán Excel) thì trang đã ở trong tài liệu, đo được ngay tại đây.
    if (page.isConnected) growAll();
  }

  // Parse a pasted Excel block: LEFT column = question, RIGHT column = one
  // accepted answer per row. A row whose left cell is blank continues the
  // answer list of the question above it (matches the teacher's screenshot:
  // "Spring/Winter/Autumn/Fall/Summer" all under "What is one of the seasons?").
  function parseExcelBlock(text) {
    const rows = text.replace(/\r/g, "").split("\n");
    while (rows.length && rows[rows.length - 1].trim() === "") rows.pop();

    const items = [];
    let current = null;
    rows.forEach(line => {
      const cells = line.split("\t").map(c => c.trim());
      const q = cells[0] || "";
      const answersInRow = cells.slice(1).filter(c => c !== "");
      if (q === "" && answersInRow.length === 0) return;   // fully blank row
      if (q !== "") {
        current = { prompt: q, acceptedAnswers: answersInRow.length ? [...answersInRow] : [""] };
        items.push(current);
      } else {
        // blank question cell -> extra answer(s) for the question right above
        if (!current) { current = { prompt: "", acceptedAnswers: [] }; items.push(current); }
        current.acceptedAnswers.push(...answersInRow);
      }
    });
    items.forEach(it => {
      if (!it.acceptedAnswers.length) it.acceptedAnswers = [""];
      it.acceptedAnswers = it.acceptedAnswers.slice(0, 1 + MAX_ALTERNATES);
    });
    return items;
  }

  // Works whether the teacher clicks the question box or an answer box first
  // — fills from THIS question downward, same convention as Quiz/Anagram.
  function onBlockPaste(e, qi) {
    const text = (e.clipboardData || window.clipboardData)?.getData("text/plain") || "";
    if (!/[\t\n]/.test(text)) return;    // a single cell -> let the normal paste happen
    e.preventDefault();

    const parsed = parseExcelBlock(text);
    if (!parsed.length) return;

    let next = data.content.items.slice(0, qi).concat(parsed);
    let dropped = 0;
    if (next.length > MAX_ITEMS) { dropped = next.length - MAX_ITEMS; next = next.slice(0, MAX_ITEMS); }
    data.content.items = next;
    renderQuestions();
    const filled = parsed.length - dropped;
    showInfo(`Pasted ${filled} question(s) from Excel${dropped ? ` (${dropped} skipped — ${MAX_ITEMS} max)` : ""}.`);
  }

  function questionCard(it, qi) {
    const card = el("div", "aw-ed-qcard");

    const top = el("div", "aw-ed-qtop");
    top.append(el("span", "aw-ed-qnum", `Question ${qi + 1}`));
    const topActions = el("div", "aw-ed-qactions");
    const dupQ = el("button", "aw-ed-del aw-ed-dup", "Duplicate");
    dupQ.type = "button";
    dupQ.disabled = data.content.items.length >= MAX_ITEMS;
    dupQ.onclick = () => {
      if (data.content.items.length >= MAX_ITEMS) return;
      const copy = JSON.parse(JSON.stringify(it));
      data.content.items.splice(qi + 1, 0, copy);
      renderQuestions();
    };
    const delQ = el("button", "aw-ed-del", "Remove");
    delQ.type = "button";
    delQ.disabled = data.content.items.length <= 1;
    delQ.onclick = () => { data.content.items.splice(qi, 1); renderQuestions(); };
    topActions.append(dupQ, delQ);
    top.append(topActions);
    card.append(top);

    // ---- LEFT = question, RIGHT = stacked answers (per teacher's layout) ----
    const blockEl = el("div", "aw-tta-ed-block");

    const qInput = el("textarea", "aw-ed-input aw-tta-ed-qtext");
    qInput.rows = 1;
    qInput.value = it.prompt;
    qInput.placeholder = "Type the question…";
    qInput.oninput = () => { it.prompt = qInput.value; autoGrow(qInput); clearError(); };
    qInput.addEventListener("paste", e => onBlockPaste(e, qi));
    noEnter(qInput);
    blockEl.append(qInput);   // chiều cao ban đầu do growAll() đặt — xem ghi chú ở đó

    const acol = el("div", "aw-tta-ed-acol");
    it.acceptedAnswers.forEach((ans, ai) => acol.append(answerRow(it, ai, qi)));
    const addA = el("button", "aw-ed-adda", "+ Add alternative answer");
    addA.type = "button";
    addA.disabled = it.acceptedAnswers.length >= 1 + MAX_ALTERNATES;
    addA.onclick = () => {
      if (it.acceptedAnswers.length < 1 + MAX_ALTERNATES) { it.acceptedAnswers.push(""); renderQuestions(); }
    };
    acol.append(addA);
    blockEl.append(acol);

    card.append(blockEl);
    return card;
  }

  function answerRow(it, ai, qi) {
    const row = el("div", "aw-tta-ed-arow");
    // ⭐ Đợt 304 — <textarea> chứ không còn <input>: một đáp án có thể là CẢ CÂU dài,
    // mà <input> thì không bao giờ xuống dòng — chữ chạy ngang ra khỏi tầm nhìn.
    const txt = el("textarea", "aw-ed-input aw-tta-ed-atext");
    txt.rows = 1;
    txt.value = it.acceptedAnswers[ai];
    txt.placeholder = ai === 0 ? "Answer" : "Alternative answer";
    txt.oninput = () => { it.acceptedAnswers[ai] = txt.value; autoGrow(txt); clearError(); };
    txt.addEventListener("paste", e => onBlockPaste(e, qi));
    noEnter(txt);

    const del = el("button", "aw-ed-del aw-ed-del-a", "×");
    del.type = "button";
    del.title = "Remove this answer";
    del.disabled = it.acceptedAnswers.length <= 1;
    del.onclick = () => { it.acceptedAnswers.splice(ai, 1); renderQuestions(); };

    row.append(txt, del);
    return row;
  }

  // ===== ⚙ BẢNG TRA HƯỚNG DẪN KHI SAI — MỘT BẢNG CHO CẢ ACT (Đợt 309) =====
  // Thầy 08/9: *"Liệu có thể gom hết vào 1 nút duy nhất, bấm vào đó thì mở 1 pop-up lớn
  // có 3 cột … Khi học sinh làm thì sẽ tự động scan khớp câu, không cần phải gõ lẻ cho
  // từng câu như hiện tại."* — Đợt 308 làm mỗi câu một nút, gõ lại một nội dung 30 lần.
  //
  // ⚠️ CỘT THỨ TƯ "ÁP DỤNG CHO" LÀ CÓ LÝ DO, ĐỪNG BỎ: một dòng chung có thể khớp nhầm
  // câu khác. Ca thật ở Lesson 15: câu 1 đáp án là **want** to play, câu 11 là **need**
  // to use — dòng chung "chứa want → đề hỏi CẦN" đúng cho câu 11 nhưng bậy cho câu 1.
  // Mặc định vẫn là "Mọi câu" (đúng ý thầy), khoá vào một câu chỉ khi cần.
  // ⚠️ Dòng khoá câu neo bằng ĐỀ BÀI (`de`), không phải số thứ tự: thầy xoá/chèn/đảo câu
  // thì số thứ tự lệch hết, còn đề thì không.
  function moBangTra() {
    const overlay = el("div", "aw-modal-overlay");
    const modal = el("div", "aw-modal aw-tta-ed-hmodal");
    modal.append(el("div", "aw-modal-title", "Hướng dẫn khi học sinh trả lời sai"));
    const than = el("div", "aw-modal-body");
    modal.append(than);
    overlay.append(modal);
    overlay.onclick = e => { if (e.target === overlay) dong(); };
    document.body.append(overlay);
    ve();
    return { dong };

    function dong() { overlay.remove(); veNhanNut(); }

    function ve() {
      than.innerHTML = "";
      than.append(el("div", "aw-tta-ed-hnote",
        "Học sinh trả lời SAI thì máy dò bảng này từ trên xuống, dòng nào khớp trước thì hiện câu " +
        "hướng dẫn của dòng đó. Không dòng nào khớp thì chỉ tô đỏ, không hiện chữ nào."));
      const bang = el("div", "aw-tta-ed-htable");
      const dau = el("div", "aw-tta-ed-hrow is-head");
      ["Áp dụng cho", "Kiểu khớp", "Chữ học sinh gõ", "Câu hướng dẫn hiện ra", ""].forEach((t, i) => {
        dau.append(el("div", "aw-tta-ed-hcell c" + i, t));
      });
      bang.append(dau);
      data.content.goiY.forEach((r, ri) => bang.append(dongBang(r, ri)));
      than.append(bang);
      if (!data.content.goiY.length) {
        than.append(el("div", "aw-tta-ed-hempty", "Chưa có dòng nào. Thêm dòng, hoặc lấy thẳng những câu học sinh đã gõ sai."));
      }
      const them = el("button", "aw-ed-adda", "+ Thêm dòng");
      them.type = "button";
      them.onclick = () => { data.content.goiY.push({ de: "", kieu: "yhet", go: "", noi: "" }); ve(); };
      const lay = el("button", "aw-ed-adda aw-tta-ed-hlay", "⤓ Lấy câu sai thật của học sinh");
      lay.type = "button";
      lay.onclick = () => layCauSaiThat(lay, ve);
      const xong = el("button", "aw-btn aw-btn-primary", "Xong");
      xong.type = "button"; xong.onclick = dong;
      const chan = el("div", "aw-tta-ed-hfoot");
      chan.append(them, lay, xong);
      than.append(chan);
    }

    function dongBang(r, ri) {
      const d = el("div", "aw-tta-ed-hrow");

      // cột 1 — ÁP DỤNG CHO
      const pv = el("select", "aw-ed-input aw-ed-select");
      const oAll = el("option", "", "Mọi câu"); oAll.value = ""; pv.append(oAll);
      data.content.items.forEach((it, i) => {
        const o = el("option", "", "Câu " + (i + 1) + " — " + String(it.prompt || "").slice(0, 24));
        o.value = it.prompt || ("__c" + i);
        pv.append(o);
      });
      // Đề đã bị sửa/xoá thì GIỮ NGUYÊN lựa chọn cũ và nói rõ, đừng âm thầm về "Mọi câu".
      if (r.de && !data.content.items.some(it => (it.prompt || "") === r.de)) {
        const o = el("option", "", "⚠ câu đã đổi đề: " + String(r.de).slice(0, 20));
        o.value = r.de; pv.append(o);
      }
      pv.value = r.de || "";
      pv.onchange = () => { r.de = pv.value; ve(); };
      d.append(boc(pv, 0));

      // cột 2 — KIỂU KHỚP
      const kieu = el("select", "aw-ed-input aw-ed-select");
      [["yhet", "Giống toàn bộ"], ["chua", "Có chứa"]].forEach(([v, t]) => {
        const o = el("option", "", t); o.value = v; kieu.append(o);
      });
      kieu.value = r.kieu === "chua" ? "chua" : "yhet";
      kieu.onchange = () => { r.kieu = kieu.value; ve(); };
      d.append(boc(kieu, 1));

      // cột 3 — CHỮ HỌC SINH GÕ
      const go = el("input", "aw-ed-input");
      go.value = r.go || "";
      go.placeholder = "ví dụ: foolball";
      go.oninput = () => { r.go = go.value; capNhatCanhBao(); };
      const o3 = boc(go, 2);
      const bao = el("div", "aw-tta-ed-hwarn");
      o3.append(bao);
      d.append(o3);

      // cột 4 — CÂU HƯỚNG DẪN
      const noi = el("input", "aw-ed-input");
      noi.value = r.noi || "";
      noi.placeholder = "câu hướng dẫn hiện cho em";
      noi.oninput = () => { r.noi = noi.value; };
      d.append(boc(noi, 3));

      const xoa = el("button", "aw-ed-del aw-ed-del-a", "×");
      xoa.type = "button"; xoa.title = "Xoá dòng này";
      xoa.onclick = () => { data.content.goiY.splice(ri, 1); ve(); };
      d.append(boc(xoa, 4));

      capNhatCanhBao();
      return d;

      function capNhatCanhBao() { bao.textContent = canhBaoDong(r); bao.hidden = !bao.textContent; }
    }

    function boc(x, i) { const o = el("div", "aw-tta-ed-hcell c" + i); o.append(x); return o; }
  }

  /**
   * ⚠️ ĐÈN CẢNH BÁO — thứ chặn đúng rủi ro lớn nhất của bảng gộp: một dòng khớp trúng
   * **ĐÁP ÁN ĐÚNG** của câu nào đó thì em làm ĐÚNG mà vẫn bị mắng (khi em sai ở chỗ khác
   * trong cùng câu). Nói rõ tại chỗ để thầy sửa ngay, thay vì đợi học sinh phát hiện.
   */
  function canhBaoDong(r) {
    const k = chuanDeSo(r.go);
    if (!k) return "";
    const trung = [];
    data.content.items.forEach((it, i) => {
      if (r.de && (it.prompt || "") !== r.de) return;
      (it.acceptedAnswers || []).forEach(a => {
        const n = chuanDeSo(a);
        if (!n) return;
        if (r.kieu === "chua" ? n.includes(k) : n === k) trung.push(i + 1);
      });
    });
    const ds = [...new Set(trung)];
    return ds.length ? "⚠ khớp cả ĐÁP ÁN ĐÚNG của câu " + ds.slice(0, 6).join(", ") + (ds.length > 6 ? "…" : "") : "";
  }

  // ⚠️ Bản NHẸ của phép chuẩn hoá, CHỈ dùng cho đèn cảnh báo và phép chống trùng dòng.
  // Phép so THẬT lúc chơi là `normalize()` trong `type-the-answer.js` (bỏ hoa-thường, bỏ
  // dấu, gom khoảng trắng). Hai bên lệch nhau tí thì cùng lắm là thừa/thiếu một cảnh báo,
  // KHÔNG bao giờ làm sai câu hướng dẫn hiện cho học sinh.
  function chuanDeSo(s) {
    return String(s == null ? "" : s).trim().replace(/\s+/g, " ")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  /**
   * ⤓ Nạp những câu HỌC SINH ĐÃ GÕ SAI THẬT, từ các bài đã giao của act. Mỗi dòng nạp về
   * được **khoá sẵn vào đúng câu** em sai (cột Áp dụng cho) — vì máy biết em sai ở câu nào,
   * còn thầy thì khỏi phải dò.
   * ⚠️ Act chưa lưu hoặc chưa giao bài lần nào thì nói rõ, đừng im lặng.
   */
  async function layCauSaiThat(nut, ve) {
    const nhan = nut.textContent;
    nut.disabled = true; nut.textContent = "đang đọc bài học sinh…";
    try {
      if (!activity || !activity.id) { showInfo("Act chưa lưu lần nào nên chưa có bài học sinh để đọc."); return; }
      const asMod = await import("../../core/assignments.js");
      const ds = await asMod.listAssignmentsForAct(activity.id, { includeTrashed: true });
      if (!ds.length) { showInfo("Act này chưa giao bài lần nào, nên chưa có câu sai nào để lấy."); return; }
      const dem = new Map();   // "<đề>\n<chữ em gõ>" -> số lượt
      for (const bg of ds) {
        const rows = await asMod.listResults(bg.code);
        for (const r of rows) {
          for (const q of (r.review || [])) {
            if (q.yourCorrect || !q.yourText) continue;
            const k = String(q.question || "").trim() + "\n" + String(q.yourText).trim();
            dem.set(k, (dem.get(k) || 0) + 1);
          }
        }
      }
      if (!dem.size) { showInfo("Chưa có em nào gõ sai ở act này."); return; }
      const daCo = new Set(data.content.goiY.map(r => chuanDeSo(r.de) + "\n" + chuanDeSo(r.go)));
      let them = 0;
      [...dem.entries()].sort((a, b) => b[1] - a[1]).forEach(([k]) => {
        const [de, go] = k.split("\n");
        if (daCo.has(chuanDeSo(de) + "\n" + chuanDeSo(go))) return;
        data.content.goiY.push({ de, kieu: "yhet", go, noi: "" });
        them++;
      });
      ve();
      showInfo(them
        ? `Đã nạp ${them} câu sai thật của học sinh — thầy viết câu hướng dẫn cho từng dòng.`
        : "Mọi câu sai của học sinh đều đã có trong bảng rồi.");
    } catch (e) {
      showError("Không đọc được bài học sinh: " + (e.message || e));
    } finally {
      nut.disabled = false; nut.textContent = nhan;
    }
  }
  // ---------- save / cancel ----------
  cancelBtn.onclick = () => onCancel?.();

  saveBtn.onclick = async () => {
    const clean = JSON.parse(JSON.stringify(data));
    clean.title = clean.title.trim();
    clean.instruction = (clean.instruction || "").trim();
    clean.theme = "classic";
    clean.content.items.forEach(it => {
      it.prompt = it.prompt.trim();
      it.acceptedAnswers = it.acceptedAnswers.map(a => a.trim()).filter(a => a !== "");
      delete it.goiY;   // ⭐ Đợt 309 — bảng tra nay là MỘT bảng của cả act (xem dưới)
    });
    // ⭐ Đợt 309 — dọn BẢNG TRA của act: bỏ dòng chưa gõ gì, và bỏ dòng có chuỗi mà CHƯA
    // CÓ CÂU HƯỚNG DẪN (giữ lại chỉ tổ làm thầy tưởng đã soạn xong).
    clean.content.goiY = (Array.isArray(clean.content.goiY) ? clean.content.goiY : [])
      .map(r => ({
        de: String(r.de || "").trim(),
        kieu: r.kieu === "chua" ? "chua" : "yhet",
        go: String(r.go || "").trim(),
        noi: String(r.noi || "").trim()
      }))
      .filter(r => r.go && r.noi);
    if (!clean.content.goiY.length) delete clean.content.goiY;

    // Drop rows that were added but left completely empty.
    clean.content.items = clean.content.items.filter(it => !(it.prompt === "" && it.acceptedAnswers.length === 0));

    const err = validate(clean);
    if (err) { showError(err); return; }

    saveBtn.disabled = true;
    const label = saveBtn.textContent;
    saveBtn.textContent = "Saving…";
    try {
      await onSave?.(clean);
    } catch (e) {
      saveBtn.disabled = false;
      saveBtn.textContent = label;
      showError("Could not save — please try again.");
    }
  };

  function showError(msg) {
    errBar.classList.remove("is-info");
    errBar.textContent = msg;
    errBar.style.display = "block";
    body.scrollTop = 0;
  }
  function showInfo(msg) {
    errBar.classList.add("is-info");
    errBar.textContent = msg;
    errBar.style.display = "block";
    body.scrollTop = 0;
  }
  function clearError() {
    if (errBar.style.display !== "none") errBar.style.display = "none";
  }

  // ---------- bulk actions bar ----------
  function buildBulkBar() {
    const bar = el("div", "aw-ed-bulk");
    const clearBtn = el("button", "aw-btn aw-ed-bulkdanger", "Delete all questions");
    clearBtn.type = "button";
    clearBtn.onclick = () => {
      if (!confirm("Delete ALL questions?")) return;
      data.content.items = [blankItem()];
      renderQuestions();
      showInfo("All questions deleted.");
    };
    // ⭐ Đợt 309 — MỘT nút cho cả act, thay cho mỗi câu một nút của Đợt 308.
    nutBangTra = el("button", "aw-btn aw-tta-ed-hbtn");
    nutBangTra.type = "button";
    nutBangTra.onclick = () => moBangTra();
    veNhanNut();
    bar.append(clearBtn, nutBangTra);
    return bar;
  }

  // ---------- small helpers ----------
  function field(labelText, control) {
    const f = el("div", "aw-ed-field");
    f.append(el("label", "aw-ed-label", labelText), control);
    return f;
  }
}

// ===== data helpers =====
function normalize(activity) {
  const a = activity ? JSON.parse(JSON.stringify(activity)) : {};
  a.type = "type_the_answer";
  a.schemaVersion = a.schemaVersion || 1;
  a.title = a.title || "";
  a.instruction = a.instruction || "";
  a.theme = "classic";
  a.options = a.options || {};
  a.content = a.content || {};
  a.content.mode = "qa";     // Spelling test is a separate mode, not built yet
  let items = Array.isArray(a.content.items) ? a.content.items : [];
  if (items.length === 0) items = [blankItem()];
  a.content.items = items.map(it => {
    let acceptedAnswers = Array.isArray(it.acceptedAnswers) && it.acceptedAnswers.length ? it.acceptedAnswers : [""];
    acceptedAnswers = acceptedAnswers.slice(0, 1 + MAX_ALTERNATES).map(x => x || "");
    // ⛔ Đợt 308 — PHẢI CHÉP `goiY` SANG. Hàm này dựng lại từng câu từ số 0, nên trường
    // nào quên ở đây là **mất trắng ngay lần thầy bấm Save đầu tiên**, không báo gì cả.
    return { prompt: it.prompt || "", acceptedAnswers, goiY: Array.isArray(it.goiY) ? it.goiY : null };
  });
  // ⭐ Đợt 309 — MỘT bảng tra cho cả act. Bảng lẻ theo từng câu của Đợt 308 (nếu act nào
  // lỡ lưu rồi) được GOM vào đây, khoá sẵn vào đúng câu của nó — không mất dòng nào.
  const bang = Array.isArray(a.content.goiY) ? a.content.goiY.slice() : [];
  a.content.items.forEach(it => {
    (Array.isArray(it.goiY) ? it.goiY : []).forEach(r => {
      if (r && (r.go || r.noi)) bang.push({ de: it.prompt || "", kieu: r.kieu === "chua" ? "chua" : "yhet", go: String(r.go || ""), noi: String(r.noi || "") });
    });
    delete it.goiY;
  });
  a.content.goiY = bang.map(r => ({
    de: String(r && r.de || ""), kieu: r && r.kieu === "chua" ? "chua" : "yhet",
    go: String(r && r.go || ""), noi: String(r && r.noi || "")
  }));
  return a;
}
function blankItem() { return { prompt: "", acceptedAnswers: [""] }; }

function validate(d) {
  if (!d.title) return "Please enter an activity title.";
  if (!d.content.items.length) return "Add at least one question.";
  for (let i = 0; i < d.content.items.length; i++) {
    const it = d.content.items[i];
    if (!it.prompt) return `Question ${i + 1} has no text.`;
    if (!it.acceptedAnswers.length) return `Question ${i + 1} needs an answer.`;
  }
  return null;
}
