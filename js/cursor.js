/* ============================================================
   CURSOR — targeting reticle + magnetic elements.
   Desktop / fine-pointer only. Everything is driven off the
   shared GSAP ticker so there is exactly one rAF on the page.
   ============================================================ */

window.initCursor = function initCursor() {
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const calm = matchMedia('(prefers-reduced-motion:reduce)').matches;
  if (!fine || calm || !window.gsap) return;

  const ret = document.getElementById('ret');
  const dot = document.getElementById('retDot');
  const label = ret.querySelector('.ret-label');
  if (!ret || !dot) return;

  document.documentElement.classList.add('cur-on');

  const LABELS = {
    home: 'Top', jump: 'Jump', driver: 'Rec', filter: 'Set',
    expand: 'Open', open: 'Visit', mail: 'Send',
  };
  const HOT = 'a,button,.card,.tile,.trow-main,.comp,.frame,.skill';

  const setX  = gsap.quickSetter(ret, 'x', 'px');
  const setY  = gsap.quickSetter(ret, 'y', 'px');
  const setDX = gsap.quickSetter(dot, 'x', 'px');
  const setDY = gsap.quickSetter(dot, 'y', 'px');

  let mx = innerWidth / 2, my = innerHeight / 2;      // raw pointer
  let rx = mx, ry = my;                                // eased reticle
  let shown = false;

  addEventListener('pointermove', (e) => {
    mx = e.clientX; my = e.clientY;
    if (!shown) {
      shown = true;
      rx = mx; ry = my;
      gsap.to([ret, dot], { opacity: 1, duration: .35, overwrite: true });
    }
  }, { passive: true });

  addEventListener('pointerdown', () => gsap.to(ret, { scale: .82, duration: .18 }));
  addEventListener('pointerup',   () => gsap.to(ret, { scale: 1,   duration: .3, ease: 'back.out(2.4)' }));
  document.addEventListener('mouseleave', () => {
    shown = false;
    gsap.to([ret, dot], { opacity: 0, duration: .25 });
  });

  gsap.ticker.add(() => {
    // reticle trails, dot is exact — the gap reads as weight
    rx += (mx - rx) * 0.19;
    ry += (my - ry) * 0.19;
    setX(rx); setY(ry);
    setDX(mx); setDY(my);
  });

  /* ---- hover state ---- */
  let current = null;
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest(HOT);
    if (t === current) return;
    current = t;
    if (t) {
      const kind = t.dataset.cursor || t.closest('[data-cursor]')?.dataset.cursor;
      ret.classList.add('hot');
      label.textContent = LABELS[kind] || '';
      gsap.to(ret, { scale: 1.25, duration: .38, ease: 'power3.out' });
      gsap.to(label, { opacity: kind ? 1 : 0, duration: .25 });
      gsap.to(dot, { scale: .55, duration: .3 });
    } else {
      ret.classList.remove('hot');
      gsap.to(ret, { scale: 1, duration: .38, ease: 'power3.out' });
      gsap.to(label, { opacity: 0, duration: .2 });
      gsap.to(dot, { scale: 1, duration: .3 });
    }
  });

  /* ---- magnetic elements ---- */
  document.querySelectorAll('.magnet').forEach((el) => {
    const strength = 0.34;
    const qx = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3.out' });
    const qy = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      qx((e.clientX - (r.left + r.width / 2)) * strength);
      qy((e.clientY - (r.top + r.height / 2)) * strength);
    });
    el.addEventListener('pointerleave', () => { qx(0); qy(0); });
  });
};
