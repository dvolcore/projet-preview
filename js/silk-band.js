/* Silk band: animated folded-gradient background for .section--price.
   Plain WebGL2, no library. Degrades: no WebGL / reduced motion = the CSS red stays.
   Runs only while the section is on screen; DPR capped; half resolution under 700px. */
(() => {
  "use strict";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;
  const band = document.querySelector(".section--price");
  if (!band) return;
  let canvas = band.querySelector(".price-band__silk");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.className = "price-band__silk";
    canvas.setAttribute("aria-hidden", "true");
    band.prepend(canvas);
  }
  const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "low-power" });
  if (!gl) { canvas.remove(); return; }

  const VS = `#version 300 es
  void main(){ vec2 v = vec2(gl_VertexID & 1, gl_VertexID >> 1) * 4.0 - 1.0; gl_Position = vec4(v, 0.0, 1.0); }`;
  const FS = `#version 300 es
  precision highp float;
  out vec4 o;
  uniform vec2 R; uniform float T; uniform vec2 M;
  void main(){
    vec2 uv = gl_FragCoord.xy / R;
    vec2 p = uv; p.x *= R.x / R.y;
    float t = T * 0.16;
    float w  = sin(p.x * 2.2 + t + sin(p.y * 3.0 + t * 0.7) * 1.2) * 0.5 + 0.5;
    float w2 = sin(p.y * 2.6 - t * 0.8 + sin(p.x * 1.7 - t * 0.5) * 1.6) * 0.5 + 0.5;
    float fold = pow(abs(sin((w + w2) * 3.14159 + t * 0.5)), 3.0);
    vec3 base  = vec3(0.639, 0.157, 0.125);   /* #A32820 brand red, stays the body colour */
    vec3 deep  = vec3(0.420, 0.086, 0.071);   /* darker crimson in the folds */
    vec3 hi    = vec3(0.851, 0.318, 0.239);   /* warm highlight on the fold ridge */
    vec3 navy  = vec3(0.043, 0.102, 0.204);   /* Pro Jet navy, a bruise at the far edge only */
    vec3 col = mix(deep, base, w);
    col = mix(col, hi, fold * 0.55);
    col = mix(col, navy, smoothstep(0.82, 1.0, uv.x) * w2 * 0.30);
    float m = exp(-length(uv - vec2(M.x, 1.0 - M.y)) * 3.0) * 0.10;
    col += hi * m;
    o = vec4(col, 1.0);
  }`;
  function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return; }
  gl.useProgram(prog);
  const uR = gl.getUniformLocation(prog, "R"), uT = gl.getUniformLocation(prog, "T"), uM = gl.getUniformLocation(prog, "M");

  let W = 0, H = 0, raf = 0, visible = false;
  const mouse = { x: 0.7, y: 0.4, tx: 0.7, ty: 0.4 };
  const t0 = performance.now();
  function size() {
    const r = band.getBoundingClientRect();
    const scale = window.innerWidth < 700 ? 0.5 : 1;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * scale;
    W = Math.max(1, Math.floor(r.width * dpr)); H = Math.max(1, Math.floor(r.height * dpr));
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
  }
  function frame() {
    raf = requestAnimationFrame(frame);
    mouse.x += (mouse.tx - mouse.x) * 0.06; mouse.y += (mouse.ty - mouse.y) * 0.06;
    gl.viewport(0, 0, W, H);
    gl.uniform2f(uR, W, H); gl.uniform1f(uT, (performance.now() - t0) / 1000); gl.uniform2f(uM, mouse.x, mouse.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function start() { if (raf) return; size(); frame(); }
  function stop() { cancelAnimationFrame(raf); raf = 0; }

  if (window.matchMedia("(pointer: fine)").matches) {
    band.addEventListener("pointermove", (e) => {
      const r = band.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) / r.width; mouse.ty = (e.clientY - r.top) / r.height;
    }, { passive: true });
    band.addEventListener("pointerleave", () => { mouse.tx = 0.7; mouse.ty = 0.4; });
  }
  new ResizeObserver(size).observe(band);
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; visible ? start() : stop(); }, { rootMargin: "120px 0px" }).observe(band);
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); else if (visible) start(); });
})();
