/* ============================================================
   UI: interactions that must work with or without GSAP.
   clock · theme · header · menu · copy · archive filter · toolkit
   ============================================================ */

window.initUI = function initUI(opts) {
  const D = window.DATA;
  const G = window.gsap;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollTo = opts.scrollTo;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- clock: New Delhi time, to the minute ---------- */
  const clock = $('#clock');
  const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: D.person.tz });
  const tick = () => { if (clock) { clock.textContent = fmt.format(new Date()); clock.dateTime = new Date().toISOString(); } };
  tick();
  setTimeout(() => { tick(); setInterval(tick, 60000); }, (60 - new Date().getSeconds()) * 1000);

  /* ---------- theme: day / night ---------- */
  const btn = $('#themeBtn');
  const label = btn && btn.querySelector('.theme-txt');
  const meta = $('#themeColor');
  function paintBtn() {
    const dark = document.documentElement.dataset.theme === 'dark';
    if (label) label.textContent = dark ? 'Day' : 'Night';
    if (btn) btn.setAttribute('aria-label', dark ? 'Switch to day mode' : 'Switch to night mode');
    if (meta) meta.content = dark ? '#0F0F0E' : '#EFEDE7';
  }
  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('theme', t); } catch (e) {}
    paintBtn();
    document.dispatchEvent(new CustomEvent('themechange', { detail: t }));
  }
  paintBtn();
  if (btn) btn.addEventListener('click', (e) => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    // a circular reveal from the button, where the browser supports it
    if (!document.startViewTransition || calm) { setTheme(next); return; }
    const r = btn.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.documentElement.classList.add('vt-theme');
    const vt = document.startViewTransition(() => setTheme(next));
    vt.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
        { duration: 700, easing: 'cubic-bezier(.65,0,.35,1)', pseudoElement: '::view-transition-new(root)' });
    });
    vt.finished.finally(() => document.documentElement.classList.remove('vt-theme'));
  });

  /* ---------- header: solid past the hero, hides going down ---------- */
  const hdr = $('#hdr');
  const rail = $('#rail');
  const nav = $('#nav');
  const links = $$('#nav a');
  const ids = D.nav.map((n) => n.id);
  let lastY = 0, active = null;

  function moveIndicator(a) {
    if (!nav) return;
    if (!a) { nav.style.setProperty('--no', 0); return; }
    nav.style.setProperty('--nx', a.offsetLeft + 'px');
    nav.style.setProperty('--nw', a.offsetWidth + 'px');
    nav.style.setProperty('--no', 1);
  }

  function onScroll(y) {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    if (rail) rail.style.setProperty('--p', Math.min(1, y / max).toFixed(4));
    if (hdr && !document.body.classList.contains('menu-open')) {
      hdr.classList.toggle('is-solid', y > innerHeight * 0.6);
      const goingDown = y > lastY + 4, goingUp = y < lastY - 4;
      if (goingDown && y > innerHeight) hdr.classList.add('is-hidden');
      else if (goingUp || y < innerHeight) hdr.classList.remove('is-hidden');
    }
    lastY = y;

    // the section whose top has crossed 40% of the viewport
    const line = innerHeight * 0.4;
    let cur = null;
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= line) cur = id;
    }
    if (cur !== active) {
      active = cur;
      links.forEach((a) => a.classList.toggle('is-on', a.dataset.sec === cur));
      $$('#menuNav a').forEach((a) => a.classList.toggle('is-on', a.dataset.sec === cur));
      moveIndicator(links.find((a) => a.dataset.sec === cur));
    }
  }
  addEventListener('resize', () => moveIndicator(links.find((a) => a.dataset.sec === active)));

  /* ---------- menu ---------- */
  const menu = $('#menu');
  const menuBtn = $('#menuBtn');
  function setMenu(open) {
    if (!menu) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? 'Close' : 'Menu';
    document.body.classList.toggle('menu-open', open);
    if (open) {
      menu.hidden = false;
      opts.lenis && opts.lenis.stop();
      if (G && !calm) {
        G.fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.7, ease: 'expo.out' });
        G.fromTo('#menuNav a', { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7, stagger: 0.05, ease: 'expo.out', delay: 0.1 });
      }
      const first = menu.querySelector('a'); if (first) first.focus({ preventScroll: true });
    } else {
      opts.lenis && opts.lenis.start();
      if (G && !calm) G.to(menu, { clipPath: 'inset(0 0 100% 0)', duration: 0.45, ease: 'expo.in', onComplete: () => { menu.hidden = true; } });
      else menu.hidden = true;
    }
  }
  if (menuBtn) menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { setMenu(false); menuBtn.focus(); } });

  /* ---------- in-page links ---------- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const el = id ? document.getElementById(id) : null;
    if (!el && id !== 'top') return;
    e.preventDefault();
    if (document.body.classList.contains('menu-open')) setMenu(false);
    scrollTo(id === 'top' ? 0 : el);
    history.replaceState(null, '', id === 'top' ? location.pathname : '#' + id);
    // keyboard and screen-reader users continue from where they landed
    const target = id === 'top' ? document.getElementById('main') : el;
    if (target) {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  });

  /* ---------- copy email ---------- */
  const copy = $('#copyMail');
  if (copy) copy.addEventListener('click', async () => {
    const txt = copy.dataset.copy;
    let ok = false;
    try { await navigator.clipboard.writeText(txt); ok = true; } catch (e) {
      const t = document.createElement('textarea'); t.value = txt; t.setAttribute('readonly', '');
      t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select();
      try { ok = document.execCommand('copy'); } catch (er) {} t.remove();
    }
    const span = copy.querySelector('span');
    span.textContent = ok ? 'Copied' : 'Press Ctrl+C';
    copy.classList.toggle('is-done', ok);
    clearTimeout(copy._t);
    copy._t = setTimeout(() => { span.textContent = 'Copy'; copy.classList.remove('is-done'); }, 1800);
  });

  /* ---------- archive: area filter, plus a tool filter from the toolkit ---------- */
  const bar = $('.flt-bar');
  const rows = $$('.ar');
  const chip = $('#toolChip');
  let area = 'all', tool = null;

  function applyFilter() {
    const state = G && window.Flip && !calm ? Flip.getState(rows) : null;
    rows.forEach((r) => {
      const inArea = area === 'all' || r.dataset.area.split(' ').includes(area);
      const inTool = !tool || r.dataset.stack.split('|').includes(tool.toLowerCase());
      r.classList.toggle('is-hidden', !(inArea && inTool));
    });
    if (state) {
      Flip.from(state, {
        duration: 0.55, ease: 'power3.inOut', absolute: false, scale: false,
        onEnter: (els) => G.fromTo(els, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.03 }),
        onLeave: (els) => G.to(els, { opacity: 0, duration: 0.2 }),
        onComplete: () => window.ScrollTrigger && ScrollTrigger.refresh(),
      });
    } else if (window.ScrollTrigger) ScrollTrigger.refresh();
  }
  if (bar) bar.addEventListener('click', (e) => {
    const b = e.target.closest('.flt');
    if (!b) return;
    if (b === chip) { tool = null; chip.hidden = true; applyFilter(); return; }
    area = b.dataset.area;
    $$('.flt[data-area]').forEach((x) => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', String(on)); });
    applyFilter();
  });

  /* ---------- toolkit: which projects use this? ---------- */
  const readout = $('#tkReadout');
  const defaultText = readout ? readout.innerHTML : '';
  const uses = {};
  D.archive.forEach((p) => p.stack.forEach((s) => { const k = s.toLowerCase(); (uses[k] = uses[k] || []).push(p.name); }));
  const list = (arr) => arr.length <= 2 ? arr.join(' and ') : arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function show(btnEl) {
    if (!readout) return;
    const t = btnEl.dataset.tool, u = uses[t.toLowerCase()] || [];
    readout.innerHTML = u.length
      ? `<b>${esc(t)}</b> appears in ${u.length === 1 ? '' : u.length + ' projects: '}${esc(list(u))}.`
      : `<b>${esc(t)}</b> comes from coursework and practice rather than a listed project.`;
  }
  $$('.tk').forEach((b) => {
    b.addEventListener('mouseenter', () => show(b));
    b.addEventListener('focus', () => show(b));
    b.addEventListener('mouseleave', () => { readout.innerHTML = defaultText; });
    b.addEventListener('blur', () => { readout.innerHTML = defaultText; });
    b.addEventListener('click', () => {
      if (b.hasAttribute('data-none')) return;
      tool = b.dataset.tool;
      area = 'all';
      $$('.flt[data-area]').forEach((x) => { const on = x.dataset.area === 'all'; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', String(on)); });
      if (chip) { chip.hidden = false; chip.textContent = 'Uses ' + tool; chip.setAttribute('aria-label', `Showing projects that use ${tool}. Clear`); }
      applyFilter();
      scrollTo(document.getElementById('archive'));
    });
  });

  return { onScroll, setTheme };
};
