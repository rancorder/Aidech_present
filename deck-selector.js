(() => {
  const params = new URLSearchParams(location.search);
  const isAudience = params.get('view') === 'audience';
  const selectedDeck = params.get('deck') === 'corporate' ? 'corporate' : 'store';

  function deckUrl(target) {
    const url = new URL(location.href);
    url.searchParams.set('deck', target);
    url.searchParams.delete('view');
    url.hash = '';
    return url.toString();
  }

  function go(target) {
    location.href = deckUrl(target);
  }

  function createLauncher() {
    if (isAudience || params.has('deck') || document.querySelector('.deckLauncher')) return;

    const launcher = document.createElement('div');
    launcher.className = 'deckLauncher';
    launcher.innerHTML = `
      <main class="deckLauncherCard" role="dialog" aria-modal="true" aria-labelledby="deckLauncherTitle">
        <div class="deckLauncherBrand">AIDECH MANAGEMENT</div>
        <h1 id="deckLauncherTitle">プレゼンを選択</h1>
        <p class="deckLauncherLead">商談相手に合わせて、使用するプレゼンを選んでください。</p>
        <div class="deckLauncherChoices">
          <button type="button" class="deckChoice store" data-deck="store">
            <span class="deckChoiceIcon">店</span>
            <span class="deckChoiceText">
              <b>店舗向け</b>
              <small>集客導線・店舗運営の改善</small>
            </span>
            <span class="deckChoiceArrow">→</span>
          </button>
          <button type="button" class="deckChoice corporate" data-deck="corporate">
            <span class="deckChoiceIcon">法</span>
            <span class="deckChoiceText">
              <b>企業向け</b>
              <small>業務改善・DX支援</small>
            </span>
            <span class="deckChoiceArrow">→</span>
          </button>
        </div>
        <p class="deckLauncherNote">選択後は発表者ビューが開きます。顧客には「顧客表示を開く」で起動した別ウィンドウだけを共有してください。</p>
      </main>`;

    launcher.querySelectorAll('[data-deck]').forEach((button) => {
      button.addEventListener('click', () => go(button.dataset.deck));
    });
    document.body.appendChild(launcher);
  }

  function injectSwitcher() {
    if (isAudience || document.querySelector('.deckSwitcher')) return;
    const head = document.querySelector('.panel .head');
    if (!head) return;

    const switcher = document.createElement('div');
    switcher.className = 'deckSwitcher';
    switcher.setAttribute('aria-label', 'プレゼン種別を切り替える');
    switcher.innerHTML = `
      <span>プレゼン種別</span>
      <div>
        <button type="button" data-deck="store" class="${selectedDeck === 'store' ? 'active' : ''}">店舗向け</button>
        <button type="button" data-deck="corporate" class="${selectedDeck === 'corporate' ? 'active' : ''}">企業向け</button>
      </div>`;

    switcher.querySelectorAll('[data-deck]').forEach((button) => {
      button.addEventListener('click', () => {
        if (button.dataset.deck !== selectedDeck) go(button.dataset.deck);
      });
    });
    head.appendChild(switcher);
  }

  createLauncher();
  injectSwitcher();

  const observer = new MutationObserver(injectSwitcher);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();