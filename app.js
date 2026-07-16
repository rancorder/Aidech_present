const q=new URLSearchParams(location.search),deck=q.get('deck')==='corporate'?'corporate':'store',audienceMode=q.get('view')==='audience';
const source=deck==='corporate'?'./corporate/slides.json':'./slides.json',channel=`aidech-${deck}-v4`,syncKey=`${channel}-state`;
const bc='BroadcastChannel'in window?new BroadcastChannel(channel):null;
if(deck==='corporate'){const l=document.createElement('link');l.rel='stylesheet';l.href='./corporate.css';document.head.append(l)}
let slides=[],current=0,audienceWindow=null,started=Date.now();
const pad=n=>String(n).padStart(2,'0');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const br=s=>esc(s).replaceAll('\n','<br>');

async function boot(){
  const r=await fetch(source); if(!r.ok)throw Error(`${source} を読み込めません`);
  slides=(await r.json()).map((s,i)=>({...s,id:s.id||i+1,html:deck==='corporate',image:s.image||`images/${s.id||i+1}.png`,video:s.video===undefined?`images/${s.id||i+1}.mp4`:s.video,hasVideo:false,checked:deck==='corporate'||s.video==='' }));
  const h=Number(location.hash.replace('#s','')); if(Number.isInteger(h)&&h>=0&&h<slides.length)current=h;
  document.title=`Aidech Management｜${deck==='corporate'?'企業向け':'店舗向け'} 台本操作型 Web Slides`;
  audienceMode?renderAudience():renderPresenter();
}

function icon(x){return `<span class="ci">${esc(x||'✓')}</span>`}
function header(s){return `<header class="ch"><h2>${br(s.title)}</h2><i></i><p>${esc(s.subtitle)}</p></header>`}
function footer(s){return `<footer class="cb"><b>◎</b><span>${esc(s.bottom)}</span></footer>`}

function overview(s){return `<div class="ov"><section class="ovp manual"><h3>${esc(s.leftTitle)}</h3><div class="cloud">${s.leftItems.map((x,i)=>`<b class="p${i}">${icon(['⇄','▥','⌕','☎','▰'][i])}${esc(x)}</b>`).join('')}</div><p>${esc(s.leftNote)}</p></section><em>➜</em><section class="ovp auto"><h3>${esc(s.rightTitle)}</h3><div class="autoBody"><ul>${s.rightItems.map((x,i)=>`<li>${icon(['◷','✓','↗','▥'][i])}<b>${esc(x)}</b></li>`).join('')}</ul><div class="dash">▥<small>↗</small></div></div><p>${esc(s.rightNote)}</p></section></div>`}
function grid6(s){return `<div class="g6">${s.items.map(x=>`<article>${icon(x.icon)}<div><h3>${esc(x.title)}</h3><i></i><p>${esc(x.desc)}</p></div></article>`).join('')}</div>`}
function dual(s){return `<div class="dual">${s.panels.map((p,i)=>`${i?'<em>⇄</em>':''}<section class="tone-${esc(p.tone)}"><h3><b>${esc(p.num)}</b>${esc(p.title)}</h3><ul>${p.items.map((x,j)=>`<li>${icon(['⌘','⌕','✓','◎'][j])}<span>${esc(x)}</span></li>`).join('')}</ul></section>`).join('')}</div>`}
function processSlide(s){return `<div class="proc">${s.steps.map((x,i)=>`<article><b>${i+1}</b>${icon(x.icon)}<h3>${esc(x.title)}</h3><p>${esc(x.desc)}</p></article>${i<s.steps.length-1?'<em>›</em>':''}`).join('')}</div>`}
function benefits(s){return `<div class="ben">${s.items.map((x,i)=>`<article><b>${i+1}</b>${icon(x.icon)}<div><h3>${esc(x.title)}</h3><p>${esc(x.desc)}</p></div></article>`).join('')}<section class="ba"><div><strong>Before</strong><p>時間がかかる・ミスが起きる・属人化している</p></div><em>➜</em><div><strong>After</strong><p>効率的・正確・共有しやすく、本来の仕事に集中できる</p></div></section></div>`}
function principles(s){return `<h3 class="pillTitle">5つの支援原則</h3><div class="prin">${s.items.map((x,i)=>`<article><b>${i+1}</b><h3>${esc(x.title)}</h3>${icon(x.icon)}</article>`).join('')}</div>`}
function examples(s){return `<div class="ex">${s.examples.map((x,i)=>`<article class="${i===2?'hit':''}">${i===2?'<b>まずは1業務から</b>':''}${icon(['▦','▥','◎','▣','☎'][i])}<h3>${esc(x)}</h3></article>`).join('')}</div><section class="criteria"><h3>選定の基準</h3>${s.criteria.map(x=>`<div><b>✓ ${esc(x.title)}</b><span>${esc(x.desc)}</span></div>`).join('')}</section>`}
function plans(s){return `<div class="plans">${s.plans.map((p,i)=>`<article class="tone-${esc(p.tone)}"><h3><b>${esc(p.num)}</b>${esc(p.title)}</h3><div class="pv">${icon(['⌕','↗','⚙'][i])}</div><ul>${p.items.map(x=>`<li>✓ ${esc(x)}</li>`).join('')}</ul></article>`).join('')}</div>`}
function diagnostic(s){return `<div class="questions">${s.questions.map((x,i)=>`<article><b>${i+1}</b>${icon(['✓','●','◷','!'][i])}<h3>${esc(x)}</h3></article>`).join('')}</div><section class="organize"><h3>診断で整理すること</h3>${s.organize.map((x,i)=>`<div>${icon(['⇄','…','↗','✦'][i])}<b>${esc(x)}</b></div>`).join('')}</section>`}
function closeSlide(s){return `<div class="close"><section><h3>次回ご提案</h3><ul>${s.items.map((x,i)=>`<li>${icon(['▤','⇄','▥','✓'][i])}<b>${esc(x)}</b></li>`).join('')}</ul></section><em>➜</em><aside><div>▥<small>✓</small></div><p>${esc(s.message)}</p></aside></div>`}
function corporateBody(s){return ({overview,grid6,dual,process:processSlide,benefits,principles,examples,plans,diagnostic,close:closeSlide}[s.layout]||(()=>'<p>未対応レイアウト</p>'))(s)}
function corporateSlide(s){return `<section class="corp layout-${esc(s.layout)}"><div class="corner"></div>${header(s)}<main>${corporateBody(s)}</main>${footer(s)}</section>`}

function media(s,i){
  if(s.html)return `<div class="media htmlMedia ${i===current?'active':''}" data-i="${i}">${corporateSlide(s)}</div>`;
  return `<div class="media use-image ${i===current?'active':''}" data-i="${i}"><img src="${esc(s.image)}" alt="${esc(s.title)}"><video data-v="${i}" src="${esc(s.video)}" poster="${esc(s.image)}" muted playsinline preload="metadata" loop></video></div>`;
}
function stage(){return `<div class="stage deck-${deck}"><div class="progressTrack"><div class="progress"></div></div>${slides.map(media).join('')}<div class="counter">01 / ${pad(slides.length)}</div></div>`}
function mediaText(i){return slides[i].html?'HTML / 編集可能スライド':slides[i].hasVideo?'VIDEO / MP4自動再生':slides[i].checked?'IMAGE / 画像スライド':'CHECKING / 検出中'}

function setSlide(n,origin='local'){
  if(n<0||n>=slides.length)return; current=n;
  document.querySelectorAll('.media').forEach((m,i)=>{m.classList.toggle('active',i===current);if(!slides[i].html){m.classList.toggle('use-video',i===current&&slides[i].hasVideo);m.classList.toggle('use-image',!(i===current&&slides[i].hasVideo))}});
  document.querySelectorAll('.progress').forEach(x=>x.style.width=`${(current+1)/slides.length*100}%`);
  document.querySelectorAll('.counter').forEach(x=>x.textContent=`${pad(current+1)} / ${pad(slides.length)}`);
  document.querySelectorAll('.cue').forEach((x,i)=>x.classList.toggle('active',i===current));
  videos(); history.replaceState(null,'',`#s${current}`);
  const c=document.querySelector('.cue.active'); if(c&&origin==='local')c.scrollIntoView({block:'center',behavior:'smooth'});
  if(!audienceMode&&origin!=='remote')sync();
}
function videos(){document.querySelectorAll('video').forEach(v=>{const i=+v.dataset.v;try{if(i===current&&slides[i].hasVideo){v.pause();v.currentTime=0;v.play().catch(()=>{})}else{v.pause();v.currentTime=0}}catch{}})}
function restartVideo(){document.querySelectorAll(`video[data-v="${current}"]`).forEach(v=>{try{v.pause();v.currentTime=0;v.play()}catch{}})}
function detectVideos(){document.querySelectorAll('video[data-v]').forEach(v=>{const i=+v.dataset.v;v.addEventListener('loadedmetadata',()=>{slides[i].hasVideo=true;slides[i].checked=true;setSlide(current,'remote');updateMediaLabels()},{once:true});v.addEventListener('error',()=>{slides[i].checked=true;updateMediaLabels()},{once:true});try{v.load()}catch{}})}
function updateMediaLabels(){document.querySelectorAll('.mediaType').forEach((x,i)=>x.textContent=mediaText(i))}
function sync(){const m={type:channel,slide:current};if(audienceWindow&&!audienceWindow.closed)audienceWindow.postMessage(m,'*');bc?.postMessage(m);try{localStorage.setItem(syncKey,JSON.stringify(m))}catch{}}
function openAudience(){const u=new URL(location.href);u.searchParams.set('view','audience');if(deck==='corporate')u.searchParams.set('deck','corporate');u.hash=`s${current}`;audienceWindow=open(u,`AIDECH_${deck}`,'popup=yes,width=1440,height=900');setTimeout(sync,300);document.querySelector('#audStatus').innerHTML=audienceWindow?'顧客表示：<b>起動済み。この別ウィンドウだけ共有してください。</b>':'顧客表示：<b>ポップアップを許可してください。</b>'}
function full(){document.fullscreenElement?document.exitFullscreen?.():document.documentElement.requestFullscreen?.()}

function renderPresenter(){document.querySelector('#app').innerHTML=`<div class="presenter"><div class="previewPane"><div class="notice">発表者ビュー：この画面は共有しないでください</div><div class="previewShell">${stage()}</div></div><aside class="panel"><div class="head"><h1>Aidech ${deck==='corporate'?'企業向け':'店舗向け'} 台本操作型プレゼン</h1><p>「顧客表示を開く」で開いた<b>別ウィンドウだけ</b>を画面共有します。</p></div><div class="warn">⚠ この画面を共有すると台本が見えます。</div><div class="controls"><button class="primary" id="open">顧客表示を開く</button><button id="full">全画面</button></div><div class="controls"><button id="prev">← 前へ</button><button id="next">次へ →</button></div><div class="controls"><button id="rv">動画を最初から</button><button id="copy">質問をコピー</button></div><div class="status"><div id="audStatus">顧客表示：<b>未起動</b></div><div>経過時間：<b class="timer" id="timer">00:00</b></div><div>操作：Space / → 次へ、← 前へ、1〜9、0で10枚目、F 全画面</div></div><div class="cues">${slides.map((s,i)=>`<article class="cue" data-i="${i}"><div class="cueTop"><div><div class="cueNo">${pad(i+1)} / ${pad(slides.length)}</div><div class="cueTitle">${br(s.title)}</div></div><span class="badge">${pad(i+1)}</span></div><div class="mediaType">${mediaText(i)}</div><div class="sec"><div class="lab">一言目</div><div class="txt strong">${esc(s.first)}</div></div><div class="sec"><div class="lab">補足説明</div><div class="txt">${esc(s.talk)}</div></div><div class="sec"><div class="lab">押さえるポイント</div><div class="tiny">${esc(s.point)}</div></div><div class="sec"><div class="lab">相手に投げる質問</div><div class="txt ask">${esc(s.ask)}</div></div></article>`).join('')}</div></aside></div>`;
  document.querySelectorAll('.cue').forEach(x=>x.onclick=()=>setSlide(+x.dataset.i));
  document.querySelector('#open').onclick=openAudience;
  document.querySelector('#full').onclick=full;
  document.querySelector('#prev').onclick=()=>setSlide(current-1);
  document.querySelector('#next').onclick=()=>setSlide(current+1);
  document.querySelector('#rv').onclick=restartVideo;
  document.querySelector('#copy').onclick=()=>navigator.clipboard?.writeText(slides[current].ask||'');
  setInterval(()=>{const s=Math.floor((Date.now()-started)/1000),t=document.querySelector('#timer');if(t)t.textContent=`${pad(Math.floor(s/60))}:${pad(s%60)}`},500);detectVideos();setSlide(current,'remote')
}
function renderAudience(){document.querySelector('#app').innerHTML=stage();const o=document.createElement('div');o.className='audOverlay';o.innerHTML='<button id="af">全画面</button><button id="ar">動画再開</button>';document.body.append(o);document.querySelector('#af').onclick=full;document.querySelector('#ar').onclick=restartVideo;onmessage=e=>{if(e.data?.type===channel)setSlide(e.data.slide,'remote')};if(bc)bc.onmessage=e=>{if(e.data?.type===channel)setSlide(e.data.slide,'remote')};addEventListener('storage',e=>{if(e.key===syncKey&&e.newValue){try{const m=JSON.parse(e.newValue);if(m.type===channel)setSlide(m.slide,'remote')}catch{}}});detectVideos();setSlide(current,'remote')}

document.addEventListener('keydown',e=>{if(['ArrowRight',' ','PageDown'].includes(e.key)){e.preventDefault();setSlide(current+1)}if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();setSlide(current-1)}if(/^[1-9]$/.test(e.key))setSlide(+e.key-1);if(e.key==='0')setSlide(9);if(e.key.toLowerCase()==='f')full();if(e.key.toLowerCase()==='r')restartVideo()});
window.restartVideo=restartVideo;window.full=full;
boot().catch(e=>document.querySelector('#app').textContent=`スライドを読み込めませんでした：${e.message}`);
