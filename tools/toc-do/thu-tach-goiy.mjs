// Bàn thử Đợt 484 — chạy store.js / assignments.js THẬT trên Firestore giả.
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.window = globalThis; globalThis.addEventListener = () => {}; globalThis.removeEventListener = () => {};
globalThis.document = { addEventListener() {}, visibilityState: 'visible' }; globalThis.sessionStorage = globalThis.localStorage;
if (!globalThis.navigator) globalThis.navigator = { onLine: true };
const { KHO, DEM } = await import("./core/firebase.js");
const S = await import("./core/store.js");
const A = await import("./core/assignments.js");
const P = "users/U1/items/";
let dat = 0, truot = 0;
const kt = (ten, dk) => { if (dk) dat++; else { truot++; console.log("  ❌", ten); } };
const bang = n => Array.from({ length: n }, (_, i) => ({ de: "q" + i, kieu: "yhet", go: "sai" + i, noi: "Lời " + i }));
const tta = (id, n, extra = {}) => ({ id, kind: "act", type: "type_the_answer", title: "T " + id, root: "activities", parentId: "F1", num: 0, trashed: false,
  optVer: 9, createdAt: 1, updatedAt: 1, content: { items: [{ prompt: "p", acceptedAnswers: ["a"] }], ...(n != null ? { goiY: bang(n) } : {}) }, ...extra });

// ---- kho ban đầu: act CŨ (goiY gộp), act không bảng, thư mục, sổ cái Showdown
KHO.set(P + "F1", { id: "F1", kind: "folder", root: "activities", parentId: null, name: "Lớp", num: 1, trashed: false });
KHO.set(P + "A", { ...tta("A", 3), num: 2 });
KHO.set(P + "B", { ...tta("B", null), num: 3 });
KHO.set(P + "C", { ...tta("C", 5), num: 4 });
KHO.set(P + "H", { id: "H", kind: "showdown-history", root: "showdown", matches: ["to"] });

console.log("1. đọc kho cũ");
let ds = await S.listChildren("activities", "F1");
kt("thấy A,B,C", ds.map(x => x.id).sort().join() === "A,B,C");
const tatCa = await S.getItem("H"); kt("sổ cái KHÔNG vào cache", tatCa === null);
kt("A cũ còn goiY gộp (3)", ds.find(x => x.id === "A").content.goiY.length === 3);

console.log("2. lưu A ⇒ tách");
const a = await S.getActivity("A");
await S.saveActivity(JSON.parse(JSON.stringify(a)));
kt("doc A không còn goiY", !("goiY" in KHO.get(P + "A").content));
kt("doc A có dấu goiYTach", KHO.get(P + "A").content.goiYTach === true);
kt("gy_A có 3 dòng", KHO.get(P + "gy_A").goiY.length === 3 && KHO.get(P + "gy_A").kind === "act-goiy" && KHO.get(P + "gy_A").actId === "A");
kt("cache A vẫn đủ 3 dòng", (await S.getActivity("A")).content.goiY.length === 3);

console.log("3. mở lại trang (cache mới) ⇒ lượt đọc đầu KHÔNG có bảng");
S.resetCache();
ds = await S.listChildren("activities", "F1");
const aL = ds.find(x => x.id === "A");
kt("A trong danh sách: có dấu, không bảng", aL.content.goiYTach === true && !("goiY" in aL.content));
kt("gy_A không lọt vào danh sách / cache", (await S.listChildren("appdata", null)).length === 0);

console.log("4. đổi tên A khi CHƯA nạp bảng ⇒ gy_A nguyên vẹn");
const g0 = JSON.stringify(KHO.get(P + "gy_A"));
await S.renameItem("A", "T A mới");
kt("doc A vẫn dấu, không bảng", KHO.get(P + "A").content.goiYTach === true && !("goiY" in KHO.get(P + "A").content));
kt("gy_A không đổi", JSON.stringify(KHO.get(P + "gy_A")) === g0);
kt("đổi tên đã lưu", KHO.get(P + "A").title === "T A mới");

console.log("5. getItem ⇒ nạp bảng");
const n0 = DEM.getDoc;
const aN = await S.getItem("A");
kt("có 3 dòng, hết dấu", aN.content.goiY.length === 3 && !aN.content.goiYTach);
kt("đúng 1 lượt getDoc", DEM.getDoc - n0 === 1);
await S.getItem("A"); kt("lần 2 không đọc lại", DEM.getDoc - n0 === 1);

console.log("6. sửa bảng còn 2 dòng");
const a6 = JSON.parse(JSON.stringify(aN)); a6.content.goiY = a6.content.goiY.slice(0, 2);
await S.saveActivity(a6);
kt("gy_A = 2 dòng", KHO.get(P + "gy_A").goiY.length === 2);
S.resetCache(); kt("mở lại ⇒ 2 dòng", (await S.getItem("A")).content.goiY.length === 2);

console.log("7. xoá hết bảng ⇒ act mất dấu, gy_A mồ côi (không xoá), mở lại không có bảng");
const a7 = JSON.parse(JSON.stringify(await S.getItem("A"))); delete a7.content.goiY;
await S.saveActivity(a7);
kt("doc A không dấu", !KHO.get(P + "A").content.goiYTach && !("goiY" in KHO.get(P + "A").content));
kt("gy_A vẫn còn (không tự xoá)", KHO.has(P + "gy_A"));
S.resetCache(); const a7b = await S.getItem("A");
kt("mở lại: không bảng, không lỗi", !a7b.content.goiY && !a7b.content.goiYTach);

console.log("8. act B không bảng: lưu không đẻ gy_B");
await S.saveActivity(JSON.parse(JSON.stringify(await S.getItem("B"))));
kt("không có gy_B", !KHO.has(P + "gy_B") && !KHO.get(P + "B").content.goiYTach);

console.log("9. nhân bản C (chưa nạp, sau khi tách)");
await S.saveActivity(JSON.parse(JSON.stringify(await S.getItem("C")))); S.resetCache();
kt("C đã tách", KHO.get(P + "C").content.goiYTach === true && KHO.get(P + "gy_C").goiY.length === 5);
const copy = await S.duplicateItem("C");
kt("bản sao có gy_<id mới> 5 dòng", KHO.get(P + "gy_" + copy.id) && KHO.get(P + "gy_" + copy.id).goiY.length === 5);
kt("doc bản sao có dấu, không bảng", KHO.get(P + copy.id).content.goiYTach === true && !("goiY" in KHO.get(P + copy.id).content));
kt("gy_C vẫn 5 dòng", KHO.get(P + "gy_C").goiY.length === 5);

console.log("10. nhân bản cả THƯ MỤC chứa act đã tách");
S.resetCache();
const fCopy = await S.duplicateItem("F1");
const conAct = [...KHO.values()].filter(v => v.kind === "act" && v.parentId === fCopy.id);
kt("thư mục sao có đủ act", conAct.length === 4);
kt("mọi act sao có bảng tách đúng", conAct.every(v => !v.content.goiYTach || (KHO.get(P + "gy_" + v.id) && KHO.get(P + "gy_" + v.id).goiY.length > 0)));

console.log("11. thùng rác + xoá vĩnh viễn ⇒ xoá kèm gy_");
await S.trashItem(copy.id);
kt("vào thùng rác vẫn giữ gy_", KHO.has(P + "gy_" + copy.id));
await S.deleteForever(copy.id);
kt("xoá vĩnh viễn ⇒ mất cả act lẫn gy_", !KHO.has(P + copy.id) && !KHO.has(P + "gy_" + copy.id));
const cc = conAct.find(v => v.content.goiYTach);
await S.trashItem(fCopy.id); await S.emptyTrash("activities");
kt("dọn thùng rác ⇒ gy_ của act trong thư mục cũng mất", !KHO.has(P + "gy_" + cc.id) && !KHO.has(P + fCopy.id));
kt("gy_C của bản GỐC còn nguyên", KHO.get(P + "gy_C").goiY.length === 5);

console.log("12. giao bài act C CHƯA nạp ⇒ ảnh chụp đủ bảng");
S.resetCache();
const cL = (await S.listChildren("activities", "F1")).find(x => x.id === "C");
kt("C trong danh sách chưa có bảng", cL.content.goiYTach && !cL.content.goiY);
const as = await A.createAssignment(cL, { title: "Bài C" });
const snap = KHO.get("assignments/" + as.code);
kt("bài giao có 5 dòng, không dấu", snap && snap.activity.content.goiY.length === 5 && !snap.activity.content.goiYTach);

console.log("13. 2 lời gọi nạp cùng lúc dùng chung 1 lượt đọc");
S.resetCache(); const m0 = DEM.getDoc;
const [x1, x2] = await Promise.all([S.getItem("C"), S.getActivity("C")]);
kt("cả 2 có 5 dòng", x1.content.goiY.length === 5 && x2.content.goiY.length === 5);
kt("chỉ 1 getDoc", DEM.getDoc - m0 === 1);

console.log(`\nKẾT QUẢ: ${dat} đạt · ${truot} trượt`);
process.exit(truot ? 1 : 0);
