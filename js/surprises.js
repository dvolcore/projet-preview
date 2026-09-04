/* Surprises (motion candidate). Two small moments, each once per session:
   1. JET flies across the screen the first time the visitor scrolls past the hero.
   2. At the closing CTA band the Clog Monster walks in, JET blasts it, it melts,
      JET flies off. Clicking the faded JET on the band replays it.
   Nothing runs under prefers-reduced-motion. Assets: /media/brand/jet-sprint.webp,
   /projet-preview/brand/monster-{idle,scream,melt}.webp. */
(() => {
  "use strict";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window)) return;
  const once = (key) => { try { if (sessionStorage.getItem(key)) return false; sessionStorage.setItem(key, "1"); } catch (e) {} return true; };
  const img = (src, cls) => { const el = document.createElement("img"); el.src = src; el.alt = ""; el.setAttribute("aria-hidden", "true"); el.className = cls; el.decoding = "async"; return el; };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ---------- 1. Flyby ---------- */
  const trigger = document.querySelector('[aria-labelledby="stakes-title"]') || document.querySelector("main > .section");
  if (trigger) {
    const io = new IntersectionObserver((en) => {
      if (!en[0].isIntersecting) return;
      io.disconnect();
      if (!once("pj-flyby")) return;
      const fly = document.createElement("div");
      fly.className = "flyby";
      fly.appendChild(img("/projet-preview/media/brand/jet-sprint.webp", "flyby__jet"));
      const trail = document.createElement("span"); trail.className = "flyby__trail"; fly.appendChild(trail);
      document.body.appendChild(fly);
      fly.addEventListener("animationend", () => fly.remove(), { once: true });
    }, { threshold: 0.35 });
    io.observe(trigger);
  }

  /* ---------- 2. Ambush at the CTA band ---------- */
  const band = document.querySelector(".cta-band");
  if (!band) return;
  const stage = document.createElement("div");
  stage.className = "ambush";
  stage.setAttribute("aria-hidden", "true");
  const monster = img("/projet-preview/media/brand/monster-idle.webp", "ambush__monster");
  const jet = img("/projet-preview/media/brand/jet-sprint.webp", "ambush__jet");
  const blast = document.createElement("span"); blast.className = "ambush__blast";
  const puddle = document.createElement("span"); puddle.className = "ambush__puddle";
  stage.append(puddle, monster, blast, jet);
  band.appendChild(stage);

  let running = false;
  async function ambush() {
    if (running) return; running = true;
    stage.classList.add("is-on"); band.classList.add("is-ambush");
    monster.src = "/projet-preview/media/brand/monster-idle.webp";
    stage.classList.remove("s-scream", "s-blast", "s-melt", "s-exit");
    stage.classList.add("s-walk");            // monster waddles in from the left
    await sleep(2300);
    monster.src = "/projet-preview/media/brand/monster-scream.webp";
    stage.classList.add("s-scream");          // sees JET coming
    await sleep(700);
    stage.classList.add("s-blast");           // JET arrives, water on
    await sleep(900);
    monster.src = "/projet-preview/media/brand/monster-melt.webp";
    stage.classList.add("s-melt");            // monster dissolves into the puddle
    await sleep(1300);
    stage.classList.add("s-exit");            // JET peels off the top of the screen
    await sleep(1400);
    stage.classList.remove("is-on", "s-walk", "s-scream", "s-blast", "s-melt", "s-exit"); band.classList.remove("is-ambush");
    running = false;
  }
  const io2 = new IntersectionObserver((en) => {
    if (!en[0].isIntersecting) return;
    io2.disconnect();
    if (once("pj-ambush")) ambush();
  }, { threshold: 0.45 });
  io2.observe(band);

  // Replay: the faded JET already on the band becomes a button.
  const idle = band.querySelector(".cta-band__mascot");
  if (idle) {
    idle.style.pointerEvents = "auto"; idle.style.cursor = "pointer"; idle.title = "Replay";
    idle.addEventListener("click", ambush);
  }
})();
