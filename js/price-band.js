/* Price band v2 interactions: count-up figures, pipe cross-section run,
   cursor-lit glass edge and a light 3D tilt. Everything is a no-op under
   prefers-reduced-motion; the CSS already shows the finished state there. */
(() => {
  "use strict";
  const band = document.querySelector(".section--price");
  if (!band) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  /* Count-up: digits roll from a low start to the real figure. tabular-nums
     in the CSS keeps the width stable while they change. */
  function countUp(el) {
    const end = parseInt(el.getAttribute("data-count"), 10);
    if (!Number.isFinite(end)) return;
    const start = Math.max(0, Math.round(end * 0.35));
    const dur = 900, t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = String(Math.round(start + (end - start) * easeOut(p)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function runCard(card, delay) {
    setTimeout(() => {
      card.querySelectorAll("[data-count]").forEach(countUp);
      const pipe = card.querySelector(".xsec");
      if (pipe) pipe.classList.add("is-run");
    }, delay);
  }

  const cards = Array.from(band.querySelectorAll(".price-card"));
  if (reduced || !("IntersectionObserver" in window)) {
    cards.forEach((c) => { const p = c.querySelector(".xsec"); if (p) p.classList.add("is-run"); });
  } else {
    let done = false;
    const io = new IntersectionObserver((entries) => {
      if (done || !entries.some((e) => e.isIntersecting)) return;
      done = true; io.disconnect();
      cards.forEach((card, i) => runCard(card, 250 + i * 180));
    }, { threshold: 0.15 });
    const wrap = band.querySelector(".price-cards") || band;
    io.observe(wrap);
  }

  /* Replay the pipe on hover so the comparison can be watched again. */
  if (finePointer && !reduced) {
    cards.forEach((card) => {
      const pipe = card.querySelector(".xsec");
      if (!pipe) return;
      let busy = false;
      card.addEventListener("pointerenter", () => {
        if (busy || !pipe.classList.contains("is-run")) return;
        busy = true;
        pipe.classList.remove("is-run");
        // force the transition to restart from the dirty state
        void pipe.offsetWidth;
        requestAnimationFrame(() => { pipe.classList.add("is-run"); setTimeout(() => { busy = false; }, 1600); });
      });
    });
  }

  /* Cursor-lit edge + tilt. Max 3deg; springs back on leave. */
  if (finePointer && !reduced) {
    cards.forEach((card) => {
      let raf = 0, tx = 0, ty = 0;
      const apply = () => { raf = 0; card.style.transform = `perspective(900px) rotateX(${ty}deg) rotateY(${tx}deg) translateZ(0)`; };
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", (nx * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (ny * 100).toFixed(1) + "%");
        tx = (nx - 0.5) * 6; ty = (0.5 - ny) * 6;
        if (!raf) raf = requestAnimationFrame(apply);
      }, { passive: true });
      card.addEventListener("pointerleave", () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(apply); });
    });
  }
})();
