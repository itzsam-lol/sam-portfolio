/* ============================================================
   MAIN: boot order.
   1 capabilities · 2 page · 3 smooth scroll · 4 UI · 5 figures
   6 intro. Survives a blocked CDN, no WebGL and
   prefers-reduced-motion.
   ============================================================ */

(function () {
  const G = window.gsap;
  const root = document.documentElement;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animate = !!G && !calm;

  /* ---------- 1. plugins + boot class ---------- */
  if (G) {
    G.registerPlugin(...['ScrollTrigger', 'SplitText', 'DrawSVGPlugin', 'Flip']
      .map((n) => window[n]).filter(Boolean));
    G.config({ nullTargetWarn: false });
  }
  // the head script hid the hero parts that the intro reveals; give them back if nothing will
  root.classList.toggle('motion', animate);

  /* ---------- 2. page: the shipped HTML, or a fresh render if the content changed ---------- */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.Page.mount();

  /* ---------- 3. smooth scroll ---------- */
  let lenis = null;
  if (animate && window.Lenis && window.ScrollTrigger) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
    lenis.on('scroll', ScrollTrigger.update);
    G.ticker.add((t) => lenis.raf(t * 1000));
    G.ticker.lagSmoothing(0);
    window.__lenis = lenis;
  }
  // every section carries ~15vh of top padding, so landing its edge at the very top
  // leaves the section rule comfortably below the header whether or not it is showing
  function scrollTo(target, done) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    const y = el === 0 || el == null ? 0 : el;
    if (lenis) lenis.scrollTo(y, { offset: 0, duration: 1.5, easing: (t) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2), onComplete: done });
    else { scrollTo.native(typeof y === 'number' ? y : y.getBoundingClientRect().top + scrollY); if (done) setTimeout(done, calm ? 0 : 900); }
  }
  scrollTo.native = (top) => window.scrollTo({ top, behavior: calm ? 'auto' : 'smooth' });
  window.__scrollTo = scrollTo;

  /* ---------- 4. UI (works without GSAP) ---------- */
  const ui = window.initUI({ scrollTo, lenis });
  let ticking = false;
  const read = () => { ticking = false; ui.onScroll(scrollY); };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(read); } }, { passive: true });
  read();

  /* ---------- 5. figures: mounted one per task, starting now ---------- */
  const figures = window.FigKit ? window.FigKit.init() : Promise.resolve();

  /* ---------- 6. wait for type and the portrait, then go ---------- */
  const img = document.querySelector('#portrait img');
  // fonts.ready can resolve before a face has even started loading, so ask for the ones the intro measures
  const F = document.fonts;
  const ready = Promise.all([
    F && F.load ? Promise.all([F.load('800 100px "Hubot Sans"', 'SATYAM'), F.load('400 16px "Mona Sans"'), F.load('400 16px "Martian Mono"')]).catch(() => {}) : Promise.resolve(),
    img && img.decode ? img.decode().catch(() => {}) : Promise.resolve(),
  ]).then(() => F && F.ready);
  const cap = new Promise((r) => setTimeout(r, 2200));

  Promise.race([ready, cap]).then(async () => {
    window.scrollTo(0, 0);
    root.classList.add('booted');
    window.Motion.intro(() => { document.dispatchEvent(new CustomEvent('launched')); ui.ready(); });
    // the scroll choreography, then the figures, each built a slice at a time behind the intro
    if (G) await window.Motion.init();
    await figures;
    if (window.ScrollTrigger) ScrollTrigger.refresh();
    ui.ticks();
    // honour a deep link once everything has its final height
    if (location.hash.length > 1) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) setTimeout(() => scrollTo(el), animate ? 400 : 0);
    }
  });

  /* ---------- keep measurements honest ---------- */
  let rt;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      window.Motion.refit();
      if (window.ScrollTrigger) ScrollTrigger.refresh();
      ui.ticks();
    }, 180);
  });
  if (document.fonts) document.fonts.addEventListener('loadingdone', () => { window.Motion.refit(); window.ScrollTrigger && ScrollTrigger.refresh(); });
  addEventListener('load', () => { window.ScrollTrigger && ScrollTrigger.refresh(); ui.ticks(); });

  /* ---------- for anyone reading the console ---------- */
  console.log('%cSatyam 04%c  Built by hand: no framework, no build step. The source is at github.com/itzsam-lol/sam-portfolio',
    'background:#D50A1D;color:#fff;font:700 12px system-ui;padding:3px 6px', 'font:12px system-ui;color:inherit');
})();
