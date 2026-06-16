let slides = [];
let current = 0;
const $ = (id) => document.getElementById(id);
const img = $('slideImage');
const fallback = $('fallback');
const imageRoot = 'images/';

function pad(n){return String(n).padStart(2,'0')}
function imagePath(slide){return imageRoot + slide.file}

async function boot(){
  const res = await fetch('./slides.json');
  slides = await res.json();
  buildScript();
  buildThumbs();
  render();
}

function render(){
  const s = slides[current];
  $('counter').textContent = `${pad(current+1)} / ${pad(slides.length)}`;
  $('slideTitle').textContent = s.title;
  $('notesTitle').textContent = `${pad(current+1)}. ${s.title}`;
  $('notesText').textContent = s.notes;
  $('fallbackTitle').textContent = s.title;
  fallback.hidden = true;
  img.style.display = 'block';
  img.src = imagePath(s);
  img.alt = `${pad(current+1)} ${s.title}`;
  document.querySelectorAll('.script-card,.thumb').forEach((el,i)=>el.classList.toggle('active', i===current));
}

img.onerror = function(){
  img.style.display = 'none';
  fallback.hidden = false;
};

function go(n){if(!slides.length)return;current=(n+slides.length)%slides.length;render()}
function togglePanel(id,open){const p=$(id);const should=open ?? !p.classList.contains('open');p.classList.toggle('open',should);p.setAttribute('aria-hidden',String(!should))}
function closePanels(){['notesPanel','scriptPanel','thumbPanel'].forEach(id=>togglePanel(id,false))}

function buildScript(){
  const box=$('scriptList'); box.innerHTML='';
  slides.forEach((s,i)=>{
    const b=document.createElement('button');
    b.className='script-card';
    b.innerHTML=`<span class="num">${pad(i+1)}</span><h3>${s.title}</h3><p>${s.notes}</p>`;
    b.onclick=()=>{go(i)};
    box.appendChild(b);
  });
}

function buildThumbs(){
  const box=$('thumbList'); box.innerHTML='';
  slides.forEach((s,i)=>{
    const b=document.createElement('button');
    b.className='thumb';
    const t=document.createElement('img');
    t.src=imagePath(s);
    t.alt=`${pad(i+1)} ${s.title}`;
    t.loading='lazy';
    t.onerror=function(){t.style.display='none'};
    const label=document.createElement('span');
    label.textContent=`${pad(i+1)} ${s.title}`;
    b.appendChild(t);
    b.appendChild(label);
    b.onclick=()=>{go(i);togglePanel('thumbPanel',false)};
    box.appendChild(b);
  });
}

$('prevBtn').onclick=()=>go(current-1); $('nextBtn').onclick=()=>go(current+1);
$('noteBtn').onclick=()=>togglePanel('notesPanel'); $('scriptBtn').onclick=()=>togglePanel('scriptPanel'); $('thumbBtn').onclick=()=>togglePanel('thumbPanel');
$('fullBtn').onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();
$('closeNotes').onclick=()=>togglePanel('notesPanel',false); $('closeScript').onclick=()=>togglePanel('scriptPanel',false); $('closeThumbs').onclick=()=>togglePanel('thumbPanel',false);

document.addEventListener('keydown',(e)=>{
  if(e.key==='ArrowRight'||e.key===' '){e.preventDefault();go(current+1)}
  if(e.key==='ArrowLeft'){e.preventDefault();go(current-1)}
  if(e.key.toLowerCase()==='n')togglePanel('notesPanel');
  if(e.key.toLowerCase()==='s')togglePanel('scriptPanel');
  if(e.key.toLowerCase()==='m')togglePanel('thumbPanel');
  if(e.key.toLowerCase()==='f')$('fullBtn').click();
  if(e.key==='Escape')closePanels();
  if($('scriptPanel').classList.contains('open') && e.key==='Enter'){e.preventDefault();go(current+1)}
  if($('scriptPanel').classList.contains('open') && e.key==='Backspace'){e.preventDefault();go(current-1)}
});

boot();
