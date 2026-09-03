/* ============================================================
   MAIN — boot order, smooth scroll, ignition sequence, nav.
   ============================================================ */

(function () {
  const G = window.gsap;
  const calm = matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ---------- 0. no GSAP (blocked CDN, offline)? ----------
     Still render and still work — just without the motion. */
  if (!G) {
    document.documentElement.classList.add('no-motion');
    window.buildDOM();
    document.getElementById('ignition').classList.add('gone');
    document.body.classList.remove('is-booting');
    basicMode();
    return;
  }

  function basicMode() {
    // clock
    const c = document.getElementById('clock');
    const tick = () => { c.textContent = new Date().toLocaleTimeString('en-GB',
      { hour12: false, timeZone: 'Asia/Kolkata' }) + ' IST'; };
    tick(); setInterval(tick, 1000);

    // menu
    const b = document.getElementById('burger'), d = document.getElementById('drawer');
    b.addEventListener('click', () => {
      const open = !d.classList.contains('on');
      b.classList.toggle('on', open); d.classList.toggle('on', open);
      b.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('menu-open', open);
    });

    // timing-board rows
    document.querySelectorAll('.trow').forEach((row) => {
      const btn = row.querySelector('.trow-main');
      const det = row.querySelector('.t-detail');
      btn.addEventListener('click', () => {
        const open = row.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(open));
        det.style.height = open ? 'auto' : '0';
      });
    });

    // compound filter
    const bar = document.getElementById('compounds');
    if (bar) bar.addEventListener('click', (e) => {
      const btn = e.target.closest('.comp');
      if (!btn) return;
      [...bar.children].forEach((x) => {
        x.classList.toggle('on', x === btn);
        x.setAttribute('aria-pressed', String(x === btn));
      });
      document.querySelectorAll('.skill').forEach((s) => {
        const hit = btn.dataset.c === 'all' || s.dataset.c === btn.dataset.c;
        s.classList.toggle('dim', !hit);
        s.style.order = hit ? '0' : '1';
      });
    });

    // the rail falls back to plain horizontal scrolling
    const vp = document.getElementById('railVp');
    if (vp) vp.classList.add('swipe');
  }

  G.registerPlugin(...[
    'ScrollTrigger', 'ScrollSmoother', 'SplitText', 'CustomEase', 'DrawSVGPlugin',
    'MotionPathPlugin', 'ScrambleTextPlugin', 'Flip', 'Observer', 'Draggable', 'InertiaPlugin',
  ].map((n) => window[n]).filter(Boolean));

  /* ---------- 1. build the page ---------- */
  // a reload should replay the ignition from the grid, not drop you mid-lap
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  window.buildDOM();

  /* ---------- 2. smooth scroll ---------- */
  let smoother = null;
  if (!calm && window.ScrollSmoother && matchMedia('(min-width:861px)').matches) {
    try {
      smoother = ScrollSmoother.create({
        wrapper: '#smooth-wrapper',
        content: '#smooth-content',
        smooth: 1.15,
        effects: true,
        normalizeScroll: true,
        ignoreMobileResize: true,
      });
    } catch (e) { smoother = null; }
  }

  const getScroll = () => (smoother ? smoother.scrollTop() : window.scrollY || 0);
  const getMax = () => ScrollTrigger.maxScroll(window);

  /* The 3D rig must follow what the eye sees, not where the scroll is headed —
     under ScrollSmoother the content lags the raw scroll by design. */
  const content = document.getElementById('smooth-content');
  window.__scrollY = () => (smoother ? -(G.getProperty(content, 'y') || 0) : window.scrollY || 0);
  window.__maxScroll = getMax;
  const scrollTo = (target, smooth = true) => {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    if (smoother) smoother.scrollTo(el, smooth, 'top 72px');
    else window.scrollTo({ top: el.offsetTop - 72, behavior: smooth && !calm ? 'smooth' : 'auto' });
  };
  window.__scrollTo = scrollTo;

  /* ---------- 3. subsystems ---------- */
  const hud = window.initHUD({ getScroll, getMax, scrollTo });
  window.Motion.prepare();
  if (hud) window.Motion.skew(hud.getVelocity);
  window.initCursor();

  /* ---------- 4. nav ---------- */
  const burger = document.getElementById('burger');
  const drawer = document.getElementById('drawer');
  function closeDrawer() {
    burger.classList.remove('on');
    burger.setAttribute('aria-expanded', 'false');
    drawer.classList.remove('on');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('menu-open');
  }
  burger.addEventListener('click', () => {
    const open = !drawer.classList.contains('on');
    burger.classList.toggle('on', open);
    burger.setAttribute('aria-expanded', String(open));
    drawer.classList.toggle('on', open);
    drawer.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('menu-open', open);
    if (open && !calm) {
      G.from('#drawerLinks a', { opacity: 0, x: -26, duration: .6, stagger: .055, ease: 'power3.out', delay: .18 });
    }
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    e.preventDefault();
    closeDrawer();
    if (!id || id === 'top') {
      if (smoother) smoother.scrollTo(0, true); else window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      scrollTo('#' + id);
    }
  });

  /* ---------- 5. keep triggers honest ---------- */
  const refresh = () => ScrollTrigger.refresh();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  addEventListener('load', refresh);
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(refresh, 250); });

  /* ---------- 6. ignition ---------- */
  const ign = document.getElementById('ignition');
  const bar = document.getElementById('igBar');
  const pct = document.getElementById('igPct');
  const lights = [...document.querySelectorAll('#igLights .ig-light')];

  const boot = { dom: 1, fonts: 0, scene: 0 };          // 0..1 each
  const WEIGHT = { dom: 0.15, fonts: 0.2, scene: 0.65 };
  let launched = false;
  let displayed = 0;

  function total() {
    return boot.dom * WEIGHT.dom + boot.fonts * WEIGHT.fonts + boot.scene * WEIGHT.scene;
  }
  function paint() {
    const t = Math.max(displayed, total());
    displayed = t;
    if (bar) bar.style.width = (t * 100).toFixed(0) + '%';
    if (pct) pct.textContent = 'SYSTEMS CHECK · ' + String(Math.round(t * 100)).padStart(3, '0') + '%';
    if (t >= 0.999) launch();
  }

  // the 3D module reports in here; if it never loads the timeout covers us
  window.BOOT = {
    scene(p) { boot.scene = Math.max(boot.scene, Math.min(1, p)); paint(); },
    sceneFailed() { boot.scene = 1; paint(); },
  };

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { boot.fonts = 1; paint(); });
  } else { boot.fonts = 1; }

  const ticker = setInterval(paint, 120);
  const hardStop = setTimeout(() => { boot.scene = 1; boot.fonts = 1; paint(); }, 6500);

  function launch() {
    if (launched) return;
    launched = true;
    clearInterval(ticker); clearTimeout(hardStop);

    const tl = G.timeline();

    if (calm) {
      tl.set(ign, { autoAlpha: 0 })
        .call(afterLaunch);
      return;
    }

    // five reds on, hold, lights out
    lights.forEach((l, i) => tl.call(() => l.classList.add('on'), null, i * 0.17));
    tl.to({}, { duration: 0.42 })
      .call(() => lights.forEach((l) => l.classList.remove('on')))
      .to(ign, { opacity: 0, duration: 0.5, ease: 'power2.inOut' }, '+=0.12')
      .set(ign, { visibility: 'hidden', pointerEvents: 'none' })
      .fromTo('#smooth-content',
        { scale: 1.055, filter: 'blur(9px)', opacity: 0.4 },
        { scale: 1, filter: 'blur(0px)', opacity: 1, duration: 1.15, ease: 'expo.out' }, '<0.05')
      .call(afterLaunch, null, '<0.1');
  }

  function afterLaunch() {
    document.body.classList.remove('is-booting');
    ScrollTrigger.refresh();
    window.Motion.launch();
    if (hud) hud.show();
    const sc = document.getElementById('scene');
    if (sc) sc.classList.add('live');
    document.dispatchEvent(new CustomEvent('launched'));
  }

  paint();
})();
