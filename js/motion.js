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
    el: null, word: null, avail: 0, table: [], wd: 125, target: 125, busy: false,
    finalWidth() { return innerWidth < 600 ? 86 : innerWidth < 861 ? 100 : 125; },
    measure() {
      this.el = $('#heroName'); this.word = $('#heroName .hn');
      if (!this.el) return;
      this.avail = this.el.clientWidth;          // read once here, never inside an animation frame
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
      const fs = this.avail / this.widthAt(wd) * 100;
      // only the name itself: its box, the portrait and the lights are laid out from the final size
      this.el.style.setProperty('--hn-wd', wd.toFixed(2) + '%');
      this.el.style.setProperty('--hn-fs', fs.toFixed(2) + 'px');
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
      placeLights();
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
      .fromTo('.hero .boot', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.07 }, t0 + 0.55)
      // hand back to the stylesheet: drop the boot class first, then the inline values
      .call(() => document.documentElement.classList.remove('motion'))
      .set(['.hn-ch', '.hn', '.hero .boot'], { clearProps: 'transform,opacity' });
  }

  // the start lights hang over the middle of the masthead, wherever this layout puts it
  function placeLights() {
    const l = $('#lights'), h = Name.el;
    if (l && h) l.style.top = (h.offsetTop + h.offsetHeight / 2) + 'px';
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
     One-shot reveals ride an IntersectionObserver (one per edge):
     nothing is measured while the page boots, unlike a ScrollTrigger
     per element. ScrollTrigger is kept for what scrubs with scroll.
     `edge` is where the element's top has to reach, from the bottom.
     ========================================================= */
  const viewers = {};
  function onView(el, fn, edge = '-10%') {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { fn(); return; }
    let v = viewers[edge];
    if (!v) {
      v = viewers[edge] = new IntersectionObserver((es) => es.forEach((e) => {
        if (!e.isIntersecting) return;
        v.unobserve(e.target);
        const fns = e.target.__onView || [];
        e.target.__onView = null;
        fns.forEach((f) => f());
      }), { rootMargin: `0px 0px ${edge} 0px` });
    }
    (el.__onView = el.__onView || []).push(fn);
    v.observe(el);
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
      G.set(el, { '--wd': '82%' });
      G.set(split.chars, { yPercent: 105 });
      onView(el, () => G.timeline()
        .to(el, { '--wd': '125%', duration: 1.4, ease: 'power4.out' }, 0)
        .to(split.chars, { yPercent: 0, duration: 1.05, ease: 'expo.out', stagger: 0.035 }, 0), '-14%');
    });
    // section rows: the rule draws across, then the labels settle on it
    $$('.sec-row').forEach((row) => {
      if (calm) return;
      G.set(row, { '--rw': 0 });
      G.set(row.children, { opacity: 0, y: 8 });
      onView(row, () => G.timeline()
        .to(row, { '--rw': 1, duration: 1.2, ease: 'expo.inOut' }, 0)
        .to(row.children, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.06 }, 0.35), '-8%');
    });
  }

  function lines() {
    // multi-line headings that read better arriving line by line
    $$('.machine-line').forEach((el) => {
      if (calm || !has('SplitText')) return;
      const split = new SplitText(el, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
      G.set(split.lines, { yPercent: 110 });
      onView(el, () => G.to(split.lines, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1 }), '-15%');
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
    const els = $$(sel);
    G.set(els, { opacity: 0, y: 22 });
    els.forEach((el) => onView(el, () => G.to(el, { opacity: 1, y: 0, duration: 0.95, ease: 'expo.out', clearProps: 'opacity,transform' })));
    // list rows arrive in a quick stagger, per list
    ['.jobs', '.ot-list', '.og-list', '.ar-list', '.quant-grid', '.tk-grid', '.contact-links'].forEach((s) => {
      const list = $(s);
      if (!list) return;
      const kids = [...list.children];
      G.set(kids, { opacity: 0, y: 26 });
      onView(list, () => G.to(kids, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06, clearProps: 'opacity,transform' }), '-15%');
    });
  }

  /* =========================================================
     Intro statement: the paragraph inks in as you read it
     ========================================================= */
  function introFill() {
    const el = $('#introText');
    if (!el || calm || !has('SplitText')) return;
    const split = new SplitText(el, { type: 'words', wordsClass: 'word', aria: 'none' });
    G.fromTo(split.words, { '--k': 0 }, {
      '--k': 1, ease: 'none', stagger: 0.1,
      scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 52%', scrub: 0.6 },
    });
    G.set('.intro-k', { opacity: 0, x: -10 });
    onView(el, () => G.to('.intro-k', { opacity: 1, x: 0, duration: 0.8, ease: 'expo.out' }), '-20%');
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
    const copy = $$('.machine-note, .machine-cap, .machine-meter');
    G.set(copy, { opacity: 0, y: 14 });
    onView(sec, () => G.to(copy, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease: 'expo.out' }), '-60%');
  }

  /* =========================================================
     Work: sheets stack like drawings on a desk
     ========================================================= */
  function sheets() {
    const list = $$('.sheet');
    if (!list.length || calm) return;
    const mm = G.matchMedia();
    mm.add('(min-width: 1025px) and (min-height: 860px)', () => {
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
      G.set(split.chars, { yPercent: 105 });
      onView(s, () => G.to(split.chars, { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.025 }), '-32%');
    });
  }

  /* =========================================================
     Sheets: an approval stamp lands on each title block
     ========================================================= */
  function stamps() {
    if (calm) return;
    $$('.sheet').forEach((sheet) => {
      const st = sheet.querySelector('.stamp');
      if (!st) return;
      G.set(st, { opacity: 0 });
      onView(sheet, () => G.timeline()
        .fromTo(st, { opacity: 0, scale: 1.9, rotation: -16 }, { opacity: 1, scale: 1, rotation: -7, duration: 0.3, ease: 'power4.in' })
        // the sheet takes the hit
        .to(sheet.querySelector('.tblock'), { y: 2, duration: 0.05, yoyo: true, repeat: 1, ease: 'power1.inOut' }, 0.28), '-58%');
    });
  }

  /* =========================================================
     Numbers: they roll up like a timing screen, once
     ========================================================= */
  // reels sit over the real text (made transparent), so nothing moves when they go
  function roll(el) {
    const txt = el.textContent;
    const box = document.createElement('span');
    box.className = 'nr-box';
    box.setAttribute('aria-hidden', 'true');
    const reels = [];
    [...txt].forEach((c, i, all) => {
      if (/\d/.test(c)) {
        const turns = 1 + ((all.length - i) % 2);
        let h = '';
        for (let t = 0; t < turns; t++) for (let k = 0; k < 10; k++) h += `<i>${k}</i>`;
        for (let k = 0; k <= +c; k++) h += `<i>${k}</i>`;
        const w = document.createElement('span');
        w.className = 'nr';
        w.innerHTML = `<span>${h}</span>`;
        box.appendChild(w);
        reels.push([w.firstChild, turns * 10 + +c]);
      } else {
        const s = document.createElement('span');
        s.className = 'nr-s';
        s.textContent = c;
        box.appendChild(s);
      }
    });
    el.classList.add('nr-on');
    el.appendChild(box);
    const tl = G.timeline({ onComplete: () => { box.remove(); el.classList.remove('nr-on'); } });
    reels.forEach(([col, n], i) => {
      tl.fromTo(col, { yPercent: 0 }, { yPercent: -100 * n / (n + 1), duration: 0.9 + i * 0.14, ease: 'power3.out' }, i * 0.05);
    });
  }
  function rolls() {
    if (calm) return;
    $$('.num-roll').forEach((el) => {
      if (!/\d/.test(el.textContent)) return;
      onView(el, () => roll(el));
    });
  }

  /* =========================================================
     Back to the grid: the lights go out once more
     ========================================================= */
  function relaunch() {
    if (calm || !G || Name.busy) return;
    const lights = $$('#lights i');
    const OUT = 0.2 + 5 * 0.18 + 0.4;
    const st = { wd: 75 };
    const tl = G.timeline({ onComplete: () => { Name.busy = false; Name.apply(Name.target); } });
    placeLights();
    tl.set('#lights', { opacity: 1 });
    lights.forEach((l, i) => tl.call(() => l.classList.add('on'), null, 0.2 + i * 0.18));
    tl.call(() => { lights.forEach((l) => l.classList.remove('on')); Name.busy = true; }, null, OUT)
      .to('#lights', { opacity: 0, duration: 0.25 }, OUT + 0.05)
      .fromTo(st, { wd: 75 }, { wd: Name.target, duration: 1.3, ease: 'power3.inOut', onUpdate: () => Name.apply(st.wd) }, OUT)
      .fromTo('.hn-ch', { yPercent: 0 }, { yPercent: -7, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.out', stagger: 0.035 }, OUT);
  }

  /* =========================================================
     Research: the preprint page, highlighter, table
     ========================================================= */
  function research() {
    if (calm) { $$('.hl').forEach((m) => m.style.setProperty('--hl', '100%')); return; }
    const sheet = $('.paper-sheet');
    if (sheet) {
      // it lands once, then turns slowly with the scroll, as if being picked up off the desk
      G.set(sheet, { y: 60, opacity: 0 });
      onView($('#research-paper'), () => G.to(sheet, { y: 0, opacity: 1, duration: 1.4, ease: 'expo.out' }), '-20%');
      G.fromTo(sheet, { rotation: -3 }, { rotation: 0.6, ease: 'none',
        scrollTrigger: { trigger: '#research-paper', start: 'top 80%', end: 'bottom 60%', scrub: 1 } });
      onView(sheet, () => G.to('.hl', { '--hl': '100%', duration: 0.9, ease: 'power2.inOut', stagger: 0.5 }), '-55%');
    }
    const rows = $$('.ds-table tbody tr');
    if (rows.length) {
      G.set(rows, { opacity: 0, x: -12 });
      onView($('.ds-table'), () => G.to(rows, { opacity: 1, x: 0, duration: 0.6, stagger: 0.05, ease: 'expo.out', clearProps: 'opacity,transform' }), '-15%');
    }
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
      // an open stint's width is a calc() against "now", so read what was drawn
      const track = s.parentElement.offsetWidth || 1;
      const l = parseFloat(s.style.left) / 100, w = s.offsetWidth / track;
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
    const copy = $$('.mail, .copy, .contact-open');
    G.set(copy, { opacity: 0, y: 24 });
    onView($('.contact-grid'), () => G.to(copy, { opacity: 1, y: 0, duration: 1, stagger: 0.08, ease: 'expo.out' }), '-15%');
  }

  /* ---------- public ---------- */
  return {
    Name,
    intro,
    relaunch,
    // one task per part, so building the scroll choreography never stalls a frame for long
    async init() {
      if (!G) return;
      const breathe = () => new Promise((r) => (window.scheduler && scheduler.yield ? scheduler.yield().then(r) : setTimeout(r, 0)));
      for (const fn of [titles, lines, reveals, introFill, machine, sheets, stamps, rolls, research, stints, contact]) {
        fn();
        await breathe();
      }
    },
    refit() { Name.measure(); if (!Name.busy) Name.apply(Name.target); },
  };
})();
