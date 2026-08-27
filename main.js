// =============================================================
// main.js — AWord HOME, a Google-Drive-style library.
//
//   Top level: two FIXED folders — Activities (games) and Results (kept for
//   student results, filled in the Firebase phase). Neither can be deleted.
//
//   Inside a root: a toolbar [New game* · New folder · Recycle bin · Search ·
//   grid/list view], a breadcrumb, then the sub-folders and acts.
//     * "New game" shows only inside Activities.
//
//   Folder ⁝ menu:  Open in new tab · Copy link · Rename · Move · Duplicate · Delete
//   Act ⁝ menu:     Open in new tab · Copy link · Edit content · Rename · ...
//   Delete -> Recycle bin (per root). Permanent delete happens in the bin.
//
//   LINKS (v0.8.0): every folder/act carries a short NUMBER, so its address is
//   ?r=activities · ?f=12 · ?f=12&a=57 · ?a=57. The address bar follows wherever
//   the teacher is (Back/Forward work), and the same link opens the same item on
//   any computer signed into the teacher's account. Old ?play=/?folder= links
//   still open, and are quietly upgraded to the short form.
// =============================================================

import { startGame } from "./core/engine.js";
import { el, copyText } from "./core/utils.js";
import { icons } from "./core/icons.js";
import { ensureTemplate } from "./core/registry.js";
import { TEMPLATES, templateLabel, templateIcon } from "./core/catalog.js";
import { getDefaultOptions, saveDefaultOptions, buildOptionsControls } from "./core/settings.js";
import { WRONG_SOUND_OPTIONS, getWrongSoundChoice, setWrongSoundChoice, previewWrongSound } from "./core/wrong-sound.js";
import {
  ROOTS, itemName, getItem, getByNum, ensureNumbers, listChildren, pathTo, listFolders, searchItems, listTrash,
  createFolder, saveActivity, renameItem, moveItem, duplicateItem, trashItem, restoreItem, deleteForever,
  emptyTrash, setFolderColor, folderCounts, importBundle, sameName,
  setFolderPinned, listPinned, setPinnedOrder,
  resetCache
} from "./core/store.js";
import {
  listClasses, createClass, renameClass, setStudents, deleteClass,
  // Dot 192 - mergeStudents is no longer imported: the class editor now holds a
  // real row (with its pupil id) per pupil, so ids survive an edit without any
  // name-matching. The helper stays exported from core/classes.js with its own
  // tests; nothing in the app calls it any more.
  parseStudentNames, resetClassesCache, MAX_STUDENTS
} from "./core/classes.js";
// SHOWDOWN (Đợt 155) — the home page needs only the two account-change hooks;
// the mode itself is driven entirely from inside a game (core/engine.js).
import { resetShowdownCache } from "./core/showdown-setup.js";
import { clearPick as clearShowdownPick } from "./core/showdown.js";
// ⭐⭐⭐ Đợt 236 — the full-page durable ledger, reached from its own button on
// this very page (see topbar() below). Unlike the line above, THIS is a real,
// heavy import: main.js already talks to Firestore directly (it IS the
// teacher's signed-in library), so none of Showdown's "keep the student page
// clean" rule from core/HUONG DAN CORE.md applies here.
import { mountShowdownHome } from "./core/showdown-home.js";
import { currentUser, signIn, signOutNow, TEACHER_EMAIL } from "./core/firebase.js";
import { variantsOf, voiceVariantsOf, clueOf, voiceOf, setVoiceOf, variantFullyVoiced } from "./core/content-view.js";
import {
  listAllAssignments, listAssignmentsForAct, updateAssignment, trashAssignment,
  restoreAssignment, deleteAssignmentForever, assignmentNameTaken, hasNewResults,
  getAssignment
} from "./core/assignments.js";
import {
  openAssignmentDetail, openAssignmentEdit, confirmTrashAssignment,
  copyAssignmentLink, copyAssignmentQr,
  // ⭐ Đợt 253 — đường ?giao= mở thẳng form Set assignment (cửa cho myLesson).
  openAssignmentSetup
} from "./core/assignment-ui.js";
// NOTE: no template is imported here. Each game (and its stylesheet) is fetched
// the first time it is actually played or edited — see ensureTemplate() in
// core/registry.js, which reads the one list in core/catalog.js.

const app = document.getElementById("app");

const ROOT_LABEL = { activities: "Activities", results: "Results" };
const FOLDER_SVG = '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor"><path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2Z"/></svg>';
const DOTS = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>';
const PREVIEW_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
const FOLDER_DEFAULT_COLOR = "#f5b13b";
// Modern 8-color set for the folder-color picker.
const FOLDER_COLORS = ["#ef4444", "#f97316", "#f5b13b", "#22c55e", "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899"];

const state = {
  view: "top",          // "top" | "folder" | "search" | "trash" | "showdown-home"
  root: null,           // "activities" | "results"
  folderId: null,       // current folder (null = root of the tree)
  mode: localStorage.getItem("aword-view") || "grid",   // "grid" | "list"
  query: "",
  user: null,           // the signed-in teacher (null = signed out)
  showdownClassId: ""   // ⭐ Đợt 236 — which class "showdown-home" is open on
};
// The live handle from mountShowdownHome() (core/showdown-home.js), so leaving
// the page can tear down its class-picker listener/fullscreen bookkeeping
// straight away rather than only via that file's own MutationObserver
// fallback (belt-and-braces, same posture as core/showdown-setup.js's panel).
let showdownHomeHandle = null;
// ⭐ Đợt 237 — set by topbar() whenever it builds the gold Showdown icon, so
// core/showdown-home.js can morph THAT SAME button into the ANALYSE pill
// instead of owning a second one on its own toolbar. null on any page that
// never built the icon (there is nothing to morph there).
let sdHomeBtnSetAnalyse = null;

// ⭐⭐ Đợt 247 — CẦU THƯ VIỆN CHO myLesson (`window.__awordLib`).
// myLesson (app Electron soạn bài) mở trang này trong một <webview> đã đăng
// nhập Google của thầy, rồi gọi các hàm dưới qua executeJavaScript để:
//   1. tìm THƯ MỤC act theo mã bài (vd "LSA2-S2.T1.P3-4-5" — tên thư mục của
//      thầy CHỨA mã + có thể kèm chữ, nên so kiểu "chứa", không so bằng);
//   2. liệt kê ACT trong thư mục đó (để thầy chọn ENG1/QUIZ1... từng ngăn).
// Mọi hàm tự trả {ok:false, loi:"chua-dang-nhap"} khi chưa đăng nhập — myLesson
// dựa vào đó để hiện màn "bấm để đăng nhập AWord" thay vì chết lặng.
// ⛔ KHÔNG thêm hàm GHI vào đây — tạo assignment đi qua đường bridge `giaoBai`
// (core/engine.js) để form Set assignment THẬT của AWord vẫn là nơi duy nhất
// quyết định options/optVer/xếp thư mục Results.
window.__awordLib = {
  daDangNhap: () => !!state.user,
  async timThuMuc(chuoi) {
    if (!state.user) return { ok: false, loi: "chua-dang-nhap" };
    const q = String(chuoi || "").trim().toLowerCase();
    if (!q) return { ok: true, ds: [] };
    try {
      const folders = await listFolders("activities");
      const khop = folders.filter(f => String(f.name || "").toLowerCase().includes(q));
      const ds = [];
      for (const f of khop) {
        // đường dẫn đầy đủ để thầy phân biệt khi 2 thư mục trùng tên
        const chain = await pathTo(f.id).catch(() => []);
        ds.push({ id: f.id, num: f.num ?? null, ten: f.name || "",
                  duongDan: chain.map(x => x.name).join(" / ") });
      }
      return { ok: true, ds };
    } catch (e) { return { ok: false, loi: e.message || "loi" }; }
  },
  async lietKeAct(folderId) {
    if (!state.user) return { ok: false, loi: "chua-dang-nhap" };
    try {
      const items = await listChildren("activities", folderId || null);
      return { ok: true, ds: items.filter(n => n.kind === "act")
        .map(n => ({ id: n.id, num: n.num ?? null, ten: n.title || "", type: n.type })) };
    } catch (e) { return { ok: false, loi: e.message || "loi" }; }
  },
};

init();

// The library lives in the cloud and is private, so nothing renders until the
// teacher is signed in (the teacher chose "require sign-in", 19/7/2026).
async function init() {
  let user = null;
  try {
    user = await currentUser();
  } catch (e) {
    renderLogin("Could not reach Firebase. Check your internet connection.");
    return;
  }
  if (!user) { renderLogin(); return; }
  state.user = user;

  try {
    await maybeSeed();
    await ensureNumbers();      // one-time: give older items their link numbers
  } catch (e) {
    renderLogin("Could not load your library: " + e.message);
    return;
  }

  window.addEventListener("popstate", () => routeFromLocation());
  // ⭐ Đợt 221 — NO resize listener any more. Đợt 218b needed one because the
  // panel's row span was a number this file computed and had to recompute when
  // myActivity changed its column count under it. The rail is plain flex now:
  // the browser reflows it, and there is nothing left for JS to keep in step.
  await routeFromLocation();
}

// ---------------- shareable links & the address bar (v0.8.0) ----------------
// Folders and acts are addressed by their SHORT NUMBER, so a link can be copied
// between the teacher's computers (same Google account) and land in the same
// place:  ?r=activities  ·  ?f=12  ·  ?f=12&a=57  ·  ?a=57 (act outside folders)
// The old ?play=<id> / ?folder=<root>~<id> links still work.
function baseUrl() { return location.origin + location.pathname; }

async function linkFor(node) {
  const p = new URLSearchParams();
  if (node.kind === "folder") {
    p.set("f", node.num);
  } else {
    if (node.parentId) {
      const parent = await getItem(node.parentId);
      if (parent && typeof parent.num === "number") p.set("f", parent.num);
    }
    p.set("a", node.num);
  }
  return `${baseUrl()}?${p.toString()}`;
}

function setUrl(url, replace) {
  if (url === location.href) return;
  history[replace ? "replaceState" : "pushState"]({}, "", url);
}

// Read the address bar and show whatever it points at (also used by Back/Forward).
// `fromUrl: true` stops the navigation helpers from pushing the address again —
// we are following the address bar, not driving it.
async function routeFromLocation() {
  const p = new URLSearchParams(location.search);
  const opts = { fromUrl: true };

  // ⭐ Đợt 247 — ?bao=<mã bài giao>: mở THẲNG bảng kết quả assignment (đúng
  // pop-up openAssignmentDetail của Results) trên nền trang chủ. Đường cho
  // myLesson: bấm đúp icon tích xanh bên đó = nạp webview vào URL này. Mã sai/
  // đã xoá thì rơi xuống trang chủ như thường, không nổ.
  if (p.get("bao")) {
    const a = await getAssignment(p.get("bao")).catch(() => null);
    if (a && !a.trashed) {
      goTop(opts);
      openAssignmentDetail(a, { onChanged: () => {} });
      return;
    }
  }

  // ⭐⭐ Đợt 253 — ?giao=<num act>&lop=<lớp>&td=<tiêu đề>: mở THẲNG form Set
  // assignment của act đó trên NỀN TRỐNG — cửa cho myLesson v1.14.0. Đường cũ
  // (myLesson nạp ?a=<num> rồi gọi bridge `giaoBai`) bày cả trang game ra sau
  // lưng form; thầy chốt 24/8: pop-up bên myLesson phải trông y hệt form Set
  // assignment, không được thấy trang game. Đường này KHÔNG đụng ?a=/bridge —
  // myActivity và mọi link cũ giữ nguyên.
  //   · form là openAssignmentSetup THẬT trên act GỐC từ thư viện (giữ nguyên
  //     luật `sourceAct` Đợt 250 + marker kèm bộ nghĩa Đợt 252);
  //   · thầy lỡ đóng form thì nền có đúng một nút SET ASSIGNMENT mở lại;
  //   · act sai / template không giao được → rơi xuống trang chủ như ?bao= sai
  //     mã, không chết trắng trong webview của myLesson.
  if (p.get("giao")) {
    const node = await getByNum(p.get("giao")).catch(() => null);
    if (node && node.kind === "act") {
      let tpl = null;
      try { tpl = await ensureTemplate(node.type); } catch (e) { /* rơi xuống trang chủ */ }
      if (tpl && !tpl.noAssignment) {
        document.body.classList.add("aw-giao-mode");
        // ⭐ Đợt 254 — &khung=1: CHẾ ĐỘ NHÚNG cho pop-up myLesson v1.15.0. Vỏ
        // thẻ trắng + đầu đề + khối TIÊU ĐỀ do myLesson vẽ ngay trên webview,
        // nên bên này pop-up GỐC (form Set assignment, màn QR) vẽ PHẲNG TRÀN
        // MÉP — không nền xám, không bo góc, không đầu đề riêng (CSS
        // body.aw-khung-mode + .aw-as-goc, đánh dấu trong openModal của
        // core/assignment-ui.js). Đóng pop-up gốc mà không mọc pop-up gốc mới
        // là bắn marker MYACT:AW:GIAO:DONG để myLesson đóng cả pop-up bên đó.
        // Không &khung= ⇒ y hệt Đợt 253 — myActivity/link cũ không đổi gì.
        if (p.get("khung")) document.body.classList.add("aw-khung-mode");
        const moForm = () => openAssignmentSetup(node, {
          lop: p.get("lop") || "",
          tieuDe: p.get("td") || "",
          onCreated: (a, ct) => {
            // Cùng một marker với đường bridge (core/engine.js giaoBai) — myLesson
            // chỉ nghe MỘT chỗ. ⛔ Đừng đổi tên marker / bỏ 2 khoá cũ code+title.
            try {
              console.log("MYACT:AW:ASSIGN:" + JSON.stringify({
                code: a.code, title: a.title,
                bo: (ct && ct.bo) || "", boTen: (ct && ct.boTen) || "",
                mauType: (ct && ct.mauType) || a.activityType || "",
                mauTen: (ct && ct.mauTen) || "",
              }));
            } catch (_) {}
          },
        });
        app.innerHTML = "";
        const nen = el("div", "aw-giao-nen");
        const nut = el("button", "aw-giao-reopen", "SET ASSIGNMENT");
        nut.type = "button";
        nut.onclick = moForm;
        nen.append(nut);
        app.append(nen);
        moForm();
        return;
      }
    }
  }

  const actKey = p.get("a") || p.get("play");
  if (actKey) {
    const node = p.get("a") ? await getByNum(p.get("a")) : await getItem(p.get("play"));
    if (node && node.kind === "act") {
      // A deep-linked act (?a= / ?play=) lands here on a FRESH page, so its
      // template is not in the registry yet — load it first, exactly like
      // playAct() does. Đợt 33 (v0.9.7) added ensureTemplate() everywhere a
      // game starts but MISSED this deep-link route, so any non-Quiz act opened
      // by URL threw `Chưa có game loại "..." trong registry` and rendered
      // blank. (This is how myActivity's dual board mirrors an act into the
      // right pane, which is why only the right half went white.)
      try { await ensureTemplate(node.type); }
      catch (e) { toast(`${templateLabel(node.type)} — could not load`); return goTop(opts); }
      state.view = "play";
      if (!p.get("a")) setUrl(await linkFor(node), true);   // upgrade an old link in place
      startGame(app, node, { onExit: goTop });
      return;
    }
  }
  if (p.get("sd")) return openShowdownHome({ fromUrl: true, classId: p.get("c") || "" });
  if (p.get("f")) {
    const node = await getByNum(p.get("f"));
    if (node && node.kind === "folder") return enterFolder(node.root, node.id, opts);
  }
  if (p.get("r") && ROOTS.includes(p.get("r"))) return openRoot(p.get("r"), opts);
  if (p.get("folder")) {                                    // legacy link
    const [root, fid] = p.get("folder").split("~");
    if (ROOTS.includes(root)) {
      const node = fid ? await getItem(fid) : null;
      setUrl(node ? await linkFor(node) : `${baseUrl()}?r=${root}`, true);
      return enterFolder(root, fid || null, opts);
    }
  }
  goTop(opts);
}

// Point the address bar at wherever the library currently is.
async function syncUrl(replace) {
  if (state.view === "showdown-home") {
    const p = new URLSearchParams();
    p.set("sd", "1");
    if (state.showdownClassId) p.set("c", state.showdownClassId);
    return setUrl(`${baseUrl()}?${p.toString()}`, replace);
  }
  if (state.view === "top") return setUrl(baseUrl(), replace);
  if (state.folderId) {
    const node = await getItem(state.folderId);
    if (node) return setUrl(await linkFor(node), replace);
  }
  if (state.root) setUrl(`${baseUrl()}?r=${state.root}`, replace);
}

async function copyLinkFlow(node) {
  const url = await linkFor(node);
  const ok = await copyText(url);
  toastMsg(ok ? "Link copied" : url);
}


// ---------------- sign-in screen ----------------
function renderLogin(errorMsg) {
  app.innerHTML = "";
  const wrap = el("div", "aw-lib");
  const bar = el("div", "aw-appbar");
  bar.append(logo(false));
  wrap.append(bar);

  const card = el("div", "aw-login");
  card.append(el("div", "aw-login-title", "Your games, on any computer"));
  card.append(el("div", "aw-login-sub",
    "Sign in to open your library of folders and activities."));

  const btn = el("button", "aw-login-btn");
  btn.type = "button";
  btn.append(el("span", "aw-login-g", GOOGLE_G), el("span", null, "Sign in with Google"));
  btn.onclick = async () => {
    btn.disabled = true;
    err.textContent = "";
    try {
      await signIn();
      resetCache();
      resetClassesCache();   // classes keep their own cache — drop it too, or the
                             // previous account's class rolls would linger
      // Đợt 155 — and the same for Showdown: its team table is another account's
      // data, and the team THIS browser had ticked names pupils who are not in
      // the new account's classes at all.
      resetShowdownCache();
      clearShowdownPick();
      await init();
    } catch (e) {
      btn.disabled = false;
      if (e.code === "auth/popup-closed-by-user" || e.code === "auth/cancelled-popup-request") return;
      err.textContent = e.code === "aw/not-teacher" ? e.message : (e.message || "Sign-in failed.");
    }
  };
  card.append(btn);

  const err = el("div", "aw-login-err", errorMsg ? escapeHtml(errorMsg) : "");
  card.append(err);
  card.append(el("div", "aw-login-note", `Only ${escapeHtml(TEACHER_EMAIL)} can open this library.`));

  wrap.append(card);
  wrap.append(footer());
  app.append(wrap);
  requestAnimationFrame(() => sizeBrand(wrap));
}

const GOOGLE_G = `<svg viewBox="0 0 48 48" width="20" height="20"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>`;

// (v0.9.2) The one-off "bring your old offline library online" prompt has been
// REMOVED. The move happened on 19/7/2026 and nothing writes to localStorage any
// more, so the question could only ever nag about leftovers. Anything still in a
// browser's old storage stays there untouched; core/store.js keeps
// importLocalLibrary() so it can be run by hand from the console if ever needed.

// Small floating confirmation used by the library pages.
// `.aw-lib-toast` starts at opacity 0 — it only shows once `.is-on` is added.
function toastMsg(msg) {
  const t = el("div", "aw-lib-toast", escapeHtml(msg));
  document.body.append(t);
  requestAnimationFrame(() => t.classList.add("is-on"));
  setTimeout(() => { t.classList.remove("is-on"); setTimeout(() => t.remove(), 250); }, 3000);
}

function escapeHtml(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function maybeSeed() {
  // seed the sample quiz the first time the library is ever empty
  const anyActivities = await listChildren("activities", null);
  const anyFolders = (await listFolders("activities")).length;
  if (anyActivities.length === 0 && anyFolders === 0) {
    const { activity } = await import("./templates/quiz/sample-quiz.js");
    await saveActivity(activity, { root: "activities", parentId: null });
  }
}

// ---------------- render dispatch ----------------
async function render() {
  closeMenu();
  // ⭐ Đợt 236 — tear the showdown-home page down explicitly BEFORE wiping it
  // out from under itself: its own MutationObserver would catch this a beat
  // later regardless (core/showdown-home.js's watchForClose), but there is no
  // reason to wait for that when we are the ones doing the removing.
  if (showdownHomeHandle) { showdownHomeHandle.dispose(); showdownHomeHandle = null; }
  app.innerHTML = "";
  if (state.view === "showdown-home") return renderShowdownHome();
  if (state.view === "top") return renderTop();
  return renderInside();
}
function goTop(opts = {}) {
  state.view = "top"; state.root = null; state.folderId = null; state.query = "";
  if (!opts.fromUrl) syncUrl();
  render();
}

// ---------------- ⭐⭐⭐ Đợt 236 — SHOWDOWN home (the full-page ledger) --------
function openShowdownHome(opts = {}) {
  state.view = "showdown-home";
  state.root = null; state.folderId = null; state.query = "";
  if (opts.classId !== undefined) state.showdownClassId = opts.classId;
  if (!opts.fromUrl) syncUrl();
  render();
}
function renderShowdownHome() {
  // ⭐ Đợt 236 — `.aw-sdh-page` is a WIDER exception to `.aw-lib`'s usual
  // 1040px (core/app.css): three real columns (day/month rail, tiles, and in
  // CHOOSING a fourth ANALYSE column) need more room than a two-column library
  // page ever has, and this screen is a deliberate destination, not something
  // reached mid-browse — a bit more breathing room here does not disturb the
  // library's own width anywhere else.
  const wrap = el("div", "aw-lib aw-sdh-page");
  wrap.append(topbar(false));
  const mount = el("div");
  wrap.append(mount);
  wrap.append(footer());
  app.append(wrap);
  requestAnimationFrame(() => sizeBrand(wrap));
  showdownHomeHandle = mountShowdownHome(mount, {
    classId: state.showdownClassId,
    toast: toastMsg,
    onClassChange: (classId) => {
      state.showdownClassId = classId;
      syncUrl();
    },
    onChoosingChange: (on) => { sdHomeBtnSetAnalyse?.(on); }
  });
}

// ---------------- top level: two fixed roots ----------------
function renderTop() {
  const wrap = el("div", "aw-lib");
  wrap.append(topbar(false));   // home: logo + settings only (no Activities/Results nav)

  const grid = el("div", "aw-roots");
  ROOTS.forEach(root => {
    const card = el("button", "aw-root-card");
    card.type = "button";
    card.onclick = () => openRoot(root);
    const ic = el("div", "aw-root-icon", FOLDER_SVG);
    card.append(ic, el("div", "aw-root-name", ROOT_LABEL[root]));
    grid.append(card);
  });
  wrap.append(grid);
  wrap.append(footer());
  app.append(wrap);
}
function openRoot(root, opts = {}) {
  state.view = "folder"; state.root = root; state.folderId = null; state.query = "";
  if (!opts.fromUrl) syncUrl();
  render();
}

// ---------------- inside a root (folder / search / trash) ----------------
async function renderInside() {
  // ⭐⭐ Đợt 218b — the Quick access panel is NOT a column beside the page any
  // more: it is the FIRST CELL OF THE CARD GRID (thầy 20/8/2026, "vị trí thay
  // thế cho thư mục đầu tiên về điểm cao nhất … không gian của thư mục còn 3
  // cột thôi"). So the page keeps its original 1040px and its four columns —
  // the panel simply takes column 1 and the cards get the other three.
  //
  // ⭐ Because the panel is now part of the grid, NOTHING here needs a media
  // query: `repeat(auto-fill, minmax(200px, 1fr))` already drops a column at a
  // time as the window narrows, and the panel — being the first item — keeps
  // its place while the cards fall to the rows below. That IS the teacher's
  // "ưu tiên hiển thị khung quick access hơn", got for free.
  const wrap = el("div", "aw-lib");

  // header: logo (left) + settings/Activities/Results cluster (right)
  wrap.append(topbar(true));
  wrap.append(await breadcrumb());
  wrap.append(toolbar());

  const body = el("div", "aw-fm-body");
  wrap.append(body);
  wrap.append(footer());
  app.append(wrap);

  let items;
  if (state.view === "trash") items = await listTrash(state.root);
  else if (state.view === "search") items = await searchItems(state.root, state.query);
  else items = await listChildren(state.root, state.folderId);

  // RESULTS shows the assignments themselves — there is no copy of them in the
  // library, so what you see here IS the strip under the act (v0.9.0).
  const assignments = state.root === "results" ? await assignmentsForView() : await loadAssignmentsForDots();

  if (!items.length && !assignments.length) {
    // ⭐ Đợt 192 (thầy: "Với 1 thư mục trống, thay vì hiện dòng This folder is
    // empty thì hiển thị ô Import file để kéo thẳng file vào được luôn") — an
    // empty folder is not a fact to report, it is a job waiting to be done, and
    // the job is almost always "put a lesson in it". The zone is the SAME
    // `.aw-imp-drop` the Import dialog uses, deliberately: it already carries
    // the drag-over state and the teacher has learned that shape.
    // ⚠ ONLY for a real, empty LIBRARY folder. Trash, a search with no hits and
    // an empty Results folder are all still statements of fact — dropping a
    // lesson file into the recycle bin means nothing, and offering it there
    // would be an invitation to a place that cannot accept it.
    // Đợt 218b — an empty view still shows the panel. It is the one thing on
    // this screen that can take the teacher somewhere; hiding it exactly when
    // there is nothing else here would be backwards.
    if (state.view === "trash" || state.view === "search" || state.root === "results") {
      body.append(await withQuickAccess(el("div", "aw-fm-empty",
        state.view === "trash" ? "Recycle bin is empty."
        : state.view === "search" ? `No results for “${escapeText(state.query)}”.`
        : "No assignments here yet. Give one out from an activity.")));
      return;
    }
    const drop = el("div", "aw-imp-drop aw-fm-emptydrop",
      `<div class="aw-imp-drop-icon">${IMP_UPLOAD_SVG}</div>` +
      `<div class="aw-imp-drop-title">Drag a lesson file here, or <b>click to browse</b></div>` +
      `<div class="aw-imp-drop-sub">.xlsm · .xlsx · .xls</div>`);
    // Click opens the ordinary Import dialog (its own drop zone does the
    // browsing); a file dropped HERE goes straight in as that dialog's
    // `initialFile`, so the teacher gets the same review-and-pick screen either
    // way — nothing is ever imported without being shown first.
    drop.onclick = () => importFlow();
    ["dragenter", "dragover"].forEach(ev =>
      drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("is-over"); }));
    ["dragleave", "dragend"].forEach(ev =>
      drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove("is-over"); }));
    drop.addEventListener("drop", e => {
      e.preventDefault();
      drop.classList.remove("is-over");
      const f = e.dataTransfer && e.dataTransfer.files[0];
      if (f) importFlow(f);
    });
    body.append(await withQuickAccess(drop));
    return;
  }

  // needed to roll the "new results" dot up from an assignment to its folders
  const resultFolders = state.root === "results" ? await listFolders("results") : [];

  const list = el("div", state.mode === "grid" ? "aw-fm-grid" : "aw-fm-list");
  for (const node of items) {
    let card;
    if (state.view === "trash") card = trashCard(node);
    else if (node.kind === "folder") {
      card = folderCard(node, await folderCounts(node.id), assignmentCountIn(node.id),
                        state.root === "results" && folderHasNews(node.id, resultFolders));
    } else card = actCard(node);
    list.append(card);
  }
  if (state.root === "results") {
    assignments.forEach(a => list.append(state.view === "trash" ? trashAssignmentCard(a) : assignmentCard(a)));
  }
  body.append(await withQuickAccess(list));
}

// ⭐ Đợt 221 — the ONE layout both view modes (and every empty state) use: a
// fixed Quick access rail on the left, everything else in a box of its own on
// the right. Before this, GRID view put the panel inside the card grid and LIST
// view wrapped it beside the rows — two shapes, and only the list one kept the
// promise thầy asked for.
async function withQuickAccess(content) {
  const wrapRow = el("div", "aw-fm-withqa");
  wrapRow.append(await quickAccess(), content);
  content.classList.add("aw-fm-qamain");
  return wrapRow;
}

// In ACTIVITIES we do not show assignments, but we still want the "new results"
// dot on the acts that have some, so the list is fetched (one query) anyway.
async function loadAssignmentsForDots() {
  try { assignmentCache = await listAllAssignments({ includeTrashed: true }); }
  catch (e) { assignmentCache = []; }
  return [];
}

// A small red dot in the top-right corner of a card, like a phone notification.
function newDot(title) {
  const dot = el("span", "aw-newdot");
  dot.title = title || "New results";
  return dot;
}

// Does anything inside this folder (at any depth) have new results?
function folderHasNews(folderId, allFolders) {
  const inside = new Set([folderId]);
  let grew = true;
  while (grew) {
    grew = false;
    allFolders.forEach(f => {
      if (!inside.has(f.id) && inside.has(f.parentId ?? null)) { inside.add(f.id); grew = true; }
    });
  }
  return assignmentCache.some(a => !a.trashed && inside.has(a.folderId ?? null) && hasNewResults(a));
}

function actHasNews(actId) {
  return assignmentCache.some(a => !a.trashed && a.activityId === actId && hasNewResults(a));
}

// ---------------- assignments inside Results ----------------
// One fetch per render, cached for the counting helpers below.
let assignmentCache = [];

async function assignmentsForView() {
  try {
    assignmentCache = await listAllAssignments({ includeTrashed: true });
  } catch (e) {
    assignmentCache = [];
    return [];
  }
  const byName = (a, b) => String(a.title || "").toLowerCase().localeCompare(String(b.title || "").toLowerCase());
  if (state.view === "trash") return assignmentCache.filter(a => a.trashed).sort((a, b) => (b.trashedAt || 0) - (a.trashedAt || 0));
  if (state.view === "search") {
    const q = state.query.trim().toLowerCase();
    return assignmentCache.filter(a => !a.trashed && String(a.title || "").toLowerCase().includes(q)).sort(byName);
  }
  return assignmentCache.filter(a => !a.trashed && (a.folderId ?? null) === (state.folderId ?? null)).sort(byName);
}

// How many assignments sit anywhere inside this Results folder (for the badge).
function assignmentCountIn(folderId) {
  if (state.root !== "results") return 0;
  return assignmentCache.filter(a => !a.trashed && (a.folderId ?? null) === folderId).length;
}

// ---------------- QUICK ACCESS (Đợt 218 · reshaped in 218b) ----------------
// The left-hand panel of pinned folders, shaped like Windows Explorer's "Quick
// access": ONLY the folders the teacher pinned, plus their children under an
// arrow — never the whole tree (thầy chốt 20/8/2026).
//
// ⭐⭐ Đợt 221 — IT IS A COLUMN OF ITS OWN, not a cell of the card grid.
// Đợt 218b made it the grid's first item, which put it in the right place but
// only for as long as it was tall enough: a grid item spans WHOLE ROWS, so the
// moment the panel ran out of rows the cards wrapped back underneath it and sat
// in its column. Thầy 21/8/2026: *"Thư mục không bao giờ nằm cùng không gian
// cột của QUICK ACCESS"*. A flex rail is the only shape that can promise that —
// the cards get their own box and physically cannot enter this one.
//
// ⭐ THE WHOLE OF `sizeQuickAccess()` WENT WITH IT, and good riddance: the row
// span it computed was the app's one documented case of a function reading its
// own output (a 3-pin panel ratcheted taller on every recalculation). Nothing
// measures anything now — flex does it — so the resize listener went too.
// ⚠️ Thầy chốt *"luôn giữ cột bên trái"*: there is still no @media rule and the
// rail never folds away, however narrow the window gets in myActivity.
//
// A folder gets in through its ⁝ menu, and the pin lives ON THE FOLDER NODE, so
// the same panel comes up on all three machines (core/store.js setFolderPinned).
// ⚠️ Costs NO extra Firestore read: listPinned() and listFolders() both read the
// in-memory cache the library page has already loaded.
const QA_OPEN_KEY = "aword-qa-open";   // which branches are unfolded — per MACHINE (a screen belongs to a machine, not to an account)

// ---- RECENT (Đợt 221) — the bottom half of the panel -----------------------
// The folders the teacher OPENED most recently (thầy chốt 21/8/2026, over
// "recently changed"). Per MACHINE, in localStorage, for the same reason the
// unfolded-branch set is: opening a folder is a thing that happens at a screen,
// and writing it to Firestore would cost a document write on every single click
// through the library — the one gesture that must stay instant.
// ⚠️ MORE ARE STORED THAN ARE SHOWN. A folder that has since been deleted (or
// belongs to the other root) is filtered out at render time, so keeping only 5
// would show four rows, then three. 16 is deep enough that the list stays full.
const QA_RECENT_KEY = "aword-qa-recent";
const QA_RECENT_SHOW = 5;
const QA_RECENT_KEEP = 16;

function qaRecentList() {
  try {
    const raw = JSON.parse(localStorage.getItem(QA_RECENT_KEY));
    return Array.isArray(raw) ? raw.filter(x => x && x.id && x.root) : [];
  } catch { return []; }
}
function qaPushRecent(root, id) {
  if (!root || !id) return;                       // the root of a tree is not a folder
  const next = [{ root, id }, ...qaRecentList().filter(x => !(x.id === id && x.root === root))]
    .slice(0, QA_RECENT_KEEP);
  try { localStorage.setItem(QA_RECENT_KEY, JSON.stringify(next)); } catch { /* a list is not worth an error */ }
}
function qaClearRecent() {
  try { localStorage.removeItem(QA_RECENT_KEY); } catch { /* ignore */ }
}

function qaOpenSet() {
  try {
    const raw = JSON.parse(localStorage.getItem(QA_OPEN_KEY));
    return new Set(Array.isArray(raw) ? raw : []);
  } catch { return new Set(); }
}
function qaSaveOpen(set) {
  try { localStorage.setItem(QA_OPEN_KEY, JSON.stringify([...set])); } catch { /* a panel is not worth an error */ }
}

async function quickAccess() {
  const aside = el("aside", "aw-qa");
  aside.append(el("div", "aw-qa-head", '<span class="aw-qa-title">Quick access</span>'));

  const list = el("div", "aw-qa-list");
  aside.append(list);

  // ONE snapshot of the folder table feeds both halves of the panel.
  const all = await listFolders(state.root);
  const byId = new Map(all.map(f => [f.id, f]));
  const pinned = await listPinned(state.root);

  if (!pinned.length) {
    // An empty panel must SAY how to fill it — the pin lives in a folder card's
    // ⁝ menu, which is not a place anyone would guess at.
    list.append(el("div", "aw-qa-empty",
      "No folders pinned yet.<br>Open a folder's ⁝ menu and choose <b>Pin to Quick access</b>."));
  } else {
    const kidsOf = new Map();
    all.forEach(f => {
      const k = f.parentId ?? null;
      if (!kidsOf.has(k)) kidsOf.set(k, []);
      kidsOf.get(k).push(f);
    });

    // The chain from a pinned folder down to the one the teacher is standing in.
    // Those branches open by themselves, so the panel always shows WHERE YOU ARE
    // instead of making the teacher re-open the path after every click.
    const trail = new Set();
    for (let n = state.folderId ? byId.get(state.folderId) : null; n; n = n.parentId ? byId.get(n.parentId) : null) {
      trail.add(n.id);
    }

    const open = qaOpenSet();
    const ctx = { kidsOf, trail, open, pinnedRoot: true, list };
    pinned.forEach(node => list.append(qaBranch(node, 0, ctx)));
  }

  aside.append(qaRecentSection(byId));
  qaAcceptFiles(aside);
  return aside;
}

// ⭐ Đợt 221 — a lesson file dropped ANYWHERE on the panel opens Import (thầy:
// *"Thả bất cứ chỗ nào trong Quick Access đều nhận import file, tạo ra đâu thì
// tùy tên file và điều chỉnh trong import"*).
//
// ⚠️ IT CANNOT COLLIDE WITH THE CARD DRAG on the rows inside. `makeDropTarget`
// bails out the instant `draggingId` is null, which it always is for a file
// coming from outside the browser; and this one bails out unless the drag
// actually carries files. The two are mutually exclusive by test, not by luck.
// ⚠️ The row listeners deliberately do NOT stop propagation, so a file let go
// exactly on top of a pinned row still bubbles up to here. Without that, the
// rows would be dead patches in the middle of a drop zone.
function qaAcceptFiles(aside) {
  const hasFiles = e => !!(e.dataTransfer && [...(e.dataTransfer.types || [])].includes("Files"));
  ["dragenter", "dragover"].forEach(ev => aside.addEventListener(ev, e => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    aside.classList.add("is-fileover");
  }));
  ["dragleave", "dragend"].forEach(ev => aside.addEventListener(ev, e => {
    // ⚠️ dragleave fires when the pointer crosses onto a CHILD row too, which
    // would flicker the highlight off and on across the whole panel. Only a
    // pointer that has actually left the panel's box counts.
    if (ev === "dragleave" && aside.contains(e.relatedTarget)) return;
    aside.classList.remove("is-fileover");
  }));
  aside.addEventListener("drop", e => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    aside.classList.remove("is-fileover");
    const f = e.dataTransfer.files[0];
    // `fromRoot` — thầy listed a Quick access drop as the exception to
    // "tạo ở thư mục đang đứng": it builds the tree from the top of Activities
    // whatever folder happens to be open behind the panel.
    if (f) importFlow(f, { fromRoot: true });
  });
}

// ---- the bottom half: RECENT (Đợt 221) --------------------------------------
// ⚠️ Deliberately NOT half the panel's height. Thầy asked for "nửa dưới", and
// the honest reading of that is "the lower area", not a 50/50 split: five rows
// pinned to the bottom edge of a tall panel would leave a hole in the middle,
// and on a short panel a hard half would crush both lists. The pinned list above
// takes the space it needs and this sits under it, capped at five rows.
function qaRecentSection(byId) {
  const box = el("div", "aw-qa-recent");
  const head = el("div", "aw-qa-rhead");
  head.append(el("span", "aw-qa-title", "Recent"));

  // A folder that has been deleted since, or that belongs to the other tree, is
  // simply not there any more — drop it rather than drawing a dead row.
  const rows = qaRecentList()
    .filter(x => x.root === state.root)
    .map(x => byId.get(x.id))
    .filter(Boolean)
    .slice(0, QA_RECENT_SHOW);

  if (rows.length) {
    const clear = el("button", "aw-qa-rclear", icons.trash);
    clear.type = "button"; clear.title = "Clear recent list";
    clear.setAttribute("aria-label", clear.title);
    clear.onclick = () => { qaClearRecent(); render(); };
    head.append(clear);
  }
  box.append(head);

  const list = el("div", "aw-qa-rlist");
  if (!rows.length) {
    box.classList.add("is-empty");
    list.append(el("div", "aw-qa-empty", "Folders you open show up here."));
  }
  rows.forEach(node => {
    const row = el("div", "aw-qa-row" + (node.id === state.folderId ? " is-current" : ""));
    row.style.paddingLeft = "6px";
    const label = el("button", "aw-qa-label");
    label.type = "button";
    const ic = el("span", "aw-qa-ficon", FOLDER_SVG);
    ic.style.color = node.color || FOLDER_DEFAULT_COLOR;
    label.append(ic, el("span", "aw-qa-name", escapeText(itemName(node))));
    label.onclick = () => enterFolder(node.root, node.id);
    row.append(label);
    // Same drop rule as a pinned row: drag a card onto it to move the card there.
    // ⚠️ No `makePinDraggable` here — this list's order is a fact (when you last
    // opened them), not an arrangement, so there is nothing to rearrange.
    makeDropTarget(row, () => node.id, node);
    list.append(row);
  });
  box.append(list);
  return box;
}

// One folder in the panel: its row, plus a container for its children that is
// filled the FIRST time the branch is unfolded. Building every descendant up
// front would walk the teacher's whole tree on every render, for rows nobody
// has asked to see.
function qaBranch(node, depth, ctx) {
  const branch = el("div", "aw-qa-branch");
  branch.dataset.id = node.id;
  const kidNodes = ctx.kidsOf.get(node.id) || [];
  const row = el("div", "aw-qa-row" + (node.id === state.folderId ? " is-current" : ""));
  row.style.paddingLeft = (6 + depth * 14) + "px";

  const arrow = el("button", "aw-qa-arrow", kidNodes.length ? icons.next : "");
  arrow.type = "button";
  if (kidNodes.length) {
    arrow.title = "Show sub-folders";
    arrow.setAttribute("aria-label", arrow.title);
  } else {
    // A leaf keeps the SPACE of an arrow, so every name in the panel starts on
    // the same vertical line as its siblings.
    arrow.disabled = true;
    arrow.classList.add("is-blank");
  }

  const label = el("button", "aw-qa-label");
  label.type = "button";
  const ic = el("span", "aw-qa-ficon", FOLDER_SVG);
  ic.style.color = node.color || FOLDER_DEFAULT_COLOR;
  label.append(ic, el("span", "aw-qa-name", escapeText(itemName(node))));
  label.onclick = () => enterFolder(node.root, node.id);

  row.append(arrow, label);
  if (ctx.pinnedRoot) {
    // Unpin sits on the row itself: the panel is where a stale pin gets
    // noticed, and sending the teacher back to the folder card to undo it
    // would be a trip for nothing.
    const unpin = el("button", "aw-qa-unpin", icons.pin);
    unpin.type = "button"; unpin.title = "Remove from Quick access";
    unpin.setAttribute("aria-label", unpin.title);
    unpin.onclick = async e => {
      e.stopPropagation();
      await setFolderPinned(node.id, false);
      render();
    };
    row.append(unpin);
    makePinDraggable(row, branch, ctx.list);
  }
  // Drag a card (or an assignment) onto a row to move it into that folder —
  // the SAME helper the cards and the breadcrumb already use, so the guard
  // against moving a folder into its own subtree holds here too.
  makeDropTarget(row, () => node.id, node);
  branch.append(row);

  const kids = el("div", "aw-qa-kids");
  branch.append(kids);
  let built = false;
  const fill = () => {
    if (built) return;
    built = true;
    kidNodes.forEach(k => kids.append(qaBranch(k, depth + 1, { ...ctx, pinnedRoot: false })));
  };
  const setOpen = on => {
    row.classList.toggle("is-open", on);
    if (on) fill();
    kids.style.display = on ? "" : "none";
  };
  setOpen(kidNodes.length > 0 && (ctx.open.has(node.id) || ctx.trail.has(node.id)));
  arrow.onclick = e => {
    e.stopPropagation();
    const nowOpen = !row.classList.contains("is-open");
    setOpen(nowOpen);
    // Only the teacher's OWN folding is remembered. A branch that opened just
    // because the current folder sits inside it is not a preference, and
    // writing it down would slowly unfold the whole panel by itself.
    if (nowOpen) ctx.open.add(node.id); else ctx.open.delete(node.id);
    qaSaveOpen(ctx.open);
    // The panel just changed height, so its row span may be stale.
    const grid = row.closest(".aw-fm-grid");
    if (grid) sizeQuickAccess(grid);
  };
  return branch;
}

// ---- dragging a PINNED row up and down (Đợt 218b) ---------------------------
// ⛔⛔ POINTER EVENTS, NOT HTML5 DRAG. Every other drag in this app
// (`makeDraggable`) uses `draggable=true` + dragstart, and that whole API is
// MOUSE ONLY: Chromium never synthesises it from touch, so on the teacher's 86"
// TOMKO screen an HTML5-drag reorder would be a feature that simply does not
// exist — exactly the trap the panel's unpin button avoids by refusing to be a
// hover-reveal. Pointer events cover mouse, pen and finger with one path.
//
// ⚠️ `touch-action: none` on the row (core/app.css) is REQUIRED, not tidiness:
// without it the browser claims the gesture for scrolling and pointermove stops
// firing mid-drag. Đợt 216 learned the matching lesson on the slider — a
// `preventDefault` on pointerdown does NOT hold a finger.
//
// ⚠️ The two drags cannot collide: this one never touches `draggingId`, so the
// makeDropTarget listeners on the same row see no HTML5 drag in flight and do
// nothing.
const QA_DRAG_SLOP = 6;   // px of travel before a press becomes a drag, not a tap

function makePinDraggable(row, branch, list) {
  let startY = 0, pointerId = null, dragging = false;

  const onMove = e => {
    if (!dragging) {
      if (Math.abs(e.clientY - startY) < QA_DRAG_SLOP) return;
      dragging = true;
      try { row.setPointerCapture(pointerId); } catch { /* pointer already gone */ }
      branch.classList.add("is-dragging");
    }
    moveTo(e.clientY);
  };

  // Re-home the branch as the pointer crosses a sibling's midpoint. The real
  // element moves — no ghost, no placeholder — so what the teacher sees during
  // the drag IS the order that will be saved.
  const moveTo = y => {
    const sibs = [...list.children].filter(n => n !== branch && n.classList.contains("aw-qa-branch"));
    for (const sib of sibs) {
      const r = sib.getBoundingClientRect();
      const mid = r.top + r.height / 2;
      const branchIsAfter = !!(sib.compareDocumentPosition(branch) & Node.DOCUMENT_POSITION_FOLLOWING);
      if (y < mid && branchIsAfter) { list.insertBefore(branch, sib); return; }
      if (y > mid && !branchIsAfter) { list.insertBefore(branch, sib.nextSibling); return; }
    }
  };

  const onUp = () => {
    row.removeEventListener("pointermove", onMove);
    row.removeEventListener("pointerup", onUp);
    row.removeEventListener("pointercancel", onUp);
    if (!dragging) return;
    dragging = false;
    try { row.releasePointerCapture(pointerId); } catch { /* already released */ }
    branch.classList.remove("is-dragging");
    // A pointerup at the end of a drag is still followed by a click, and that
    // click would open the folder the teacher was only rearranging. Swallow
    // exactly one, in the capture phase, before the label's handler sees it.
    row.addEventListener("click", ev => { ev.stopPropagation(); ev.preventDefault(); },
                         { capture: true, once: true });
    const ids = [...list.children].filter(n => n.classList.contains("aw-qa-branch")).map(n => n.dataset.id);
    // No re-render: the DOM already IS the new order, and rebuilding it here
    // would take the panel out from under the finger that just let go.
    setPinnedOrder(state.root, ids).catch(() => toastMsg("Could not save the new order."));
  };

  row.addEventListener("pointerdown", e => {
    if (e.button != null && e.button !== 0) return;          // right-click is not a drag
    if (e.target.closest(".aw-qa-arrow, .aw-qa-unpin")) return;  // those are buttons, not a handle
    startY = e.clientY; pointerId = e.pointerId; dragging = false;
    row.addEventListener("pointermove", onMove);
    row.addEventListener("pointerup", onUp);
    row.addEventListener("pointercancel", onUp);
  });
}

async function breadcrumb() {
  const bc = el("div", "aw-fm-crumbs");
  const home = el("button", "aw-crumb", "Home"); home.onclick = goTop;
  bc.append(home, sep());
  const rootBtn = el("button", "aw-crumb", ROOT_LABEL[state.root]);
  rootBtn.onclick = () => openRoot(state.root);
  makeDropTarget(rootBtn, () => null);   // drop here -> move to the root of this tree
  bc.append(rootBtn);
  if (state.view === "trash") { bc.append(sep(), el("span", "aw-crumb is-current", "Recycle bin")); return bc; }
  if (state.view === "search") { bc.append(sep(), el("span", "aw-crumb is-current", "Search")); return bc; }
  const chain = await pathTo(state.folderId);
  chain.forEach((f, i) => {
    bc.append(sep());
    const isCurrent = i === chain.length - 1;
    const b = el(isCurrent ? "span" : "button", "aw-crumb" + (isCurrent ? " is-current" : ""), escapeText(itemName(f)));
    if (!isCurrent) b.onclick = () => enterFolder(state.root, f.id);
    makeDropTarget(b, () => f.id, f);    // drop an item onto an ancestor folder crumb
    bc.append(b);
  });
  return bc;
  function sep() { return el("span", "aw-crumb-sep", "›"); }
}

function toolbar() {
  const bar = el("div", "aw-fm-toolbar");
  const left = el("div", "aw-fm-tools");

  if (state.view !== "trash" && state.root === "activities") {
    const newAct = el("button", "aw-btn aw-btn-primary aw-fm-newbtn", "+ New activity");
    newAct.type = "button"; newAct.onclick = newActivityFlow;
    left.append(newAct);
  }
  if (state.view !== "trash") {
    const newFolder = el("button", "aw-btn aw-fm-newbtn", "+ New folder");
    newFolder.type = "button"; newFolder.onclick = newFolderFlow;
    left.append(newFolder);
  }
  if (state.view !== "trash" && state.root === "activities") {
    // Wider than a plain icon button on purpose (teacher's request
    // 10/8/2026) — it doubles as a drop target: dragging a lesson file
    // straight onto it opens Import already reading that file, skipping
    // the click-to-open step. The dialog's own internal drop-zone (inside
    // importFlow()) still works too, for picking a different file once open.
    const imp = el("button", "aw-btn aw-fm-iconbtn aw-fm-importbtn", IMP_UPLOAD_SVG);
    imp.type = "button"; imp.title = "Import from a lesson file — or drag one here"; imp.setAttribute("aria-label", "Import");
    imp.onclick = () => importFlow();
    ["dragenter", "dragover"].forEach(ev => imp.addEventListener(ev, e => { e.preventDefault(); imp.classList.add("is-dragover"); }));
    ["dragleave", "dragend"].forEach(ev => imp.addEventListener(ev, e => { e.preventDefault(); imp.classList.remove("is-dragover"); }));
    imp.addEventListener("drop", e => {
      e.preventDefault(); imp.classList.remove("is-dragover");
      const f = e.dataTransfer && e.dataTransfer.files[0];
      importFlow(f || undefined);
    });
    left.append(imp);
  }
  const inTrash = state.view === "trash";
  const bin = el("button", "aw-btn aw-fm-iconbtn" + (inTrash ? " is-on" : ""), inTrash ? icons.prev : icons.trash);
  bin.type = "button"; bin.title = inTrash ? "Back" : "Recycle bin"; bin.setAttribute("aria-label", bin.title);
  bin.onclick = () => { if (inTrash) enterFolder(state.root, null); else { state.view = "trash"; render(); } };
  left.append(bin);
  if (inTrash) {
    const empty = el("button", "aw-btn aw-lib-del", "Empty bin");
    empty.type = "button"; empty.onclick = emptyBinFlow;
    left.append(empty);
  }
  bar.append(left);

  const right = el("div", "aw-fm-tools");
  if (state.view !== "trash") {
    const form = el("form", "aw-fm-search");
    const inp = el("input", "aw-fm-searchinput"); inp.type = "search"; inp.placeholder = "Search…"; inp.value = state.query;
    const btn = el("button", "aw-fm-searchbtn", icons.search || "🔍"); btn.type = "submit"; btn.title = "Search";
    form.onsubmit = e => { e.preventDefault(); const q = inp.value.trim(); state.query = q; state.view = q ? "search" : "folder"; render(); };
    form.append(inp, btn);
    right.append(form);

    const grp = el("div", "aw-fm-viewtoggle");
    const g = viewBtn("grid", GRID_SVG, "Grid view");
    const l = viewBtn("list", LIST_SVG, "List view");
    grp.append(g, l);
    right.append(grp);
  }
  bar.append(right);
  return bar;

  function viewBtn(mode, svg, title) {
    const b = el("button", "aw-fm-vbtn" + (state.mode === mode ? " is-on" : ""), svg);
    b.type = "button"; b.title = title;
    b.onclick = () => { state.mode = mode; localStorage.setItem("aword-view", mode); render(); };
    return b;
  }
}

// ---------------- cards ----------------
// Folder card mirrors the act card: a big icon in a preview area on top, then a
// foot with the name + ⁝ menu (⁝ pinned bottom-left). A count sits on the icon:
//   • only acts inside            -> one number (total acts, recursive)
//   • both subfolders AND acts    -> [direct subfolders] | [total acts], 2 colors
//   • no acts at all              -> nothing
// Also a drag-drop target.
// A card for one assignment inside Results. Clicking opens the same report the
// strip under the act opens — same document, same everything.
function assignmentCard(a) {
  const card = el("div", "aw-card aw-card-asg");
  card.onclick = () => openAssignmentDetail(a, { onChanged: render });

  const preview = el("div", "aw-fp");
  const ic = el("div", "aw-fp-icon aw-fp-asg", icons.assignment);
  preview.append(ic);
  if (a.closed) preview.append(el("div", "aw-asg-flag", "CLOSED"));
  else if (a.deadline && Date.now() > a.deadline) preview.append(el("div", "aw-asg-flag aw-asg-flag-due", "PAST DUE"));
  card.append(preview);
  if (hasNewResults(a)) card.append(newDot("New results"));

  const foot = el("div", "aw-card-foot");
  const info = el("div", "aw-card-info");
  info.append(el("div", "aw-card-name", escapeText(a.title || a.code)),
              el("span", "aw-card-type", "ASSIGNMENT"));
  foot.append(info, menuButton(a, assignmentMenuItems));
  card.append(foot);

  makeAssignmentDraggable(card, a);   // drag into a Results folder / breadcrumb
  return card;
}

function trashAssignmentCard(a) {
  const card = el("div", "aw-card aw-card-trash");
  card.append(el("div", "aw-folder-icon", icons.assignment));
  const foot = el("div", "aw-card-foot aw-card-foot-trash");
  foot.append(el("div", "aw-card-name", escapeText(a.title || a.code)));
  const acts = el("div", "aw-trash-actions");
  const restore = el("button", "aw-btn", "Restore"); restore.type = "button";
  restore.onclick = async () => { await restoreAssignment(a.code); toastMsg("Assignment restored"); render(); };
  const del = el("button", "aw-btn aw-lib-del", "Delete forever"); del.type = "button";
  del.onclick = async () => {
    if (!window.confirm(`Permanently delete “${a.title || a.code}” AND every score collected for it? This cannot be undone.`)) return;
    del.disabled = restore.disabled = true; del.textContent = "Deleting...";
    try { await deleteAssignmentForever(a.code); toastMsg("Assignment deleted"); }
    catch (e) { toastMsg(e.message || "Could not delete"); }
    render();
  };
  acts.append(restore, del);
  foot.append(acts);
  card.append(foot);
  return card;
}

function folderCard(node, counts, assignmentCount = 0, hasNews = false) {
  const card = el("div", "aw-card aw-card-folder");
  card.onclick = () => enterFolder(node.root, node.id);

  const preview = el("div", "aw-fp");
  const ic = el("div", "aw-fp-icon", FOLDER_SVG);
  ic.style.color = node.color || FOLDER_DEFAULT_COLOR;
  preview.append(ic);

  // In Results the number that matters is how many assignments are inside.
  const { folders = 0, acts = assignmentCount } = state.root === "results" ? { folders: 0 } : (counts || {});
  if (acts > 0) {
    const badge = el("div", "aw-fp-count");
    if (folders > 0) {
      // acts first (blue), then folders (amber-orange), split by a short divider
      badge.classList.add("aw-fp-count-two");
      badge.append(el("span", "aw-fp-n aw-fp-n-acts", String(acts)));
      badge.append(el("span", "aw-fp-div"));
      badge.append(el("span", "aw-fp-n aw-fp-n-folders", String(folders)));
    } else {
      badge.append(el("span", "aw-fp-n aw-fp-n-acts", String(acts)));
    }
    preview.append(badge);
  }
  card.append(preview);
  if (hasNews) card.append(newDot("New results inside"));

  const foot = el("div", "aw-card-foot");
  const info = el("div", "aw-card-info");
  info.append(el("div", "aw-card-name", escapeText(itemName(node))));
  foot.append(info, menuButton(node, folderMenuItems));
  card.append(foot);

  makeDraggable(card, node);
  makeDropTarget(card, () => node.id, node);   // drop another item INTO this folder
  return card;
}

// Pick one random item from an act's content and normalise it to
// {question, answers[]} for the card preview, regardless of which shape the
// owning template uses. Every shape in the library today:
//   Quiz / Open the box / Gameshow / Maze chase : content.questions|items
//                                                 {question, answers:[{text}]}
//   Anagram / Flying fruit : content.items       {word, clue}
//   Type the answer        : content.items       {prompt, acceptedAnswers[]}
//   True-false / Whack-a-mole : content.statements {text, answer:boolean}
//   Find the match         : content.pairs       {keyword, definition}
//   Crossword              : content.words       {answer, clue}
//   Balloon pop            : content.items       {keyword, definition}
//   Unjumble               : content.items       {sentence, clue}
//   Speaking cards         : content.cards       {text, image?}
// Returns null when there's nothing to show.
function previewPick(node) {
  const c = node.content || {};
  const list = c.questions || c.items || c.words || c.statements || c.cards || c.pairs || [];
  if (!list.length) return null;
  const it = list[Math.floor(Math.random() * list.length)];
  const question = it.question || it.prompt || it.clue || it.definition ||
                   it.sentence || it.text || it.word || "";
  if (!question) return null;
  let answers = [];
  if (Array.isArray(it.answers)) answers = it.answers.map(a => a.text || "").filter(Boolean);
  else if (Array.isArray(it.acceptedAnswers)) answers = it.acceptedAnswers.filter(Boolean);
  else if (typeof it.answer === "boolean") answers = [it.answer ? "True" : "False"];
  else if (typeof it.answer === "string" && it.answer) answers = [it.answer];
  else if (it.keyword) answers = [it.keyword];
  else if (it.word && it.word !== question) answers = [it.word];
  else if (it.sentence && it.sentence !== question) answers = [it.sentence];
  return { question, answers };
}

// Does EVERY item of this act carry a voice clip? (Đợt 142, teacher.) The
// badge on the card means "this one is finished", so a half-generated list
// deliberately stays unmarked — a green speaker on an act where only 12 of
// 35 words speak would be worse than no badge at all.
// `item.voice` is the same marker core/voice-playback.js's voiceView() reads,
// and core/convert.js carries it across every template shape, so this one
// check covers an Anagram act and anything it was converted into.
function actFullyVoiced(node) {
  const c = node.content || {};
  // Đợt 145 — a vocabulary act keeps one clip set PER clue set, so it only
  // earns the badge when every set that can be spoken really is. Half-voiced
  // (ENG1 done, ENG2 not) must not read as finished: the teacher's whole use
  // for the badge is spotting at a glance what still needs generating.
  const voiceVariants = voiceVariantsOf(c);
  if (voiceVariants) return voiceVariants.every(k => variantFullyVoiced(c, k));
  const list = c.questions || c.items || c.words || c.statements || c.cards || c.pairs || [];
  return list.length > 0 && list.every(it => it && it.voice);
}

function actCard(node) {
  const card = el("div", "aw-card aw-card-act");

  const preview = el("div", "aw-cp");
  const pick = previewPick(node);
  if (pick) {
    preview.append(el("div", "aw-cp-q", escapeText(pick.question)));
    const chips = el("div", "aw-cp-answers");
    pick.answers.slice(0, 4).forEach((text, i) => {
      const chip = el("div", "aw-cp-chip", escapeText(text));
      chip.style.background = PREVIEW_COLORS[i % PREVIEW_COLORS.length];
      chips.append(chip);
    });
    preview.append(chips);
  } else {
    preview.append(el("div", "aw-cp-empty", "No questions yet"));
  }
  const playBtn = el("button", "aw-cp-play", icons.playBig);
  playBtn.type = "button"; playBtn.title = "Play";
  playBtn.onclick = e => { e.stopPropagation(); playAct(node.id); };
  preview.append(playBtn);
  if (actFullyVoiced(node)) {
    const voiceBadge = el("div", "aw-cp-voice", icons.soundOn);
    voiceBadge.title = "Every word in this act has a voice clip";
    preview.append(voiceBadge);
    // `has-voice` is what lets the CSS start the question's FIRST line clear
    // of the badge — the badge is absolutely positioned, so without it the
    // text runs underneath (seen on the very first screenshot of this build).
    preview.classList.add("has-voice");
  }
  card.append(preview);
  // an act wears the dot when one of ITS assignments has new results
  if (actHasNews(node.id)) card.append(newDot("New results in an assignment"));

  const foot = el("div", "aw-card-foot");
  const info = el("div", "aw-card-info");
  // name on TOP, template type BELOW it (matches the agreed card layout)
  info.append(el("div", "aw-card-name", escapeText(itemName(node))), el("span", "aw-card-type", escapeText(templateLabel(node.type))));
  foot.append(info, menuButton(node, actMenuItems));
  card.append(foot);

  makeDraggable(card, node);   // an act can be dragged into a folder / breadcrumb
  return card;
}

// ---------------- drag & drop (move into folders / breadcrumb) ----------------
let draggingId = null;
function makeDraggable(card, node) {
  card.draggable = true;
  card.addEventListener("dragstart", e => {
    draggingId = node.id;
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", node.id); } catch { /* ignore */ }
    card.classList.add("is-dragging");
  });
  card.addEventListener("dragend", () => {
    draggingId = null;
    card.classList.remove("is-dragging");
    document.querySelectorAll(".is-dropok").forEach(x => x.classList.remove("is-dropok"));
  });
}
// `target` (optional) = the node this element represents, so we never drop an
// item onto itself. `getParentId()` returns the destination folder id (or null).
// Assignments are dragged the same way; they carry an "asg:" prefix because
// they live in a different collection from the library items.
function makeAssignmentDraggable(card, a) {
  card.draggable = true;
  card.addEventListener("dragstart", e => {
    draggingId = "asg:" + a.code;
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", a.code); } catch { /* ignore */ }
    card.classList.add("is-dragging");
  });
  card.addEventListener("dragend", () => {
    draggingId = null;
    card.classList.remove("is-dragging");
    document.querySelectorAll(".is-dropok").forEach(x => x.classList.remove("is-dropok"));
  });
}

function makeDropTarget(elm, getParentId, target) {
  elm.addEventListener("dragover", e => {
    if (draggingId == null || (target && draggingId === target.id)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    elm.classList.add("is-dropok");
  });
  elm.addEventListener("dragleave", () => elm.classList.remove("is-dropok"));
  elm.addEventListener("drop", async e => {
    e.preventDefault();
    elm.classList.remove("is-dropok");
    const id = draggingId; draggingId = null;
    if (id == null || (target && id === target.id)) return;
    try {
      if (String(id).startsWith("asg:")) await moveAssignmentTo(String(id).slice(4), getParentId());
      else await moveItem(id, getParentId());   // guards against folder-into-own-subtree
    } catch (err) {
      toastMsg(err.message || "Could not move that here.");
    }
    render();
  });
}

// Move one assignment into a Results folder (null = top level), refusing a
// name that is already used there.
async function moveAssignmentTo(code, folderId) {
  const all = await listAllAssignments({ includeTrashed: true });
  const a = all.find(x => x.code === code);
  if (!a) return;
  if (assignmentNameTaken(all, { folderId, title: a.title, exceptCode: code })) {
    throw new Error(`“${a.title}” already exists in that folder.`);
  }
  await updateAssignment(code, { folderId: folderId ?? null });
}

// ⁝ Move for an assignment — the same folder-tree picker the library uses.
async function moveAssignmentFlow(a) {
  const folders = await listFolders("results");
  openModal("Move to", (body, close) => {
    const tree = el("div", "aw-move-tree");
    let chosen = null;                       // null = top level of Results
    tree.append(pickRow(ROOT_LABEL.results, 0, null));
    renderChildren(null, 1);
    body.append(tree);

    const err = el("div", "aw-ed-error", "");
    err.style.display = "none";
    body.append(err);

    const actions = el("div", "aw-modal-actions");
    const cancel = el("button", "aw-btn", "Cancel"); cancel.type = "button"; cancel.onclick = close;
    const ok = el("button", "aw-btn aw-btn-primary", "Move here"); ok.type = "button";
    ok.onclick = async () => {
      try { await moveAssignmentTo(a.code, chosen); close(); render(); }
      catch (e) { err.style.display = ""; err.textContent = e.message; }
    };
    actions.append(cancel, ok);
    body.append(actions);

    function renderChildren(parentId, depth) {
      folders.filter(f => (f.parentId ?? null) === (parentId ?? null))
        .sort((x, y) => itemName(x).localeCompare(itemName(y)))
        .forEach(f => { tree.append(pickRow(itemName(f), depth, f.id)); renderChildren(f.id, depth + 1); });
    }
    function pickRow(label, depth, id) {
      const row = el("button", "aw-move-row");
      row.type = "button"; row.style.paddingLeft = (10 + depth * 18) + "px";
      row.append(el("span", "aw-move-ic", FOLDER_SVG), el("span", null, escapeText(label)));
      row.onclick = () => { chosen = id; tree.querySelectorAll(".aw-move-row").forEach(r => r.classList.remove("is-sel")); row.classList.add("is-sel"); };
      return row;
    }
  });
}

function trashCard(node) {
  const card = el("div", "aw-card aw-card-trash");
  card.append(el("div", "aw-folder-icon", node.kind === "folder" ? FOLDER_SVG : (icons.template || FOLDER_SVG)));
  const foot = el("div", "aw-card-foot aw-card-foot-trash");
  foot.append(el("div", "aw-card-name", escapeText(itemName(node))));
  const acts = el("div", "aw-trash-actions");
  const restore = el("button", "aw-btn", "Restore"); restore.type = "button";
  restore.onclick = async () => { await restoreItem(node.id); render(); };
  const del = el("button", "aw-btn aw-lib-del", "Delete forever"); del.type = "button";
  del.onclick = async () => { if (window.confirm(`Permanently delete “${itemName(node)}”? This cannot be undone.`)) { await deleteForever(node.id); render(); } };
  acts.append(restore, del);
  foot.append(acts);
  card.append(foot);
  return card;
}

function menuButton(node, itemsFn) {
  const b = el("button", "aw-card-menu", DOTS);
  b.type = "button"; b.title = "Options"; b.setAttribute("aria-label", "Options");
  b.onclick = e => { e.stopPropagation(); openMenu(b, itemsFn(node)); };
  return b;
}

// ---------------- ⁝ menu contents ----------------
function folderMenuItems(node) {
  return [
    ["Open in new tab", () => openInNewTab(node)],
    ["Copy link", () => copyLinkFlow(node)],
    [node.pinned ? "Remove from Quick access" : "Pin to Quick access", () => pinFlow(node)],
    ["Rename", () => renameFlow(node)],
    ["Color", () => colorFlow(node)],
    ["Move", () => moveFlow(node)],
    ["Duplicate", () => duplicateFlow(node)],
    ["Delete", () => deleteFlow(node), true]
  ];
}
function assignmentMenuItems(a) {
  return [
    ["Open report", () => openAssignmentDetail(a, { onChanged: render })],
    ["Copy student link", () => copyAssignmentLink(a)],
    ["Copy QR image", () => copyAssignmentQr(a)],
    ["Edit", () => openAssignmentEdit(a, { onSaved: render })],
    ["Move", () => moveAssignmentFlow(a)],
    ["Delete", () => confirmTrashAssignment(a, { onDone: render }), true]
  ];
}
function actMenuItems(node) {
  return [
    ["Open in new tab", () => openInNewTab(node)],
    ["Copy link", () => copyLinkFlow(node)],
    ["Edit content", () => editAct(node.id)],
    ["Rename", () => renameFlow(node)],
    ["Duplicate", () => duplicateFlow(node)],
    ["Move", () => moveFlow(node)],
    ["Delete", () => deleteFlow(node), true]
  ];
}

// ---------------- actions ----------------
async function playAct(id) {
  const node = await getItem(id);
  if (!node) return render();
  // The game (and its stylesheet) is fetched the moment it is first needed —
  // see ensureTemplate() in core/registry.js.
  try { await ensureTemplate(node.type); }
  catch (e) { toast(`${templateLabel(node.type)} — could not load`); return; }
  state.view = "play";
  setUrl(await linkFor(node));               // the address bar now points at this act
  startGame(app, node, { onExit: goTop });   // the in-game Home button returns here
}
// Edit content -> open the editor for THIS act's type (each template registers
// its own `edit`). Falls back gracefully if a type has no editor yet.
async function editAct(id) {
  const node = await getItem(id);
  if (!node) return render();
  let tpl = null;
  try { tpl = await ensureTemplate(node.type); } catch (e) { tpl = null; }
  if (!tpl || !tpl.edit) { toast(`${templateLabel(node.type)} — editor coming soon`); return; }
  tpl.edit(app, node, {
    header: topbar(true),
    footer: footer(),
    onSave: async updated => { await saveActivity(updated); render(); },
    onCancel: render
  });
}

// "+ New activity" -> pick an act TYPE first (each type has its own edit page),
// then open that type's editor on a blank act seeded with the Settings defaults.
function newActivityFlow() {
  openModal("New activity", (body, close) => {
    body.append(el("div", "aw-pick-hint", "Choose an activity type to create."));
    const grid = el("div", "aw-pick-grid");
    TEMPLATES.forEach(t => {
      const cardCls = "aw-pick-card" + (t.built ? "" : " is-soon");
      const card = el("button", cardCls);
      card.type = "button";
      card.append(el("div", "aw-pick-name", t.label));
      card.append(el("div", "aw-pick-blurb", t.blurb || ""));
      if (!t.built) card.append(el("span", "aw-pick-soon", "Coming soon"));
      card.onclick = () => {
        if (!t.built) { toast(`${t.label} — coming soon`); return; }
        close();
        createBlankAct(t.type);
      };
      grid.append(card);
    });
    body.append(grid);
    const actions = el("div", "aw-modal-actions");
    const cancel = el("button", "aw-btn", "Cancel"); cancel.type = "button"; cancel.onclick = close;
    actions.append(cancel);
    body.append(actions);
  });
}

async function createBlankAct(type) {
  let tpl = null;
  try { tpl = await ensureTemplate(type); } catch (e) { tpl = null; }
  if (!tpl || !tpl.edit) { toast(`${templateLabel(type)} — editor coming soon`); return; }
  const blank = {
    type, schemaVersion: 1, title: "", instruction: "", theme: "classic",
    options: getDefaultOptions(type),   // inherit the teacher's Settings defaults
    content: { questions: [] }
  };
  const root = state.root, parentId = state.folderId;
  tpl.edit(app, blank, {
    header: topbar(true),
    footer: footer(),
    onSave: async updated => { await saveActivity(updated, { root, parentId }); enterFolder(root, parentId); },
    onCancel: () => enterFolder(root, parentId)
  });
}
function newFolderFlow() {
  openTextModal("New folder", "Folder name", "", async name => {
    if (name.trim()) { await createFolder(state.root, state.folderId, name.trim()); render(); }
  });
}

// "Empty bin" -> permanently delete EVERYTHING in the current root's recycle
// bin after a clear confirmation (bulk, irreversible — same finality as the
// per-item "Delete forever"). Only offered while viewing the bin.
async function emptyBinFlow() {
  let items;
  try { items = await listTrash(state.root); }
  catch (e) { toast(e && e.code === "aw/signed-out" ? "Please sign in first." : "Could not open the recycle bin."); return; }
  if (!items.length) { toast("Recycle bin is already empty."); return; }
  openModal("Empty recycle bin", (body, close) => {
    body.append(el("div", "aw-modal-text",
      `Permanently delete all <b>${items.length}</b> item${items.length === 1 ? "" : "s"} in the recycle bin? This cannot be undone.`));
    const actions = el("div", "aw-modal-actions");
    const cancel = el("button", "aw-btn", "Cancel"); cancel.type = "button"; cancel.onclick = close;
    const del = el("button", "aw-btn aw-lib-del", "Delete all"); del.type = "button";
    del.onclick = async () => {
      del.disabled = true; del.textContent = "Deleting…";
      try {
        const n = await emptyTrash(state.root);
        close();
        render();
        toast(`Deleted ${n} item${n === 1 ? "" : "s"} from the recycle bin.`);
      } catch (e) {
        del.disabled = false; del.textContent = "Delete all";
        body.append(el("div", "aw-ed-error", e && e.code === "aw/signed-out" ? "Please sign in first." : (e && e.message ? e.message : "Could not empty the bin.")));
      }
    };
    actions.append(cancel, del);
    body.append(actions);
  });
}

// ---------- Import dialog ----------
// Drop or browse a lesson SPREADSHEET (.xlsm/.xlsx/.xls) — the app reads it in
// the browser (same mapping as the taoactaw skill), lists the acts it found, and
// you tick which to create. By default acts land in the CURRENT folder; ticking
// "Make a new folder" puts them in a fresh subfolder instead. (A .json bundle
// file works too.) Titles that already exist in the target are skipped.
// SheetJS (~1 MB) loads only when a spreadsheet is actually read.
const IMP_UPLOAD_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V5M8 9l4-4 4 4"/><path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"/></svg>`;
const IMP_DOC_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>`;
// Đợt 148 — the per-type icons moved to `core/catalog.js` (TEMPLATE_ICON), the
// one place that already lists every type, because the in-game Template picker
// needed exactly the same map. The private copy that used to sit here could
// only ever drift from it.
// ⭐ Đợt 268 — the "ACT" subfolder concept (a QUIZ1/QUIZ2/READINGACT-only
// folder, teacher's request 10/8/2026) is retired: lesson-import.js now lands
// every act flat in the same folder, so there is nothing left to guard here.

// `opts.fromRoot` — build the folder tree from the TOP of Activities instead of
// from wherever the teacher happens to be standing. Set by a file dropped on the
// Quick access panel (thầy 21/8/2026 listed that as the one exception to
// "tạo ở thư mục đang đứng"), and it is also what keeps such a drop safe while
// the teacher is inside the Results tree, which cannot hold acts at all.
function importFlow(initialFile, opts = {}) {
  const basePid = opts.fromRoot ? null : state.folderId;
  openModal("Import activities", (body, close) => {
    if (body.parentElement) body.parentElement.classList.add("is-import");
    let acts = [], sourceName = "", sourcePath = [], pathKnown = false;
    let ttsMod = null;   // { VOICES, getLastVoice, setLastVoice, generateVoicesBatch } — lazy, loaded in handleFile()

    // ----- drop zone: click to browse OR drag a file in -----
    const fileInput = el("input"); fileInput.type = "file";
    fileInput.accept = ".xlsm,.xlsx,.xls,.json,application/json";
    fileInput.style.display = "none";
    const drop = el("div", "aw-imp-drop");
    const setDrop = (title, sub) => {
      drop.innerHTML = `<div class="aw-imp-drop-icon">${IMP_UPLOAD_SVG}</div>` +
        `<div class="aw-imp-drop-title">${title}</div><div class="aw-imp-drop-sub">${sub}</div>`;
    };
    const IDLE = ["Drag a lesson file here, or <b>click to browse</b>", ".xlsm · .xlsx · .xls"];
    setDrop(...IDLE);
    drop.onclick = () => fileInput.click();
    ["dragenter", "dragover"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("is-over"); }));
    ["dragleave", "dragend"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove("is-over"); }));
    drop.addEventListener("drop", e => { e.preventDefault(); drop.classList.remove("is-over"); const f = e.dataTransfer && e.dataTransfer.files[0]; if (f) handleFile(f); });
    fileInput.onchange = () => { const f = fileInput.files && fileInput.files[0]; if (f) handleFile(f); };
    body.append(drop, fileInput);

    const err = el("div", "aw-ed-error", ""); err.style.display = "none"; body.append(err);
    const panel = el("div"); panel.style.cssText = "flex-direction:column;gap:12px;display:none;"; body.append(panel);
    // ⭐ Đợt 221 — STEP 2 lives out here, beside `panel`, and is built ONCE.
    // ⚠️ It must not be created inside buildPanel(): that runs again for every
    // file the teacher drops into an open dialog, and a second folder screen
    // (and a second Back button) would pile up underneath the first with no
    // sign on screen that two of them existed.
    const folder = el("div", "aw-imp-folder"); folder.style.display = "none"; body.append(folder);
    const report = el("div", "aw-import-report"); report.style.cssText = "font-size:14px;line-height:1.5;max-height:150px;overflow:auto;display:none;"; body.append(report);

    const actions = el("div", "aw-modal-actions");
    const back = el("button", "aw-btn", "‹ Back"); back.type = "button"; back.style.display = "none";
    const cancel = el("button", "aw-btn", "Close"); cancel.type = "button"; cancel.onclick = close;
    const ok = el("button", "aw-btn aw-btn-primary", "Import"); ok.type = "button"; ok.disabled = true;
    actions.append(back, cancel, ok); body.append(actions);
    const showErr = m => { err.style.display = ""; err.textContent = m; };

    async function handleFile(f) {
      err.style.display = "none"; panel.style.display = "none"; report.style.display = "none"; acts = []; ok.disabled = true;
      // A new file always lands the teacher back on step 1 — the folder screen
      // it would otherwise still be showing describes the file just replaced.
      folder.style.display = "none"; back.style.display = "none"; drop.style.display = "";
      setDrop(`Reading <b>${escapeText(f.name)}</b>…`, "");
      try {
        const [{ parseLessonToBundle, isSpreadsheet }, tts, voiceBatch, voiceMix] = await Promise.all([
          import("./core/lesson-import.js"), import("./core/tts.js"),
          import("./core/voice-batch.js"), import("./core/voice-mix.js")
        ]);
        ttsMod = { ...tts, ...voiceBatch, ...voiceMix };
        const bundle = isSpreadsheet(f.name)
          ? await parseLessonToBundle(await f.arrayBuffer(), { fileName: f.name })
          : JSON.parse(await f.text());
        if (!bundle || !Array.isArray(bundle.activities) || !bundle.activities.length) {
          setDrop(...IDLE); showErr("No activities found in that file."); return;
        }
        acts = bundle.activities;
        sourceName = bundle.folder || "";
        // ⭐ Đợt 221 — the whole folder PATH the file name asks for. A .json
        // bundle carries only a name, so fall back to a one-level path.
        sourcePath = Array.isArray(bundle.folderPath) && bundle.folderPath.length
          ? bundle.folderPath.slice() : (sourceName ? [sourceName] : []);
        pathKnown = !!bundle.folderPathKnown;
        setDrop(`<b>${escapeText(f.name)}</b> — ${acts.length} activities`, "Click to choose a different file");
        buildPanel();
      } catch (e) {
        setDrop(...IDLE); showErr("Could not read that file: " + (e && e.message ? e.message : e));
      }
    }
    // A file dropped straight onto the toolbar's Import button (teacher's
    // request 10/8/2026) skips the click-to-open step — the dialog opens
    // already reading it.
    if (initialFile) handleFile(initialFile);

    function buildPanel() {
      panel.innerHTML = ""; panel.style.display = "flex";

      function buildActRow(a) {
        const row = el("label", "aw-imp-row");
        const cb = el("input"); cb.type = "checkbox"; cb.checked = true;
        const c = a.content || {};
        const n = (c.pairs || c.cards || c.statements || c.questions || c.items || []).length;
        // Đợt 146 — a comprehension act holds BOTH halves of its exercise, but
        // the count above is one half (that IS the number of questions a class
        // answers in a round). "30 ×2" says both things at once; without it the
        // row for a merged QUIZ reads exactly like the old single-half one.
        const halves = (c.contentSets || []).length;
        const nText = halves > 1 ? `${n} ×${halves}` : String(n);
        row.append(cb,
          el("span", "aw-imp-ricon", templateIcon(icons, a.type) || IMP_DOC_SVG),
          el("span", "aw-imp-rtitle", escapeText(a.title)),
          el("span", "aw-imp-rmeta", `${templateLabel(a.type)} · ${nText}${a.subfolder ? " · " + escapeText(a.subfolder) : ""}`));
        cb.onchange = () => { row.classList.toggle("is-off", !cb.checked); refresh(); };
        return { el: row, cb };
      }

      // ---- voice panel (first, teacher's request 10/8/2026) — each
      // TTS-eligible act (ENG1/ENG2) gets its OWN row here, same shape as a
      // normal row below: ticking it both includes it in the import AND
      // generates its voice — the only difference is living in this box, to
      // draw more attention to the voice-capable acts. VI1/VI2 (Vietnamese
      // clues) and PRONUNCIATION (IPA clues) never appear here or get a
      // voice — an English Kokoro voice would misread both.
      // ⭐ 13/8/2026 (Đợt 142) — this box now offers the SAME voice choices as
      // the Anagram editor's "Generate all voices": one voice, or Mix voice
      // (4 hand-picked voices taking turns), or Random (every voice of one
      // accent). The rules behind the mix — as many Male rows as Female, no
      // voice used noticeably more than the rest — are core/voice-mix.js's
      // `planFor`, the exact function the editor calls, so the two can never
      // drift apart. Only the markup differs (panel here, popover there).
      let readVoiceChoice = null;   // () => {mix,random,accent,mixIds,singleId}
      const voiceRowOf = new Map();   // act -> its already-built row (voice box OR list, never both)
      if (ttsMod && acts.some(a => a.ttsEligible)) {
        const vbox = el("div", "aw-imp-voice");
        vbox.append(el("div", "aw-imp-voice-title", "Voice (TTS)"));
        vbox.append(el("div", "aw-imp-voice-hint",
          "Reads each word's Clue and saves it — same as Anagram's “Generate all voices”, including Mix voice. " +
          "A vocabulary act is voiced for BOTH English clue sets (ENG1 and ENG2), so 100 words means 200 clips. " +
          "Runs AFTER the acts are created, and needs you signed in."));
        const vrows = el("div", "aw-imp-voice-rows");
        acts.filter(a => a.ttsEligible).forEach(a => {
          const row = buildActRow(a);
          voiceRowOf.set(a, row);
          vrows.append(row.el);
        });
        vbox.append(vrows);

        // Last time's setup comes back (teacher imports several lesson files
        // in a row): the single voice from core/tts.js's own key, the mix
        // setup from core/voice-mix.js's.
        const last = ttsMod.getLastMix() || { mix: false, random: false, accent: "en-gb", mixIds: [...ttsMod.MIX_DEFAULTS] };

        const singleSelect = el("select", "aw-imp-voice-select");
        ttsMod.fillVoiceOptions(singleSelect, null);
        singleSelect.value = ttsMod.getLastVoice();

        const mixChk = document.createElement("input"); mixChk.type = "checkbox"; mixChk.checked = last.mix;
        const mixLabel = el("label", "aw-imp-voice-check");
        mixLabel.append(mixChk, document.createTextNode(" Mix voice — take turns through a few voices"));

        const mixWrap = el("div", "aw-imp-voice-mix");
        // 4 pickers that exclude each other, so the same voice can never be
        // chosen twice — identical rule and defaults to the editor's.
        const mixRows = last.mixIds.map((defId, i) => {
          const row = el("div", "aw-imp-voice-mixrow");
          row.append(el("span", null, `Voice ${i + 1}`));
          const sel = el("select", "aw-imp-voice-select");
          sel.style.marginTop = "0";
          ttsMod.fillVoiceOptions(sel, null);
          sel.value = defId;
          row.append(sel);
          mixWrap.append(row);
          return { row, select: sel };
        });
        function refreshMixSelects() {
          const chosen = mixRows.map(r => r.select.value);
          mixRows.forEach((r, i) => {
            const keep = r.select.value;
            ttsMod.fillVoiceOptions(r.select, chosen.filter((_, j) => j !== i));
            r.select.value = keep;   // its own id was never in its own exclude list, so this always sticks
          });
        }
        mixRows.forEach(r => { r.select.onchange = refreshMixSelects; });
        refreshMixSelects();

        const randomChk = document.createElement("input"); randomChk.type = "checkbox"; randomChk.checked = last.random;
        const randomLabel = el("label", "aw-imp-voice-check");
        randomLabel.append(randomChk, document.createTextNode(" Random — mix ALL voices of an accent"));
        mixWrap.append(randomLabel);

        const accentWrap = el("div", "aw-imp-voice-accent");
        let mixAccent = last.accent;
        const ukChk = document.createElement("input"); ukChk.type = "radio"; ukChk.name = "aw-imp-mix-accent"; ukChk.checked = mixAccent === "en-gb";
        const ukLabel = el("label", "aw-imp-voice-check"); ukLabel.append(ukChk, document.createTextNode(" UK accents"));
        const usChk = document.createElement("input"); usChk.type = "radio"; usChk.name = "aw-imp-mix-accent"; usChk.checked = mixAccent === "en-us";
        const usLabel = el("label", "aw-imp-voice-check"); usLabel.append(usChk, document.createTextNode(" US accents"));
        ukChk.onchange = () => { if (ukChk.checked) mixAccent = "en-gb"; };
        usChk.onchange = () => { if (usChk.checked) mixAccent = "en-us"; };
        accentWrap.append(ukLabel, usLabel);
        mixWrap.append(accentWrap);

        const syncVoiceUI = () => {
          singleSelect.style.display = mixChk.checked ? "none" : "";
          mixWrap.style.display = mixChk.checked ? "" : "none";
          mixRows.forEach(r => { r.row.style.display = randomChk.checked ? "none" : ""; });
          accentWrap.style.display = randomChk.checked ? "" : "none";
        };
        mixChk.onchange = syncVoiceUI;
        randomChk.onchange = syncVoiceUI;

        vbox.append(singleSelect, mixLabel, mixWrap);
        syncVoiceUI();
        panel.append(vbox);

        readVoiceChoice = () => ({
          mix: mixChk.checked, random: randomChk.checked, accent: mixAccent,
          mixIds: mixRows.map(r => r.select.value), singleId: singleSelect.value
        });
      }

      const head = el("div", "aw-imp-head");
      const count = el("span");
      const selAll = el("button", "aw-imp-selall"); selAll.type = "button";
      head.append(count, selAll);

      const list = el("div", "aw-imp-list");
      const checks = acts.map(a => {
        const row = voiceRowOf.get(a) || (() => { const r = buildActRow(a); list.append(r.el); return r; })();
        return row.cb;
      });

      panel.append(head, list);

      // ================= STEP 2: THE FOLDER SCREEN (Đợt 221) =================
      // Thầy: *"Trong bảng thông tin import trước khi chốt cũng cần có thêm 1
      // màn chốt thư mục nữa trước khi tạo"*. It replaces the old single
      // "Make a new folder" + name field, which could only ever describe one
      // level — the importer now proposes five.
      //
      // ⚠️ STEP 1 IS HIDDEN, NOT DESTROYED. `readVoiceChoice()` reads live
      // values out of the voice box and the act checkboxes are the record of
      // what was ticked; rebuilding either would lose the teacher's choices the
      // moment they stepped back and forth.
      folder.innerHTML = "";
      const fWhere = el("div", "aw-imp-folder-base", "");
      const fRows = el("div", "aw-imp-path");
      const fAdd = el("button", "aw-imp-path-add", "+ Add a level"); fAdd.type = "button";
      const fSum = el("div", "aw-imp-folder-hint", "");
      folder.append(fWhere, fRows, fAdd, fSum);

      // ---- where the path hangs off, and how much of it is already walked ----
      // Thầy's rule, in one place: standing at the TOP of Activities builds the
      // whole tree; standing INSIDE a folder that the path already names drops
      // every level up to and including it ("tự bỏ cấp trùng, tạo phần còn
      // thiếu"); standing somewhere unrelated makes just the one leaf folder,
      // which is exactly what import did before this đợt.
      // ⚠️ The LAST match, not the first: a path that ever repeats a name should
      // shed as much as it truthfully can, and matching the first would rebuild
      // levels the teacher is already standing below.
      let hereName = null;
      const trimPath = segs => {
        if (!hereName || !segs.length) return segs.slice();
        let hit = -1;
        segs.forEach((s, i) => { if (sameName(s, hereName)) hit = i; });
        if (hit >= 0) return segs.slice(hit + 1);
        return segs.slice(-1);
      };

      let pathInputs = [];          // one <input> per level, in order
      const pathSegments = () => pathInputs.map(i => i.value.trim()).filter(Boolean);

      function drawPath(segs) {
        fRows.innerHTML = ""; pathInputs = [];
        segs.forEach(name => addLevel(name));
        if (!segs.length) fRows.append(el("div", "aw-imp-path-none",
          "No new folder — the acts go straight into this folder."));
        refreshDupState();
      }
      function addLevel(name, focus) {
        const none = fRows.querySelector(".aw-imp-path-none");
        if (none) none.remove();
        const row = el("div", "aw-imp-path-row");
        const mark = el("span", "aw-imp-path-mark", "");
        const inp = el("input", "aw-ed-input aw-imp-path-input");
        inp.value = name || ""; inp.placeholder = "Folder name";
        const del = el("button", "aw-imp-path-del", icons.close); del.type = "button";
        del.title = "Remove this level";
        del.setAttribute("aria-label", del.title);
        del.onclick = () => {
          pathInputs = pathInputs.filter(x => x !== inp);
          row.remove();
          if (!pathInputs.length) fRows.append(el("div", "aw-imp-path-none",
            "No new folder — the acts go straight into this folder."));
          refreshDupState();
        };
        row.append(mark, inp, del);
        fRows.append(row);
        pathInputs.push(inp);
        let t = null;
        inp.oninput = () => { clearTimeout(t); t = setTimeout(refreshDupState, 250); };
        if (focus) inp.focus();
      }
      fAdd.onclick = () => { addLevel("", true); refreshDupState(); };

      function refresh() {
        const sel = checks.filter(c => c.checked).length;
        count.innerHTML = `<b>${sel}</b> of ${acts.length} selected`;
        selAll.textContent = checks.every(c => c.checked) ? "Clear all" : "Select all";
        ok.textContent = sel ? `Choose folder ›` : "Choose folder";
        ok.disabled = !sel;
      }
      selAll.onclick = () => {
        const turnOn = checks.some(c => !c.checked);
        checks.forEach(c => { c.checked = turnOn; c.closest(".aw-imp-row").classList.toggle("is-off", !turnOn); });
        refresh();
      };
      refresh();

      // ---- duplicate-name guard (teacher's request 10/8/2026) — flags any
      // act row whose title already exists in its REAL target folder RED
      // (stays ticked; teacher renames/deletes the existing item, or unticks
      // the row). Blocking itself happens on the Import click below — this
      // only updates the visual state, re-run on every input that could
      // change the target (file, a path level added / renamed / removed).
      //
      // ⭐ Đợt 221 — `folderDup` IS GONE. It used to paint the folder field red
      // whenever "Make a new folder" named one that already existed, because
      // back then that meant "you are about to pour a second lesson into
      // someone else's folder". The auto-path REUSES existing folders as its
      // whole purpose — `LISTENING` and the category above the series are
      // supposed to be there already — so flagging reuse would light the screen
      // up red on every correct import. The check that still means something is
      // the per-act one below: same act title, same folder.
      // `undefined` means "this target doesn't exist / hasn't been created
      // yet, so nothing can conflict with it" — kept STRICTLY distinct from
      // `null`, which is the real, valid id of the library's top level
      // (basePid is `null` there, not a sentinel — using `null` for both would
      // make root-level imports never flag a real duplicate).
      async function resolveFolderPath(parentId, segments) {
        let pid = parentId;
        for (const raw of segments) {
          const name = (raw || "").toString().trim();
          if (!name) continue;
          const kids = await listChildren(state.root, pid);
          const match = kids.find(k => k.kind === "folder" && sameName(k.name, name));
          if (!match) return undefined;
          pid = match.id;
        }
        return pid;
      }
      // Walk the typed path one level at a time, reporting which levels are
      // already in the library and which will be created. ⚠️ Once a level is
      // missing every level below it is missing too — they are being made
      // inside something that does not exist yet — so the walk stops looking
      // rather than searching the wrong parent.
      // ⚠️ ONE ENTRY PER ROW ON SCREEN, including a row whose name is still
      // blank — the caller paints the rows by index, and quietly dropping the
      // empty ones would slide every ✓/+ below them onto the wrong line.
      // A blank level is skipped for the walk itself (importBundle ignores it
      // too) without disturbing the parent the next real level is looked up in.
      async function walkPath(parentId, rawNames) {
        const out = []; let pid = parentId, alive = true;
        for (const raw of rawNames) {
          const name = (raw || "").trim();
          if (!name) { out.push({ name: "", id: null }); continue; }
          let id = null;
          if (alive) {
            const kids = await listChildren(state.root, pid);
            const m = kids.find(k => k.kind === "folder" && sameName(k.name, name));
            if (m) id = m.id; else alive = false;
          }
          out.push({ name, id });
          pid = id;
        }
        return out;
      }
      async function refreshDupState() {
        const segs = pathSegments();
        const walked = await walkPath(basePid, pathInputs.map(i => i.value));
        // Paint each level: ✓ it is already there, + it will be made.
        fRows.querySelectorAll(".aw-imp-path-row").forEach((row, i) => {
          const w = walked[i];
          const mark = row.querySelector(".aw-imp-path-mark");
          const named = !!(w && w.name);
          // Step in one notch per level so five near-identical codes read as a
          // path and not as five separate folders. Set here, not in addLevel(),
          // because removing a middle level renumbers everything below it.
          row.style.marginLeft = (i * 14) + "px";
          row.classList.toggle("is-new", named && !(w && w.id));
          mark.textContent = !named ? "" : (w && w.id) ? "✓" : "+";
          mark.title = !named ? "" : (w && w.id) ? "Already in your library" : "Will be created";
        });
        // The deepest level that HAS a name — a half-typed row at the bottom is
        // not yet the destination, and reading it as one would say "brand new"
        // about a path that is in fact entirely built already.
        const last = [...walked].reverse().find(w => w.name);
        // Every level exists -> that is the real folder the acts land in, and
        // its contents can clash. Anything else is brand new and therefore empty.
        const baseId = !segs.length ? basePid : (last && last.id ? last.id : undefined);
        fSum.innerHTML = `<b>${checks.filter(c => c.checked).length}</b> activities will go into ` +
          `<b>${escapeText(segs.length ? segs[segs.length - 1] : (hereName || ROOT_LABEL[state.root]))}</b>.`;

        const pathCache = new Map();
        for (let i = 0; i < acts.length; i++) {
          const a = acts[i];
          const row = checks[i].closest(".aw-imp-row");
          if (!row) continue;
          if (baseId === undefined) { row.classList.remove("is-dup"); continue; }
          const key = (a.subfolder || "").toString();
          let targetId;
          if (pathCache.has(key)) targetId = pathCache.get(key);
          else { targetId = await resolveFolderPath(baseId, key.split("/").filter(Boolean)); pathCache.set(key, targetId); }
          let dup = false;
          if (targetId !== undefined) {
            const kids = await listChildren(state.root, targetId);
            dup = kids.some(k => k.kind === "act" && sameName(k.title, a.title));
          }
          row.classList.toggle("is-dup", dup);
        }
      }
      // ---- the two steps ----------------------------------------------------
      // `step` is the only thing that decides which half of the dialog is on
      // screen and what the primary button does, so the two can never disagree.
      let step = 1;
      back.onclick = () => showStep(1);

      function showStep(n) {
        step = n;
        panel.style.display = n === 1 ? "flex" : "none";
        drop.style.display = n === 1 ? "" : "none";
        folder.style.display = n === 1 ? "none" : "";
        back.style.display = n === 1 ? "none" : "";
        err.style.display = "none";
        if (n === 1) refresh();
        else {
          const sel = checks.filter(c => c.checked).length;
          ok.textContent = `Import ${sel}`;
          ok.disabled = !sel;
        }
      }

      (async () => {
        // The folder the path hangs off, by name — this is what `trimPath()`
        // measures the proposed path against.
        if (basePid) {
          const here = await getItem(basePid);
          hereName = here ? itemName(here) : null;
        }
        const proposed = trimPath(sourcePath);
        fWhere.innerHTML =
          `Creating in <b>${escapeText(hereName || ROOT_LABEL[state.root])}</b>` +
          (pathKnown
            ? " — folders read from the file name."
            : sourcePath.length ? " — the file name didn't match a known series, so just one folder is proposed." : "");
        drawPath(proposed);
      })();

      ok.onclick = async () => {
        const chosen = acts.filter((_, i) => checks[i].checked);
        if (!chosen.length) return;
        // Step 1's button only moves on. Nothing is written until the folder
        // screen has been seen (thầy: "1 màn chốt thư mục nữa trước khi tạo").
        if (step === 1) { showStep(2); refreshDupState(); return; }

        const segs = pathSegments();
        if (pathInputs.length && pathInputs.some(i => !i.value.trim())) {
          showErr("One of the folder levels has no name — type it, or remove that level."); return;
        }

        const dupTicked = acts.some((a, i) => checks[i].checked && checks[i].closest(".aw-imp-row")?.classList.contains("is-dup"));
        if (dupTicked) {
          showErr("There's a name conflict with something already in your library — fix it (rename/delete the conflict, or untick the flagged row, on the previous screen), then Import again.");
          return;
        }

        const voiceEligible = chosen.filter(a => a.ttsEligible);
        let wantVoice = voiceEligible.length > 0;
        // ONE plan for the WHOLE import, not one per act (teacher's choice
        // 13/8/2026): the Male/Female balance is a property of everything
        // being generated in this run, so ENG1 and ENG2 share a single plan
        // and runVoiceBatch() walks it with a running offset.
        let voicePlan = null, voiceId = null;
        if (wantVoice) {
          const wordCount = voiceEligible.reduce((s, a) => s + voiceJobsOf(a).count, 0);
          const choice = readVoiceChoice();
          const resolved = ttsMod.planFor(choice, wordCount);
          voicePlan = resolved.plan; voiceId = choice.singleId;
          // "Skip voices" (or dismissing the dialog) does NOT cancel the
          // import — it only downgrades this run to text-only, same as if
          // every voice row had been unticked. The acts themselves are
          // always what "Import" promised.
          wantVoice = await confirmVoiceGeneration(wordCount, ttsMod.describeChoice(choice));
          if (wantVoice) {
            if (!choice.mix) ttsMod.setLastVoice(choice.singleId);
            ttsMod.setLastMix(choice);
          }
        }

        err.style.display = "none"; ok.disabled = true; ok.textContent = "Importing…";
        try {
          const res = await importBundle({ folderPath: segs, activities: chosen }, { parentId: basePid });
          if (res.errors && res.errors.length) {
            // Some acts failed — keep the dialog open so the problem isn't missed.
            report.style.display = ""; report.innerHTML = "";
            report.append(el("div", "aw-imp-done", `✓ Created ${res.created}${res.skipped ? `, skipped ${res.skipped}` : ""}.`));
            res.errors.slice(0, 8).forEach(m => report.append(el("div", "aw-ed-error", escapeText(m))));
            cancel.textContent = "Done"; ok.textContent = "Import"; ok.disabled = false;
            render();
            return;
          }
          // Done — auto-close, and open the DEEPEST folder of the path (that is
          // where the acts are). An empty path means "straight in here", so
          // there is nowhere to go and the current view just refreshes.
          close();
          if (segs.length && res.folderId) enterFolder("activities", res.folderId);
          else render();
          if (res.skipped) toast(`Imported ${res.created}, skipped ${res.skipped} already there`);
          // Voice generation runs AFTER the acts already exist (teacher's
          // request 10/8/2026) — the other acts in this import shouldn't wait
          // on a possibly-slow, sequential TTS batch.
          if (wantVoice) {
            const voiceActs = (res.createdActs || []).filter(a => a.ttsEligible);
            if (voiceActs.length) runVoiceBatch(voiceActs, { plan: voicePlan, voiceId }, ttsMod);
          }
        } catch (e) {
          ok.disabled = false; ok.textContent = `Import ${chosen.length}`;
          showErr(e && e.code === "aw/signed-out" ? "Please sign in first." : (e && e.message ? e.message : "Import failed."));
        }
      };
    }
  });
}
// Small OK/Skip gate before the (possibly slow, sequential) TTS batch
// starts — shown once, right before Import actually runs. Resolves false
// if skipped via either button or by dismissing the dialog (outside click
// / Escape) — openModal's onClose always fires, but a Promise only
// settles on its FIRST resolve() call, so a "Generate" click followed by
// the dialog's own close() (which re-fires onClose) is harmless.
// `voiceWhat` is core/voice-mix.js's describeChoice() — a ready sentence
// naming either the single voice or the mix about to be used.
function confirmVoiceGeneration(wordCount, voiceWhat) {
  return new Promise(resolve => {
    openModal("Generate voices?", (body, close) => {
      body.append(el("div", "aw-modal-text",
        `Will generate <b>${wordCount}</b> clip${wordCount === 1 ? "" : "s"} using <b>${escapeText(voiceWhat)}</b>. ` +
        `Runs after the import finishes — you'll need to be signed in to save the clips.`));
      const actions = el("div", "aw-modal-actions");
      const no = el("button", "aw-btn", "Skip voices"); no.type = "button";
      no.onclick = () => { resolve(false); close(); };
      const yes = el("button", "aw-btn aw-btn-primary", "Generate"); yes.type = "button";
      yes.onclick = () => { resolve(true); close(); };
      actions.append(no, yes);
      body.append(actions);
    }, () => resolve(false));
  });
}

// Generates voice for every item of every act in `acts` (already-created
// ENG1/ENG2 anagram acts, from importBundle()'s createdActs), sequentially,
// in its own modal — outside-click is ignored while running (same idiom as
// templates/anagram/anagram-editor.js's "Generate all voices" popover) so
// the batch can't be dismissed by accident, but the small red Cancel is
// always one click away (soft-cancel: the word in flight always finishes).
// Persists each act ONCE, right after ITS OWN words are done — not per
// word — so a cancel or sign-out partway through never loses whatever was
// already generated, and Firestore only takes 1 write per act either way.
// `choice` is { plan, voiceId }: `plan` is the one voice-per-word array built
// for the WHOLE import (null when the teacher picked a single voice), and the
// acts here are walked in the same order the plan was sized against, so each
// act reads its own slice through a running offset.
// How much work an act's voices are. Đợt 145: a vocabulary act holds several
// clue sets and each spoken one needs its OWN clip per word, so a 100-word act
// with ENG1 + ENG2 is 200 clips, not 100. `[null]` means "the act has no clue
// sets" — the plain, pre-Đợt-145 path, one clip per item read off `.clue`.
function voiceJobsOf(act) {
  const items = (act.content && act.content.items) || [];
  const variants = (act.ttsVariants && act.ttsVariants.length)
    ? act.ttsVariants
    : (voiceVariantsOf(act.content) || [null]);
  return { items, variants, count: items.length * variants.length };
}

function runVoiceBatch(acts, choice, ttsMod) {
  const GENERIC_CLUE_TEXT = "Unscramble the word";
  const overlay = el("div", "aw-modal-overlay");
  const modal = el("div", "aw-modal");
  modal.append(el("div", "aw-modal-title", "Generating voices"));
  const body = el("div", "aw-modal-body");
  modal.append(body);
  overlay.append(modal);
  let running = true;
  overlay.onclick = e => { if (e.target === overlay && !running) closeOverlay(); };
  document.body.append(overlay);
  function closeOverlay() { overlay.remove(); }

  const totalWords = acts.reduce((s, a) => s + voiceJobsOf(a).count, 0);
  const status = el("div", "aw-voice-status", `Generating 0 / ${totalWords}…`);
  const progressWrap = el("div", "aw-voice-progress");
  const progressFill = el("div", "aw-voice-progressfill");
  progressWrap.append(progressFill);
  const btnRow = el("div", "aw-modal-actions");
  const runCancelBtn = el("button", "aw-voice-runcancel", "Cancel");
  runCancelBtn.type = "button";
  btnRow.append(runCancelBtn);
  body.append(status, progressWrap, btnRow);

  let cancelled = false;
  runCancelBtn.onclick = () => { cancelled = true; runCancelBtn.disabled = true; runCancelBtn.textContent = "Cancelling…"; };

  (async () => {
    let doneWords = 0, failedWords = 0, signedOut = false;
    let planOffset = 0;   // how many words of `choice.plan` earlier acts already used
    for (const act of acts) {
      if (cancelled) break;
      const { items, variants } = voiceJobsOf(act);
      let anyDone = false;
      // Đợt 145 — one pass per SPOKEN CLUE SET. generateVoicesBatch works on a
      // flat list of `{clue, voice, voiceId}` rows and writes its results back
      // into those same objects, so each pass hands it a PROJECTION of this
      // variant and copies the answers into `item.voices[variant]` afterwards.
      // That keeps core/voice-batch.js (shared with the Anagram editor)
      // completely unaware that clue sets exist. Carrying the existing clip id
      // into the projection is what makes a re-run overwrite the same clip
      // instead of orphaning it — the same contract as "Regenerate".
      for (const variant of variants) {
        if (cancelled) break;
        const rows = variant
          ? items.map(it => ({ ...voiceOf(it, variant), clue: clueOf(it, variant) }))
          : items;
        // generateVoicesBatch's `index` is this row's position in THIS list,
        // so the shared plan is read at offset + index.
        const base = planOffset;
        const voiceFor = choice.plan ? ((it, i) => choice.plan[base + i]) : choice.voiceId;
        planOffset += rows.length;
        const label = variant ? `${act.title} · ${variant.toUpperCase()}` : act.title;
        const res = await ttsMod.generateVoicesBatch(rows, voiceFor, {
          textFor: it => (it.clue || "").trim() || GENERIC_CLUE_TEXT,
          isCancelled: () => cancelled,
          onProgress: (done, failed) => {
            status.textContent = `Generating ${doneWords + done + failedWords + failed} / ${totalWords}… (${label})`;
            progressFill.style.width = `${Math.round(((doneWords + done + failedWords + failed) / totalWords) * 100)}%`;
          }
        });
        if (variant) rows.forEach((r, i) => { if (r.voice) setVoiceOf(items[i], variant, r); });
        doneWords += res.done; failedWords += res.failed;
        if (res.done) anyDone = true;
        if (res.signedOut) { signedOut = true; break; }
      }
      // Saved ONCE per act, after all of its sets — a cancel or a sign-out
      // partway through still keeps whatever was generated before it.
      if (anyDone) {
        // Strip the import-only flags before persisting — they have no place
        // in the saved activity document.
        const { ttsEligible, ttsVariants, ...actToSave } = act;
        try { await saveActivity(actToSave, {}); } catch { /* left text-only; teacher can retry per-row in Edit */ }
      }
      if (signedOut) break;
    }
    running = false;
    runCancelBtn.style.display = "none";
    if (signedOut) {
      status.textContent = "Please sign in first — the words already voiced were saved; the rest stayed text-only.";
    } else if (cancelled) {
      status.textContent = `Cancelled — generated voice for ${doneWords} word(s) before stopping.`;
    } else {
      status.textContent = `Done — generated voice for ${doneWords} word(s)${failedWords ? `, ${failedWords} failed` : ""}.`;
    }
    const doneBtn = el("button", "aw-btn aw-btn-primary", "OK");
    doneBtn.type = "button"; doneBtn.onclick = closeOverlay;
    btnRow.innerHTML = ""; btnRow.append(doneBtn);
  })();
}

function renameFlow(node) {
  openTextModal("Rename", "New name", itemName(node), async name => {
    if (name.trim()) { await renameItem(node.id, name.trim()); render(); }
  });
}
function colorFlow(node) {
  openModal("Folder color", (body, close) => {
    const grid = el("div", "aw-colorgrid");
    const current = node.color || FOLDER_DEFAULT_COLOR;
    FOLDER_COLORS.forEach(c => {
      const sw = el("button", "aw-swatch" + (c.toLowerCase() === current.toLowerCase() ? " is-sel" : ""));
      sw.type = "button"; sw.title = c; sw.style.background = c;
      sw.onclick = async () => { await setFolderColor(node.id, c); close(); render(); };
      grid.append(sw);
    });
    body.append(grid);
    const actions = el("div", "aw-modal-actions");
    const reset = el("button", "aw-btn", "Default color"); reset.type = "button";
    reset.onclick = async () => { await setFolderColor(node.id, null); close(); render(); };
    const cancel = el("button", "aw-btn", "Cancel"); cancel.type = "button"; cancel.onclick = close;
    actions.append(reset, cancel);
    body.append(actions);
  });
}
// Đợt 218 — pin/unpin a folder to the Quick access panel. Turning a pin ON
// also makes sure the panel is SHOWING: a teacher who pins something and sees
// nothing happen has been told the feature is broken.
async function pinFlow(node) {
  const on = !node.pinned;
  await setFolderPinned(node.id, on);
  toast(on ? `Pinned “${itemName(node)}” to Quick access`
           : `Removed “${itemName(node)}” from Quick access`);
  render();
}

async function duplicateFlow(node) {
  // duplicateItem counts the name up ("... (2)") rather than refusing.
  try { await duplicateItem(node.id); } catch (e) { toastMsg(e.message || "Could not duplicate."); }
  render();
}
async function deleteFlow(node) {
  // An act may have assignments already out with students. Deleting the act
  // does NOT have to take them down (each holds its own copy of the game), so
  // ask rather than decide for the teacher.
  if (node.kind === "act") {
    let given = [];
    try { given = await listAssignmentsForAct(node.id); } catch (e) { /* offline: just delete the act */ }
    if (given.length) return deleteActWithAssignments(node, given);
  }
  await trashItem(node.id);
  render();
}

function deleteActWithAssignments(node, given) {
  openModal("Delete activity", (body, close) => {
    body.append(el("div", "aw-modal-text",
      `<b>${escapeText(itemName(node))}</b> has <b>${given.length}</b> assignment${given.length === 1 ? "" : "s"} ` +
      `given to students. Each assignment keeps its own copy of the game, so it can keep working ` +
      `and you keep the scores.`));
    const actions = el("div", "aw-modal-actions");
    const cancel = el("button", "aw-btn", "Cancel"); cancel.type = "button"; cancel.onclick = close;
    const keep = el("button", "aw-btn", "Delete activity only"); keep.type = "button";
    keep.onclick = async () => { close(); await trashItem(node.id); toastMsg("Activity deleted, assignments kept"); render(); };
    const both = el("button", "aw-btn aw-btn-primary", "Delete both"); both.type = "button";
    both.onclick = async () => {
      close();
      await trashItem(node.id);
      for (const a of given) { try { await trashAssignment(a.code); } catch (e) { /* keep going */ } }
      toastMsg("Activity and its assignments moved to the recycle bins");
      render();
    };
    actions.append(cancel, keep, both);
    body.append(actions);
  });
}
async function openInNewTab(node) {
  window.open(await linkFor(node), "_blank");
}

function enterFolder(root, folderId, opts = {}) {
  state.view = "folder"; state.root = root; state.folderId = folderId ?? null; state.query = "";
  // ⭐ Đợt 221 — the ONE funnel every way into a folder goes through (a card, a
  // breadcrumb, a Quick access row, a shared link, the Back button), so the
  // Recent list is written in exactly one place. `folderId` null is the top of a
  // tree, which is not a folder and never enters the list.
  qaPushRecent(root, state.folderId);
  if (!opts.fromUrl) syncUrl();
  render();
}

// ---------------- Move dialog (folder tree, same root) ----------------
async function moveFlow(node) {
  const folders = await listFolders(node.root);
  // build parent->children map for the tree; exclude the moving item's own subtree
  const forbidden = new Set([node.id]);
  if (node.kind === "folder") collectSubtree(folders, node.id, forbidden);

  openModal("Move to", (body, close) => {
    const tree = el("div", "aw-move-tree");
    let chosen = null;   // null = root
    const rootRow = pickRow(ROOT_LABEL[node.root], 0, null);
    tree.append(rootRow);
    renderChildren(null, 1);
    body.append(tree);

    const moveErr = el("div", "aw-ed-error", "");
    moveErr.style.display = "none";
    body.append(moveErr);

    const actions = el("div", "aw-modal-actions");
    const cancel = el("button", "aw-btn", "Cancel"); cancel.onclick = close;
    const ok = el("button", "aw-btn aw-btn-primary", "Move here"); ok.type = "button";
    ok.onclick = async () => {
      try { await moveItem(node.id, chosen); close(); render(); }
      catch (e) { moveErr.style.display = ""; moveErr.textContent = e.message || "Could not move it there."; }
    };
    actions.append(cancel, ok);
    body.append(actions);

    function renderChildren(parentId, depth) {
      folders.filter(f => (f.parentId ?? null) === (parentId ?? null) && !forbidden.has(f.id))
        .sort((a, b) => itemName(a).localeCompare(itemName(b)))
        .forEach(f => { tree.append(pickRow(itemName(f), depth, f.id)); renderChildren(f.id, depth + 1); });
    }
    function pickRow(label, depth, id) {
      const row = el("button", "aw-move-row");
      row.type = "button"; row.style.paddingLeft = (10 + depth * 18) + "px";
      row.append(el("span", "aw-move-ic", FOLDER_SVG), el("span", null, escapeText(label)));
      row.onclick = () => { chosen = id; tree.querySelectorAll(".aw-move-row").forEach(r => r.classList.remove("is-sel")); row.classList.add("is-sel"); };
      return row;
    }
  });
}
function collectSubtree(folders, id, set) {
  folders.filter(f => f.parentId === id).forEach(f => { set.add(f.id); collectSubtree(folders, f.id, set); });
}

// ---------------- small UI helpers: menu + modals ----------------
let openMenuEl = null;
function openMenu(anchor, items) {
  closeMenu();
  const menu = el("div", "aw-ctx");
  items.forEach(([label, fn, danger]) => {
    const b = el("button", "aw-ctx-item" + (danger ? " is-danger" : ""), escapeText(label));
    b.type = "button";
    b.onclick = () => { closeMenu(); fn(); };
    menu.append(b);
  });
  document.body.append(menu);
  const r = anchor.getBoundingClientRect();
  const mw = 190;
  let left = r.right - mw; if (left < 8) left = 8;
  menu.style.left = left + "px";
  menu.style.top = (r.bottom + 4) + "px";
  openMenuEl = menu;
  setTimeout(() => document.addEventListener("pointerdown", onMenuOutside), 0);
}
function onMenuOutside(e) { if (openMenuEl && !openMenuEl.contains(e.target)) closeMenu(); }
function closeMenu() { if (openMenuEl) { openMenuEl.remove(); openMenuEl = null; document.removeEventListener("pointerdown", onMenuOutside); } }

// `onClose` (optional) fires whenever the modal goes away — including when the
// user dismisses it by clicking the backdrop. Callers that await a modal MUST
// use it, otherwise a backdrop click leaves them waiting forever.
function openModal(title, buildBody, onClose) {
  const overlay = el("div", "aw-modal-overlay");
  const modal = el("div", "aw-modal");
  modal.append(el("div", "aw-modal-title", escapeText(title)));
  const body = el("div", "aw-modal-body");
  modal.append(body);
  overlay.append(modal);
  overlay.onclick = e => { if (e.target === overlay) close(); };
  document.body.append(overlay);
  buildBody(body, close);
  return { close };
  function close() {
    if (!overlay.isConnected) return;   // guard: close() may be called twice
    overlay.remove();
    onClose?.();
  }
}
// `onOk` may be async and may THROW — a duplicate name, for example. The dialog
// then stays open and shows the reason instead of silently doing nothing.
function openTextModal(title, placeholder, value, onOk) {
  openModal(title, (body, close) => {
    const inp = el("input", "aw-ed-input"); inp.placeholder = placeholder; inp.value = value || "";
    body.append(inp);
    const err = el("div", "aw-ed-error", "");
    err.style.display = "none";
    body.append(err);
    const actions = el("div", "aw-modal-actions");
    const cancel = el("button", "aw-btn", "Cancel"); cancel.type = "button"; cancel.onclick = close;
    const ok = el("button", "aw-btn aw-btn-primary", "OK"); ok.type = "button";
    const submit = async () => {
      ok.disabled = true;
      err.style.display = "none";
      try {
        await onOk(inp.value);
        close();
      } catch (e) {
        ok.disabled = false;
        err.style.display = "";
        err.textContent = e.message || "That did not work.";
        inp.focus(); inp.select();
      }
    };
    ok.onclick = submit;
    inp.onkeydown = e => { if (e.key === "Enter") submit(); if (e.key === "Escape") close(); };
    actions.append(cancel, ok);
    body.append(actions);
    setTimeout(() => { inp.focus(); inp.select(); }, 0);
  });
}

// ---------------- header (brand + right-side button cluster) ----------------
// Shown on every library page and every edit page. Left = brand cluster.
// Right = Settings gear; on non-home pages ALSO Activities + Results quick-nav,
// forming a balanced cluster opposite the brand.
function topbar(showNav) {
  const bar = el("div", "aw-appbar");
  bar.append(logo(showNav));

  const right = el("div", "aw-appbar-right");
  if (showNav) {
    right.append(navBtn("Activities", "activities"));
    right.append(navBtn("Results", "results"));
  }
  // ⭐⭐⭐ Đợt 236 — SHOWDOWN, the full-page durable ledger. Icon only, gold,
  // glowing (thầy's own words) — same gold pulse as the in-game ANALYSE button
  // (`aw-sd-rec-analyseglow`, core/app.css), reused rather than a second
  // keyframe for the same idea. HOME PAGE ONLY (thầy said "trang chủ"
  // specifically): the library/editor pages already carry Activities/Results/
  // Settings, and a fourth icon there would compete with those for no reason —
  // this is a destination you go TO, not a tool you reach for mid-browse.
  if (!showNav) {
    const sd = el("button", "aw-appbtn aw-sdh-homebtn", icons.showdown);
    sd.type = "button"; sd.title = "Showdown results"; sd.setAttribute("aria-label", "Showdown results");
    sd.append(el("span", "aw-sdh-homebtn-word", "ANALYSE"));
    // ⭐ Đợt 237 — same icon does double duty: off the Showdown page it is
    // plain navigation; ON the page (state.view === "showdown-home", topbar(false)
    // is rendered there too — see renderShowdownHome()) a second tap morphs it
    // into the ANALYSE pill instead of re-opening the page it is already on.
    sd.onclick = () => {
      if (state.view === "showdown-home" && showdownHomeHandle) showdownHomeHandle.toggleChoosing();
      else openShowdownHome();
    };
    sdHomeBtnSetAnalyse = on => { sd.classList.toggle("is-analyse", on); sd.title = on ? "Cancel analyse" : "Showdown results"; };
    right.append(sd);
  } else {
    sdHomeBtnSetAnalyse = null;
  }
  const gear = el("button", "aw-appbtn aw-settings-btn", icons.settings);
  gear.type = "button"; gear.title = "Settings"; gear.setAttribute("aria-label", "Settings");
  gear.onclick = openSettingsFlow;
  right.append(gear);
  if (state.user) right.append(accountBtn());
  bar.append(right);

  // make "in ANDREW CLASSES" exactly as wide as the "AWord" logo (by spacing
  // out its letters — keeps each glyph's natural shape, no stretching)
  requestAnimationFrame(() => sizeBrand(bar));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => sizeBrand(bar));
  return bar;
}

// Centered footer shown at the bottom of every library/editor page.
function footer() {
  const f = el("div", "aw-foot");
  f.append(el("div", "aw-foot-line", "Phone &amp; Zalo: 0359.769.765"));
  f.append(el("div", "aw-foot-line aw-foot-copy",
    "Copyright © 2018 - 2026 ANDREW CLASSES by Pham Xuan Ninh. All Rights Reserved."));
  return f;
}

// Signed-in account chip: the teacher's Google photo (or initial), opening a
// small menu with Sign out.
function accountBtn() {
  const b = el("button", "aw-appbtn aw-account-btn");
  b.type = "button";
  b.title = state.user.email || "Account";
  b.setAttribute("aria-label", "Account");
  if (state.user.photoURL) {
    const img = el("img", "aw-account-img");
    img.src = state.user.photoURL;
    img.alt = "";
    img.referrerPolicy = "no-referrer";   // Google blocks hot-linking with a referrer
    b.append(img);
  } else {
    b.append(el("span", "aw-account-ini", escapeHtml((state.user.email || "?")[0].toUpperCase())));
  }
  // openMenu takes [label, fn, danger] tuples. The account email is already the
  // button's tooltip, so the menu only needs the one real action.
  b.onclick = () => openMenu(b, [["Sign out", doSignOut]]);
  return b;
}

async function doSignOut() {
  try { await signOutNow(); } catch { /* ignore */ }
  resetCache();
  resetClassesCache();
  resetShowdownCache();
  clearShowdownPick();     // Đợt 155 — see the matching pair in the sign-in path
  state.user = null;
  state.view = "top"; state.root = null; state.folderId = null; state.query = "";
  renderLogin();
}

function navBtn(label, root) {
  const b = el("button", "aw-appnav" + (state.view !== "top" && state.root === root ? " is-on" : ""));
  b.type = "button";
  b.append(el("span", "aw-appnav-ic", icons.folder), el("span", null, label));
  b.onclick = () => openRoot(root);
  return b;
}

// Space out the tagline so its total width equals the logo's width — WITHOUT
// distorting the letters (only letter-spacing changes, glyph shapes are kept).
function sizeBrand(scope) {
  (scope || document).querySelectorAll(".aw-brand").forEach(brand => {
    const logoEl = brand.querySelector(".aw-brand-logo");
    const subEl = brand.querySelector(".aw-brand-sub");
    if (!logoEl || !subEl) return;
    subEl.style.letterSpacing = "0px";
    const L = logoEl.getBoundingClientRect().width;
    const w0 = subEl.getBoundingClientRect().width;   // natural width, no spacing
    const n = (subEl.textContent || "").length;
    if (n > 1 && L > w0) {
      // extra width shared across the gaps AFTER each character; subtract the
      // trailing gap so the last glyph lands on the logo's right edge.
      const ls = (L - w0) / (n - 1);
      subEl.style.letterSpacing = ls.toFixed(3) + "px";
      subEl.style.marginRight = (-ls).toFixed(3) + "px";
    }
  });
}

// The brand cluster (AWord + "in ANDREW CLASSES"). Clickable EVERYWHERE it
// appears -> back to the top-level home (the two main folders).
function logo(small) {
  const w = el("button", "aw-brand" + (small ? " is-sm" : ""));
  w.type = "button";
  w.title = "Home";
  w.onclick = goTop;
  w.append(
    el("div", "aw-brand-logo", 'A<span>Word</span>'),
    el("div", "aw-brand-sub", 'in <b>ANDREW CLASSES</b>')
  );
  return w;
}

// ---------------- Settings (multi-row menu) ----------------
// Settings menu -> "Default activity options" -> pick a template -> its options.
// (More rows will be added here in the future.)
function openSettingsFlow() {
  closeMenu();
  openModal("Settings", (body, close) => {
    const titleEl = body.parentElement.querySelector(".aw-modal-title");
    const setTitle = (text, onBack) => {
      titleEl.innerHTML = "";
      if (onBack) {
        const back = el("button", "aw-set-back", "‹"); back.type = "button";
        back.title = "Back"; back.onclick = onBack;
        titleEl.append(back);
      }
      titleEl.append(document.createTextNode(text));
    };

    showMenu();

    function showMenu() {
      body.closest(".aw-modal")?.classList.remove("is-optswide");
      setTitle("Settings", null);
      body.innerHTML = "";
      const list = el("div", "aw-set-menu");
      list.append(menuRow("Default activity options",
        "Set the options new activities start with", () => showTemplates("activity")));
      list.append(menuRow("Default homework options",
        "Set the options a new assignment starts with", () => showTemplates("homework")));
      list.append(menuRow("Classes",
        "Class rolls used by activities that call pupils by name", showClasses));
      // ⭐ Đợt 274 (27/8/2026, thầy) — a meme sound effect for wrong answers,
      // for playing along in class only. Never touches homework/assignment —
      // see core/wrong-sound.js's setAssignmentMode().
      list.append(menuRow("Wrong-answer sound",
        "A fun sound for wrong answers in class (never used for homework)", showWrongSound));
      // placeholder rows for features coming later
      list.append(menuRow("Appearance", "Coming soon", null));
      list.append(menuRow("Leaderboard & results", "Coming soon", null));
      body.append(list);
    }

    // ---------- Classes ----------
    // The roll is app-wide data (core/classes.js), not activity content:
    // Running team deals its turns to real pupils by name, and later activities
    // will want the same list. Everything here is async — the rolls live in
    // Firestore next to the library, so every machine signed into the teacher's
    // account sees the same classes.
    // ⭐ Đợt 192 (thầy: "Bỏ hết các text hướng dẫn đi" · "Thêm 1 ô add a new
    // class ở cuối cột lớp") — the screen is now nothing but the list itself.
    // The paragraph explaining what a class is, and the "create" row bolted on
    // ABOVE the list, are both gone: a new class is made where the eye already
    // ends up, at the BOTTOM of the list, by the same tile that shows what is
    // there. One idea per screen, and the screen says it by its shape.
    async function showClasses() {
      body.closest(".aw-modal")?.classList.remove("is-classwide");
      setTitle("Classes", showMenu);
      body.innerHTML = "";

      const listWrap = el("div", "aw-set-menu");
      body.append(listWrap);
      listWrap.append(el("div", "aw-set-hint", "Loading…"));
      try {
        const classes = await listClasses();
        listWrap.innerHTML = "";
        classes.forEach(c => {
          const n = c.students.length;
          listWrap.append(menuRow(c.name,
            n === 1 ? "1 pupil" : `${n} pupils`,
            () => showClassEditor(c.id)));
        });
        listWrap.append(addClassTile(listWrap));
      } catch (e) {
        listWrap.innerHTML = "";
        listWrap.append(el("div", "aw-set-hint", e.message || "Could not load your classes."));
      }
    }

    /**
     * The last row of the class list: a dashed slot that BECOMES the input.
     * An inline field rather than prompt(): prompt() is blocked in embedded
     * views (myActivity's WebContentsView among them) and would fail silently
     * exactly where the teacher works — the same reason Showdown's own
     * "Add member" row is built this way.
     */
    function addClassTile(listWrap) {
      const tile = el("button", "aw-set-addtile", "+ Add a new class");
      tile.type = "button";
      tile.onclick = () => {
        const holder = el("div", "aw-set-addtile is-editing");
        const inp = el("input", "aw-set-addinput");
        inp.placeholder = "Class name";
        inp.maxLength = 40;
        let closed = false;
        const commit = async () => {
          if (closed) return;
          closed = true;
          const name = inp.value.trim();
          if (!name) { holder.replaceWith(tile); return; }
          try {
            const cls = await createClass(name);
            toast(`Class "${cls.name}" created`);
            await showClassEditor(cls.id);
          } catch (e) {
            holder.replaceWith(tile);
            showSetError(e.message || "Could not create the class.");
          }
        };
        inp.onkeydown = ev => {
          if (ev.key === "Enter") { ev.preventDefault(); commit(); }
          // Escape must not commit — blur fires on the way out and would
          // otherwise create a class the teacher had just decided against.
          if (ev.key === "Escape") { closed = true; holder.replaceWith(tile); }
        };
        inp.onblur = commit;
        holder.append(inp);
        tile.replaceWith(holder);
        inp.focus();
      };
      return tile;
    }

    // ⭐⭐ Đợt 192 — ONE BOX PER PUPIL, IN COLUMNS (thầy: "nhập các ô tên học
    // sinh tương tự bố cục nhập dữ liệu trong Anagram, được chia thành các cột như
    // vậy · Bố trí tối đa là 20 học sinh để không cần phải scroll").
    //
    // This REPLACES the one-name-per-line textarea. What the textarea could not
    // do is carry anything ALONGSIDE a name: Đợt 191 had to bolt boy/girl on as
    // a second grid of chips underneath, keyed by lowercased NAME because the
    // textarea had no row to hang an id on — which quietly got two pupils of
    // the same name wrong. A real row per pupil ends that: the gender, the
    // delete and the drag handle all belong to the row, and the row still knows
    // its pupil id, so ids survive an edit without any name-matching at all
    // (mergeStudents is no longer needed here — setStudents/normalize takes the
    // records as they are).
    // ⚠ THE EXCEL PASTE IS KEPT. It was the whole point of the textarea and the
    // teacher still pastes a register column out of Excel — pasting into any
    // name box fills from that row down (onNamePaste), reusing the id of anyone
    // whose name comes back unchanged. Take this out and the screen becomes 20
    // pieces of typing.
    const CLS_COL_ROWS = 10;      // 10 rows × 2 columns = the 20 that must not scroll
    async function showClassEditor(id) {
      setTitle("Class", showClasses);
      body.innerHTML = "";
      body.append(el("div", "aw-set-hint", "Loading…"));

      let cls;
      try {
        const all = await listClasses();
        cls = all.find(c => c.id === id);
      } catch (e) {
        body.innerHTML = "";
        body.append(el("div", "aw-set-hint", e.message || "Could not load the class."));
        return;
      }
      if (!cls) { showClasses(); return; }

      body.innerHTML = "";
      setTitle(cls.name, showClasses);
      // Two columns of pupil rows do not fit the 440px dialog every other
      // settings screen uses. Removed again by showClasses() on the way back.
      body.closest(".aw-modal")?.classList.add("is-classwide");

      const errBar = el("div", "aw-ed-error");
      errBar.style.display = "none";
      body.append(errBar);

      const nameField = el("div", "aw-ed-field");
      nameField.append(el("label", "aw-ed-label", "Class name"));
      const nameInput = el("input", "aw-ed-input");
      nameInput.value = cls.name;
      nameInput.maxLength = 40;
      nameInput.oninput = hideErr;
      nameField.append(nameInput);
      body.append(nameField);

      // The working copy. Every row keeps the pupil's REAL id, so reordering,
      // renaming and deleting all leave the ids of everyone else untouched — a
      // saved Running team roster names its pupils by id.
      let rows = (cls.students || []).map(st => ({ id: st.id, name: st.name, gender: st.gender || "" }));

      const grid = el("div", "aw-cls-grid");
      const addWrap = el("div", "aw-cls-addwrap");
      body.append(grid, addWrap);
      renderRows();

      const actions = el("div", "aw-modal-actions");
      const delBtn = el("button", "aw-btn aw-ed-bulkdanger", "Delete class");
      delBtn.type = "button";
      delBtn.onclick = async () => {
        if (!confirm(`Delete the class "${cls.name}" and its ${cls.students.length} pupil(s)?\n\nThis cannot be undone.`)) return;
        delBtn.disabled = true;
        try {
          await deleteClass(cls.id);
          toast(`Class "${cls.name}" deleted`);
          await showClasses();
        } catch (e) {
          delBtn.disabled = false;
          showErr(e.message || "Could not delete the class.");
        }
      };
      const saveBtn = el("button", "aw-btn aw-btn-primary", "Save");
      saveBtn.type = "button";
      saveBtn.onclick = async () => {
        const newName = nameInput.value.trim();
        if (!newName) { showErr("Please enter a class name."); return; }
        saveBtn.disabled = true;
        const label = saveBtn.textContent;
        saveBtn.textContent = "Saving…";
        try {
          // Blank rows simply do not exist — normalize() drops any record with
          // an empty name, so an untouched "Add a new student" row costs nothing
          // and the teacher never has to tidy up before saving.
          const students = rows
            .map(r => ({ id: r.id || "", name: String(r.name || "").replace(/\s+/g, " ").trim(), gender: r.gender }))
            .filter(r => r.name);
          await setStudents(cls.id, students);
          if (newName !== cls.name) await renameClass(cls.id, newName);
          toast("Class saved");
          await showClasses();
        } catch (e) {
          saveBtn.disabled = false;
          saveBtn.textContent = label;
          showErr(e.message || "Could not save the class.");
        }
      };
      actions.append(delBtn, saveBtn);
      body.append(actions);
      nameInput.focus();

      // ---- the pupil grid --------------------------------------------------
      function renderRows() {
        grid.innerHTML = "";
        // COLUMN-MAJOR, and that is the whole trick: `grid-auto-flow: column`
        // with a stated row count fills 1-10 down the left column and 11-20 down
        // the right, which is how a register is read. Left to right instead
        // would put pupil 2 beside pupil 1 and the numbering would zig-zag.
        // The row count grows for a class of more than 20 (it then scrolls,
        // which is honest) but never shrinks below 10, so a class of 4 does not
        // sit in a box a quarter the height of the one next door.
        // ⚠ THE ADD TILE IS NOT A CELL OF THIS GRID, and that is measured, not
        // taste. Counted as a 21st cell it pushed the row count to 11, which
        // both split the class 11/9 instead of 10/10 and made the dialog 46px
        // taller — and the teacher's brief for this screen is that TWENTY
        // pupils fit with no scrolling. Measured: in the grid, 735px of dialog;
        // below it, 689px, against the 80vh cap (864px on the 1080p classroom
        // board). Put it back in the grid and both the symmetry and the margin
        // go with it.
        const rowCount = Math.max(CLS_COL_ROWS, Math.ceil(rows.length / 2));
        grid.style.gridTemplateRows = `repeat(${rowCount}, auto)`;
        rows.forEach((r, i) => grid.append(pupilRow(r, i)));
        addWrap.innerHTML = "";
        if (rows.length < MAX_STUDENTS) addWrap.append(addPupilTile());
      }

      function addPupilTile() {
        const add = el("button", "aw-cls-add", "+ Add a new student");
        add.type = "button";
        add.onclick = () => {
          rows.push({ id: "", name: "", gender: "" });
          renderRows();
          const boxes = grid.querySelectorAll(".aw-cls-name");
          boxes[boxes.length - 1]?.focus();
        };
        return add;
      }

      function pupilRow(r, i) {
        const row = el("div", "aw-cls-row");
        row.dataset.idx = String(i);
        row.append(el("span", "aw-cls-num", String(i + 1)));

        const inp = el("input", "aw-cls-name");
        inp.value = r.name;
        inp.maxLength = 40;
        inp.placeholder = "Name";
        // ⚠ A NAME IS NEVER CUT is the house rule (see shortenName in
        // core/showdown-setup.js), but an <input> cannot honour it the way a
        // display chip can: it has no ellipsis and no abbreviated form, it just
        // stops drawing at its right edge. The box is sized for the long
        // Vietnamese names that actually occur (measured, see app.css), and the
        // title carries the whole name for the ones that still run past it —
        // the value itself is never touched, so nothing is ever lost.
        inp.title = r.name;
        inp.oninput = () => { r.name = inp.value; inp.title = inp.value; hideErr(); };
        inp.addEventListener("paste", e => onNamePaste(e, i));
        row.append(inp);

        // ⭐ The long two-half button (thầy: "Cạnh ô nhập tên có 1 nút dài có 2
        // nửa BOY và GIRL, bấm vào cái nào thì cái đó sáng").
        // Tapping the LIT half turns it off again: nothing else on this screen
        // can undo a mis-tap, and "not set" is a real, common state — it is what
        // a class that never bothers with this looks like, and Showdown's
        // shuffle deals those pupils exactly as it always did.
        const seg = el("div", "aw-cls-seg");
        [["m", icons.boy, "BOY"], ["f", icons.girl, "GIRL"]].forEach(([g, svg, text]) => {
          const half = el("button", `aw-cls-half is-${g}` + (r.gender === g ? " is-on" : ""),
            `<span class="aw-cls-halficon">${svg}</span><span class="aw-cls-halftext">${text}</span>`);
          half.type = "button";
          half.dataset.g = g;
          half.title = text === "BOY" ? "Boy" : "Girl";
          half.onclick = () => {
            r.gender = r.gender === g ? "" : g;
            // Repaint THIS control only. A full renderRows() here would rebuild
            // every input on the screen and take the caret out of whichever name
            // the teacher was halfway through typing.
            seg.querySelectorAll(".aw-cls-half").forEach(x =>
              x.classList.toggle("is-on", x.dataset.g === r.gender));
          };
          seg.append(half);
        });
        row.append(seg);

        const del = el("button", "aw-cls-iconbtn aw-cls-del", icons.trash);
        del.type = "button"; del.title = "Remove";
        del.onclick = () => { rows.splice(i, 1); renderRows(); };
        row.append(del);

        const handle = el("button", "aw-cls-iconbtn aw-cls-drag", icons.dragHandle);
        handle.type = "button"; handle.title = "Drag to reorder";
        wireReorder(handle, row, i);
        row.append(handle);

        return row;
      }

      /**
       * Drag a row to a new place.
       * ⚠⚠ POINTER EVENTS, NOT HTML5 DRAG-AND-DROP — and this is the one place
       * this file deliberately parts company with the anagram editor and the
       * library's folder cards, which both use `draggable` + dragstart/drop.
       * Native DnD DOES NOT FIRE FROM A FINGER. The teacher's classroom machine
       * is an infrared touch panel (TOMKO TK-TT86, the whole reason
       * core/press.js exists), so a reorder built on `draggable` would be a
       * control that simply does nothing on the machine it was asked for, while
       * testing perfectly on a mouse. Pointer events cover both.
       */
      function wireReorder(handle, row, from) {
        let active = false;
        const clear = () => {
          grid.querySelectorAll(".aw-cls-row").forEach(r => r.classList.remove("is-droptarget"));
        };
        handle.addEventListener("pointerdown", e => {
          if (e.button !== 0) return;
          e.preventDefault();               // or the browser starts a text selection instead
          active = true;
          row.classList.add("is-dragging");
          try { handle.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
        });
        handle.addEventListener("pointermove", e => {
          if (!active) return;
          clear();
          const over = rowUnder(e.clientX, e.clientY);
          if (over && over !== row) over.classList.add("is-droptarget");
        });
        const finish = e => {
          if (!active) return;
          active = false;
          row.classList.remove("is-dragging");
          const over = rowUnder(e.clientX, e.clientY);
          clear();
          if (!over || over === row) return;
          const to = Number(over.dataset.idx);
          if (!Number.isInteger(to) || to === from) return;
          const [moved] = rows.splice(from, 1);
          rows.splice(to, 0, moved);
          renderRows();
        };
        handle.addEventListener("pointerup", finish);
        handle.addEventListener("pointercancel", () => { active = false; row.classList.remove("is-dragging"); clear(); });
      }

      /** Which pupil row is under this point (the dragged row's own handle has
       *  pointer capture, but elementFromPoint is unaffected by capture). */
      function rowUnder(x, y) {
        const hit = document.elementFromPoint(x, y);
        return hit ? hit.closest(".aw-cls-row") : null;
      }

      /**
       * Paste a column copied out of Excel into any name box: it fills from THAT
       * row downward, exactly as the anagram editor's row paste does.
       * ⚠ Ids are RE-USED by name for the rows being overwritten — this is what
       * the old mergeStudents() did and it still matters: pasting the same
       * register back with one correction must not hand every pupil a new id and
       * orphan a Running team roster already printed against them.
       */
      function onNamePaste(e, at) {
        const text = (e.clipboardData || window.clipboardData)?.getData("text/plain") || "";
        if (!/[\r\n\t]/.test(text)) return;         // a single cell — let the ordinary paste happen
        e.preventDefault();
        const names = parseStudentNames(text);
        if (!names.length) return;
        // Only rows AT or AFTER the paste point may donate an id; the ones above
        // are staying exactly where they are and still hold theirs.
        const pool = new Map();
        rows.slice(at).forEach(r => {
          const k = String(r.name || "").trim().toLowerCase();
          if (!k) return;
          if (!pool.has(k)) pool.set(k, []);
          pool.get(k).push(r);
        });
        const made = names.map(n => {
          const q = pool.get(n.trim().toLowerCase());
          const old = q && q.length ? q.shift() : null;
          return { id: old ? old.id : "", name: n, gender: old ? old.gender : "" };
        });
        rows = rows.slice(0, at).concat(made).slice(0, MAX_STUDENTS);
        renderRows();
      }

      // `scrollTop = 0` is not decoration: the pupil grid makes this dialog tall,
      // and an error bar at the very top of a scrolled-down dialog is an error
      // nobody sees. Carried over from the screen this one replaced.
      function showErr(msg) { errBar.textContent = msg; errBar.style.display = "block"; body.scrollTop = 0; }
      function hideErr() { if (errBar.style.display !== "none") errBar.style.display = "none"; }
    }

    function showSetError(msg) {
      toast(msg);
    }

    // `kind`: "activity" (Default activity options, unchanged since Đợt 143) or
    // "homework" (Đợt C, 15/8/2026 — what a NEW "Set assignment" form starts
    // with). Same screens, same builder, a separate bucket in localStorage —
    // see settings.js's bucketKey().
    function showTemplates(kind) {
      body.closest(".aw-modal")?.classList.remove("is-optswide");
      setTitle(kind === "homework" ? "Default homework options" : "Default activity options", showMenu);
      body.innerHTML = "";
      body.append(el("div", "aw-set-hint", "Choose a template to set its default options."));
      const grid = el("div", "aw-pick-grid");
      TEMPLATES.forEach(t => {
        const card = el("button", "aw-pick-card" + (t.built ? "" : " is-soon"));
        card.type = "button";
        card.append(el("div", "aw-pick-name", t.label), el("div", "aw-pick-blurb", t.blurb || ""));
        if (!t.built) card.append(el("span", "aw-pick-soon", "Coming soon"));
        card.onclick = () => { if (!t.built) { toast(`${t.label} — coming soon`); return; } showOptions(t, kind); };
        grid.append(card);
      });
      body.append(grid);
    }

    // Đợt 143 — this screen now shows the FULL Options panel for the chosen
    // game, built by the very same function the in-game panel uses. It used to
    // show a quiz-shaped form of four controls whatever the game was.
    // `async` because most of those controls come from the template's own
    // buildExtraOptions, so the template module has to be loaded first — the
    // Settings dialog is reachable without ever having played anything.
    async function showOptions(t, kind) {
      const isHw = kind === "homework";
      setTitle(`${t.label} ${isHw ? "homework " : ""}defaults`, () => showTemplates(kind));
      body.innerHTML = "";
      body.append(el("div", "aw-set-hint", isHw
        ? `A new "Set assignment" form for ${t.label} will start with these options.`
        : `New ${t.label} activities will start with these options.`));
      // The full panel is a 2-column grid; the 440px Settings dialog is too
      // narrow for a 3-choice segmented control in half of that (measured in
      // Đợt 140: under ~186px a column can't hold one). Widen to the same width
      // the in-game panel uses, and drop the class again on every other screen
      // of this dialog so only THIS one is wide.
      const modalEl = body.closest(".aw-modal");
      if (modalEl) modalEl.classList.add("is-optswide");
      const draft = getDefaultOptions(t.type, kind);   // working copy; saved only on Save
      let tpl = null;
      try { tpl = await ensureTemplate(t.type); } catch (e) { tpl = null; }
      // The teacher can close the dialog while the module is still loading.
      if (!body.isConnected) return;
      // ⭐ Đợt 245 — `kind` travels through. Settings ▸ Default HOMEWORK options
      // feeds the "Set assignment" form, so it must drop the same dead "Show
      // answers at end" switch that form drops (see core/options-panel.js).
      // Default ACTIVITY options keeps it — an act played in class really does
      // read `activity.options.showAnswers`.
      // ⚠️ No `act` here on purpose: a DEFAULT has no act, so there are no clue
      // sets to name and the bare Text/Voice switch is correct.
      body.append(buildOptionsControls(tpl, draft, { kind }));
      const actions = el("div", "aw-modal-actions");
      const cancel = el("button", "aw-btn", "Cancel"); cancel.type = "button"; cancel.onclick = close;
      const save = el("button", "aw-btn aw-btn-primary", "Save"); save.type = "button";
      save.onclick = () => { saveDefaultOptions(t.type, draft, kind); close(); toast("Settings saved"); };
      actions.append(cancel, save);
      body.append(actions);
    }

    // ⭐ Đợt 274 (27/8/2026, thầy) — pick which sound plays on a wrong
    // click/pick/answer during normal play. Saved and applied immediately
    // (core/wrong-sound.js), no separate Save button — same "tap to apply"
    // feel as the mute toggle in-game. Tapping a meme choice also previews it
    // right away so the teacher can hear it before leaving the screen.
    function showWrongSound() {
      body.closest(".aw-modal")?.classList.remove("is-optswide");
      setTitle("Wrong-answer sound", showMenu);
      body.innerHTML = "";
      const list = el("div", "aw-set-menu");
      const rows = new Map();
      WRONG_SOUND_OPTIONS.forEach(opt => {
        const row = el("button", "aw-set-row" + (opt.id === getWrongSoundChoice() ? " is-current" : ""));
        row.type = "button";
        const txt = el("div", "aw-set-rowtext");
        txt.append(el("div", "aw-set-rowtitle", opt.label));
        row.append(txt, el("span", "aw-set-check", "✓"));
        row.onclick = () => {
          setWrongSoundChoice(opt.id);
          rows.forEach((r, id) => r.classList.toggle("is-current", id === opt.id));
          if (opt.file) previewWrongSound(opt.id);
        };
        rows.set(opt.id, row);
        list.append(row);
      });
      body.append(list);
    }

    function menuRow(title, sub, onClick) {
      const row = el("button", "aw-set-row" + (onClick ? "" : " is-disabled"));
      row.type = "button";
      const txt = el("div", "aw-set-rowtext");
      txt.append(el("div", "aw-set-rowtitle", title), el("div", "aw-set-rowsub", sub));
      row.append(txt);
      if (onClick) { row.append(el("span", "aw-set-chev", "›")); row.onclick = onClick; }
      else row.disabled = true;
      return row;
    }
  });
}

// small floating toast (library pages have no engine toast of their own)
let toastTimer = null;
function toast(msg) {
  let t = document.querySelector(".aw-lib-toast");
  if (!t) { t = el("div", "aw-lib-toast"); document.body.append(t); }
  t.textContent = msg;
  t.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("is-on"), 2200);
}
function escapeText(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const GRID_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>';
const LIST_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="3" y="4" width="18" height="3" rx="1.5"/><rect x="3" y="10.5" width="18" height="3" rx="1.5"/><rect x="3" y="17" width="18" height="3" rx="1.5"/></svg>';
