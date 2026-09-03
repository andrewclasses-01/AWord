// =============================================================
// GROUP SORT EDITOR — one column PER GROUP (2..8): the group's name on top,
// its items below. Same page chrome + contract as the other editors:
//   openGsEditor(container, activity, { onSave, onCancel, header, footer })
// Saves `content.groups = [name…]` + `content.items = [{text, group}]`
// (the shape group-sort.js reads). Paste an Excel range into any item box:
//   • two columns  item ⇥ group  → each row lands in the group it names
//     (a new group is created when the name is unknown, up to 8);
//   • one column of items        → fills THIS column from that row down.
// Limits: 2..8 groups, at least 1 item per group, 150 items in total.
// =============================================================

import { el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";
import { MAX_GROUPS, MIN_GROUPS, MAX_ITEMS, normalizeGroups } from "./gs-shared.js";

const DOT = ["#33a0e6", "#e23c3c", "#f39a1e", "#33a24a"];

export function openGsEditor(container, activity, { onSave, onCancel, header, footer } = {}) {
  const isNew = !(activity && activity.id);
  const data = normalize(activity);   // { title, instruction, options, content, groups: [{name, items:[str]}] }

  container.innerHTML = "";
  const page = el("div", "aw-ed");
  if (header) page.append(header);

  const head = el("div", "aw-ed-head");
  const headL = el("div", "aw-ed-headleft");
  headL.append(el("span", "aw-ed-typebadge", "GROUP SORT"));
  headL.append(el("div", "aw-ed-heading", isNew ? "New activity" : "Edit content"));
  head.append(headL);
  const actions = el("div", "aw-ed-headactions");
  const cancelBtn = el("button", "aw-btn", "Cancel");
  const saveBtn = el("button", "aw-btn aw-btn-primary", "Save");
  cancelBtn.type = "button"; saveBtn.type = "button";
  actions.append(cancelBtn, saveBtn);
  head.append(actions);
  page.append(head);

  const errBar = el("div", "aw-ed-error");
  errBar.style.display = "none";
  page.append(errBar);

  const body = el("div", "aw-ed-body");
  page.append(body);

  const meta = el("div", "aw-ed-meta");
  const titleInput = el("input", "aw-ed-input");
  titleInput.value = data.title;
  titleInput.placeholder = "e.g. Question words — Group sort";
  titleInput.oninput = () => { data.title = titleInput.value; clearError(); };
  meta.append(field("Activity Title", titleInput));
  body.append(meta);

  body.append(el("div", "aw-ed-sectionhead", "Groups and their items"));
  body.append(el("div", "aw-gs-ed-hint",
    `${MIN_GROUPS}–${MAX_GROUPS} groups, at least 1 item each, ${MAX_ITEMS} items in total. ` +
    "Paste an Excel range (item ⇥ group) into any item box to fill several groups at once."));
  body.append(buildBulkBar());

  const cols = el("div", "aw-gs-ed-cols");
  body.append(cols);
  renderCols();

  if (footer) page.append(footer);
  container.append(page);
  titleInput.focus();

  function totalCount() { return data.groups.reduce((n, g) => n + g.items.length, 0); }

  function renderCols() {
    cols.innerHTML = "";
    data.groups.forEach((g, gi) => cols.append(colFor(g, gi)));
    const add = el("button", "aw-gs-ed-addgroup", "+ Add group");
    add.type = "button";
    add.disabled = data.groups.length >= MAX_GROUPS;
    add.onclick = () => {
      if (data.groups.length >= MAX_GROUPS) return;
      data.groups.push({ name: "", items: ["", ""] });
      renderCols();
      const inputs = cols.querySelectorAll(".aw-gs-ed-gname");
      inputs[inputs.length - 1]?.focus();
    };
    cols.append(add);
  }

  function colFor(g, gi) {
    const col = el("div", "aw-gs-ed-col");
    const headRow = el("div", "aw-gs-ed-colhead");
    const dot = el("span", "aw-gs-ed-dot");
    dot.style.background = DOT[gi % 4];
    const name = el("input", "aw-gs-ed-gname");
    name.value = g.name;
    name.placeholder = `Group ${gi + 1} name`;
    name.maxLength = 60;
    name.oninput = () => { g.name = name.value; clearError(); };
    const delG = iconBtn(icons.trash, "Remove this group", "is-danger");
    delG.disabled = data.groups.length <= MIN_GROUPS;
    delG.onclick = () => {
      if (data.groups.length <= MIN_GROUPS) return;
      const kept = g.items.filter(t => (t || "").trim()).length;
      if (kept && !confirm(`Remove group “${g.name || gi + 1}” and its ${kept} item(s)?`)) return;
      data.groups.splice(gi, 1);
      renderCols();
    };
    headRow.append(dot, name, delG);
    col.append(headRow);

    const list = el("div", "aw-gs-ed-list");
    g.items.forEach((text, ii) => list.append(rowFor(g, gi, text, ii)));
    col.append(list);

    const addBtn = el("button", "aw-gs-ed-addrow", "+ Add an item");
    addBtn.type = "button";
    addBtn.disabled = totalCount() >= MAX_ITEMS;
    addBtn.onclick = () => {
      if (totalCount() >= MAX_ITEMS) return;
      g.items.push("");
      renderCols();
      const inputs = cols.querySelectorAll(".aw-gs-ed-col")[gi]?.querySelectorAll(".aw-gs-ed-item");
      inputs?.[inputs.length - 1]?.focus();
    };
    col.append(addBtn);
    return col;
  }

  function rowFor(g, gi, text, ii) {
    const row = el("div", "aw-gs-ed-row");
    row.append(el("div", "aw-gs-ed-num", String(ii + 1) + "."));
    const box = el("div", "aw-gs-ed-box");
    const inp = el("input", "aw-gs-ed-item");
    inp.value = text;
    inp.placeholder = "An item that belongs to this group";
    inp.oninput = () => { g.items[ii] = inp.value; clearError(); };
    inp.addEventListener("paste", e => onPaste(e, g, ii));
    box.append(inp);
    row.append(box);
    const iconsWrap = el("div", "aw-gs-ed-icons");
    const dup = iconBtn(icons.duplicate, "Duplicate");
    dup.disabled = totalCount() >= MAX_ITEMS;
    dup.onclick = () => { if (totalCount() >= MAX_ITEMS) return; g.items.splice(ii + 1, 0, g.items[ii]); renderCols(); };
    const del = iconBtn(icons.trash, "Remove", "is-danger");
    del.disabled = g.items.length <= 1;
    del.onclick = () => { g.items.splice(ii, 1); renderCols(); };
    iconsWrap.append(dup, del);
    row.append(iconsWrap);
    return row;
  }

  function iconBtn(svg, title, extraClass) {
    const b = el("button", "aw-gs-ed-iconbtn" + (extraClass ? " " + extraClass : ""), svg);
    b.type = "button"; b.title = title; b.setAttribute("aria-label", title);
    return b;
  }

  // Paste a copied Excel RANGE (see the header note for the two shapes).
  function onPaste(e, g, ii) {
    const text = (e.clipboardData || window.clipboardData)?.getData("text/plain") || "";
    if (!/[\t\n]/.test(text)) return;
    e.preventDefault();
    const rows = text.replace(/\r/g, "").split("\n");
    while (rows.length && rows[rows.length - 1].trim() === "") rows.pop();
    const twoCols = rows.some(l => (l.split("\t")[1] || "").trim());
    let added = 0, skipped = 0, newGroups = 0;
    if (twoCols) {
      rows.forEach(line => {
        const cells = line.split("\t").map(c => c.trim());
        const item = cells[0], gname = cells[1];
        if (!item) return;
        if (totalCount() >= MAX_ITEMS) { skipped++; return; }
        let target = gname ? data.groups.find(x => x.name.trim().toLowerCase() === gname.toLowerCase()) : g;
        if (!target) {
          if (data.groups.length >= MAX_GROUPS) { skipped++; return; }
          target = { name: gname, items: [] };
          data.groups.push(target); newGroups++;
        }
        target.items.push(item); added++;
      });
      data.groups.forEach(x => { x.items = x.items.filter((t, i, arr) => (t || "").trim() || arr.length === 1); });
    } else {
      const parsed = rows.map(l => l.split("\t")[0].trim()).filter(Boolean);
      const room = Math.max(0, MAX_ITEMS - (totalCount() - g.items.length));
      const take = parsed.slice(0, room);
      skipped = parsed.length - take.length;
      g.items = g.items.slice(0, ii).concat(take);
      added = take.length;
    }
    renderCols();
    showInfo(`Pasted ${added} item(s) from Excel` +
      (newGroups ? `, ${newGroups} new group(s)` : "") +
      (skipped ? ` (${skipped} skipped — limits)` : "") + ".");
  }

  cancelBtn.onclick = () => onCancel?.();
  saveBtn.onclick = async () => {
    const groups = data.groups.map(g => ({ name: (g.name || "").trim(), items: g.items.map(t => (t || "").trim()).filter(Boolean) }));
    const err = validate(data.title, groups);
    if (err) { showError(err); return; }
    const clean = {
      id: activity && activity.id ? activity.id : undefined,
      type: "group_sort",
      schemaVersion: 1,
      title: (data.title || "").trim(),
      instruction: (data.instruction || "").trim(),
      theme: "classic",
      options: data.options || {},
      content: {
        ...JSON.parse(JSON.stringify(data.content || {})),
        groups: groups.map(g => g.name),
        items: groups.flatMap(g => g.items.map(text => ({ text, group: g.name })))
      }
    };
    if (clean.id === undefined) delete clean.id;
    saveBtn.disabled = true;
    const label = saveBtn.textContent;
    saveBtn.textContent = "Saving…";
    try { await onSave?.(clean); }
    catch (e) { saveBtn.disabled = false; saveBtn.textContent = label; showError("Could not save — please try again."); }
  };

  function showError(msg) { errBar.classList.remove("is-info"); errBar.textContent = msg; errBar.style.display = "block"; body.scrollTop = 0; }
  function showInfo(msg) { errBar.classList.add("is-info"); errBar.textContent = msg; errBar.style.display = "block"; body.scrollTop = 0; }
  function clearError() { if (errBar.style.display !== "none") errBar.style.display = "none"; }

  function buildBulkBar() {
    const bar = el("div", "aw-ed-bulk");
    const clearBtn = el("button", "aw-btn aw-ed-bulkdanger", "Delete all items");
    clearBtn.type = "button";
    clearBtn.onclick = () => {
      if (!confirm("Delete ALL items in every group?")) return;
      data.groups.forEach(g => { g.items = ["", ""]; });
      renderCols();
      showInfo("All items deleted.");
    };
    bar.append(clearBtn);
    return bar;
  }
  function field(labelText, control) {
    const f = el("div", "aw-ed-field");
    f.append(el("label", "aw-ed-label", labelText), control);
    return f;
  }
}

// ===== data helpers =====
function normalize(activity) {
  const a = activity ? JSON.parse(JSON.stringify(activity)) : {};
  const content = a.content && typeof a.content === "object" ? a.content : {};
  const names = normalizeGroups(content);
  const groups = names.map(name => ({ name, items: [] }));
  (Array.isArray(content.items) ? content.items : []).forEach(it => {
    if (!it || typeof it.text !== "string") return;
    const key = String(it.group == null ? "" : it.group).trim().toLowerCase();
    let g = groups.find(x => x.name.toLowerCase() === key);
    if (!g) {
      if (!key || groups.length >= MAX_GROUPS) return;     // an item of a group that no longer exists
      g = { name: String(it.group).trim(), items: [] };
      groups.push(g);
    }
    g.items.push(it.text);
  });
  while (groups.length < MIN_GROUPS) groups.push({ name: "", items: [] });
  groups.forEach(g => { while (g.items.length < 1) g.items.push(""); if (g.items.length === 1 && !g.items[0]) g.items.push(""); });
  return { title: a.title || "", instruction: a.instruction || "", options: a.options || {}, content, groups };
}

function validate(title, groups) {
  if (!(title || "").trim()) return "Please enter an activity title.";
  if (groups.length < MIN_GROUPS) return `Add at least ${MIN_GROUPS} groups.`;
  if (groups.length > MAX_GROUPS) return `At most ${MAX_GROUPS} groups.`;
  const seen = new Set();
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    if (!g.name) return `Group ${i + 1} needs a name.`;
    const key = g.name.toLowerCase();
    if (seen.has(key)) return `Two groups are both called “${g.name}”. Give each group its own name.`;
    seen.add(key);
    if (!g.items.length) return `Group “${g.name}” needs at least 1 item.`;
  }
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  if (total > MAX_ITEMS) return `At most ${MAX_ITEMS} items in total (you have ${total}).`;
  return null;
}
