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
  const completedSources = new Set();
  function mount(root) {
    if (!root) return function () {};
    const cleanups = [];
    root.querySelectorAll('[data-brand-motion]').forEach(container => {
      if (mounted.has(container)) return;
      const video = container.querySelector('video[data-motion-src]');
      const button = container.querySelector('[data-motion-toggle]');
      if (!video || !button) return;
      const preference = matchMedia('(prefers-reduced-motion: reduce)');
      const source = video.dataset.motionSrc;
      let completed = completedSources.has(source);
      let wanted = !preference.matches && !completed, visible = false, disposed = false;
      video.muted = true;
      video.loop = false;
      video.removeAttribute("loop");
      const label = () => {
        button.textContent = completed ? 'Replay animation' : wanted ? 'Pause animation' : 'Play animation';
        button.setAttribute('aria-pressed', String(wanted));
      };
      const sync = () => {
        if (disposed) return;
        label();
        if (wanted && !completed && visible && !document.hidden) {
          if (!video.getAttribute('src')) video.src = video.dataset.motionSrc;
          const promise = video.play();
          if (promise) promise.catch(error => {
            if (disposed || !wanted || !visible || document.hidden || error.name === 'AbortError') return;
            wanted = false; label();
          });
        } else video.pause();
      };
      const toggle = () => {
        if (completed) {
          completed = false; completedSources.delete(source);
          if (video.getAttribute('src')) video.currentTime = 0;
          wanted = true;
        } else wanted = !wanted;
        sync();
      };
      const ended = () => {
        completed = true; wanted = false; completedSources.add(source);
        video.pause(); label();
      };
      const preferenceChanged = () => { wanted = !preference.matches && !completed; sync(); };
      const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, {threshold:0.05});
      observer.observe(container);
      button.addEventListener('click', toggle);
      video.addEventListener('ended', ended);
      document.addEventListener('visibilitychange', sync);
      preference.addEventListener('change', preferenceChanged);
      const cleanup = () => {
        disposed = true; observer.disconnect(); video.pause();
        button.removeEventListener('click', toggle);
        video.removeEventListener('ended', ended);
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
