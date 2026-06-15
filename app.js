const slides = [
  {id:1,title:'表紙',image:'https://drive.google.com/thumbnail?id=1XUBN_w9WMWu8LWz5S_jMIKFUeAwC-kGK&sz=w2400',notes:'本日は、地域のお店を見つけてもらいやすく、選ばれやすくするための導線整理についてご提案します。InstagramやGoogleマップを単体で頑張るのではなく、お客様が検索してから来店するまで迷わない状態をつくる内容です。'},
  {id:2,title:'こんなお悩み、ありませんか？',image:'https://drive.google.com/thumbnail?id=1Ap4XwIFJeJFAu5xb9dD_h00TYP2vpHiv&sz=w2400',notes:'多くのお店では、発信そのものよりも、何を直せば来店につながるのかが見えにくくなっています。Instagramを更新していても反応が見えない、Googleマップの情報が古い、写真やプロフィールがバラバラ、日々の業務で改善に手が回らない。まずはこの状態を整理します。'},
  {id:3,title:'2つの支援',image:'https://drive.google.com/thumbnail?id=1pC3fe-Qs09j-gU4c1tERrTEgrUWBGzux&sz=w2400',notes:'支援は大きく二つです。一つ目は集客の土台づくり。Googleマップ、Instagram、写真や動画の見せ方を整えます。二つ目は店舗運営のラク化。予約や問い合わせ、LINE活用、手作業削減まで、現場が回る仕組みも視野に入れます。'},
  {id:4,title:'ご相談から導入・伴走までの流れ',image:'https://drive.google.com/thumbnail?id=1db4Ym2FzMk4viNb4c5uj2MHLtpjOAtP2&sz=w2400',notes:'いきなり運用を増やすのではなく、まず現状をお聞きして、優先順位を整理します。そのうえで改善方針を設計し、必要な初期構築や導線整理を行い、月額伴走で反応を見ながら育てていきます。'},
  {id:5,title:'導入によって期待できる変化',image:'https://drive.google.com/thumbnail?id=1OPcGCYskt8AtsAIWyvRdDOKOYmW4tcju&sz=w2400',notes:'導線が整うと、見つけてもらいやすくなり、魅力が伝わりやすくなり、再来店にもつながりやすくなります。集客だけではなく、現場の手作業や迷いを減らし、お客様と向き合う時間を増やすことも重要な変化です。'},
  {id:6,title:'サポート体制',image:'https://drive.google.com/thumbnail?id=1xP-mceQUxd0u14sTaaUWjaPua9YkWGQH&sz=w2400',notes:'難しい専門用語で進めるのではなく、店舗目線でわかりやすく整理します。専門知識がなくても進めやすい形に落とし込み、状況に応じて柔軟に対応します。机上の提案ではなく、現場に合う形にすることを大切にします。'},
  {id:7,title:'集客の土台づくり',image:'https://drive.google.com/thumbnail?id=1JNx1V2EUSrv79Nke_cYNZoyDwtW550h_&sz=w2400',notes:'まずは集客の土台を完成させます。Instagramプロフィールやピン留め投稿、Googleマップの基本整備、メニュー・写真・口コミから予約への導線整理など、見つけてもらいやすい状態を先につくります。'},
  {id:8,title:'3つの伴走プラン',image:'https://drive.google.com/thumbnail?id=1deoRqTsmFeTUrnvQgCObE9q7sYXK4lkj&sz=w2400',notes:'お店の状態に合わせて、アドバイス中心、継続改善中心、写真や動画まで任せるプランまで選べる形です。金額ありきではなく、どこまで自社でできて、どこから任せたいかを確認しながら無理なく設計します。'},
  {id:9,title:'無料診断・ご相談',image:'https://drive.google.com/thumbnail?id=1qEUpUDuCdsC5CBWh_nToyK202NkrhzcN&sz=w2400',notes:'最初から大きな導入を決める必要はありません。まずは現状のInstagram、Googleマップ、ホームページを確認し、改善の優先順位を整理します。何から手をつければいいかを、次の一歩に変える相談です。'},
  {id:10,title:'締め',image:'https://drive.google.com/thumbnail?id=1D4xGDliwoNAFL1_BfTzhuZxIJ-PQKvr4&sz=w2400',notes:'お店の魅力はすでにあります。必要なのは、その魅力が伝わる順番と導線を整えることです。見つけてもらい、選ばれ、来店につながる状態を一緒につくっていきましょう。'}
];
let current = 0;
const $ = (id)=>document.getElementById(id);
const img = $('slideImage');
const fallback = $('fallback');
function pad(n){return String(n).padStart(2,'0')}
function render(){
  const s = slides[current];
  $('counter').textContent = `${pad(current+1)} / ${pad(slides.length)}`;
  $('slideTitle').textContent = s.title;
  $('notesTitle').textContent = `${pad(current+1)}. ${s.title}`;
  $('notesText').textContent = s.notes;
  $('fallbackTitle').textContent = s.title;
  fallback.hidden = true;
  img.style.display = 'block';
  img.src = s.image;
  img.alt = `${pad(current+1)} ${s.title}`;
  document.querySelectorAll('.script-card,.thumb').forEach((el,i)=>el.classList.toggle('active', i===current));
}
img.onerror = ()=>{img.style.display='none'; fallback.hidden=false};
function go(n){current=(n+slides.length)%slides.length;render()}
function togglePanel(id,open){const p=$(id);const should=open ?? !p.classList.contains('open');p.classList.toggle('open',should);p.setAttribute('aria-hidden',String(!should))}
function closePanels(){['notesPanel','scriptPanel','thumbPanel'].forEach(id=>togglePanel(id,false))}
function buildScript(){
  const box=$('scriptList'); box.innerHTML='';
  slides.forEach((s,i)=>{const b=document.createElement('button');b.className='script-card';b.innerHTML=`<span class="num">${pad(i+1)}</span><h3>${s.title}</h3><p>${s.notes}</p>`;b.onclick=()=>{go(i)};box.appendChild(b)});
}
function buildThumbs(){
  const box=$('thumbList'); box.innerHTML='';
  slides.forEach((s,i)=>{const b=document.createElement('button');b.className='thumb';b.innerHTML=`<img src="${s.image}" alt=""><span>${pad(i+1)} ${s.title}</span>`;b.onclick=()=>{go(i);togglePanel('thumbPanel',false)};box.appendChild(b)});
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
buildScript();buildThumbs();render();
