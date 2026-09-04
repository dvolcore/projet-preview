/* The film loads only after an explicit request. Native dialog manages focus. */
(() => {
  'use strict';
  const link = document.querySelector('[data-film-open]');
  const dialog = document.querySelector('.film-dialog');
  if (!link || !dialog || typeof dialog.showModal !== 'function') return;
  const video = dialog.querySelector('video');
  const close = dialog.querySelector('.film-dialog__close');
  let previousOverflow = '';
  link.addEventListener('click', (event) => {
    event.preventDefault();
    if (!video.getAttribute('src')) video.src = link.href;
    previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    video.play().catch(() => {});
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    video.pause();
    document.body.style.overflow = previousOverflow;
    link.focus();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
})();
