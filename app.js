const q=new URLSearchParams(location.search),deck=q.get('deck')==='corporate'?'corporate':'store',audienceMode=q.get('view')==='audience';
const source=deck==='corporate'?'./corporate/slides.json':'./slides.json',channel=`aidech-${deck}-v5`,syncKey=`${channel}-state`;
const bc='BroadcastChannel'in window?new BroadcastChannel(channel):null;
let slides=[],current=0,audienceWindow=null,started=Date.now();
const pad=n=>String(n).padStart(2,'0');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const br=s=>esc(s).replaceAll('\n','<br>');

async function boot(){
  const r=await fetch(source);if(!r.ok)throw Error(`${source} を読み込めません`);
  const data=await r.json();
  slides=data.map((s,i)=>{const id=s.id||i+1,corp=deck==='corporate';return{...s,id,image:corp?`corporate/images/${id}.svg`:(s.image||`images/${id}.png`),video:corp?'':(s.video===undefined?`images/${id}.mp4`:s.video),hasVideo:false,checked:corp||s.video===''};});
  const h=Number(location.hash.replace('#s',''));if(Number.isInteger(h)&&h>=0&&h<slides.length)current=h;
  document.title=`Aidech Management｜${deck==='corporate'?'企業向け':'店舗向け'} 台本操作型 Web Slides`;
  audienceMode?renderAudience():renderPresenter();
}
function media(s,i){return `<div class="media use-image ${i===current?'active':''}" data-i="${i}"><img src="${esc(s.image)}" alt="${esc(s.title)}"><video data-v="${i}" src="${esc(s.video)}" poster="${esc(s.image)}" muted playsinline preload="metadata" loop></video></div>`;}
function stage(){return `<div class="stage deck-${deck}"><div class="progressTrack"><div class="progress"></div></div>${slides.map(media).join('')}<div class="counter">01 / ${pad(slides.length)}</div></div>`;}
function mediaText(i){return slides[i].hasVideo?'VIDEO / MP4自動再生':'IMAGE / 高品質スライド';}
function setSlide(n,origin='local'){
  if(n<0||n>=slides.length)return;current=n;
  document.querySelectorAll('.media').forEach((m,i)=>{m.classList.toggle('active',i===current);m.classList.toggle('use-video',i===current&&slides[i].hasVideo);m.classList.toggle('use-image',!(i===current&&slides[i].hasVideo));});
  document.querySelectorAll('.progress').forEach(x=>x.style.width=`${(current+1)/slides.length*100}%`);
  document.querySelectorAll('.counter').forEach(x=>x.textContent=`${pad(current+1)} / ${pad(slides.length)}`);
  document.querySelectorAll('.cue').forEach((x,i)=>x.classList.toggle('active',i===current));
  videos();history.replaceState(null,'',`#s${current}`);
  const c=document.querySelector('.cue.active');if(c&&origin==='local')c.scrollIntoView({block:'center',behavior:'smooth'});
  if(!audienceMode&&origin!=='remote')sync();
}
function videos(){document.querySelectorAll('video').forEach(v=>{const i=+v.dataset.v;try{if(i===current&&slides[i].hasVideo){v.pause();v.currentTime=0;v.play().catch(()=>{});}else{v.pause();v.currentTime=0;}}catch{}});}
function restartVideo(){document.querySelectorAll(`video[data-v="${current}"]`).forEach(v=>{try{v.pause();v.currentTime=0;v.play();}catch{}});}
function detectVideos(){if(deck==='corporate')return;document.querySelectorAll('video[data-v]').forEach(v=>{const i=+v.dataset.v;v.addEventListener('loadedmetadata',()=>{slides[i].hasVideo=true;slides[i].checked=true;setSlide(current,'remote');updateMediaLabels();},{once:true});v.addEventListener('error',()=>{slides[i].checked=true;updateMediaLabels();},{once:true});try{v.load();}catch{}});}
function updateMediaLabels(){document.querySelectorAll('.mediaType').forEach((x,i)=>x.textContent=mediaText(i));}
function sync(){const m={type:channel,slide:current};if(audienceWindow&&!audienceWindow.closed)audienceWindow.postMessage(m,'*');bc?.postMessage(m);try{localStorage.setItem(syncKey,JSON.stringify(m));}catch{}}
function openAudience(){const u=new URL(location.href);u.searchParams.set('view','audience');u.searchParams.set('deck',deck);u.hash=`s${current}`;audienceWindow=open(u,`AIDECH_${deck}`,'popup=yes,width=1440,height=900');setTimeout(sync,300);document.querySelector('#audStatus').innerHTML=audienceWindow?'顧客表示：<b>起動済み。この別ウィンドウだけ共有してください。</b>':'顧客表示：<b>ポップアップを許可してください。</b>';}
function full(){document.fullscreenElement?document.exitFullscreen?.():document.documentElement.requestFullscreen?.();}
function renderPresenter(){
  document.querySelector('#app').innerHTML=`<div class="presenter"><div class="previewPane"><div class="notice">発表者ビュー：この画面は共有しないでください</div><div class="previewShell">${stage()}</div></div><aside class="panel"><div class="head"><h1>Aidech ${deck==='corporate'?'企業向け':'店舗向け'} 台本操作型プレゼン</h1><p>「顧客表示を開く」で開いた<b>別ウィンドウだけ</b>を画面共有します。</p></div><div class="warn">⚠ この画面を共有すると台本が見えます。</div><div class="controls"><button class="primary" id="open">顧客表示を開く</button><button id="full">全画面</button></div><div class="controls"><button id="prev">← 前へ</button><button id="next">次へ →</button></div><div class="controls"><button id="rv">動画を最初から</button><button id="copy">質問をコピー</button></div><div class="status"><div id="audStatus">顧客表示：<b>未起動</b></div><div>経過時間：<b class="timer" id="timer">00:00</b></div><div>操作：Space / → 次へ、← 前へ、1〜9、0で10枚目、F 全画面</div></div><div class="cues">${slides.map((s,i)=>`<article class="cue" data-i="${i}"><div class="cueTop"><div><div class="cueNo">${pad(i+1)} / ${pad(slides.length)}</div><div class="cueTitle">${br(s.title)}</div></div><span class="badge">${pad(i+1)}</span></div><div class="mediaType">${mediaText(i)}</div><div class="sec"><div class="lab">一言目</div><div class="txt strong">${esc(s.first)}</div></div><div class="sec"><div class="lab">補足説明</div><div class="txt">${esc(s.talk)}</div></div><div class="sec"><div class="lab">押さえるポイント</div><div class="tiny">${esc(s.point)}</div></div><div class="sec"><div class="lab">相手に投げる質問</div><div class="txt ask">${esc(s.ask)}</div></div></article>`).join('')}</div></aside></div>`;
  document.querySelectorAll('.cue').forEach(x=>x.onclick=()=>setSlide(+x.dataset.i));
  document.querySelector('#open').onclick=openAudience;document.querySelector('#full').onclick=full;document.querySelector('#prev').onclick=()=>setSlide(current-1);document.querySelector('#next').onclick=()=>setSlide(current+1);document.querySelector('#rv').onclick=restartVideo;document.querySelector('#copy').onclick=()=>navigator.clipboard?.writeText(slides[current].ask||'');
  setInterval(()=>{const s=Math.floor((Date.now()-started)/1000),t=document.querySelector('#timer');if(t)t.textContent=`${pad(Math.floor(s/60))}:${pad(s%60)}`;},500);detectVideos();setSlide(current,'remote');
}
function renderAudience(){document.querySelector('#app').innerHTML=stage();const o=document.createElement('div');o.className='audOverlay';o.innerHTML='<button id="af">全画面</button><button id="ar">動画再開</button>';document.body.append(o);document.querySelector('#af').onclick=full;document.querySelector('#ar').onclick=restartVideo;onmessage=e=>{if(e.data?.type===channel)setSlide(e.data.slide,'remote');};if(bc)bc.onmessage=e=>{if(e.data?.type===channel)setSlide(e.data.slide,'remote');};addEventListener('storage',e=>{if(e.key===syncKey&&e.newValue){try{const m=JSON.parse(e.newValue);if(m.type===channel)setSlide(m.slide,'remote');}catch{}}});detectVideos();setSlide(current,'remote');}
document.addEventListener('keydown',e=>{if(['ArrowRight',' ','PageDown'].includes(e.key)){e.preventDefault();setSlide(current+1);}if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();setSlide(current-1);}if(/^[1-9]$/.test(e.key))setSlide(+e.key-1);if(e.key==='0')setSlide(9);if(e.key.toLowerCase()==='f')full();if(e.key.toLowerCase()==='r')restartVideo();});
window.restartVideo=restartVideo;window.full=full;boot().catch(e=>document.querySelector('#app').textContent=`スライドを読み込めませんでした：${e.message}`);