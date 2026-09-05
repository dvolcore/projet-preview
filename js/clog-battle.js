(function () {
  'use strict';
  const root = document.querySelector('[data-clog-battle]');
  if (!root) return;
  const stage = root.querySelector('.clog-battle__stage');
  const watch = root.querySelector('[data-battle-watch]');
  const status = root.querySelector('[data-battle-status]');
  const hero = root.querySelector('.clog-battle__hero');
  const monster = root.querySelector('.clog-battle__monster');
  const service = root.querySelector('[data-battle-service]');
  const base = root.dataset.assetBase;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const choices = {
    recurring: ['The clog that comes back.', 'Grease and buildup can remain after a cable opens the line. Hydro jetting cleans the pipe wall when inspection confirms it is the right approach.', 'Explore hydro jetting', 'hydro-jetting/'],
    roots: ['Find what is beneath the surface.', 'Roots, scale, and older pipe need a closer look. A camera helps identify the obstruction and pipe condition before choosing cleaning or repair.', 'Explore camera inspection', 'camera-inspection/'],
    slow: ['Get your everyday flow back.', 'A slow sink or shower can start with a localized blockage. We inspect the situation and choose the right drain-clearing method.', 'Explore drain clearing', 'drain-clearing/']
  };
  let timers = [];
  function stopTimers() { timers.forEach(clearTimeout); timers = []; }
  function finish() {
    stopTimers(); stage.classList.remove('is-running'); stage.classList.add('is-complete');
    hero.src = base + 'jet-stance.webp'; watch.disabled = false; watch.textContent = 'Replay the illustration';
    status.textContent = 'Next: choose your service or request an inspection.';
  }
  root.querySelectorAll('[data-battle-choice]').forEach(function (button) {
    button.addEventListener('click', function () {
      stopTimers(); stage.classList.remove('is-running', 'is-complete');
      hero.src = base + 'jet-stance.webp'; monster.src = base + 'monster-idle.webp';
      watch.disabled = false; watch.textContent = 'Watch Pro Jet in action'; status.textContent = '';
      root.querySelectorAll('[data-battle-choice]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      const item = choices[button.dataset.battleChoice];
      root.querySelector('[data-battle-title]').textContent = item[0];
      root.querySelector('[data-battle-description]').textContent = item[1];
      service.textContent = item[2] + ' →'; service.href = root.dataset.siteBase + item[3];
    });
  });
  watch.addEventListener('click', function () {
    stopTimers(); stage.classList.remove('is-complete');
    if (reduced.matches || document.documentElement.classList.contains('pj-fx-off')) { finish(); return; }
    hero.src = base + 'jet-sprint.webp'; monster.src = base + 'monster-idle.webp';
    stage.classList.add('is-running'); watch.disabled = true; status.textContent = 'Pro Jet in action · illustrated sequence';
    timers.push(setTimeout(function () { monster.src = base + 'monster-scream.webp'; window.ProJetCinema?.cue('blast'); }, 1850));
    timers.push(setTimeout(function () { monster.src = base + 'monster-melt.webp'; }, 3200));
    timers.push(setTimeout(function () { finish(); window.ProJetCinema?.cue('success'); }, 5600));
  });
  function motionChanged(event) { if ((event && event.detail && event.detail.enabled === false) || reduced.matches) { if (stage.classList.contains('is-running')) finish(); } }
  document.addEventListener('projet:interface-motion', motionChanged);
  window.addEventListener('projet:interface-motion', motionChanged);
  reduced.addEventListener('change', motionChanged);
  if ('IntersectionObserver' in window) new IntersectionObserver(function (entries) { if (!entries[0].isIntersecting && stage.classList.contains('is-running')) finish(); }).observe(stage);
})();
