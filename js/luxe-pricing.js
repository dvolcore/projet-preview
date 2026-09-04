/* Stable prices and stationary cards; only light and the pipe illustration move. */
(() => {
  'use strict';
  const band = document.querySelector('.price-band--luxe');
  if (!band) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cards = [...band.querySelectorAll('.price-card')];
  const finishPipes = () => cards.forEach(card => card.querySelector('.xsec')?.classList.add('is-run'));
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'price-motion-toggle';
  toggle.textContent = 'Pause light effects';
  toggle.setAttribute('aria-pressed', 'false');
  band.querySelector('.container').appendChild(toggle);
  let userPaused = false;
  const sync = () => {
    const paused = userPaused || reduced.matches;
    band.classList.toggle('is-paused', paused);
    toggle.hidden = reduced.matches;
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.textContent = paused ? 'Resume light effects' : 'Pause light effects';
    if (reduced.matches) finishPipes();
  };
  toggle.addEventListener('click', () => { userPaused = !userPaused; sync(); });
  reduced.addEventListener('change', sync);
  sync();
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      const visible = entries.some(entry => entry.isIntersecting);
      band.classList.toggle('is-visible', visible);
    }, {threshold: 0.05}).observe(band);
    const pipes = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.querySelector('.xsec')?.classList.add('is-run');
        pipes.unobserve(entry.target);
      });
    }, {threshold: 0.2});
    cards.forEach(card => pipes.observe(card));
  } else { finishPipes(); }
  cards.forEach(card => {
    card.addEventListener('pointermove', event => {
      if (reduced.matches || userPaused || event.pointerType === 'touch') return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${(event.clientX - rect.left) / rect.width * 100}%`);
      card.style.setProperty('--my', `${(event.clientY - rect.top) / rect.height * 100}%`);
    }, {passive: true});
  });
})();
