/* Aidech Web Slides — 店舗向け / 企業向け共通エンジン
   - 既定: 店舗向け
   - ?deck=corporate: 企業向け
   - ?view=audience: 顧客表示
*/
const params = new URLSearchParams(location.search);
const deck = params.get("deck") === "corporate" ? "corporate" : "store";
const isAud = params.get("view") === "audience";
const deckMeta = deck === "corporate"
  ? { label: "企業向け", slidesUrl: "./corporate/slides.json" }
  : { label: "店舗向け", slidesUrl: "./slides.json" };

const CH_NAME = `aidech-sync-v2-${deck}`;
const SYNC_KEY = `aidech-sync-v2-${deck}`;
const MSG_TYPE = `aidech-slide-${deck}`;
const ch = ("BroadcastChannel" in window) ? new BroadcastChannel(CH_NAME) : null;

let slides = [];
let cur = 0;
let aud = null;
let start = Date.now();
const pad = (n) => String(n).padStart(2, "0");

async function loadImageSource(src, mime = "image/webp") {
  if (!src || !src.endsWith(".b64")) return src;
  const res = await fetch(src);
  if (!res.ok) throw new Error(`画像データの取得に失敗しました: ${src}`);
  const b64 = (await res.text()).trim();
  return `data:${mime};base64,${b64}`;
}

async function boot() {
  document.title = `Aidech Management｜${deckMeta.label} 台本操作型 Web Slides`;
  const res = await fetch(deckMeta.slidesUrl);
  if (!res.ok) throw new Error(`slides.json の取得に失敗しました: ${deckMeta.slidesUrl}`);
  const raw = await res.json();

  slides = await Promise.all(raw.map(async (s, i) => {
    const id = s.id || i + 1;
    const defaultImage = deck === "corporate" ? `corporate/images/${id}.b64` : `images/${id}.png`;
    const image = await loadImageSource(s.image || defaultImage, s.imageMime || "image/webp");
    const video = s.video !== undefined
      ? s.video
      : (deck === "store" ? `images/${id}.mp4` : "");
    return { ...s, id, image, video, hasVideo: false, checked: !video };
  }));

  const h = parseInt(location.hash.replace("#s", ""), 10);
  if (!isNaN(h) && h >= 0 && h < slides.length) cur = h;
  isAud ? audience() : presenter();
}

function media(s, i) {
  const active = i === cur ? " active" : "";
  const video = s.video
    ? `<video data-v="${i}" src="${s.video}" poster="${s.image}" muted playsinline preload="metadata" loop></video>`
    : "";
  return `<div class="media use-image${active}" data-i="${i}">
    <img src="${s.image}" alt="${pad(i + 1)} ${s.title}">
    ${video}
    <div class="shade"></div>
  </div>`;
}

function stage() {
  return `<div class="stage">
    <div class="progressTrack"><div class="progress"></div></div>
    ${slides.map(media).join("")}
    <div class="counter">01 / ${pad(slides.length)}</div>
  </div>`;
}

function initVideoDetection() {
  document.querySelectorAll("video[data-v]").forEach((v) => {
    const i = parseInt(v.dataset.v, 10);
    const s = slides[i];
    const wrap = v.closest(".media");
    v.addEventListener("loadedmetadata", () => {
      s.hasVideo = true;
      s.checked = true;
      if (wrap) wrap.dataset.hasVideo = "true";
      updateMediaClasses();
      if (i === cur) playCurrentVideo();
      updateCueMediaLabels();
    }, { once: true });
    v.addEventListener("error", () => {
      s.hasVideo = false;
      s.checked = true;
      if (wrap) wrap.dataset.hasVideo = "false";
      updateMediaClasses();
      updateCueMediaLabels();
    }, { once: true });
    try { v.load(); } catch (_) {}
  });
}

function updateMediaClasses() {
  document.querySelectorAll(".media").forEach((m, i) => {
    const active = i === cur;
    const useVideo = active && slides[i].hasVideo;
    m.classList.toggle("active", active);
    m.classList.toggle("use-video", useVideo);
    m.classList.toggle("use-image", !useVideo);
  });
}

function setSlide(n, src = "local") {
  if (n < 0 || n >= slides.length) return;
  cur = n;
  updateMediaClasses();
  document.querySelectorAll(".progress").forEach((p) =>
    p.style.width = `${((cur + 1) / slides.length) * 100}%`);
  document.querySelectorAll(".counter").forEach((c) =>
    c.textContent = `${pad(cur + 1)} / ${pad(slides.length)}`);
  document.querySelectorAll(".cue").forEach((c, i) =>
    c.classList.toggle("active", i === cur));
  resetVideos();
  const activeCue = document.querySelector(".cue.active");
  if (activeCue && src === "local") activeCue.scrollIntoView({ block: "center", behavior: "smooth" });
  history.replaceState(null, "", `#s${cur}`);
  if (!isAud && src !== "remote") sync();
}

function resetVideos() {
  document.querySelectorAll("video").forEach((v) => {
    const i = parseInt(v.dataset.v, 10);
    try {
      if (i === cur && slides[i].hasVideo) {
        v.pause();
        v.currentTime = 0;
        const p = v.play();
        if (p && p.catch) p.catch(() => {});
      } else {
        v.pause();
        v.currentTime = 0;
      }
    } catch (_) {}
  });
}

function playCurrentVideo() {
  document.querySelectorAll(`video[data-v="${cur}"]`).forEach((v) => {
    try {
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
    } catch (_) {}
  });
}

function restartVideo() {
  document.querySelectorAll(`video[data-v="${cur}"]`).forEach((v) => {
    try { v.pause(); v.currentTime = 0; v.play(); } catch (_) {}
  });
}

function sync() {
  const message = { type: MSG_TYPE, slide: cur, at: Date.now() };
  if (aud && !aud.closed) aud.postMessage(message, "*");
  if (ch) ch.postMessage(message);
  try { localStorage.setItem(SYNC_KEY, JSON.stringify(message)); } catch (_) {}
}

function openAud() {
  const u = new URL(location.href);
  u.searchParams.set("view", "audience");
  if (deck === "corporate") u.searchParams.set("deck", "corporate");
  else u.searchParams.delete("deck");
  u.hash = `s${cur}`;
  aud = window.open(u.toString(), `AIDECH_AUDIENCE_${deck.toUpperCase()}`, "popup=yes,width=1440,height=900");
  setTimeout(sync, 300);
  const status = document.getElementById("audStatus");
  if (status) status.innerHTML = aud
    ? "顧客表示：<b>別ウィンドウ起動済み。この別ウィンドウだけ共有してください。</b>"
    : "顧客表示：<b>ポップアップがブロックされています。許可してください。</b>";
}

function fs() {
  if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen();
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
}

function mediaStatusText(i) {
  if (slides[i].hasVideo) return "VIDEO / MP4自動再生";
  if (slides[i].checked) return "IMAGE / 画像スライド";
  return "CHECKING / 検出中";
}

function updateCueMediaLabels() {
  document.querySelectorAll(".mediaType").forEach((el, i) => {
    el.textContent = mediaStatusText(i);
  });
}

function presenter() {
  document.getElementById("app").innerHTML = `
    <div class="presenter">
      <div class="previewPane">
        <div class="notice">発表者ビュー：この画面は共有しないでください</div>
        <div class="previewShell">${stage()}</div>
      </div>
      <aside class="panel">
        <div class="head">
          <h1>Aidech ${deckMeta.label} 台本操作型プレゼン</h1>
          <p>「顧客表示を開く」で開いた<b>別ウィンドウだけ</b>を画面共有します。手元はこの台本を見ながら進行できます。</p>
        </div>
        <div class="warn">⚠ この画面を共有すると台本が見えます。共有するのは顧客ウィンドウだけにしてください。</div>
        <div class="controls">
          <button class="primary" id="open">顧客表示を開く</button>
          <button id="full">全画面</button>
        </div>
        <div class="controls">
          <button id="prev">← 前へ</button>
          <button id="next">次へ →</button>
        </div>
        <div class="controls">
          <button id="rv">動画を最初から</button>
          <button id="copy">質問をコピー</button>
        </div>
        <div class="status">
          <div id="audStatus">顧客表示：<b>未起動</b></div>
          <div>経過時間：<b class="timer" id="timer">00:00</b></div>
          <div>操作：Space / → 次へ、← 前へ、1〜9 指定、0で10枚目、R 動画再開、F 全画面</div>
        </div>
        <div class="cues">
          ${slides.map((s, i) => `
            <article class="cue" data-i="${i}">
              <div class="cueTop">
                <div>
                  <div class="cueNo">${pad(i + 1)} / ${pad(slides.length)}</div>
                  <div class="cueTitle">${s.title}</div>
                </div>
                <span class="badge">${pad(i + 1)}</span>
              </div>
              <div class="mediaType">${mediaStatusText(i)}</div>
              <div class="sec"><div class="lab">一言目</div><div class="txt strong">${s.first || ""}</div></div>
              <div class="sec"><div class="lab">補足説明</div><div class="txt">${s.talk || ""}</div></div>
              <div class="sec"><div class="lab">押さえるポイント</div><div class="tiny">${s.point || ""}</div></div>
              <div class="sec"><div class="lab">相手に投げる質問</div><div class="txt ask">${s.ask || ""}</div></div>
            </article>`).join("")}
        </div>
      </aside>
    </div>`;

  document.querySelectorAll(".cue").forEach((c) => {
    c.onclick = () => setSlide(parseInt(c.dataset.i, 10));
  });
  document.getElementById("open").onclick = openAud;
  document.getElementById("full").onclick = fs;
  document.getElementById("prev").onclick = () => setSlide(cur - 1);
  document.getElementById("next").onclick = () => setSlide(cur + 1);
  document.getElementById("rv").onclick = restartVideo;
  document.getElementById("copy").onclick = async () => {
    try { await navigator.clipboard.writeText(slides[cur].ask || ""); }
    catch (_) { alert(slides[cur].ask || ""); }
  };

  setInterval(() => {
    const sec = Math.floor((Date.now() - start) / 1000);
    const m = pad(Math.floor(sec / 60));
    const s = pad(sec % 60);
    const timer = document.getElementById("timer");
    if (timer) timer.textContent = `${m}:${s}`;
  }, 500);

  initVideoDetection();
  setSlide(cur, "remote");
}

function audience() {
  document.getElementById("app").innerHTML = stage();
  const overlay = document.createElement("div");
  overlay.className = "audOverlay";
  overlay.innerHTML = '<button onclick="fs()">全画面</button><button onclick="restartVideo()">動画再開</button>';
  document.body.appendChild(overlay);

  window.onmessage = (e) => {
    if (e.data && e.data.type === MSG_TYPE) setSlide(e.data.slide, "remote");
  };
  if (ch) ch.onmessage = (e) => {
    if (e.data && e.data.type === MSG_TYPE) setSlide(e.data.slide, "remote");
  };
  window.addEventListener("storage", (e) => {
    if (e.key === SYNC_KEY && e.newValue) {
      try {
        const message = JSON.parse(e.newValue);
        if (message.type === MSG_TYPE) setSlide(message.slide, "remote");
      } catch (_) {}
    }
  });

  initVideoDetection();
  setSlide(cur, "remote");
}

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
    e.preventDefault(); setSlide(cur + 1);
  }
  if (e.key === "ArrowLeft" || e.key === "PageUp") {
    e.preventDefault(); setSlide(cur - 1);
  }
  if (/^[1-9]$/.test(e.key)) setSlide(parseInt(e.key, 10) - 1);
  if (e.key === "0" && slides.length >= 10) setSlide(9);
  if (e.key.toLowerCase() === "r") restartVideo();
  if (e.key.toLowerCase() === "f") fs();
});

window.restartVideo = restartVideo;
window.fs = fs;

boot().catch((error) => {
  console.error(error);
  document.getElementById("app").innerHTML = `<div style="padding:32px;font-family:sans-serif;color:#081B3D"><h1>スライドを読み込めませんでした</h1><p style="margin-top:12px">${error.message}</p></div>`;
});
