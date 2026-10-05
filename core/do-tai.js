/* ============================================================
   do-tai.js — CHẾ ĐỘ ĐO TẢI TRANG (Đợt 479, 05/10/2026)

   VÌ SAO: thầy báo AWord mở trên iPad (iOS 27, Safari) "rất lâu". Chrome giả lập iPad
   (CPU chậm 4–6×, wifi/4G) chỉ ra 1,7–3,9 s lần đầu, 0,5–1,1 s lần sau ⇒ KHÔNG tái hiện được.
   Safari thật thì không đo từ máy tính được (Web Inspector cần máy Mac) ⇒ trang TỰ ĐO rồi
   hiện bảng số ngay trên màn hình để thầy chụp ảnh gửi.

   BẬT: mở link kèm `?do=1` (index.html hoặc play.html). Cờ được nhớ trong localStorage
   'aw_do' ⇒ các lần mở SAU (không kèm ?do=1) vẫn đo — để so "lần đầu" với "mở lại".
   TẮT: `?do=0` hoặc nút "Tắt đo" trong bảng.
   Bộ nạp là đoạn <script> nhỏ ở đầu <head> của index.html + play.html: không bật thì
   KHÔNG tải file này (trang bình thường không tốn thêm byte nào).

   ĐO GÌ (chỉ ĐỌC, không ghi gì lên Firestore, không đổi hành vi app):
   - Navigation Timing: DNS · kết nối · TLS · chờ máy chủ · HTML xong · DOMContentLoaded · load.
   - FCP (chữ/hình đầu tiên).
   - Mốc của AWord: hết màn chờ `.aw-boot` · hết chữ "Loading" · DOM thôi đổi (ổn định).
   - Resource Timing: số file, KB, file lấy từ cache, gom theo nơi tải, 10 file chậm nhất.
   - Khựng: khung hình cách nhau > 50 ms (rAF) trong 30 s đầu ⇒ máy bận chạy JS/dựng trang.
   - Lỗi JS / lỗi tải file / promise bị từ chối.
   - Lịch sử 8 lần đo gần nhất (localStorage 'aw_do_ls') để thấy lần đầu vs mở lại.
   ============================================================ */
(function () {
  'use strict';
  if (window.__awDo) return;
  window.__awDo = true;

  var P = window.performance;
  var T = function () { return Math.round(P.now()); };
  var moc = { chayScript: T(), hetMauCho: null, hetLoading: null, domCuoi: null };
  var loi = [];
  var GIOI_HAN = 30000;   // theo dõi DOM + khựng trong 30 s đầu

  // ---- lỗi ----
  window.addEventListener('error', function (e) {
    var t = e && e.target;
    if (t && t !== window && (t.src || t.href)) loi.push(T() + ' ms · không tải được ' + String(t.src || t.href).replace(location.origin, ''));
    else loi.push(T() + ' ms · ' + String((e && e.message) || 'lỗi').slice(0, 140));
  }, true);
  window.addEventListener('unhandledrejection', function (e) {
    var r = e && e.reason;
    loi.push(T() + ' ms · promise: ' + String((r && r.message) || r).slice(0, 140));
  });

  // ---- khựng (khoảng cách giữa 2 khung hình) ----
  var kh = { dai: 0, tong: 0, max: 0, cuoi: 0 };
  function raf(t) {
    if (kh.cuoi) {
      var d = t - kh.cuoi;
      if (d > 50) { kh.dai++; kh.tong += d; if (d > kh.max) kh.max = d; }
    }
    kh.cuoi = t;
    if (P.now() < GIOI_HAN) requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // ---- LCP (nội dung lớn nhất hiện ra) — Safari mới + Chrome; không có thì bỏ qua ----
  var lcp = null;
  try {
    new PerformanceObserver(function (l) { var e = l.getEntries(); if (e.length) lcp = e[e.length - 1].startTime; })
      .observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) { /* trình duyệt không hỗ trợ */ }

  // ---- mốc DOM của AWord ----
  function coChuLoading() {
    var b = document.body;
    if (!b) return true;
    var w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        if (!p || p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE' || (p.closest && p.closest('#aw-do'))) return NodeFilter.FILTER_REJECT;
        return /Loading/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });
    return !!w.nextNode();
  }
  var henKiem = 0;
  function kiem() {
    henKiem = 0;
    var now = T();
    // Đợt 480: màn chờ còn trong DOM nhưng đã ẨN (khung cha display:none…) cũng tính là hết — iPad đã đăng nhập báo "—" suốt 30 s.
    var bEl = document.querySelector('.aw-boot');
    var boot = !!bEl && bEl.getClientRects().length > 0;
    if (!boot && moc.hetMauCho == null) moc.hetMauCho = now;
    if (!boot && moc.hetLoading == null && !coChuLoading()) moc.hetLoading = now;
    if (moc.hetLoading != null && coChuLoading()) moc.hetLoading = null;   // "Loading" hiện lại ⇒ chưa xong
    moc.domCuoi = now;
    capNhatNut();
  }
  var mo = new MutationObserver(function (ds) {
    for (var i = 0; i < ds.length; i++) {
      var tg = ds[i].target;
      if (tg && tg.closest && tg.closest('#aw-do')) continue;
      if (!henKiem) henKiem = setTimeout(kiem, 60);
      return;
    }
  });
  function batDauTheoDoi() {
    mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    kiem();
    setTimeout(function () { mo.disconnect(); kiem(); }, Math.max(0, GIOI_HAN - P.now()));
  }

  // ---- số liệu ----
  function soMs(x) { return x == null ? '—' : (x >= 1000 ? (x / 1000).toFixed(2).replace('.', ',') + ' s' : Math.round(x) + ' ms'); }
  function soKB(b) { return b >= 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.round(b / 1024) + ' KB'; }
  function ngan(u) {
    try { var x = new URL(u); return (x.host === location.host ? '' : x.host) + x.pathname.replace(/^.*\/(?=[^/]+\/[^/]+$)/, '…/') ; } catch (e) { return String(u).slice(0, 60); }
  }
  function thuThap() {
    var n = (P.getEntriesByType('navigation') || [])[0] || {};
    var fcpE = (P.getEntriesByName('first-contentful-paint') || [])[0];
    var res = P.getEntriesByType('resource') || [];
    var theoNoi = {}, js = { n: 0, giai: 0 }, tai = 0, cache = 0, khongBiet = 0;
    res.forEach(function (r) {
      var host; try { host = new URL(r.name).host; } catch (e) { host = '?'; }
      var k = host === location.host ? 'aword (trang này)' : host;
      var g = theoNoi[k] || (theoNoi[k] = { n: 0, kb: 0, xong: 0 });
      g.n++; g.kb += r.transferSize || 0; g.xong = Math.max(g.xong, r.responseEnd);
      tai += r.transferSize || 0;
      if (r.transferSize === 0 && r.decodedBodySize > 0) cache++;
      if (r.transferSize === 0 && !r.decodedBodySize) khongBiet++;
      if (/\.m?js(\?|$)/.test(r.name)) { js.n++; js.giai += r.decodedBodySize || 0; }
    });
    var cham = res.slice().sort(function (a, b) { return b.duration - a.duration; }).slice(0, 10);
    // Đợt 480: cùng một đường dẫn bị tải nhiều lần (bẫy Safari + fetch() làm nóng của Đợt 285c)
    var demUrl = {}, trung = 0, thua = 0;
    res.forEach(function (r) { demUrl[r.name] = (demUrl[r.name] || 0) + 1; });
    Object.keys(demUrl).forEach(function (u) { if (demUrl[u] > 1 && !/Listen\/channel|recaptcha|appcheck/.test(u)) { trung++; thua += demUrl[u] - 1; } });
    return {
      n: n, fcp: fcpE ? fcpE.startTime : null, res: res, theoNoi: theoNoi, js: js, tai: tai, cache: cache, khongBiet: khongBiet, cham: cham, trung: trung, thua: thua
    };
  }

  function baoCao() {
    var d = thuThap(), n = d.n;
    var ua = navigator.userAgent;
    var may = (/iPad|Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? 'iPad' : (/iPhone/.test(ua) ? 'iPhone' : (/Android/.test(ua) ? 'Android' : 'Máy tính'));
    var ios = (ua.match(/OS (\d+)[._](\d+)/) || ua.match(/Version\/(\d+)\.(\d+)/) || []);
    var conn = navigator.connection ? (navigator.connection.effectiveType || '') + (navigator.connection.downlink ? ' ~' + navigator.connection.downlink + ' Mbps' : '') : 'không rõ';
    var L = [];
    var bay = new Date();
    L.push('AWord · ĐO TẢI TRANG · ' + bay.toLocaleDateString('vi-VN') + ' ' + bay.toLocaleTimeString('vi-VN'));
    L.push(location.pathname + location.search.replace(/([?&])(n|ma)=[^&]*/g, '$1$2=…'));
    L.push('Máy: ' + may + (ios[1] ? ' · bản ' + ios[1] + '.' + ios[2] : '') + ' · màn ' + screen.width + '×' + screen.height + ' @' + (window.devicePixelRatio || 1) + ' · ' + (navigator.hardwareConcurrency || '?') + ' lõi · mạng ' + conn);
    L.push('Kiểu mở: ' + ({ navigate: 'mở mới', reload: 'tải lại', back_forward: 'quay lại' }[n.type] || n.type || '?') + (document.referrer ? ' · từ ' + ngan(document.referrer) : ''));
    L.push('');
    L.push('① Tới máy chủ:  DNS ' + soMs(n.domainLookupEnd - n.domainLookupStart) + ' · kết nối ' + soMs(n.connectEnd - n.connectStart) +
      (n.secureConnectionStart > 0 ? ' (TLS ' + soMs(n.connectEnd - n.secureConnectionStart) + ')' : '') + ' · chờ trang ' + soMs(n.responseStart - n.requestStart) +
      (n.redirectEnd ? ' · chuyển hướng ' + soMs(n.redirectEnd - n.redirectStart) : ''));
    L.push('② HTML xong ' + soMs(n.responseEnd) + ' · DOM sẵn ' + soMs(n.domContentLoadedEventEnd || null) + ' · load ' + soMs(n.loadEventEnd || null));
    L.push('③ Hình đầu tiên (FCP) ' + soMs(d.fcp) + ' · nội dung lớn nhất (LCP) ' + soMs(lcp));
    L.push('④ ⭐ Hết màn chờ ' + soMs(moc.hetMauCho) + ' · ⭐ Hết "Loading" ' + soMs(moc.hetLoading) + ' · DOM thôi đổi ' + soMs(moc.domCuoi));
    L.push('⑤ ' + d.res.length + ' file · tải ' + soKB(d.tai) + ' · từ cache ' + d.cache + (d.khongBiet ? ' · không rõ ' + d.khongBiet : '') +
      ' · JS ' + d.js.n + ' file (' + soKB(d.js.giai) + ' mã)' + ' · TẢI TRÙNG ' + d.trung + ' file (thừa ' + d.thua + ' lượt)');
    Object.keys(d.theoNoi).sort(function (a, b) { return d.theoNoi[b].n - d.theoNoi[a].n; }).forEach(function (k) {
      var g = d.theoNoi[k];
      L.push('    ' + k + ': ' + g.n + ' file ' + soKB(g.kb) + ' · xong lúc ' + soMs(g.xong));
    });
    L.push('⑥ Khựng (khung > 50 ms, 30 s đầu): ' + kh.dai + ' lần · tổng ' + soMs(kh.tong) + ' · dài nhất ' + soMs(kh.max));
    L.push('⑦ 10 file chậm nhất (bắt đầu → xong, KB):');
    d.cham.forEach(function (r) {
      L.push('    ' + soMs(r.duration).padStart(8) + '  @' + soMs(r.startTime) + '→' + soMs(r.responseEnd) + '  ' + (r.transferSize ? soKB(r.transferSize) : (r.decodedBodySize ? 'cache' : '?')) + '  ' + ngan(r.name));
    });
    L.push('⑧ Lỗi: ' + (loi.length ? '' : 'không có'));
    loi.slice(0, 8).forEach(function (x) { L.push('    ' + x); });
    var ls = docLichSu();
    if (ls.length) {
      L.push('');
      L.push('Lịch sử (mới nhất trên): giờ · trang · hết màn chờ · hết Loading · load · tải · cache');
      ls.forEach(function (x) { L.push('    ' + x); });
    }
    return L.join('\n');
  }

  // ---- lịch sử ----
  var KHOA_LS = 'aw_do_ls';
  function docLichSu() { try { return JSON.parse(localStorage.getItem(KHOA_LS) || '[]'); } catch (e) { return []; } }
  function ghiLichSu() {
    try {
      var d = thuThap(), n = d.n, gio = new Date();
      var dong = ('0' + gio.getHours()).slice(-2) + ':' + ('0' + gio.getMinutes()).slice(-2) + ' · ' + (location.pathname.replace(/^.*\//, '') || 'index') +
        ' · ' + soMs(moc.hetMauCho) + ' · ' + soMs(moc.hetLoading) + ' · ' + soMs(n.loadEventEnd || null) + ' · ' + soKB(d.tai) + ' · ' + d.cache + '/' + d.res.length;
      var ls = docLichSu(); ls.unshift(dong);
      localStorage.setItem(KHOA_LS, JSON.stringify(ls.slice(0, 8)));
    } catch (e) { /* chế độ riêng tư: bỏ qua */ }
  }

  // ---- giao diện: nút nhỏ góc dưới trái + bảng ----
  var nut = null, bang = null;
  function capNhatNut() {
    if (!nut) return;
    var x = moc.hetLoading != null ? moc.hetLoading : moc.hetMauCho;
    nut.textContent = '⏱ ' + (x == null ? 'đang đo…' : soMs(x));
  }
  function dungGiaoDien() {
    var st = document.createElement('style');
    st.textContent =
      '#aw-do{position:fixed;left:8px;bottom:8px;z-index:2147483647;font:12px/1.45 ui-monospace,Menlo,Consolas,monospace;color:#13202e}' +
      '#aw-do .n{background:#13202e;color:#fff;border:0;border-radius:16px;padding:7px 12px;font:600 13px system-ui,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.3)}' +
      '#aw-do .b{display:none;position:fixed;left:8px;right:8px;bottom:52px;max-height:78vh;overflow:auto;background:#fff;border:2px solid #13202e;border-radius:10px;padding:10px;box-shadow:0 6px 24px rgba(0,0,0,.35)}' +
      '#aw-do.mo .b{display:block}' +
      '#aw-do pre{margin:0 0 8px;white-space:pre-wrap;word-break:break-word;font:inherit;user-select:text;-webkit-user-select:text}' +
      '#aw-do .h button{margin:0 6px 0 0;padding:6px 10px;border:1px solid #13202e;border-radius:6px;background:#eef3f9;font:600 13px system-ui,sans-serif;color:#13202e}';
    var g = document.createElement('div');
    g.id = 'aw-do';
    g.innerHTML = '<div class="b"><pre></pre><div class="h"><button data-v="chep">Sao chép</button><button data-v="lai">Đo lại</button><button data-v="tat">Tắt đo</button><button data-v="dong">Đóng</button></div></div><button class="n">⏱ đang đo…</button>';
    document.head.appendChild(st);
    document.documentElement.appendChild(g);   // ngoài <body>: không dính transform/stacking của app
    nut = g.querySelector('.n'); bang = g.querySelector('pre');
    nut.addEventListener('click', function () {
      g.classList.toggle('mo');
      if (g.classList.contains('mo')) bang.textContent = baoCao();
    });
    g.querySelector('.h').addEventListener('click', function (e) {
      var v = e.target && e.target.getAttribute('data-v');
      if (v === 'dong') g.classList.remove('mo');
      if (v === 'lai') location.reload();
      if (v === 'tat') {
        try { localStorage.removeItem('aw_do'); } catch (x) { /* bỏ qua */ }
        location.href = location.href.replace(/([?&])do=1(&|$)/, '$1').replace(/[?&]$/, '');
      }
      if (v === 'chep') {
        var s = baoCao();
        var xong = function () { e.target.textContent = 'Đã chép ✓'; };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s).then(xong, function () {});
      }
    });
    capNhatNut();
  }

  function khiCoBody(fn) { if (document.body) fn(); else document.addEventListener('DOMContentLoaded', fn); }
  khiCoBody(function () { dungGiaoDien(); batDauTheoDoi(); });
  // Ghi lịch sử khi trang đã yên: 3 s sau load (hoặc tối đa 30 s)
  function sauLoad() {
    var hen = setInterval(function () {
      if (P.now() - (moc.domCuoi || 0) > 3000 || P.now() > GIOI_HAN) { clearInterval(hen); kiem(); ghiLichSu(); }
    }, 500);
  }
  if (document.readyState === 'complete') sauLoad(); else window.addEventListener('load', sauLoad);
})();
