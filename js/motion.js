/* ============================================================
   MOTION — every GSAP timeline on the page.
   Structure: eases → global reveals → per-section behaviour.
   Nothing here assumes the 3D scene exists.
   ============================================================ */

window.Motion = (function () {
  const G = window.gsap;
  const calm = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const has = (n) => !!window[n];

  /* ---------- signature eases ---------- */
  function eases() {
    if (!has('CustomEase')) return;
    CustomEase.create('launch', 'M0,0 C0.12,0 0.05,1 1,1');          // hard out, long tail
    CustomEase.create('shift',  'M0,0 C0.6,0 0.2,1 1,1');            // gear-change snap
    CustomEase.create('drift',  'M0,0 C0.25,0.1 0.25,1 1,1');
  }

  /* ---------- heading line reveals ---------- */
  function headings() {
    const nodes = document.querySelectorAll('.split-lines');
    nodes.forEach((el) => {
      if (calm || !has('SplitText')) { G.set(el, { opacity: 1 }); return; }
      try {
        const split = new SplitText(el, { type: 'lines', mask: 'lines', linesClass: 'sl' });
        G.from(split.lines, {
          yPercent: 118, duration: 1.05, ease: 'expo.out', stagger: 0.085,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
        // keep it correct when the line count changes
        let t;
        addEventListener('resize', () => {
          clearTimeout(t);
          t = setTimeout(() => { try { split.revert(); split.split(); } catch (e) {} }, 220);
        });
      } catch (e) {
        G.set(el, { opacity: 1 });
      }
    });
  }

  /* ---------- generic rise-in ---------- */
  function rises() {
    document.querySelectorAll('.rise').forEach((el) => {
      G.from(el, {
        opacity: 0, y: calm ? 0 : 34, duration: calm ? 0.01 : 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });
  }

  /* ---------- section head rules draw in ---------- */
  function rules() {
    document.querySelectorAll('.sec-head').forEach((h) => {
      const rule = h.querySelector('.rule');
      const tl = G.timeline({ scrollTrigger: { trigger: h, start: 'top 92%', once: true } });
      tl.from(h.children, { opacity: 0, y: 14, duration: 0.6, stagger: 0.06, ease: 'power3.out' });
      if (rule) tl.from(rule, { scaleX: 0, duration: 0.9, ease: 'expo.out' }, 0.1);
    });
  }

  /* ---------- number counters ---------- */
  // The markup already holds the final value (so it survives a JS/CDN failure);
  // the tween just runs it up from zero when it scrolls into view.
  function counters() {
    document.querySelectorAll('[data-count]').forEach((el) => {
      const to = parseFloat(el.dataset.count);
      const sfx = el.dataset.suffix || '';
      if (calm) return;
      const o = { n: 0 };
      G.fromTo(o, { n: 0 }, {
        n: to, duration: 2.1, ease: 'power2.out',
        onUpdate: () => { el.textContent = Math.round(o.n) + sfx; },
        onComplete: () => { el.textContent = to + sfx; },
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      });
    });
  }

  /* ---------- ticker marquee ---------- */
  function ticker() {
    const a = document.getElementById('tickerA');
    const b = document.getElementById('tickerB');
    if (!a || !b || calm) return;
    const loop = G.timeline({ repeat: -1 })
      .to([a, b], { xPercent: -100, duration: 34, ease: 'none' })
      .set([a, b], { xPercent: 0 });
    const wrap = a.parentElement;
    wrap.addEventListener('pointerenter', () => G.to(loop, { timeScale: 0.15, duration: .5 }));
    wrap.addEventListener('pointerleave', () => G.to(loop, { timeScale: 1, duration: .5 }));
  }

  /* ---------- hero launch ---------- */
  function heroLaunch() {
    const chars = document.querySelectorAll('.hero-ch');
    const lights = [...document.querySelectorAll('#heroLights i')];
    const tl = G.timeline({ defaults: { ease: 'expo.out' } });

    if (calm) {
      G.set(['#heroTop', '#heroRole', '#heroStrip', '#scrollCue'], { opacity: 1 });
      G.set(chars, { opacity: 1, y: 0 });
      lights.forEach((l) => l.classList.remove('on'));
      return tl;
    }

    tl.set(['#heroTop', '#heroRole', '#heroStrip', '#scrollCue'], { opacity: 1 })
      .from('#heroTop', { opacity: 0, y: 18, duration: 0.8 }, 0)
      .from(chars, {
        yPercent: 116, opacity: 0, duration: 1.15,
        stagger: { each: 0.045, from: 'start' }, ease: 'launch',
      }, 0.05)
      .from('.hero-role .dash', { scaleX: 0, duration: 0.9 }, '-=0.65')
      .from('#heroRole span:last-child', { opacity: 0, x: -14, duration: 0.7 }, '<')
      .from('#heroStrip .cell', { opacity: 0, y: 22, duration: 0.75, stagger: 0.07 }, '-=0.6')
      .from('#scrollCue', { opacity: 0, duration: 0.6 }, '-=0.35');

    // five reds, then out
    lights.forEach((l, i) => tl.call(() => l.classList.add('on'), null, 0.15 + i * 0.16));
    tl.call(() => {
      lights.forEach((l) => l.classList.remove('on'));
      const s = document.getElementById('heroStatus');
      if (s) { s.textContent = 'ON TRACK'; s.classList.add('green'); }
    }, null, 0.15 + 5 * 0.16 + 0.3);

    return tl;
  }

  /* ---------- hero parallax on scroll-out ---------- */
  function heroParallax() {
    if (calm) return;
    G.to('.hero-body', {
      y: -70, opacity: 0.15, ease: 'none',
      scrollTrigger: { trigger: '#top', start: 'top top', end: 'bottom top', scrub: 0.6 },
    });
    G.to('.hero-grid', {
      y: 140, ease: 'none',
      scrollTrigger: { trigger: '#top', start: 'top top', end: 'bottom top', scrub: 1.1 },
    });
  }

  /* ---------- 1. driver ---------- */
  function driver() {
    const frame = document.getElementById('driverFrame');
    const img = document.getElementById('driverImg');
    if (!frame || calm) return;

    // depth parallax inside the photo
    G.to(img, {
      yPercent: -7, ease: 'none',
      scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: 0.8 },
    });

    if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;

    G.set(frame, { transformPerspective: 900 });
    const rx = G.quickTo(frame, 'rotationX', { duration: 0.7, ease: 'power3.out' });
    const ry = G.quickTo(frame, 'rotationY', { duration: 0.7, ease: 'power3.out' });
    const ix = G.quickTo(img, 'x', { duration: 0.9, ease: 'power3.out' });
    const iy = G.quickTo(img, 'y', { duration: 0.9, ease: 'power3.out' });

    frame.addEventListener('pointermove', (e) => {
      const r = frame.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      rx(-ny * 9); ry(nx * 11);
      ix(nx * -18); iy(ny * -18);
    });
    frame.addEventListener('pointerleave', () => { rx(0); ry(0); ix(0); iy(0); });
  }

  /* ---------- 2. setup sheet ---------- */
  function setup() {
    const grid = document.getElementById('skillGrid');
    if (!grid) return;
    const skills = [...grid.querySelectorAll('.skill')];

    skills.forEach((row, i) => {
      const bar = row.querySelector('.skill-bar > i');
      const shine = row.querySelector('.skill-bar > u');
      const w = row.dataset.w + '%';
      const tl = G.timeline({ scrollTrigger: { trigger: row, start: 'top 90%', once: true } });
      tl.from(row, { opacity: 0, x: calm ? 0 : -26, duration: calm ? .01 : .75, ease: 'power3.out' })
        // the bar's real width is already inline, so sweep it up from zero
        .fromTo(bar, { width: '0%' }, { width: w, duration: calm ? .01 : 1.25, ease: 'expo.out' }, 0.12)
        .from(row.querySelectorAll('.chip'), {
          opacity: 0, y: 10, duration: calm ? .01 : .45, stagger: 0.035, ease: 'power2.out',
        }, 0.28);
      if (shine && !calm) {
        tl.fromTo(shine, { left: '-14%', opacity: 0.9 },
          { left: '104%', opacity: 0, duration: 0.85, ease: 'power2.inOut' }, 0.5);
      }
      row.style.setProperty('--i', i);
    });

    /* compound filter */
    const bar = document.getElementById('compounds');
    if (!bar) return;
    bar.addEventListener('click', (e) => {
      const btn = e.target.closest('.comp');
      if (!btn) return;
      const c = btn.dataset.c;

      [...bar.children].forEach((b) => {
        const on = b === btn;
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', String(on));
      });

      const state = has('Flip') && !calm ? Flip.getState(skills) : null;
      skills.forEach((s) => {
        const hit = c === 'all' || s.dataset.c === c;
        s.classList.toggle('dim', !hit);
        s.style.order = hit ? '0' : '1';
        // the reveal tween left an inline opacity, so drive the dim state with
        // GSAP too rather than losing a specificity fight with it
        G.to(s, {
          opacity: hit ? 1 : 0.2,
          filter: hit ? 'saturate(1)' : 'saturate(.15)',
          duration: calm ? 0.01 : 0.45, ease: 'power2.out', overwrite: 'auto',
        });
      });
      if (state) {
        Flip.from(state, {
          duration: 0.62, ease: 'power3.inOut', absolute: true, nested: true,
          onComplete: () => ScrollTrigger.refresh(),
        });
      }
    });
  }

  /* ---------- 3. history ---------- */
  function history() {
    const rows = [...document.querySelectorAll('.trow')];
    if (!rows.length) return;

    rows.forEach((row, i) => {
      G.from(row, {
        opacity: 0, x: calm ? 0 : -30, duration: calm ? .01 : .8, ease: 'power3.out',
        delay: i * 0.08,
        scrollTrigger: { trigger: row, start: 'top 90%', once: true },
      });
    });

    rows.forEach((row) => {
      const btn = row.querySelector('.trow-main');
      const det = row.querySelector('.t-detail');
      const inner = row.querySelector('.t-detail-in');
      btn.addEventListener('click', () => {
        const open = row.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(open));
        G.to(det, {
          height: open ? inner.offsetHeight : 0,
          duration: calm ? 0.01 : 0.55, ease: 'power3.inOut',
          onComplete: () => {
            if (open) det.style.height = 'auto';
            ScrollTrigger.refresh();
          },
        });
        if (open && !calm) {
          G.from(inner.children, { opacity: 0, y: 16, duration: 0.6, stagger: 0.08, ease: 'power3.out', delay: 0.12 });
        }
      });
    });
  }

  /* ---------- 4. garage rail ---------- */
  function garage() {
    const vp = document.getElementById('railVp');
    const track = document.getElementById('railTrack');
    const meter = document.getElementById('railMeter');
    const count = document.getElementById('railCount');
    if (!vp || !track) return;
    const cards = [...track.querySelectorAll('.card')];
    const total = cards.length;

    const wide = () => matchMedia('(min-width:861px)').matches;

    /* -- desktop: pinned horizontal scrub -- */
    if (wide() && !calm) {
      const dist = () => Math.max(0, track.scrollWidth - vp.clientWidth + 24);

      const rail = G.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: '#garage',
          start: 'top top',
          end: () => '+=' + (dist() + window.innerHeight * 0.4),
          pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: (self) => {
            const p = self.progress;
            if (meter) meter.style.width = (p * 100).toFixed(1) + '%';
            if (count) count.textContent =
              String(Math.min(total, Math.floor(p * total) + 1)).padStart(2, '0')
              + ' / ' + String(total).padStart(2, '0');
          },
          // telemetry steps back so it never sits on top of a card
          onToggle: (self) => {
            const hud = document.getElementById('hud');
            if (hud) G.to(hud, { opacity: self.isActive ? 0.12 : 1, duration: 0.4 });
          },
        },
      });

      // cards drift in depth as the rail carries them across — a horizontal
      // scrub needs `containerAnimation`, or the trigger reads the wrong axis
      cards.forEach((c) => {
        G.fromTo(c,
          { yPercent: 3.5, rotate: 0.8 },
          {
            yPercent: -3.5, rotate: -0.8, ease: 'none',
            scrollTrigger: {
              trigger: c, containerAnimation: rail,
              start: 'left right', end: 'right left', scrub: true,
            },
          });
      });

      // drag the rail directly — translated into page scroll so it stays
      // in sync with the pin rather than fighting it
      if (window.Observer) {
        Observer.create({
          target: vp, type: 'pointer', dragMinimum: 3, lockAxis: true,
          onPress: () => vp.classList.add('grabbing'),
          onRelease: () => vp.classList.remove('grabbing'),
          onDrag: (self) => {
            if (self.lockedAxis === 'y') return;
            const sm = window.ScrollSmoother && ScrollSmoother.get();
            if (sm) sm.scrollTop(sm.scrollTop() - self.deltaX * 1.25);
            else window.scrollBy(0, -self.deltaX * 1.25);
          },
        });
      }
    } else {
      // mobile / reduced motion: native horizontal scroll with snap
      vp.classList.add('swipe');
      const hint = document.getElementById('railHint');
      if (hint) hint.textContent = 'Swipe';
      vp.addEventListener('scroll', () => {
        const p = vp.scrollLeft / Math.max(1, vp.scrollWidth - vp.clientWidth);
        if (meter) meter.style.width = (p * 100).toFixed(1) + '%';
        if (count) count.textContent =
          String(Math.min(total, Math.floor(p * (total - 1)) + 1)).padStart(2, '0')
          + ' / ' + String(total).padStart(2, '0');
      }, { passive: true });
      cards.forEach((c, i) => {
        G.from(c, {
          opacity: 0, y: 26, duration: calm ? .01 : .7, ease: 'power3.out', delay: i * 0.05,
          scrollTrigger: { trigger: vp, start: 'top 88%', once: true },
        });
      });
    }

    /* -- per-card cursor glow + tilt -- */
    if (!matchMedia('(hover:hover) and (pointer:fine)').matches || calm) return;
    cards.forEach((c) => {
      G.set(c, { transformPerspective: 1100 });
      const rx = G.quickTo(c, 'rotationX', { duration: 0.6, ease: 'power3.out' });
      const ry = G.quickTo(c, 'rotationY', { duration: 0.6, ease: 'power3.out' });
      const sc = G.quickTo(c, 'scale', { duration: 0.6, ease: 'power3.out' });
      c.addEventListener('pointermove', (e) => {
        const r = c.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width;
        const ny = (e.clientY - r.top) / r.height;
        c.style.setProperty('--mx', (nx * 100).toFixed(1) + '%');
        c.style.setProperty('--my', (ny * 100).toFixed(1) + '%');
        rx(-(ny - 0.5) * 7); ry((nx - 0.5) * 9); sc(1.018);
      });
      c.addEventListener('pointerleave', () => { rx(0); ry(0); sc(1); });
    });
  }

  /* ---------- 5. crew bento ---------- */
  function crew() {
    const tiles = [...document.querySelectorAll('.tile')];
    tiles.forEach((t, i) => {
      G.from(t, {
        opacity: 0, y: calm ? 0 : 44, scale: calm ? 1 : 0.97,
        duration: calm ? .01 : .85, ease: 'power3.out', delay: (i % 3) * 0.09,
        scrollTrigger: { trigger: t, start: 'top 90%', once: true },
      });
    });
  }

  /* ---------- 6. pit lane ---------- */
  function pitlane() {
    const chars = document.querySelectorAll('.pit-ch');
    if (!chars.length) return;
    G.from(chars, {
      yPercent: calm ? 0 : 110, opacity: 0, duration: calm ? .01 : 1,
      ease: 'expo.out', stagger: 0.05,
      scrollTrigger: { trigger: '#pitlane', start: 'top 72%', once: true },
    });
    if (calm) return;
    G.to('.flag', {
      backgroundPositionX: '88px', ease: 'none',
      scrollTrigger: { trigger: '#pitlane', start: 'top bottom', end: 'bottom bottom', scrub: 1 },
    });
    G.from('.foot > div', {
      opacity: 0, y: 20, duration: 0.7, stagger: 0.09, ease: 'power3.out',
      scrollTrigger: { trigger: '.foot', start: 'top 95%', once: true },
    });
  }

  /* ---------- velocity skew: the elastic "speed" feel ---------- */
  function skew(getVel) {
    if (calm) return;
    const targets = document.querySelectorAll('#skillGrid,.board,.bento,.driver-grid');
    if (!targets.length) return;
    const setters = [...targets].map((t) => G.quickTo(t, 'skewY', { duration: 0.5, ease: 'power3.out' }));
    let last = 0;
    G.ticker.add(() => {
      const v = getVel();
      // enough lean to read as speed, not so much that the text stops being readable
      const s = Math.max(-1.6, Math.min(1.6, v * 0.0018));
      if (Math.abs(s - last) < 0.02) return;
      last = s;
      setters.forEach((fn) => fn(s));
    });
  }

  /* ---------- public ---------- */
  return {
    prepare() {
      eases();
      headings(); rules(); rises(); counters(); ticker();
      heroParallax(); driver(); setup(); history(); garage(); crew(); pitlane();
    },
    launch: heroLaunch,
    skew,
  };
})();
