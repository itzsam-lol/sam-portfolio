/* ============================================================
   MOTION: every GSAP timeline on the page.
   One motion language: things arrive from below a mask, wide
   type "accelerates" through the width axis, and diagrams draw
   themselves before they start working.
   ============================================================ */

window.Motion = (function () {
  const G = window.gsap;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const has = (n) => !!window[n];
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* =========================================================
     Hero masthead: fit to the column at any width-axis value
     ========================================================= */
  const Name = {
    el: null, word: null, table: [], wd: 125, target: 125, busy: false,
    finalWidth() { return innerWidth < 600 ? 86 : innerWidth < 861 ? 100 : 125; },
    measure() {
      this.el = $('#heroName'); this.word = $('#heroName .hn');
      if (!this.el) return;
      // natural width of the word at 100px for wdth 75…125
      const probe = this.word.cloneNode(true);
      // em letter-spacing is inherited as an absolute length, so restate it at the probe's size
      const ls = parseFloat(getComputedStyle(this.el).letterSpacing) / parseFloat(getComputedStyle(this.el).fontSize) || 0;
      Object.assign(probe.style, { position: 'absolute', visibility: 'hidden', left: '-9999px', top: '0', fontSize: '100px', whiteSpace: 'nowrap', letterSpacing: ls + 'em' });
      probe.querySelectorAll('.hn-ch').forEach((c) => (c.style.transform = 'none'));
      this.el.appendChild(probe);
      this.table = [];
      for (let w = 75; w <= 125; w += 5) {
        probe.style.fontStretch = w + '%';
        this.table.push([w, probe.getBoundingClientRect().width]);
      }
      probe.remove();
      this.target = this.finalWidth();
    },
    widthAt(wd) {
      const t = this.table; if (!t.length) return 0;
      const i = Math.min(t.length - 2, Math.max(0, Math.floor((wd - 75) / 5)));
      const [w0, a] = t[i], [w1, b] = t[i + 1];
      return a + (b - a) * ((wd - w0) / (w1 - w0));
    },
    apply(wd) {
      if (!this.el || !this.table.length) return;
      this.wd = wd;
      const avail = this.el.clientWidth;
      const fs = avail / this.widthAt(wd) * 100;
      this.el.style.setProperty('--hn-wd', wd.toFixed(2) + '%');
      this.el.style.setProperty('--hn-fs', fs.toFixed(2) + 'px');
      document.documentElement.style.setProperty('--hn-fs', fs.toFixed(2) + 'px');
    },
  };

  /* =========================================================
     Intro: five lights, lights out, away we go
     ========================================================= */
  function intro(done) {
    const body = document.body;
    // the scroll-out tweens are built only now: built earlier, they would record the
    // intro's hidden state as their starting point and hide the hero on the way back up
    const finish = () => { Name.busy = false; body.classList.remove('is-booting'); heroScroll(); done && done(); };
    Name.measure();

    if (!G || calm) {
      Name.apply(Name.target);
      document.documentElement.classList.remove('motion');
      finish();
      return;
    }

    let firstVisit = true;
    try { firstVisit = !sessionStorage.getItem('seen'); sessionStorage.setItem('seen', '1'); } catch (e) {}

    const tl = G.timeline({ onComplete: finish });
    const lights = $$('#lights i');
    Name.busy = true;

    // five reds, one every 0.2 s, a held beat, then lights out: the name launches on that instant
    const OUT = 0.25 + 5 * 0.2 + 0.5;
    if (firstVisit) {
      tl.set('#lights', { opacity: 1 });
      lights.forEach((l, i) => tl.call(() => l.classList.add('on'), null, 0.25 + i * 0.2));
      tl.call(() => lights.forEach((l) => l.classList.remove('on')), null, OUT);
      tl.to('#lights', { opacity: 0, duration: 0.25 }, OUT + 0.05);
    }
    const t0 = firstVisit ? OUT : 0.05;

    // the name comes off the line condensed and stretches to its final width
    const st = { wd: 75 };
    Name.apply(75);
    tl.to(st, { wd: Name.target, duration: 1.6, ease: 'power3.inOut', onUpdate: () => Name.apply(st.wd) }, t0)
      // y:0 matters: GSAP reads the stylesheet's translateY(104%) as pixels and would keep it
      .fromTo('.hn-ch', { yPercent: 104, y: 0 }, { yPercent: 0, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.045 }, t0)
      .fromTo('.hero-portrait', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.25, ease: 'expo.out' }, t0 + 0.12)
      .fromTo('.hero-portrait img', { scale: 1.1, yPercent: 4 }, { scale: 1, yPercent: 0, duration: 1.7, ease: 'expo.out' }, t0 + 0.12)
      .fromTo('.hero .boot', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.07 }, t0 + 0.55)
      .fromTo('.hdr', { opacity: 0 }, { opacity: 1, duration: 0.8 }, t0 + 0.7)
      // hand back to the stylesheet: drop the boot class first, then the inline values
      .call(() => document.documentElement.classList.remove('motion'))
      .set(['.hn-ch', '.hn', '.hero .boot', '.hero-portrait', '.hero-portrait img', '.hdr'], { clearProps: 'transform,opacity,clipPath' });
  }

  function heroScroll() {
    if (calm || !G) return;
    const mm = G.matchMedia();
    mm.add('(min-width: 861px)', () => {
      const trig = { trigger: '#top', start: 'top top', end: 'bottom top', scrub: 0.4 };
      G.fromTo('.hero-portrait', { yPercent: 0 }, { yPercent: -10, ease: 'none', scrollTrigger: trig });
      G.fromTo('.hero-name', { yPercent: 0 }, { yPercent: 38, ease: 'none', scrollTrigger: trig });
      G.fromTo(['.hero-lede', '.hero-facts', '.hero-meta', '.hero-plate'], { y: 0, opacity: 1 },
        { y: -60, opacity: 0.2, ease: 'none', scrollTrigger: { ...trig, start: 'top+=10% top' } });
    });
  }

  /* =========================================================
     Reveals shared by every section
     ========================================================= */
  // big titles: characters rise out of a mask while the width axis opens up
  function titles() {
    $$('.sec-title, .contact-title').forEach((el) => {
      if (calm || !has('SplitText')) return;
      // words first, so a line can only ever break between words
      const split = new SplitText(el, { type: 'words,chars', mask: 'chars', charsClass: 'tc', wordsClass: 'tw' });
      const tl = G.timeline({ scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
      tl.fromTo(el, { '--wd': '82%' }, { '--wd': '125%', duration: 1.4, ease: 'power4.out' }, 0)
        .from(split.chars, { yPercent: 105, duration: 1.05, ease: 'expo.out', stagger: 0.035 }, 0);
    });
    // section rows: the rule draws across, then the labels settle on it
    $$('.sec-row').forEach((row) => {
      if (calm) return;
      const tl = G.timeline({ scrollTrigger: { trigger: row, start: 'top 92%', once: true } });
      tl.fromTo(row, { '--rw': 0 }, { '--rw': 1, duration: 1.2, ease: 'expo.inOut' }, 0)
        .from(row.children, { opacity: 0, y: 8, duration: 0.6, ease: 'power3.out', stagger: 0.06 }, 0.35);
    });
  }

  function lines() {
    // multi-line headings that read better arriving line by line
    $$('.machine-line').forEach((el) => {
      if (calm || !has('SplitText')) return;
      const split = new SplitText(el, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
      G.from(split.lines, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.1,
        scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    });
  }

  function reveals() {
    if (calm) return;
    // each element rises on its own as it reaches the bottom tenth of the screen
    const sel = [
      '.reveal',
      '.sheet-line, .sheet-desc, .sheet-points, .metrics',
      '.paper-kicker, .paper-plain, .results, .ds, .paper-meta, .paper-links',
      '.udyox-head > *, .udyox-nums li, .udyox-text, .udyox-stack',
      '.st-cap', '.aw, .course-list, .langs',
    ].join(', ');
    $$(sel).forEach((el) => {
      G.from(el, { opacity: 0, y: 22, duration: 0.95, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
    // list rows arrive in a quick stagger, per list
    ['.jobs', '.ot-list', '.og-list', '.ar-list', '.quant-grid', '.tk-grid', '.contact-links'].forEach((sel) => {
      const list = $(sel);
      if (!list || calm) return;
      G.from(list.children, { opacity: 0, y: 26, duration: 0.9, ease: 'expo.out', stagger: 0.06,
        scrollTrigger: { trigger: list, start: 'top 85%', once: true } });
    });
  }

  /* =========================================================
     Intro statement: the paragraph inks in as you read it
     ========================================================= */
  function introFill() {
    const el = $('#introText');
    if (!el || calm || !has('SplitText')) return;
    const split = new SplitText(el, { type: 'words', wordsClass: 'word' });
    G.fromTo(split.words, { opacity: 0.13 }, {
      opacity: 1, ease: 'none', stagger: 0.1,
      scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 52%', scrub: 0.6 },
    });
    G.from('.intro-k', { opacity: 0, x: -10, duration: 0.8, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 80%', once: true } });
  }

  /* =========================================================
     Interlude: progress for scene.js, copy in and out
     ========================================================= */
  function machine() {
    const sec = $('#machine');
    if (!sec) return;
    const M = window.__machine = window.__machine || { p: 0, active: false };
    if (calm) { M.p = 0.55; return; }
    ScrollTrigger.create({
      trigger: sec, start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate: (s) => { M.p = s.progress; },
      onToggle: (s) => { M.active = s.isActive; },
    });
    ScrollTrigger.create({
      trigger: sec, start: 'top bottom', end: 'bottom top',
      onToggle: (s) => { M.near = s.isActive; },
    });
    G.to('.machine-copy', { opacity: 0, y: -40, ease: 'none',
      scrollTrigger: { trigger: sec, start: '78% bottom', end: 'bottom bottom', scrub: true } });
    G.from('.machine-note, .machine-cap, .machine-meter', { opacity: 0, y: 14, duration: 0.9, stagger: 0.08, ease: 'expo.out',
      scrollTrigger: { trigger: sec, start: 'top 40%', once: true } });
  }

  /* =========================================================
     Work: sheets stack like drawings on a desk
     ========================================================= */
  function sheets() {
    const list = $$('.sheet');
    if (!list.length || calm) return;
    const mm = G.matchMedia();
    mm.add('(min-width: 1025px) and (min-height: 721px)', () => {
      list.forEach((s, i) => {
        const next = list[i + 1];
        if (!next) return;
        G.fromTo(s.querySelector('.sheet-in'), { scale: 1, '--dim': 0 }, {
          scale: 0.94, '--dim': 0.62, ease: 'none',
          scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top+=80', scrub: true },
        });
      });
    });
    // titles on each sheet arrive with the sheet
    list.forEach((s) => {
      const t = s.querySelector('.sheet-title');
      if (!t || !has('SplitText')) return;
      const split = new SplitText(t, { type: 'words,chars', mask: 'chars' });
      G.from(split.chars, { yPercent: 105, duration: 1, ease: 'expo.out', stagger: 0.025,
        scrollTrigger: { trigger: s, start: 'top 68%', once: true } });
    });
  }

  /* =========================================================
     Figures: draw on first sight, then run while visible
     ========================================================= */
  function figures() {
    $$('.fig').forEach((fig) => {
      const svg = fig.querySelector('.fig-svg');
      if (!svg) return;
      const id = fig.dataset.fig;
      const loop = window.Figures.play(id, svg);

      if (calm) { if (loop) loop.progress(0.999).pause(); return; }

      const strokes = $$('.f-draw:not(.f-dash):not(.f-tray):not(.f-curve), .f-axis, .f-bar, .f-road', svg);
      const soft = $$('text, .f-dash, .f-tray, .f-curve, .f-grid, .f-dot, .f-junction, .f-qr, .f-bit, .f-cell, .f-rule, .f-slot, .f-tier-sat, .f-tier-mid, .f-tier-res, .f-pt, .f-ci, .f-head, .f-ship', svg);
      const bars = $$('.f-bar', svg);
      const tl = G.timeline({ paused: true });
      if (has('DrawSVGPlugin')) {
        tl.fromTo(strokes.filter((e) => !e.classList.contains('f-bar')), { drawSVG: '0%' },
          { drawSVG: '100%', duration: 1.1, ease: 'power2.inOut', stagger: { each: 0.012, from: 'start' },
            onComplete: () => G.set(strokes, { clearProps: 'strokeDasharray,strokeDashoffset' }) }, 0);
      }
      tl.fromTo(soft, { opacity: 0 }, { opacity: 1, duration: 0.6, stagger: { each: 0.006 }, ease: 'power1.out' }, 0.25);
      bars.forEach((b) => {
        // bars grow from their baseline (left for horizontal, bottom for vertical)
        const vertical = +b.getAttribute('height') > +b.getAttribute('width');
        const neg = b.dataset.neg === '1';
        G.set(b, { transformOrigin: vertical ? '50% 100%' : (neg ? '100% 50%' : '0% 50%') });
        tl.fromTo(b, vertical ? { scaleY: 0 } : { scaleX: 0 }, { scaleY: 1, scaleX: 1, duration: 1, ease: 'expo.out' }, 0.45);
      });

      let drawn = false;
      ScrollTrigger.create({
        trigger: fig, start: 'top 82%', end: 'bottom 10%',
        onToggle: (s) => {
          if (s.isActive) {
            if (!drawn) { drawn = true; tl.play(); if (loop) G.delayedCall(1.2, () => s.isActive && loop.play()); }
            else if (loop) loop.play();
          } else if (loop) loop.pause();
        },
      });
    });
  }

  /* =========================================================
     Research: the preprint page, highlighter, table
     ========================================================= */
  function research() {
    if (calm) { $$('.hl').forEach((m) => m.style.setProperty('--hl', '100%')); return; }
    const sheet = $('.paper-sheet');
    if (sheet) {
      // it lands once, then turns slowly with the scroll, as if being picked up off the desk
      G.fromTo(sheet, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1.4, ease: 'expo.out',
        scrollTrigger: { trigger: '#research-paper', start: 'top 80%', once: true } });
      G.fromTo(sheet, { rotation: -3 }, { rotation: 0.6, ease: 'none',
        scrollTrigger: { trigger: '#research-paper', start: 'top 80%', end: 'bottom 60%', scrub: 1 } });
      G.to('.hl', { '--hl': '100%', duration: 0.9, ease: 'power2.inOut', stagger: 0.5,
        scrollTrigger: { trigger: sheet, start: 'top 45%', once: true } });
    }
    const rows = $$('.ds-table tbody tr');
    if (rows.length) G.from(rows, { opacity: 0, x: -12, duration: 0.6, stagger: 0.05, ease: 'expo.out',
      scrollTrigger: { trigger: '.ds-table', start: 'top 85%', once: true } });
  }

  /* =========================================================
     Experience: replay the stint chart as you scroll past it
     ========================================================= */
  function stints() {
    const chart = $('.st-chart');
    if (!chart || calm) return;
    const tl = G.timeline({ scrollTrigger: { trigger: chart, start: 'top 82%', end: 'bottom 45%', scrub: 0.8 } });
    // the timeline's clock is the chart's own x axis: each bar starts where it starts
    $$('.stint', chart).forEach((s) => {
      const l = parseFloat(s.style.left) / 100, w = parseFloat(s.style.width) / 100;
      tl.fromTo(s.querySelector('.stint-bar'), { clipPath: 'inset(0% 100% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: Math.max(0.04, w), ease: 'none' }, l);
      const out = s.querySelector(':scope > .stint-t');
      if (out) tl.fromTo(out, { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 0.06, ease: 'none' }, l + w * 0.8);
    });
    tl.fromTo('.st-now', { opacity: 0 }, { opacity: 1, duration: 0.05 }, '>-0.02')
      .fromTo('.st-future', { opacity: 0 }, { opacity: 1, duration: 0.08 }, '<');

    // on phones the chart is wider than the screen: pan the view with the replay,
    // so the bar being drawn is always on screen, until the reader swipes it themselves
    const wrap = $('#stScroll');
    if (!wrap) return;
    let mine = false, set = -1;
    wrap.addEventListener('scroll', () => { if (Math.abs(wrap.scrollLeft - set) > 2) mine = true; }, { passive: true });
    ScrollTrigger.create({
      trigger: chart, start: 'top 82%', end: 'bottom 45%',
      onUpdate: (s) => {
        const max = wrap.scrollWidth - wrap.clientWidth;
        if (mine || max < 4) return;
        wrap.scrollLeft = s.progress * max;
        set = wrap.scrollLeft;
      },
    });
  }

  /* =========================================================
     Contact: the chequered flag waves you in
     ========================================================= */
  function contact() {
    if (calm) return;
    G.fromTo('.flag', { backgroundPosition: '0px 0px, 14px 14px' }, {
      backgroundPosition: '112px 0px, 126px 14px', ease: 'none',
      scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom bottom', scrub: 0.5 },
    });
    G.from('.mail, .copy, .contact-open', { opacity: 0, y: 24, duration: 1, stagger: 0.08, ease: 'expo.out',
      scrollTrigger: { trigger: '.contact-grid', start: 'top 85%', once: true } });
  }

  /* ---------- public ---------- */
  return {
    Name,
    intro,
    init() {
      if (!G) return;
      titles(); lines(); reveals(); introFill(); machine();
      sheets(); figures(); research(); stints(); contact();
    },
    refit() { Name.measure(); if (!Name.busy) Name.apply(Name.target); },
  };
})();
