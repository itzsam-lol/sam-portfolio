/* ============================================================
   HUD — telemetry, circuit minimap, nav state.
   Every readout is derived from *real* scroll position and
   velocity, so the numbers actually mean something.
   ============================================================ */

window.initHUD = function initHUD(opts) {
  const G = window.gsap;
  if (!G) return null;

  const getScroll = opts.getScroll;
  const calm = matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ---------- elements ---------- */
  const el = {
    rail:  document.getElementById('railFill'),
    nav:   document.getElementById('nav'),
    clock: document.getElementById('clock'),
    hud:   document.getElementById('hud'),
    gear:  document.getElementById('hudGear'),
    spd:   document.getElementById('hudSpd'),
    thr:   document.getElementById('hudThr'),
    brk:   document.getElementById('hudBrk'),
    ers:   document.getElementById('hudErs'),
    drs:   document.getElementById('hudDrs'),
    flash: document.getElementById('flash'),
    circ:  document.getElementById('circuit'),
    lap:   document.getElementById('circLap'),
    live:  document.getElementById('trackLive'),
    car:   document.getElementById('trackCar'),
    secs:  document.getElementById('circSecs'),
    links: [...document.querySelectorAll('.nav-links a')],
  };

  /* ---------- car along the circuit ---------- */
  let carTween = null;
  if (el.car && window.MotionPathPlugin) {
    try {
      carTween = G.to(el.car, {
        duration: 1, ease: 'none', paused: true,
        motionPath: { path: '#trackGhost', align: '#trackGhost', alignOrigin: [0.5, 0.5] },
      });
    } catch (e) { carTween = null; }
  }
  if (el.live && window.DrawSVGPlugin) G.set(el.live, { drawSVG: '0% 0%' });

  /* ---------- sector markers on the map ---------- */
  (function marks() {
    const g = document.getElementById('circMarks');
    const path = document.getElementById('trackGhost');
    if (!g || !path || !path.getPointAtLength) return;
    const L = path.getTotalLength();
    [0.34, 0.67].forEach((f) => {
      const p = path.getPointAtLength(L * f);
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); c.setAttribute('r', 2.4);
      c.setAttribute('fill', '#5a5a64');
      g.appendChild(c);
    });
  })();

  /* ---------- sector jump buttons ---------- */
  const SECTOR_TARGET = { 1: 'driver', 2: 'history', 3: 'crew' };
  if (el.secs) {
    el.secs.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-sector]');
      if (!b) return;
      opts.scrollTo('#' + SECTOR_TARGET[b.dataset.sector]);
    });
  }

  /* ---------- clock ---------- */
  function clock() {
    if (!el.clock) return;
    el.clock.textContent = new Date().toLocaleTimeString('en-GB', {
      hour12: false, timeZone: 'Asia/Kolkata',
    }) + ' IST';
  }
  clock(); setInterval(clock, 1000);

  /* ---------- telemetry state ---------- */
  let prevY = getScroll();
  let prevT = performance.now();
  let vel = 0;          // smoothed px/s
  let spd = 0;          // smoothed km/h
  let ers = 92;         // %
  let gear = 0;
  let sector = 1;
  let activeId = 'top';

  const GEARS = ['N', '1', '2', '3', '4', '5', '6', '7', '8'];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  function gearFor(kmh) {
    if (kmh < 6) return 0;
    return clamp(Math.ceil(kmh / 42), 1, 8);
  }

  function shiftFlash(up) {
    if (calm || !el.flash) return;
    G.fromTo(el.flash,
      { opacity: up ? 0.5 : 0.3 },
      { opacity: 0, duration: 0.28, ease: 'power2.out', overwrite: true });
    if (window.ScrambleTextPlugin && el.gear) {
      G.fromTo(el.gear, { scale: 1.35 }, { scale: 1, duration: 0.32, ease: 'back.out(3)' });
    }
  }

  /* ---------- per-frame ---------- */
  function frame() {
    const now = performance.now();
    const y = getScroll();
    const max = Math.max(1, opts.getMax());
    const dt = Math.max(8, now - prevT) / 1000;

    const raw = (y - prevY) / dt;                    // px per second, signed
    vel += (raw - vel) * 0.16;                       // smooth
    prevY = y; prevT = now;

    const p = clamp(y / max, 0, 1);

    /* progress rail */
    if (el.rail) el.rail.style.width = (p * 100).toFixed(2) + '%';

    /* nav stuck state */
    if (el.nav) el.nav.classList.toggle('stuck', y > 60);

    /* --- speed: |velocity| mapped, with a resting idle --- */
    const target = clamp(Math.abs(vel) * 0.115, 0, 340);
    spd += (target - spd) * (target > spd ? 0.2 : 0.055);   // fast rise, slow decay
    const shown = Math.round(spd);
    if (el.spd) el.spd.textContent = String(shown).padStart(3, '0');

    /* --- gear --- */
    const g2 = gearFor(spd);
    if (g2 !== gear) { shiftFlash(g2 > gear); gear = g2; if (el.gear) el.gear.textContent = GEARS[gear]; }

    /* --- throttle / brake traces --- */
    const thr = vel > 0 ? clamp(vel * 0.055, 0, 100) : 0;
    const brk = vel < 0 ? clamp(-vel * 0.07, 0, 100) : 0;
    if (el.thr) el.thr.style.width = thr.toFixed(0) + '%';
    if (el.brk) el.brk.style.width = brk.toFixed(0) + '%';

    /* --- ERS: drains under load, harvests under braking / rest --- */
    ers += (brk > 4 ? 0.55 : thr > 40 ? -0.42 : 0.16);
    ers = clamp(ers, 4, 100);
    if (el.ers) el.ers.style.width = ers.toFixed(0) + '%';

    /* --- DRS: open on the two long straights of the lap --- */
    const drsOpen = (p > 0.30 && p < 0.46) || (p > 0.66 && p < 0.84);
    if (el.drs) el.drs.classList.toggle('open', drsOpen);

    /* --- circuit map --- */
    if (el.live && window.DrawSVGPlugin) G.set(el.live, { drawSVG: '0% ' + (p * 100).toFixed(2) + '%' });
    if (carTween) carTween.progress(p);
    if (el.lap) el.lap.textContent = 'LAP ' + (p > .999 ? '1/1 ✓' : '1/1');

    /* --- sector --- */
    const s2 = p < 0.34 ? 1 : p < 0.67 ? 2 : 3;
    if (s2 !== sector) {
      sector = s2;
      if (el.secs) [...el.secs.children].forEach((b) =>
        b.classList.toggle('on', +b.dataset.sector === sector));
    }

    /* --- nav active link ---
       measured off the viewport rect, which stays correct through
       ScrollSmoother's transform and ScrollTrigger's pin-spacers */
    const line = innerHeight * 0.38;
    let cur = 'top';
    for (const s of window.DATA.sections) {
      const node = document.getElementById(s.id);
      if (node && node.getBoundingClientRect().top <= line) cur = s.id;
    }
    if (cur !== activeId) {
      activeId = cur;
      el.links.forEach((a) => a.classList.toggle('on', a.dataset.sec === cur));
    }

    return { p, vel, spd };
  }

  G.ticker.add(frame);

  /* reveal the chrome once we are past the ignition */
  function show() {
    G.to([el.hud, el.circ].filter(Boolean), {
      opacity: 1, duration: 0.9, ease: 'power2.out', stagger: 0.12, delay: 0.35,
    });
  }

  return { frame, show, getVelocity: () => vel, getSpeed: () => spd };
};
