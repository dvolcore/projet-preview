(function (factory) {
  if (typeof define === 'function' && typeof Espo !== 'undefined') {
    define('custom:lib/brand-motion', [], factory);
  } else {
    const motion = factory();
    window.ProJetMotion = motion;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => motion.mount(document), {once:true});
    else motion.mount(document);
  }
})(function () {
  'use strict';
  const mounted = new WeakMap();
  function mount(root) {
    if (!root) return function () {};
    const cleanups = [];
    root.querySelectorAll('[data-brand-motion]').forEach(container => {
      if (mounted.has(container)) return;
      const video = container.querySelector('video[data-motion-src]');
      const button = container.querySelector('[data-motion-toggle]');
      if (!video || !button) return;
      const preference = matchMedia('(prefers-reduced-motion: reduce)');
      let wanted = !preference.matches, visible = false, disposed = false;
      video.muted = true;
      const label = () => {
        button.textContent = wanted ? 'Pause animation' : 'Play animation';
        button.setAttribute('aria-pressed', String(wanted));
      };
      const sync = () => {
        if (disposed) return;
        label();
        if (wanted && visible && !document.hidden) {
          if (!video.getAttribute('src')) video.src = video.dataset.motionSrc;
          const promise = video.play();
          if (promise) promise.catch(error => {
            if (disposed || !wanted || !visible || document.hidden || error.name === 'AbortError') return;
            wanted = false; label();
          });
        } else video.pause();
      };
      const toggle = () => { wanted = !wanted; sync(); };
      const preferenceChanged = () => { wanted = !preference.matches; sync(); };
      const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, {threshold:0.05});
      observer.observe(container);
      button.addEventListener('click', toggle);
      document.addEventListener('visibilitychange', sync);
      preference.addEventListener('change', preferenceChanged);
      const cleanup = () => {
        disposed = true; observer.disconnect(); video.pause();
        button.removeEventListener('click', toggle);
        document.removeEventListener('visibilitychange', sync);
        preference.removeEventListener('change', preferenceChanged);
        mounted.delete(container);
      };
      mounted.set(container, cleanup); cleanups.push(cleanup); label();
    });
    return () => cleanups.forEach(fn => fn());
  }
  return {mount};
});
