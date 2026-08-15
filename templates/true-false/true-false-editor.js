// =============================================================
// TRUE FALSE EDITOR — the form a teacher uses to create or edit a True/false
// activity. Same contract as templates/quiz/quiz-editor.js:
//   openTfEditor(container, activity, { onSave, onCancel, header, footer })
// Reuses the SHARED editor page chrome from core/app.css (.aw-ed-* header/
// title field/tip/bulk bar/count).
//
// LAYOUT (teacher's spec, 1/8/2026): TWO COLUMNS instead of a per-row
// True/False toggle — the left column holds the statements that are TRUE, the
// right column holds the statements that are FALSE. On save both columns are
// merged into the same `content.statements = [{text, answer}]` shape the game
// already reads, so activities made with the old editor still load and play.
// Because the game now ALWAYS shuffles, the two columns carry no play order and
// there's no reorder handle to worry about — just add / duplicate / delete.
//
// SCOPE (same simplification as the other templates, per Teacher Andrew):
// this page edits ONLY the title + the two statement lists. Theme is always
// Classic; default options (speed/lives/repeat/...) live in Settings; per-act
// options are tweaked from the in-game Options panel. Limits: max 40
// statements total, min 3 (and at least one on each side, so the game is
// actually True-OR-false).
// =============================================================

import { el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";
// Đợt 146 — a reading act holds BOTH halves of the same exercise (READINGACT1 =
// practice, READINGACT2 = homework). No-ops for an act without halves.
import { makeSetTabs, foldEditedSet, expandSetsForEditing, activeContentSet } from "../../core/content-view.js";

const MIN_ITEMS = 3;
const MAX_ITEMS = 40;

// How a pasted Excel cell in an answer column is read as True/False.
function parseAnswer(cell) {
  const t = String(cell || "").trim().toLowerCase();
  if (["true", "t", "1", "yes", "y", "correct", "right", "đúng", "dung"].includes(t)) return true;
  if (["false", "f", "0", "no", "n", "wrong", "incorrect", "sai"].includes(t)) return false;
  return null;   // unrecognised
}

export function openTfEditor(container, activity, { onSave, onCancel, header, footer } = {}) {
  const isNew = !(activity && activity.id);
  const data = normalize(activity);   // data.trueTexts[] , data.falseTexts[] (arrays of strings)

  container.innerHTML = "";
  const page = el("div", "aw-ed");
  if (header) page.append(header);

  // ---- Sticky action bar: act-type badge + heading  |  Cancel / Save ----
  const head = el("div", "aw-ed-head");
  const headL = el("div", "aw-ed-headleft");
  headL.append(el("span", "aw-ed-typebadge", "TRUE OR FALSE"));
  headL.append(el("div", "aw-ed-heading", isNew ? "New activity" : "Edit content"));
  head.append(headL);
  const actions = el("div", "aw-ed-headactions");
  const cancelBtn = el("button", "aw-btn", "Cancel");
  const saveBtn = el("button", "aw-btn aw-btn-primary", "Save");
  cancelBtn.type = "button"; saveBtn.type = "button";
  actions.append(cancelBtn, saveBtn);
  head.append(actions);
  page.append(head);

  // ---- Error / info banner (hidden until needed) ----
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
  titleInput.placeholder = "e.g. Plant life cycle — True or false";
  titleInput.oninput = () => { data.title = titleInput.value; clearError(); };
  meta.append(field("Activity Title", titleInput));
  body.append(meta);

  // ===== STATEMENTS (two columns) =====
  body.append(el("div", "aw-ed-sectionhead", "Statements"));
  // PRACTICE | HOMEWORK tabs (Đợt 146). This editor's on-screen model is two
  // columns of plain strings, not the stored `statements` array — hence the
  // read/load pair, which converts in both directions.
  const setTabs = makeSetTabs(data.content, {
    current: activeContentSet(data),
    read: () => toStatements(data.trueTexts, data.falseTexts),
    load: items => {
      const split = fromStatements(items);
      data.trueTexts = split.trueTexts;
      data.falseTexts = split.falseTexts;
      renderCols();
    }
  });
  if (setTabs.el) body.append(setTabs.el);
  body.append(buildBulkBar());

  const cols = el("div", "aw-tf-ed-cols");
  const trueCol = el("div", "aw-tf-ed-col is-true");
  const falseCol = el("div", "aw-tf-ed-col is-false");
  cols.append(trueCol, falseCol);
  body.append(cols);
  renderCols();

  if (footer) page.append(footer);

  container.append(page);
  titleInput.focus();

  function totalCount() { return data.trueTexts.length + data.falseTexts.length; }

  // ---------- column rendering ----------
  function renderCols() {
    renderOneCol(trueCol, true);
    renderOneCol(falseCol, false);
  }

  function renderOneCol(colEl, isTrue) {
    const list = isTrue ? data.trueTexts : data.falseTexts;
    colEl.innerHTML = "";
    colEl.append(el("div", "aw-tf-ed-coltitle " + (isTrue ? "is-true" : "is-false"),
      isTrue ? "&#10003; TRUE statements" : "&#10007; FALSE statements"));

    const listWrap = el("div", "aw-tf-ed-list");
    list.forEach((text, ii) => listWrap.append(colRow(list, text, ii, isTrue)));
    colEl.append(listWrap);

    const addBtn = el("button", "aw-tf-ed-addrow", isTrue ? "+ Add a TRUE statement" : "+ Add a FALSE statement");
    addBtn.type = "button";
    addBtn.disabled = totalCount() >= MAX_ITEMS;
    addBtn.onclick = () => {
      if (totalCount() >= MAX_ITEMS) return;
      list.push("");
      renderOneCol(colEl, isTrue);
    };
    colEl.append(addBtn);
  }

  function colRow(list, text, ii, isTrue) {
    const row = el("div", "aw-tf-ed-row");
    row.append(el("div", "aw-tf-ed-num", String(ii + 1) + "."));

    const box = el("div", "aw-tf-ed-box");
    const inp = el("input", "aw-tf-ed-statement");
    inp.value = text;
    inp.placeholder = isTrue ? "A statement that is TRUE" : "A statement that is FALSE";
    inp.oninput = () => { list[ii] = inp.value; clearError(); };
    inp.addEventListener("paste", e => onColPaste(e, list, ii, isTrue));
    box.append(inp);
    row.append(box);

    const iconsWrap = el("div", "aw-tf-ed-icons");
    const dupBtn = iconBtn(icons.duplicate, "Duplicate");
    dupBtn.disabled = totalCount() >= MAX_ITEMS;
    dupBtn.onclick = () => {
      if (totalCount() >= MAX_ITEMS) return;
      list.splice(ii + 1, 0, list[ii]);
      renderCols();
    };
    const delBtn = iconBtn(icons.trash, "Remove", "is-danger");
    delBtn.disabled = totalCount() <= 1;
    delBtn.onclick = () => { list.splice(ii, 1); renderCols(); };
    iconsWrap.append(dupBtn, delBtn);
    row.append(iconsWrap);

    return row;
  }

  function iconBtn(svg, title, extraClass) {
    const b = el("button", "aw-tf-ed-iconbtn" + (extraClass ? " " + extraClass : ""), svg);
    b.type = "button";
    b.title = title;
    b.setAttribute("aria-label", title);
    return b;
  }

  // Drop anything over MAX by trimming the FALSE column first, then TRUE.
  function enforceMax() {
    let over = totalCount() - MAX_ITEMS;
    if (over <= 0) return 0;
    const dropped = over;
    while (over > 0 && data.falseTexts.length) { data.falseTexts.pop(); over--; }
    while (over > 0 && data.trueTexts.length) { data.trueTexts.pop(); over--; }
    return dropped;
  }

  // Paste a copied Excel RANGE. Two shapes are understood:
  //  • statement + a True/False column -> each row is routed to the correct
  //    side (works no matter which column you paste into);
  //  • a single column of statements -> fills THIS column from this row down.
  function onColPaste(e, list, ii, isTrue) {
    const text = (e.clipboardData || window.clipboardData)?.getData("text/plain") || "";
    if (!/[\t\n]/.test(text)) return;    // a single cell -> let the normal paste happen
    e.preventDefault();

    const rows = text.replace(/\r/g, "").split("\n");
    while (rows.length && rows[rows.length - 1].trim() === "") rows.pop();

    const hasTF = rows.some(l => parseAnswer(l.split("\t")[1]) !== null);
    let added = 0;

    if (hasTF) {
      rows.forEach(line => {
        const cells = line.split("\t").map(c => c.trim());
        const t = cells[0];
        if (!t) return;
        const ans = parseAnswer(cells[1]);
        if (ans === false) data.falseTexts.push(t);
        else data.trueTexts.push(t);   // true or unrecognised -> True side
        added++;
      });
    } else {
      const parsed = rows.map(l => l.split("\t")[0].trim()).filter(Boolean);
      const next = list.slice(0, ii).concat(parsed);
      if (isTrue) data.trueTexts = next; else data.falseTexts = next;
      added = parsed.length;
    }

    const dropped = enforceMax();
    renderCols();
    showInfo(`Pasted ${added - dropped} statement(s) from Excel${dropped ? ` (${dropped} skipped — ${MAX_ITEMS} max)` : ""}.`);
  }

  // ---------- save / cancel ----------
  cancelBtn.onclick = () => onCancel?.();

  saveBtn.onclick = async () => {
    const trueTexts = data.trueTexts.map(t => (t || "").trim()).filter(Boolean);
    const falseTexts = data.falseTexts.map(t => (t || "").trim()).filter(Boolean);

    const clean = {
      id: activity && activity.id ? activity.id : undefined,
      type: "true_false",
      schemaVersion: 1,
      title: (data.title || "").trim(),
      instruction: (data.instruction || "").trim(),
      theme: "classic",
      options: data.options || {},
      // Đợt 146 — start from the draft's own content so `contentSets` /
      // `itemsKey` / the other half travel through Save, then overwrite just
      // the statements with what is on screen.
      content: {
        ...JSON.parse(JSON.stringify(data.content || {})),
        statements: [
          ...trueTexts.map(text => ({ text, answer: true })),
          ...falseTexts.map(text => ({ text, answer: false }))
        ]
      }
    };
    if (clean.id === undefined) delete clean.id;

    const err = validate(clean, trueTexts.length, falseTexts.length);
    if (err) { showError(err); return; }
    foldEditedSet(clean.content, setTabs.currentKey());

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
    const clearBtn = el("button", "aw-btn aw-ed-bulkdanger", "Delete all statements");
    clearBtn.type = "button";
    clearBtn.onclick = () => {
      if (!confirm("Delete ALL statements?")) return;
      data.trueTexts = ["", ""];
      data.falseTexts = ["", ""];
      renderCols();
      showInfo("All statements deleted.");
    };
    bar.append(clearBtn);
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
// Split the stored {text, answer} statements back into two string lists. New
// activities start with two blank rows on each side.
// The stored shape ([{text, answer}]) <-> this editor's two columns of plain
// strings. Đợt 146 made these two named functions rather than inline loops
// because the PRACTICE|HOMEWORK tabs have to convert BOTH ways on every switch.
export function fromStatements(statements) {
  const trueTexts = [], falseTexts = [];
  (Array.isArray(statements) ? statements : []).forEach(s => {
    if (!s || typeof s.text !== "string") return;
    (s.answer === true ? trueTexts : falseTexts).push(s.text);
  });
  while (trueTexts.length < 2) trueTexts.push("");
  while (falseTexts.length < 2) falseTexts.push("");
  return { trueTexts, falseTexts };
}
function toStatements(trueTexts, falseTexts) {
  return [
    ...trueTexts.map(t => (t || "").trim()).filter(Boolean).map(text => ({ text, answer: true })),
    ...falseTexts.map(t => (t || "").trim()).filter(Boolean).map(text => ({ text, answer: false }))
  ];
}

function normalize(activity) {
  const a = activity ? JSON.parse(JSON.stringify(activity)) : {};
  const title = a.title || "";
  const instruction = a.instruction || "";
  const options = a.options || {};
  // Đợt 146 — the draft carries `content` now, so the halves (and the keys that
  // describe them) survive a Save. Before this, save() rebuilt `content` from
  // scratch, which would have thrown the homework half away silently.
  const content = a.content && typeof a.content === "object" ? a.content : {};
  const setKey = activeContentSet({ content, options });
  expandSetsForEditing(content);
  const statements = setKey
    ? (content.sets[setKey] || [])
    : (Array.isArray(content.statements) ? content.statements : []);
  const { trueTexts, falseTexts } = fromStatements(statements);
  return { title, instruction, options, content, trueTexts, falseTexts };
}

function validate(d, trueCount, falseCount) {
  if (!d.title) return "Please enter an activity title.";
  const total = d.content.statements.length;
  if (total < MIN_ITEMS) return `Add at least ${MIN_ITEMS} statements in total.`;
  if (trueCount < 1) return "Add at least one TRUE statement (left column).";
  if (falseCount < 1) return "Add at least one FALSE statement (right column).";
  return null;
}
