// =============================================================
// MY BEAT — the music player (Đợt 385).
//
// Songs always play through YouTube's own embedded player (the privacy-
// enhanced youtube-nocookie host), never from a stored audio file — that is
// the copyright rule thầy chốt. The game only needs: play, pause, seek, and
// "what second are we at". YouTube's IFrame API gives exactly that.
//
// FakePlayer = same surface driven by a clock, for songs without a video
// (the built-in demo) and for the test page.
// =============================================================

let apiP = null;
function loadApi() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (apiP) return apiP;
  apiP = new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { try { prev && prev(); } catch { /* ignore */ } resolve(window.YT); };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.onerror = () => { apiP = null; reject(new Error("YouTube could not be reached — check the internet connection.")); };
    document.head.append(s);
    setTimeout(() => { if (!(window.YT && window.YT.Player)) { apiP = null; reject(new Error("YouTube is taking too long to load — check the internet connection.")); } }, 15000);
  });
  return apiP;
}

// Error codes YouTube reports -> words for the teacher.
const YT_ERR = {
  2: "The video link is not valid.",
  5: "This video cannot play in the browser.",
  100: "This video was removed or made private.",
  101: "The owner does not allow this video to play inside other sites (embedding is off).",
  150: "The owner does not allow this video to play inside other sites (embedding is off)."
};

// host: an empty element the player replaces. Resolves when ready to play.
export async function createPlayer(host, videoId, { onError, onState } = {}) {
  if (!videoId) return createFakePlayer(host, { duration: 60 });
  const YT = await loadApi();
  const box = document.createElement("div");
  host.append(box);
  let p = null, ended = false;
  await new Promise((resolve, reject) => {
    const to = setTimeout(() => reject(new Error("The video did not load in time.")), 20000);
    p = new YT.Player(box, {
      host: "https://www.youtube-nocookie.com",
      videoId,
      playerVars: { controls: 0, disablekb: 1, fs: 0, rel: 0, modestbranding: 1, playsinline: 1, iv_load_policy: 3, cc_load_policy: 0 },
      events: {
        onReady: () => { clearTimeout(to); resolve(); },
        onError: e => { clearTimeout(to); const msg = YT_ERR[e.data] || "The video could not play."; onError && onError(msg); reject(new Error(msg)); },
        onStateChange: e => { ended = e.data === 0; onState && onState(e.data); }
      }
    });
  });
  return {
    kind: "youtube",
    play() { ended = false; p.playVideo(); },
    pause() { p.pauseVideo(); },
    seek(t) { ended = false; p.seekTo(Math.max(0, t), true); },
    time() { const t = p.getCurrentTime ? p.getCurrentTime() : 0; return Number.isFinite(t) ? t : 0; },
    duration() { return p.getDuration ? p.getDuration() : 0; },
    playing() { return p.getPlayerState && p.getPlayerState() === 1; },
    ended() { return ended; },
    destroy() { try { p.destroy(); } catch { /* ignore */ } box.remove(); }
  };
}

// Clock-only player: the same surface, no sound. Used by the demo song.
export function createFakePlayer(host, { duration = 60 } = {}) {
  let t = 0, on = false, last = 0, ended = false;
  const now = () => performance.now() / 1000;
  const cur = () => { if (on) { t = Math.min(duration, t + (now() - last)); last = now(); if (t >= duration) { on = false; ended = true; } } return t; };
  const tag = document.createElement("div");
  tag.className = "mb-fakevid";
  tag.innerHTML = '<div class="mb-eq"><i></i><i></i><i></i><i></i><i></i><i></i></div><span>Demo song · no sound</span>';
  host.append(tag);
  return {
    kind: "fake",
    play() { cur(); on = true; ended = false; last = now(); tag.classList.add("on"); },
    pause() { cur(); on = false; tag.classList.remove("on"); },
    seek(v) { cur(); t = Math.max(0, Math.min(duration, v)); ended = false; },
    time: cur,
    duration: () => duration,
    playing: () => on,
    ended: () => ended,
    destroy() { tag.remove(); }
  };
}

// Title + channel of a video without an API key (YouTube oEmbed allows the
// AWord origin — checked 25/9/2026). null when the link is wrong or offline.
export async function videoInfo(videoId) {
  if (!videoId) return null;
  try {
    const r = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent("https://www.youtube.com/watch?v=" + videoId)}`);
    if (!r.ok) return null;
    const j = await r.json();
    return { title: j.title || "", channel: j.author_name || "", thumb: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` };
  } catch { return null; }
}

export const thumbUrl = id => id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "";
