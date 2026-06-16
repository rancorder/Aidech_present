/* Aidech Web Slides — 発表者ビュー / 顧客表示 分離型
   - ?view=audience で顧客ウィンドウ（共有するのはこれだけ）
   - BroadcastChannel + localStorage + window.open でスライド同期
   - images/N.mp4 があれば自動で動画再生、無ければ images/N.png
*/
const CH_NAME = "aidech-sync-v1";
const SYNC_KEY = "aidech-sync-v1";
const MSG_TYPE = "aidech-slide";

let slides = [];
let cur = 0;
let aud = null;
let start = Date.now();
const params = new URLSearchParams(location.search);
const isAud = params.get("view") === "audience";
const ch = ("BroadcastChannel" in window) ? new BroadcastChannel(CH_NAME) : null;

const pad = (n) => String(n).padStart(2, "0");

async function boot() {
  const res = await fetch("./slides.json");
  const raw = await res.json();
  slides = raw.map((s, i) => ({
    ...s,
    image: s.image || `images/${s.id || i + 1}.png`,
    video: s.video || `images/${s.id || i + 1}.mp4`,
    hasVideo: false,
    checked: false
  }));

  let h = parseInt(location.hash.replace("#s", ""), 10);
  if (!isNaN(h) && h >= 0 && h < slides.length) cur = h;

  isAud ? audience() : presenter();
}

/* ---------- 共通：ステージ（スライド表示部） ---------- */
function media(s, i) {
  const a = i === cur ? " active" : "";
  return `<div class="media use-image${a}" data-i="${i}">
    <img src="${s.image}" alt="${pad(i + 1)} ${s.title}">
    <video data-v="${i}" src="${s.video}" poster="${s.image}" muted playsinline preload="metadata" loop></video>
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

/* ---------- MP4 自動検出 ---------- */
function initVideoDetection() {
  document.querySelectorAll("video[data-v]").forEach((v) => {
    const i = parseInt(v.dataset.v, 10);
    const s = slides[i];
    const wrap = v.closest(".media");
    v.addEventListener("loadedmetadata", () => {
      s.hasVideo = true; s.checked = true;
      if (wrap) wrap.dataset.hasVideo = "true";
      updateMediaClasses();
      if (i === cur) playCurrentVideo();
      updateCueMediaLabels();
    }, { once: true });
    v.addEventListener("error", () => {
      s.hasVideo = false; s.checked = true;
      if (wrap) wrap.dataset.hasVideo = "false";
      updateMediaClasses();
      updateCueMediaLabels();
    }, { once: true });
    try { v.load(); } catch (e) {}
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
  document.querySelectorAll(".vflag").forEach((f) =>
    f.classList.toggle("on", slides[cur] && slides[cur].hasVideo));
}

/* ---------- スライド遷移 ---------- */
function setSlide(n, src = "local") {
  if (n < 0 || n >= slides.length) return;
  cur = n;
  updateMediaClasses();
  document.querySelectorAll(".progress").forEach((p) =>
    p.style.width = ((cur + 1) / slides.length * 100) + "%");
  document.querySelectorAll(".counter").forEach((c) =>
    c.textContent = pad(cur + 1) + " / " + pad(slides.length));
  document.querySelectorAll(".cue").forEach((c, i) =>
    c.classList.toggle("active", i === cur));
  resetVideos();
  const ac = document.querySelector(".cue.active");
  if (ac && src === "local") ac.scrollIntoView({ block: "center", behavior: "smooth" });
  history.replaceState(null, "", "#s" + cur);
  if (!isAud && src !== "remote") sync();
}

function resetVideos() {
  document.querySelectorAll("video").forEach((v) => {
    const i = parseInt(v.dataset.v, 10);
    try {
      if (i === cur && slides[i].hasVideo) {
        v.pause(); v.currentTime = 0;
        const p = v.play(); if (p && p.catch) p.catch(() => {});
      } else { v.pause(); v.currentTime = 0; }
    } catch (e) {}
  });
}
function playCurrentVideo() {
  document.querySelectorAll(`video[data-v="${cur}"]`).forEach((v) => {
    try { const p = v.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
  });
}
function restartVideo() {
  document.querySelectorAll(`video[data-v="${cur}"]`).forEach((v) => {
    try { v.pause(); v.currentTime = 0; v.play(); } catch (e) {}
  });
}
function toggleVideo() {
  document.querySelectorAll(`video[data-v="${cur}"]`).forEach((v) =>
    v.paused ? v.play() : v.pause());
}

/* ---------- 同期 ---------- */
function sync() {
  const m = { type: MSG_TYPE, slide: cur, at: Date.now() };
  if (aud && !aud.closed) aud.postMessage(m, "*");
  if (ch) ch.postMessage(m);
  try { localStorage.setItem(SYNC_KEY, JSON.stringify(m)); } catch (e) {}
}
function openAud() {
  const u = new URL(location.href);
  u.searchParams.set("view", "audience");
  u.hash = "s" + cur;
  aud = window.open(u.toString(), "AIDECH_AUDIENCE", "popup=yes,width=1440,height=900");
  setTimeout(sync, 300);
  const st = document.getElementById("audStatus");
  if (st) st.innerHTML = aud
    ? "顧客表示：<b>別ウィンドウ起動済み。この別ウィンドウだけ共有してください。</b>"
    : "顧客表示：<b>ポップアップがブロックされています。許可してください。</b>";
}
function fs() {
  if (!document.fullscreenElement && document.documentElement.requestFullscreen)
    document.documentElement.requestFullscreen();
  else if (document.exitFullscreen) document.exitFullscreen();
}

/* ---------- カンペのメディア種別ラベル ---------- */
function mediaStatusText(i) {
  if (slides[i].hasVideo) return "VIDEO / MP4自動再生";
  if (slides[i].checked) return "IMAGE / 画像スライド";
  return "CHECKING / 検出中";
}
function updateCueMediaLabels() {
  document.querySelectorAll(".mediaType").forEach((el, i) =>
    el.textContent = mediaStatusText(i));
}

/* ---------- 発表者ビュー ---------- */
function presenter() {
  document.getElementById("app").innerHTML = `
    <div class="presenter">
      <div class="previewPane">
        <div class="notice">発表者ビュー：この画面は共有しないでください</div>
        <div class="previewShell">${stage()}</div>
      </div>
      <aside class="panel">
        <div class="head">
          <h1>Aidech 台本操作型プレゼン</h1>
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
          <div>操作：Space / → 次へ、← 前へ、1〜9 指定、R 動画再開、F 全画面</div>
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

  document.querySelectorAll(".cue").forEach((c) =>
    c.onclick = () => setSlide(parseInt(c.dataset.i, 10)));
  document.getElementById("open").onclick = openAud;
  document.getElementById("full").onclick = fs;
  document.getElementById("prev").onclick = () => setSlide(cur - 1);
  document.getElementById("next").onclick = () => setSlide(cur + 1);
  document.getElementById("rv").onclick = restartVideo;
  document.getElementById("copy").onclick = async () => {
    try { await navigator.clipboard.writeText(slides[cur].ask || ""); }
    catch (e) { alert(slides[cur].ask || ""); }
  };

  setInterval(() => {
    const sec = Math.floor((Date.now() - start) / 1000);
    const m = pad(Math.floor(sec / 60)), s = pad(sec % 60);
    const t = document.getElementById("timer");
    if (t) t.textContent = `${m}:${s}`;
  }, 500);

  initVideoDetection();
  setSlide(cur, "remote");
}

/* ---------- 顧客表示（共有する画面） ---------- */
function audience() {
  document.getElementById("app").innerHTML = stage();
  const o = document.createElement("div");
  o.className = "audOverlay";
  o.innerHTML = '<button onclick="fs()">全画面</button><button onclick="restartVideo()">動画再開</button>';
  document.body.appendChild(o);

  window.onmessage = (e) => {
    if (e.data && e.data.type === MSG_TYPE) setSlide(e.data.slide, "remote");
  };
  if (ch) ch.onmessage = (e) => {
    if (e.data && e.data.type === MSG_TYPE) setSlide(e.data.slide, "remote");
  };
  window.addEventListener("storage", (e) => {
    if (e.key === SYNC_KEY && e.newValue) {
      try {
        const m = JSON.parse(e.newValue);
        if (m.type === MSG_TYPE) setSlide(m.slide, "remote");
      } catch (_) {}
    }
  });

  initVideoDetection();
  setSlide(cur, "remote");
}

/* ---------- キーボード操作 ---------- */
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); setSlide(cur + 1); }
  if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); setSlide(cur - 1); }
  if (/^[1-9]$/.test(e.key)) setSlide(parseInt(e.key, 10) - 1);
  if (e.key.toLowerCase() === "r") restartVideo();
  if (e.key.toLowerCase() === "f") fs();
});

window.restartVideo = restartVideo;
window.toggleVideo = toggleVideo;
window.fs = fs;

boot();
