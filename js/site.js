/* Pro Jet site engine. Vanilla JS + GSAP ScrollTrigger.
   Everything degrades: no JS = static page, reduced motion = no pin/parallax,
   no autoplaying video and no reveal animations. Native CSS smooth scrolling
   handles anchors, so the skip link moves focus the way the browser intends. */
(function () {
  "use strict";
  const html = document.documentElement;
  html.classList.remove("no-js");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (reduced) html.classList.add("reduced-motion");
  const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  if (hasGsap) window.gsap.registerPlugin(window.ScrollTrigger);

  /* ---------- Header + nav ---------- */
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("primary-nav");
  const onScroll = () => header && header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  if (toggle && nav) {
    const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const backdrop = () => [document.querySelector("main"), document.querySelector(".site-footer"), document.querySelector(".callbar"), document.querySelector(".site-header .brand")].filter(Boolean);
    const isOpen = () => nav.classList.contains("is-open");
    // The toggle doubles as the close button, so it belongs inside the cycle.
    const trapStops = () => [toggle].concat(Array.prototype.slice.call(nav.querySelectorAll(FOCUSABLE)))
      .filter((el) => el.getClientRects().length > 0);

    function openNav() {
      toggle.setAttribute("aria-expanded", "true");
      nav.classList.add("is-open");
      document.body.style.overflow = "hidden";
      backdrop().forEach((el) => { el.inert = true; el.setAttribute("inert", ""); });
      const stops = trapStops();
      const first = stops.filter((el) => el !== toggle)[0] || toggle;
      window.requestAnimationFrame(() => first.focus());
    }

    function closeNav(returnFocus) {
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
      document.body.style.overflow = "";
      backdrop().forEach((el) => { el.inert = false; el.removeAttribute("inert"); });
      if (returnFocus) toggle.focus();
    }

    toggle.addEventListener("click", () => { isOpen() ? closeNav(true) : openNav(); });
    nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => { if (isOpen()) closeNav(false); }));

    document.addEventListener("keydown", (e) => {
      if (!isOpen()) return;
      if (e.key === "Escape") { e.preventDefault(); closeNav(true); return; }
      if (e.key !== "Tab") return;
      const stops = trapStops();
      if (!stops.length) return;
      const first = stops[0];
      const last = stops[stops.length - 1];
      const active = document.activeElement;
      const inside = stops.indexOf(active) !== -1;
      if (e.shiftKey) {
        if (!inside || active === first) { e.preventDefault(); last.focus(); }
      } else if (!inside || active === last) {
        e.preventDefault(); first.focus();
      }
    });

    // A resize past the desktop breakpoint must not leave the page inert.
    window.addEventListener("resize", () => {
      if (isOpen() && window.matchMedia("(min-width: 961px)").matches) closeNav(false);
    }, { passive: true });
  }

  /* ---------- Reveals ---------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (!reduced && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          const el = en.target;
          const delay = parseFloat(el.getAttribute("data-reveal-delay") || 0);
          setTimeout(() => el.classList.add("is-in"), delay);
          io.unobserve(el);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- Hero parallax (layers at different rates) ---------- */
  const hero = document.querySelector(".hero");
  if (hero && hasGsap && !reduced) {
    const layers = hero.querySelectorAll("[data-depth]");
    layers.forEach((layer) => {
      const depth = parseFloat(layer.getAttribute("data-depth"));
      window.gsap.to(layer, {
        yPercent: depth * 28,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true }
      });
    });
    const content = hero.querySelector(".hero__content");
    if (content) window.gsap.to(content, { yPercent: 12, opacity: 0.2, ease: "none", scrollTrigger: { trigger: hero, start: "40% top", end: "bottom top", scrub: true } });
    if (finePointer) {
      const qs = Array.from(layers).map((layer) => ({
        depth: parseFloat(layer.getAttribute("data-depth")),
        x: window.gsap.quickTo(layer, "x", { duration: 0.9, ease: "power3" }),
        y: window.gsap.quickTo(layer, "y", { duration: 0.9, ease: "power3" })
      }));
      hero.addEventListener("pointermove", (e) => {
        const r = hero.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        qs.forEach((q) => { q.x(nx * -26 * q.depth); q.y(ny * -14 * q.depth); });
      });
    }
    // Entrance
    window.gsap.from(hero.querySelectorAll(".hero__content > *"), { y: 26, opacity: 0, duration: 1.1, ease: "power3.out", stagger: 0.08, delay: 0.15 });
    const truck = hero.querySelector(".hero__truck");
    if (truck) window.gsap.from(truck, { xPercent: 8, opacity: 0, duration: 1.6, ease: "power3.out", delay: 0.1 });
  }

  /* ---------- Signature act: THE LINE ---------- */
  const act = document.querySelector(".line-act");
  if (act) {
    const stage = act.querySelector(".line-act__stage");
    const nozzle = act.querySelector("#nozzle");
    const hose = act.querySelector("#hose");
    const jets = act.querySelector("#jets");
    const clipRect = act.querySelector("#dirtyClip rect");
    const water = act.querySelector("#water");
    const cam = act.querySelector("#cam");
    const verified = act.querySelector("#verified");
    const gauge = act.querySelector("[data-gauge]");
    const steps = act.querySelectorAll(".step");
    const X0 = 80, X1 = 1110;
    const clamp = (v) => Math.max(0, Math.min(1, v));
    const ease = (t) => 1 - Math.pow(1 - t, 3);

    function render(p) {
      // Phase A (0 - .15): camera scouts the dirty line.
      // Phase B (.15 - .8): nozzle travels, wall cleans behind it, PSI climbs.
      // Phase C (.8 - 1): camera verifies the clean line.
      const pa = clamp(p / 0.15);
      const pb = clamp((p - 0.15) / 0.65);
      const pc = clamp((p - 0.8) / 0.2);
      const nx = X0 + ease(pb) * (X1 - X0);
      if (nozzle) nozzle.setAttribute("transform", `translate(${nx.toFixed(1)} 180)`);
      if (hose) hose.setAttribute("x2", (nx - 22).toFixed(1));
      if (clipRect) { clipRect.setAttribute("x", nx.toFixed(1)); clipRect.setAttribute("width", Math.max(0, 1180 - nx).toFixed(1)); }
      if (water) water.setAttribute("width", Math.max(0, nx - 40).toFixed(1));
      if (jets) jets.style.opacity = pb > 0 && pb < 1 ? "1" : "0";
      if (clipRect && pb >= 1) clipRect.setAttribute("width", "0");
      const nozzleVisible = p >= 0.15 && p < 0.8 ? 1 : 0;
      if (nozzle) nozzle.style.opacity = String(nozzleVisible);
      if (hose) hose.style.opacity = String(nozzleVisible);
      // camera
      let cx = -80, cop = 0;
      if (p < 0.15) { cx = X0 + ease(pa) * (X1 - X0); cop = 1; }
      else if (p >= 0.8) { cx = X0 + ease(pc) * (X1 - X0); cop = 1; }
      if (cam) { cam.setAttribute("transform", `translate(${cx.toFixed(1)} 180)`); cam.style.opacity = String(cop); }
      if (verified) verified.style.opacity = pc >= 0.98 ? "1" : "0";
      // PSI: 0 -> 4000 across first 40% of phase B, then hold, then drop in phase C.
      let psi = 0;
      if (p >= 0.15 && p < 0.8) psi = Math.round(4000 * ease(clamp(pb / 0.4)));
      if (p >= 0.8) psi = 4000;
      if (gauge) gauge.textContent = psi.toLocaleString("en-US");
      steps.forEach((s, i) => s.classList.toggle("is-active", (i === 0 && p < 0.15) || (i === 1 && p >= 0.15 && p < 0.8) || (i === 2 && p >= 0.8)));
    }

    const pipeSvg = act.querySelector(".pipe svg");
    const fitPipe = () => { if (pipeSvg) pipeSvg.setAttribute("preserveAspectRatio", window.innerWidth < 760 ? "none" : "xMidYMid meet"); };
    fitPipe(); window.addEventListener("resize", fitPipe, { passive: true });
    if (act.classList.contains("line-act--compact")) {
      const controls = act.querySelectorAll("[data-pipe-step]");
      const positions = [0.075, 0.5, 1];
      const selectStep = (index) => {
        render(positions[index]);
        controls.forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
      };
      controls.forEach((button, index) => {
        button.hidden = false;
        button.previousElementSibling.hidden = true;
        button.addEventListener("click", () => selectStep(index));
      });
      selectStep(0);
    } else if (hasGsap && !reduced) {
      render(0);
      window.ScrollTrigger.create({
        trigger: act, start: "top top", end: "+=180%", pin: stage, pinSpacing: true, scrub: 0.6,
        onUpdate: (self) => render(self.progress)
      });
    } else {
      render(1);
      if (gauge) gauge.textContent = "4,000";
    }
  }

  /* ---------- Video: autoplay, and the reduced-motion opt out ----------
     WCAG 2.2 SC 2.2.2 wants a way to stop moving content that runs past five
     seconds. Under prefers-reduced-motion nothing autoplays at all, and the
     content video gets native controls so a visitor can still choose to watch.
     Ordinary visitors are unaffected. */
  if (reduced) {
    document.querySelectorAll("video").forEach((v) => {
      v.removeAttribute("autoplay");
      v.autoplay = false;
      // Dialog media can only start after the visitor explicitly opens the film.
      if (v.closest(".film-dialog")) { v.controls = true; v.pause(); return; }
      const decorative = !!v.closest('[aria-hidden="true"]');
      let armed = true;
      const halt = () => { if (armed && !v.paused) v.pause(); };
      if (decorative) {
        v.addEventListener("play", () => { v.pause(); });
      } else {
        v.controls = true;
        const disarm = () => { armed = false; };
        v.addEventListener("pointerdown", disarm);
        v.addEventListener("keydown", disarm);
        v.addEventListener("play", halt);
      }
      ["loadedmetadata", "loadeddata", "canplay"].forEach((ev) => v.addEventListener(ev, halt));
      v.pause();
    });
  } else {
    document.querySelectorAll("video[data-autoplay]").forEach((v) => {
      if (!("IntersectionObserver" in window)) return;
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { v.play().catch(() => {}); } else { v.pause(); } });
      }, { threshold: 0.35 });
      io.observe(v);
    });
  }

  /* ---------- Quote form ---------- */
  const form = document.querySelector("form[data-quote]");
  if (form) {
    const quoteTools = window.ProJetQuote || {};
    const isPreview = typeof quoteTools.isPreviewEnv === "function" && quoteTools.isPreviewEnv(window.location);
    const button = form.querySelector("button[type=submit]");
    const status = form.querySelector(".form__status");
    const previewNote = form.parentElement?.querySelector("[data-quote-preview-note]");
    const routeNote = form.querySelector("[data-quote-route]");
    const liveLabel = button?.getAttribute("data-live-label") || "Send Request";
    const previewLabel = button?.getAttribute("data-preview-label") || "Create email request";
    const setInvalid = (name, bad) => {
      const field = form.querySelector(`[data-field="${name}"]`);
      if (!field) return !bad;
      field.classList.toggle("is-invalid", bad);
      field.querySelectorAll("input, select, textarea").forEach((el) => {
        el.setAttribute("aria-invalid", bad ? "true" : "false");
      });
      return !bad;
    };
    const setStatus = (type, htmlText) => {
      status.className = `form__status ${type}`;
      status.innerHTML = htmlText;
    };
    const readFields = () => {
      const d = new FormData(form);
      return {
        name: d.get("name"),
        email: d.get("email"),
        phone: d.get("phone"),
        zip: d.get("zip"),
        service: d.get("service"),
        urgency: d.get("urgency"),
        contact_pref: d.get("contact_pref"),
        message: d.get("message")
      };
    };
    const validate = (fields) => {
      if (typeof quoteTools.validateQuote === "function") return quoteTools.validateQuote(fields);
      const phone = String(fields.phone || "").replace(/\D/g, "");
      const invalid = {
        phone: phone.length !== 10,
        name: String(fields.name || "").trim().length < 2,
        email: String(fields.email || "").trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(fields.email || "").trim()),
        zip: String(fields.zip || "").trim().length > 0 && !/^\d{5}$/.test(String(fields.zip || "").trim()),
        message: String(fields.message || "").trim().length < 10
      };
      return { ok: !Object.values(invalid).some(Boolean), invalid };
    };
    const focusFirstInvalid = () => form.querySelector(".is-invalid input, .is-invalid textarea, .is-invalid select")?.focus();
    if (button) button.textContent = isPreview ? previewLabel : liveLabel;
    if (previewNote) {
      previewNote.hidden = !isPreview;
      previewNote.classList.toggle("is-shown", isPreview);
      previewNote.textContent = isPreview ? "This request opens in your email app. Review it and send it there." : "";
    }
    if (routeNote) {
      routeNote.hidden = !isPreview;
      routeNote.classList.toggle("is-shown", isPreview);
      routeNote.innerHTML = isPreview
        ? "This request opens in your email app. Review it and send it there. If nothing opens, call or text <a href=\"tel:+18165066243\">(816) 506-6243</a>."
        : "";
    }
    form.addEventListener("input", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      const field = target.closest("[data-field]");
      if (!field) return;
      field.classList.remove("is-invalid");
      target.setAttribute("aria-invalid", "false");
    });
    form.addEventListener("change", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      const field = target.closest("[data-field]");
      if (!field) return;
      field.classList.remove("is-invalid");
      field.querySelectorAll("input, select, textarea").forEach((el) => el.setAttribute("aria-invalid", "false"));
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fields = readFields();
      const result = validate(fields);
      ["phone", "name", "email", "zip", "message"].forEach((name) => setInvalid(name, !!result.invalid?.[name]));
      if (status) { status.className = "form__status"; status.innerHTML = ""; }
      if (!result.ok) { focusFirstInvalid(); return; }
      if (!button || !status) return;
      if (isPreview) {
        button.disabled = true;
        button.textContent = "Opening Email App";
        const mailto = typeof quoteTools.buildQuoteMailto === "function"
          ? quoteTools.buildQuoteMailto(fields)
          : "mailto:projetllckc@gmail.com?subject=Quote%20request";
        setStatus("is-note", "<strong>Email draft ready.</strong> Your email app should open with this request filled in. Review it and press send there. If nothing opens, call or text <a href=\"tel:+18165066243\">(816) 506-6243</a>.");
        status.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
        window.location.href = mailto;
        window.setTimeout(() => {
          button.disabled = false;
          button.textContent = previewLabel;
        }, 600);
        return;
      }
      const d = new FormData(form);
      button.disabled = true;
      button.textContent = "Sending";
      try {
        const res = await fetch(form.getAttribute("action"), { method: "POST", body: d, headers: { "Accept": "application/json" } });
        if (!res.ok) throw new Error("bad status");
        form.reset();
        setStatus("is-ok", "<strong>Request sent.</strong> We will get back to you promptly with an estimate. For same-day service, text or call <a href=\"tel:+18165066243\">(816) 506-6243</a>.");
      } catch (err) {
        setStatus("is-err", "<strong>That did not send.</strong> Text or call <a href=\"tel:+18165066243\">(816) 506-6243</a> or email <a href=\"mailto:projetllckc@gmail.com?subject=Quote%20request\">projetllckc@gmail.com</a>.");
      } finally {
        button.disabled = false;
        button.textContent = liveLabel;
        status.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
      }
    });
  }

  /* ---------- Current-page nav marker ---------- */
  const path = location.pathname.replace(/index\.html$/, "");
  document.querySelectorAll(".nav a[href]").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === path || (href !== "/" && path.startsWith(href))) a.setAttribute("aria-current", "page");
  });
})();
