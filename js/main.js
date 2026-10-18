/* ============================================================
   MAIN: boot order.
   1 capabilities · 2 build · 3 smooth scroll · 4 UI · 5 intro
   Survives a blocked CDN, no WebGL and prefers-reduced-motion.
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
  // hide hero parts only when something is going to reveal them
  if (animate) root.classList.add('motion');

  /* ---------- 2. build ---------- */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.buildDOM();

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
  function scrollTo(target) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    const y = el === 0 || el == null ? 0 : el;
    if (lenis) lenis.scrollTo(y, { offset: 0, duration: 1.5, easing: (t) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2) });
    else scrollTo.native(y === 0 ? 0 : y.getBoundingClientRect().top + scrollY);
  }
  scrollTo.native = (top) => window.scrollTo({ top, behavior: calm ? 'auto' : 'smooth' });
  window.__scrollTo = scrollTo;

  /* ---------- 4. UI (works without GSAP) ---------- */
  const ui = window.initUI({ scrollTo, lenis });
  let ticking = false;
  const read = () => { ticking = false; ui.onScroll(scrollY); };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(read); } }, { passive: true });
  read();

  /* ---------- 5. wait for type and the portrait, then go ---------- */
  const img = document.querySelector('#portrait img');
  // fonts.ready can resolve before a face has even started loading, so ask for the ones the intro measures
  const F = document.fonts;
  const ready = Promise.all([
    F && F.load ? Promise.all([F.load('800 100px "Hubot Sans"', 'SATYAM'), F.load('400 16px "Mona Sans"'), F.load('400 16px "Martian Mono"')]).catch(() => {}) : Promise.resolve(),
    img && img.decode ? img.decode().catch(() => {}) : Promise.resolve(),
  ]).then(() => F && F.ready);
  const cap = new Promise((r) => setTimeout(r, 2600));

  Promise.race([ready, cap]).then(() => {
    window.scrollTo(0, 0);
    window.Motion.intro(() => document.dispatchEvent(new CustomEvent('launched')));
    if (G) window.Motion.init();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
    // honour a deep link once everything has a height
    if (location.hash.length > 1) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) setTimeout(() => scrollTo(el), animate ? 900 : 0);
    }
  });

  /* ---------- keep measurements honest ---------- */
  let rt;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      window.Motion.refit();
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }, 180);
  });
  if (document.fonts) document.fonts.addEventListener('loadingdone', () => { window.Motion.refit(); window.ScrollTrigger && ScrollTrigger.refresh(); });
  addEventListener('load', () => window.ScrollTrigger && ScrollTrigger.refresh());
})();
