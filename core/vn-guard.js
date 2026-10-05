// ⭐ Đợt 419 (28/9/2026) — GÕ TIẾNG ANH KHI MÁY ĐANG BẬT UNIKEY / EVKEY.
//
// Vấn đề: bài tập AWord toàn gõ tiếng Anh, nhưng máy học sinh hay để UniKey bật
// (Telex). UniKey KHÔNG gõ thẳng chữ: nó CHẶN phím thật ở tầng Windows rồi bơm vào
// một "gói" lệnh giả. Đo thật trên UniKey 4.6 RC2 + Chrome (28/9/2026), gõ "boo":
//   keydown "b"  code=KeyB            ← phím thật, đi qua bình thường
//   keydown "o"  code=KeyO            ← phím thật
//   keydown "·"  code=""  keyCode=231 ← GÓI bắt đầu: chữ mồi U+00B7 (VK_PACKET)
//   keydown Backspace ×2              ← xoá chữ mồi + chữ "o"
//   keydown "ô"  code=""  keyCode=231 ← chữ có dấu thay vào
//   keyup   "o"  code=KeyO            ← ⭐ NHẢ PHÍM THẬT vẫn tới, dù keydown bị nuốt
// Bộ lọc cũ "chỉ giữ ASCII" xoá "ô" ⇒ gõ "oo" mất cả hai chữ, chữ nháy, và các lần
// xoá sau của UniKey xoá nhầm (nó vẫn tưởng màn hình có "ô").
//
// Cách chữa ở đây: CHẶN cả gói (không cho chạm ô chữ / game), đoán phím thật từ gói
// (luật Telex: â/ê/ô ⇒ a/e/o · ă/ơ/ư ⇒ w · đ ⇒ d · dấu ⇒ s f r x j · bỏ dấu ⇒ z),
// chèn đúng phím đó; rồi lấy keyup của phím bị nuốt làm BẰNG CHỨNG — lệch (VNI, cấu
// hình lạ) thì sửa lại. Backspace thật hoãn 60 ms: gói thì bỏ, không thì xoá thật.
// Ranh giới gói đo bằng e.timeStamp (giờ phím tới), không bằng giờ trang xử lý — máy bận vẫn đúng.
// Bản chiếu `mirror` giữ "UniKey đang tưởng màn hình có gì" để đoán cho đúng.
//
// Dùng: const g = guardVnTyping({ accepts(e), insert(ch), backspace(), input? , afterSet? });
//       …cleanup: g.dispose();
// - accepts(e): phím này có thuộc về template không (vd e.target === ô nhập).
// - insert/backspace: đúng các hàm bàn phím ảo của template đang dùng.
// - input (tuỳ chọn, chỉ ô <input>/<textarea>): bật thêm xử lý bộ gõ kiểu "gạch chân"
//   (bộ gõ tiếng Việt có sẵn của Windows/Mac) — thay chữ đã ghép bằng các phím thật.
//   ⚠️ Nhánh này CHƯA đo trên máy thật (máy 1 chỉ có UniKey).

const UA = typeof navigator !== "undefined" ? (navigator.userAgent || "") : "";
// ⭐ Đợt 431 (30/9/2026) — Safari iPad (iPadOS 13+) mặc định XƯNG LÀ "Macintosh" nên
// dòng UA không có chữ iPad ⇒ bị coi là máy tính bàn ⇒ phím bàn phím ảo (code "")
// bị `isInjected` tưởng là gói UniKey, giữ lại 150ms rồi mới chèn. Máy Mac thật có
// maxTouchPoints = 0; iPad "giả Mac" có ≥ 1 (thường 5).
const MOBILE = /Android|iPhone|iPad|iPod/i.test(UA)
  || (/Macintosh/i.test(UA) && typeof navigator !== "undefined" && navigator.maxTouchPoints > 1);
const GAP = 150;         // ms — đóng gói khi im lặng chừng này (keyup / phím kế tiếp đóng sớm hơn)
const BS_WAIT = 60;      // ms — Backspace thật hoãn chừng này xem có gói nào theo sau không
const SPLIT = 25;        // ms — trong một gói UniKey các sự kiện cách nhau < 10 ms
const MERGE = 150;       // ms — mảnh gói tới trễ (máy bận) trong khoảng này thì GHÉP lại gói trước
const SLOT_TTL = 1500;   // ms — chờ keyup của phím bị nuốt tối đa chừng này
const MIRROR_MAX = 64;

const guards = new Set();
let listening = false;

// Sự kiện do phần mềm bơm vào (SendInput KEYEVENTF_UNICODE ⇒ VK_PACKET 231).
// Máy tính bàn: phím thật LUÔN có `code` (KeyA, Space…); gói bơm vào có code "".
// ⛔ Điện thoại/iPad: bàn phím ảo cũng gửi code "" ⇒ chỉ tin keyCode 231 ở đó.
function isInjected(e) {
  if (e.keyCode === 231) return true;
  // Đợt 464 — UniKey không bao giờ bơm gói kèm Ctrl/Cmd/Alt ⇒ phím tắt (Ctrl+V…) không phải gói.
  return !MOBILE && e.code === "" && typeof e.key === "string" && e.key.length === 1
    && !e.isComposing && e.keyCode !== 229 && !e.ctrlKey && !e.metaKey && !e.altKey;
}

// Tách dấu một chữ: NFD rồi đếm các dấu phụ.
const TONE_KEY = { "\u0301": "s", "\u0300": "f", "\u0309": "r", "\u0303": "x", "\u0323": "j" };
function feats(str) {
  const f = { circ: 0, bh: 0, dd: 0, tone: "", marks: 0, base: "" };
  for (const ch of str) {
    if (ch === "đ" || ch === "Đ") { f.dd++; f.marks++; f.base += ch === "đ" ? "d" : "D"; continue; }
    const parts = ch.normalize("NFD");
    f.base += parts[0];
    for (const m of parts.slice(1)) {
      if (m === "\u0302") f.circ++;
      else if (m === "\u0306" || m === "\u031B") f.bh++;
      else if (TONE_KEY[m]) f.tone = TONE_KEY[m];
      else continue;
      f.marks++;
    }
  }
  return f;
}
// Template nghe phím ở `window` (Crossword, Find the gap…) dùng cái này trong accepts():
// đang gõ vào một ô nhập khác (ô tên, ô tìm kiếm…) thì không phải phím của game.
export function isEditableTarget(t) {
  return !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || ""));
}

const isAscii = ch => /^[\x20-\x7E]$/.test(ch);
// Hoa/thường của phím bị nuốt: gói không nói thẳng. Tin Shift/CapsLock nếu sự kiện
// bơm vào có mang; không thì cả từ đang VIẾT HOA (≥ 2 chữ, vd "DOOR", "WOW") ⇒ hoa.
// ⛔ Đừng theo chữ mang dấu: "Awesome" ⇒ "Ắe" nhưng phím "s" là chữ thường.
function upperFor(before, upperHint) {
  if (upperHint) return true;
  const m = /[\p{L}]+$/u.exec(before);
  const w = m ? m[0] : "";
  return w.length >= 2 && w === w.toUpperCase() && w !== w.toLowerCase();
}

// Đoán phím thật từ "trước gói" → "sau gói" (luật Telex của UniKey). null = chịu, chờ keyup.
export function inferKey(before, after, upperHint = false) {
  let i = 0;
  while (i < before.length && i < after.length && before[i] === after[i]) i++;
  const D = before.slice(i), I = after.slice(i);
  if (!I) return null;
  const up = k => (upperFor(before, upperHint) ? k.toUpperCase() : k);
  if (!D) {
    if (I.length === 1 && isAscii(I)) return I;                 // UniKey gửi lại chính phím đó
    // "w" đứng một mình ⇒ ư/ơ — UniKey giữ đúng hoa/thường của phím ("W" ⇒ "Ư")
    if (/^[ưƯơƠ]$/.test(I)) return I === I.toUpperCase() ? "W" : up("w");
    return null;
  }
  const fd = feats(D), fi = feats(I);
  const last = I[I.length - 1];
  // Gõ lặp để BỎ dấu (ô+o ⇒ "oo", á+s ⇒ "as", đ+d ⇒ "dd") hoặc UniKey trả lại từ
  // không phải tiếng Việt ("bôk"+space ⇒ "book "): bớt dấu + dài thêm ⇒ phím = chữ cuối.
  if (fi.marks < fd.marks && fi.base.length > fd.base.length && isAscii(last)) return last;
  if (fi.dd > fd.dd) return up("d");
  if (fi.circ > fd.circ) {
    const c = [...I].find(ch => ch.normalize("NFD").includes("\u0302"));
    return c ? up(c.normalize("NFD")[0].toLowerCase()) : null;  // â/ê/ô ⇒ a/e/o
  }
  if (fi.bh > fd.bh) return up("w");
  if (fi.tone !== fd.tone) return up(fi.tone || "z");
  if (/^[ưƯơƠ]$/.test(D) && (last === "w" || last === "W")) return last;   // ư + w ⇒ "w"
  return null;
}

// Phím thật từ keyup (e.code là vị trí phím, e.key có thể là "Process" / "Unidentified").
function physChar(e) {
  if (typeof e.key === "string" && e.key.length === 1 && isAscii(e.key)) return e.key;
  const m = /^Key([A-Z])$/.exec(e.code || "");
  if (m) return e.shiftKey ? m[1] : m[1].toLowerCase();
  const d = /^Digit([0-9])$/.exec(e.code || "");
  if (d) return d[1];
  if (e.code === "Space") return " ";
  return null;
}

function block(e) {
  e.preventDefault();
  e.stopImmediatePropagation();
}

function onKeyDown(e) {
  if (!e.isTrusted) return;                  // phím ta tự phát lại (template gọi onKey giả) — bỏ qua
  let hit = false;
  for (const g of guards) if (g.keydown(e)) hit = true;
  if (hit) block(e);
}
function onKeyUp(e) {
  if (!e.isTrusted) return;
  for (const g of guards) g.keyup(e);
}
function onPointer() { for (const g of guards) g.mirror = ""; }   // bấm chuột ⇒ UniKey cũng quên từ đang gõ

function listen(on) {
  const f = on ? "addEventListener" : "removeEventListener";
  window[f]("keydown", onKeyDown, true);
  window[f]("keyup", onKeyUp, true);
  window[f]("pointerdown", onPointer, true);
  listening = on;
}

export function guardVnTyping({ accepts, insert, backspace, input = null, afterSet = null }) {
  const g = {
    mirror: "",           // chữ UniKey đang tưởng nằm trên màn hình (đuôi dòng)
    down: new Set(),      // phím thật đang giữ (đã thấy keydown)
    pendingBs: 0, bsTimer: 0,
    packet: null,         // { before, work, last, timer, upper, chars }
    lastClosed: null,     // gói vừa đóng — còn ghép lại được nếu mảnh sau tới trễ (máy bận)
    slots: [],            // phím bị nuốt chờ keyup: { ch, seq, t }
    seq: 0,               // đếm hành động chèn/xoá của bộ này — để biết slot có còn là việc cuối
    comp: null,           // bộ gõ kiểu gạch chân: { v, s, e, keys }
    disposed: false
  };

  function flushBs() {
    clearTimeout(g.bsTimer);
    while (g.pendingBs > 0) {
      g.pendingBs--;
      g.mirror = g.mirror.slice(0, -1);
      backspace(); g.seq++;
    }
  }
  function openPacket(e) {
    if (g.packet) return;
    // ⚠️ Máy bận (trang vừa tải, máy yếu): một gói UniKey có thể tới thành 2 mảnh và mảnh
    // đầu đã bị đóng + chèn. Mảnh sau tới trong MERGE ms, chưa có phím thật nào xen giữa
    // ⇒ gỡ việc mảnh đầu đã làm rồi ghép thành một gói (đo bằng e.timeStamp = giờ phím tới).
    const lc = g.lastClosed;
    g.lastClosed = null;
    // ⛔ Chỉ ghép khi mảnh đầu CHƯA có chữ nào ("·" + Backspace rồi bị cắt): gói trọn vẹn
    // thì phím bị nuốt kế tiếp (gõ dồn "ooo", "ddd") là gói MỚI — ghép vào là sai.
    if (lc && !lc.chars && e.timeStamp - lc.last < MERGE && lc.seq === g.seq && !g.pendingBs) {
      if (lc.ch) { backspace(); g.seq++; }
      const i = g.slots.indexOf(lc.slot);
      if (i >= 0) g.slots.splice(i, 1);
      g.packet = { before: lc.before, work: lc.work, last: 0, timer: 0, upper: lc.upper, chars: lc.chars };
      g.mirror = lc.before;
      return;
    }
    g.packet = { before: g.mirror, work: g.mirror, last: 0, timer: 0, upper: false, chars: false };
    // Backspace đang hoãn thuộc về gói này (kiểu EVKey: xoá trước, chữ sau)
    clearTimeout(g.bsTimer);
    g.packet.work = g.packet.work.slice(0, Math.max(0, g.packet.work.length - g.pendingBs));
    g.pendingBs = 0;
  }
  function touchPacket(e) {
    const p = g.packet;
    p.last = e.timeStamp;
    clearTimeout(p.timer);
    p.timer = setTimeout(closePacket, GAP);
  }
  function closePacket() {
    const p = g.packet;
    if (!p) return;
    clearTimeout(p.timer);
    g.packet = null;
    const ch = inferKey(p.before, p.work, p.upper);
    g.mirror = p.work.slice(-MIRROR_MAX);
    if (g.disposed) return;
    if (ch) { insert(ch); g.seq++; }
    const slot = { ch, seq: g.seq, t: performance.now() };
    g.slots.push(slot);
    g.lastClosed = { ...p, ch, seq: g.seq, slot };
  }

  g.keydown = e => {
    if (g.disposed) return false;
    const mine = accepts(e);
    if (isInjected(e)) {
      if (!mine && !g.packet) return false;
      // Ranh giới gói: gói đang mở đã có chữ mà gặp chữ mồi "·" mới, hoặc im > SPLIT ms
      // (tính bằng giờ phím tới) ⇒ phím bị nuốt KẾ TIẾP (gõ dồn "ooo") — đóng gói cũ trước.
      if (g.packet && g.packet.chars && (e.key === "\u00B7" || e.timeStamp - g.packet.last > SPLIT)) closePacket();
      openPacket(e);
      g.packet.work += e.key;
      if (e.key !== "\u00B7") g.packet.chars = true;   // "·" = chữ mồi của gói, chưa phải chữ thật
      // Shift đang giữ / CapsLock bật lúc gói tới ⇒ phím bị nuốt là chữ HOA
      if (e.shiftKey || e.getModifierState?.("CapsLock")) g.packet.upper = true;
      touchPacket(e);
      return true;
    }
    // ⚠️ Ghi nhận MỌI phím thật đã xuống (kể cả Backspace bị hoãn, kể cả lúc không phải
    // phím của mình) — keyup của chúng không được nhận nhầm là "phím bị nuốt".
    if (e.code) g.down.add(e.code);
    if (!mine) { if (!g.packet) g.mirror = ""; return false; }
    if (e.key === "Backspace" && !e.ctrlKey && !e.metaKey && !e.altKey && !e.isComposing) {
      // UniKey luôn gửi Backspace TRƯỚC chữ mới ⇒ gói chưa có chữ nào thì Backspace thuộc gói;
      // gói đã có chữ rồi ⇒ đây là Backspace thật: đóng gói trước.
      if (g.packet && !g.packet.chars) {
        g.packet.work = g.packet.work.slice(0, -1);
        touchPacket(e);
      } else {
        if (g.packet) closePacket();
        g.lastClosed = null;
        g.pendingBs++;
        clearTimeout(g.bsTimer);
        g.bsTimer = setTimeout(flushBs, BS_WAIT);
      }
      return true;
    }
    // phím thật khác — xong mọi việc đang treo trước để giữ đúng thứ tự
    if (g.packet) closePacket();
    g.lastClosed = null;
    flushBs();
    if (e.isComposing || e.keyCode === 229) {
      if (g.comp && !MOBILE) { const ch = physChar(e); if (ch && ch !== " ") g.comp.keys += ch; }
      return false;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) { g.mirror = ""; return false; }
    if (typeof e.key === "string" && e.key.length === 1) g.mirror = (g.mirror + e.key).slice(-MIRROR_MAX);
    else if (e.key !== "Shift" && e.key !== "CapsLock") g.mirror = "";   // mũi tên, Enter, Tab… ⇒ UniKey quên từ
    return false;                                                       // để phím thật đi tiếp như cũ
  };

  g.keyup = e => {
    if (g.disposed) return;
    if (g.down.delete(e.code)) return;       // phím thật bình thường
    if (!e.code) return;                     // keyup của gói bơm vào
    const real = physChar(e);
    if (!real) return;                       // Backspace/Shift… không bao giờ là phím bị nuốt
    if (g.packet) closePacket();
    g.lastClosed = null;
    const now = performance.now();
    while (g.slots.length && now - g.slots[0].t > SLOT_TTL) g.slots.shift();
    const slot = g.slots.shift();
    if (!slot) return;
    if (!slot.ch) { insert(real); g.seq++; return; }
    // Đoán lệch (VNI, cấu hình lạ) — chỉ sửa khi chưa gõ gì sau đó. ⛔ KHÔNG sửa khi chỉ
    // lệch hoa/thường: nhả Shift trước phím ("Wow") thì keyup báo chữ thường — sai.
    if (slot.seq === g.seq && slot.ch.toLowerCase() !== real.toLowerCase()) {
      backspace(); insert(real); g.seq++;
    }
  };

  // Bộ gõ kiểu "gạch chân" (TSF Windows / macOS): không chặn được, nên khi ghép xong
  // thì thay đoạn vừa ghép bằng đúng các phím thật đã bấm.
  const onCompStart = () => {
    g.comp = { v: input.value, s: input.selectionStart ?? input.value.length, e: input.selectionEnd ?? input.value.length, keys: "" };
  };
  const onCompEnd = () => {
    const c = g.comp; g.comp = null;
    if (!c || MOBILE || !c.keys) return;
    setTimeout(() => {
      if (g.disposed) return;
      const tail = c.v.slice(c.e);
      const head = c.v.slice(0, c.s);
      const cur = input.value;
      if (cur.length < head.length + tail.length) return;
      if (!cur.startsWith(head) || !cur.endsWith(tail)) return;   // ô đã bị đổi kiểu khác — không đụng
      // dấu cách chốt từ (nếu bộ gõ chèn vào cùng lúc) — giữ lại
      const gap = cur.slice(head.length, cur.length - tail.length);
      const mid = c.keys + (/\s+$/.exec(gap)?.[0] || "");
      input.value = head + mid + tail;
      const p = head.length + mid.length;
      try { input.setSelectionRange(p, p); } catch { /* ignore */ }
      afterSet && afterSet();
    }, 0);
  };
  if (input) {
    input.addEventListener("compositionstart", onCompStart);
    input.addEventListener("compositionend", onCompEnd);
  }

  guards.add(g);
  if (!listening) listen(true);

  return {
    dispose() {
      g.disposed = true;
      clearTimeout(g.bsTimer);
      if (g.packet) clearTimeout(g.packet.timer);
      if (input) {
        input.removeEventListener("compositionstart", onCompStart);
        input.removeEventListener("compositionend", onCompEnd);
      }
      guards.delete(g);
      if (!guards.size && listening) listen(false);
    }
  };
}
