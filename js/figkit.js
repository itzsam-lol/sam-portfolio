/* ============================================================
   FIGKIT: the runtime every figure shares.

   figures.js draws each figure and runs its mechanism; this file
   mounts it. It picks the drawing for the space available (a wide
   sheet, or a tall one for phones), adds the control strip, lets
   the reader inspect any part (hover, tap, or arrow keys) with a
   numbered balloon like a parts drawing, keeps cross-references in
   the text in sync, and only runs mechanisms that are on screen.

   A figure's mechanism gets a `kit`:
     kit.layout            'wide' | 'tall'
     kit.svg               the drawing
     kit.timeline(opts)    a GSAP timeline the kit plays and pauses
     kit.tick(fn)          fn(dt) every frame while running
     kit.after(s, fn)      a delayed call that pauses with the figure
     kit.status(text)      what the mechanism is doing right now
     kit.button / stepper / select / segment / chip   controls
     kit.manual()          true while the reader is driving it
     kit.interact()        call when the reader takes over
   ============================================================ */

window.FigKit = (function () {
  const G = window.gsap;
  const D = window.DATA;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const MANUAL_FOR = 9;                     // seconds the reader keeps control after touching it
  const live = [];

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Greek letters only exist in STIX Two Text's subset
  const greek = (s) => esc(s).replace(/ρ/g, '<span class="gr">ρ</span>');
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const notesFor = (id) => (D.figures && D.figures[id]) || {};

  /* ---------- one figure ---------- */
  class Fig {
    constructor(el, width) {
      this.el = el;
      this.width0 = width;
      this.id = el.dataset.fig;
      this.spec = window.Figures.get(this.id);
      this.plate = el.querySelector('.fig-plate');
      this.notes = { ...notesFor(this.id), ...(this.spec.notes ? this.spec.notes() : {}) };
      this.keys = Object.keys(this.notes);
      this.layout = null;
      this.visible = false;
      this.drawn = false;
      this.userPaused = calm;               // reduced motion: start still, the reader can press play
      this.running = false;
      this.inspected = null;
      this.pinned = false;
      this.lastTouch = -1e9;
      this.build();
      this.mount(this.pick());
      this.observe();
    }

    /* the plate: stage for the drawing, a readout line, a control strip */
    build() {
      const p = this.plate;
      p.innerHTML = '';
      p.classList.remove('is-pending');
      this.stage = h('div', 'fig-stage');
      this.stage.tabIndex = 0;
      this.stage.setAttribute('role', 'group');
      this.read = h('p', 'fig-read');
      this.bar = h('div', 'fig-bar');
      this.own = h('div', 'fig-ctl');
      this.play = h('button', 'fk-btn fk-play');
      this.play.type = 'button';
      this.play.innerHTML = '<span class="fk-pp" aria-hidden="true"></span><span class="fk-pl"></span>';
      this.play.addEventListener('click', () => this.setPaused(!this.userPaused, true));
      const hint = h('span', 'fig-hint', this.keys.length ? (fine ? 'Hover a part to inspect it' : 'Tap a part to inspect it') : '');
      if (this.spec.compact) {
        // quant cards: no strip; a corner pause button if it moves, and a readout only while inspecting
        this.el.classList.add('fig-compact');
        if (!this.spec.still) { this.play.classList.add('fk-corner'); p.append(this.stage, this.read, this.play); }
        else p.append(this.stage, this.read);
      } else {
        if (this.spec.still) this.play.hidden = true;
        this.bar.append(this.play, this.own, hint);
        p.append(this.stage, this.read, this.bar);
      }
      this.paintPlay();

      // inspecting: mouse hover, a tap, or the arrow keys. Leaving a part waits a beat,
      // so sliding across the gap between two parts does not flash the readout
      let out = 0;
      this.stage.addEventListener('pointerover', (e) => {
        if (e.pointerType !== 'mouse' || this.pinned) return;
        const k = this.partAt(e.target);
        clearTimeout(out);
        if (k) this.inspect(k);
        else if (this.inspected) out = setTimeout(() => { if (!this.pinned) this.inspect(null); }, 140);
      });
      this.stage.addEventListener('pointerleave', (e) => {
        if (e.pointerType !== 'mouse' || this.pinned) return;
        clearTimeout(out);
        out = setTimeout(() => { if (!this.pinned) this.inspect(null); }, 140);
      });
      this.stage.addEventListener('click', (e) => {
        const k = this.partAt(e.target);
        if (k && this.spec.activate && this.spec.activate(k, this.kit) === true) return;   // the part did something
        if (!k) { if (this.pinned || this.inspected) { this.pinned = false; this.inspect(null); } return; }
        if (this.pinned && this.inspected === k) { this.pinned = false; this.inspect(null); return; }
        this.pinned = true;
        this.inspect(k);
      });
      this.stage.addEventListener('keydown', (e) => {
        const keys = this.present();
        if (!keys.length) return;
        const i = keys.indexOf(this.inspected);
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); this.pinned = true; this.inspect(keys[(i + 1) % keys.length]); }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); this.pinned = true; this.inspect(keys[(i - 1 + keys.length) % keys.length]); }
        else if (e.key === 'Escape') { this.pinned = false; this.inspect(null); }
        else if ((e.key === 'Enter' || e.key === ' ') && this.inspected && this.spec.activate) {
          if (this.spec.activate(this.inspected, this.kit) === true) e.preventDefault();
        }
      });
      this.stage.addEventListener('blur', () => { if (this.pinned) { this.pinned = false; this.inspect(null); } });
    }

    // the parts in the drawing as it is now (a view switch can change them)
    present() { return this.keys.filter((k) => this.svg && this.svg.querySelector(`[data-part="${k}"]`)); }

    partAt(t) {
      const g = t && t.closest && t.closest('[data-part]');
      return g && this.stage.contains(g) ? g.getAttribute('data-part') : null;
    }

    pick() {
      const w = this.width0 != null ? this.width0 : (this.plate.clientWidth || this.el.clientWidth);
      this.width0 = null;
      return this.spec.tall && w < (this.spec.tallBelow || 540) ? 'tall' : 'wide';
    }

    /* draw the figure for a layout and start its mechanism */
    mount(layout) {
      this.unmount();
      this.layout = layout;
      this.stage.innerHTML = this.spec.svg(layout);
      this.svg = this.stage.querySelector('svg');
      this.svg.setAttribute('data-l', layout);
      this.stage.setAttribute('aria-label', `${this.spec.label}. Interactive figure${this.keys.length ? ': use the arrow keys to inspect its parts' : ''}.`);
      this.own.innerHTML = '';
      this.balloon = null;
      this.statusText = '';
      this.inspected = null; this.pinned = false;

      const fig = this;
      const tls = [], ticks = [], calls = [], offs = [];
      this.tls = tls; this.ticks = ticks; this.calls = calls; this.offs = offs;
      this.kit = {
        layout, svg: this.svg, el: this.el, calm,
        $: (s) => fig.svg.querySelector(s),
        $$: (s) => [...fig.svg.querySelectorAll(s)],
        timeline(opts = {}) {
          // finished one-shot timelines drop out of the list, so long sessions do not pile them up
          // never play it here: it is still empty, and an empty timeline completes on the spot.
          // Unpaused, GSAP starts it on the next tick, once the caller has filled it.
          const done = opts.onComplete;
          const tl = G.timeline({ ...opts, paused: !fig.running, onComplete() {
            if (!tl.repeat()) { const i = tls.indexOf(tl); if (i >= 0) tls.splice(i, 1); }
            done && done.apply(this, arguments);
          } });
          tls.push(tl);
          // a killed timeline leaves the list too
          const kill = tl.kill.bind(tl);
          tl.kill = (...a) => { const i = tls.indexOf(tl); if (i >= 0) tls.splice(i, 1); return kill(...a); };
          return tl;
        },
        tick(fn) { ticks.push(fn); },
        after(s, fn) {
          const c = G.delayedCall(s, () => { const i = calls.indexOf(c); if (i >= 0) calls.splice(i, 1); fn(); });
          calls.push(c);
          if (!fig.running) c.pause();
          return c;
        },
        status(t) { fig.statusText = t; if (!fig.inspected) fig.paintRead(); },
        // touching a control hands the figure to the reader and wakes it if it was paused
        // (not under reduced motion: those readers start it themselves with Play)
        interact() { fig.lastTouch = performance.now(); if (fig.userPaused && !calm) fig.setPaused(false); },
        manual() { return performance.now() - fig.lastTouch < MANUAL_FOR * 1000; },
        running: () => fig.running,
        on(target, type, fn, o) { target.addEventListener(type, fn, o); offs.push(() => target.removeEventListener(type, fn, o)); },
        button: (label, fn, o) => fig.button(label, fn, o),
        stepper: (label, o) => fig.stepper(label, o),
        select: (label, opts, value, fn) => fig.select(label, opts, value, fn),
        segment: (opts, value, fn, o) => fig.segment(opts, value, fn, o),
        chip: (label) => fig.chip(label),
        inspect: (k) => fig.inspect(k),
        // after a figure swaps parts of its drawing (a view switch), drop any stale balloon
        redrawn() { fig.inspected = null; fig.pinned = false; if (fig.balloon) { fig.balloon.remove(); fig.balloon = null; } fig.svg.classList.remove('is-inspecting'); fig.paintRead(); },
      };
      this.handle = (this.spec.mount && G ? this.spec.mount(this.kit) : null) || {};
      if (calm || !G) {
        // reduced motion: no draw-in; the mechanism shows a representative still until played
        this.drawn = true;
        this.handle.still && this.handle.still();
      } else if (!this.drawn) {
        // until the reader reaches it the drawing waits blank, then draws itself
        this.drawing = false;
        this.hideForDraw();
        if (this.visible) this.drawIn();
      }
      this.paintRead();
      this.sync();
    }

    unmount() {
      if (!this.kit) return;
      this.tls.forEach((t) => t.kill());
      this.calls.forEach((c) => c.kill());
      this.offs.forEach((off) => off());
      this.handle && this.handle.destroy && this.handle.destroy();
      if (this.drawTl) { this.drawTl.kill(); this.drawTl = null; }
      this.kit = null;
    }

    /* ---------- running ---------- */
    sync() {
      const run = this.visible && this.drawn && !this.userPaused && !document.hidden;
      if (run === this.running) return;
      this.running = run;
      if (run) { this.tls.forEach((t) => t.play()); this.calls.forEach((c) => c.resume()); this.handle.play && this.handle.play(); }
      else { this.tls.forEach((t) => t.pause()); this.calls.forEach((c) => c.pause()); this.handle.pause && this.handle.pause(); }
      this.el.classList.toggle('is-running', run);
    }
    setPaused(p, byUser) {
      this.userPaused = p;
      if (byUser) this.lastTouch = performance.now();
      this.paintPlay();
      this.sync();
    }
    paintPlay() {
      this.play.classList.toggle('is-paused', this.userPaused);
      this.play.querySelector('.fk-pl').textContent = this.userPaused ? 'Play' : 'Pause';
      this.play.setAttribute('aria-label', (this.userPaused ? 'Play' : 'Pause') + ' the animation in this figure');
    }
    tick(dt) { if (this.running) for (const f of this.ticks) f(dt); }

    observe() {
      const io = new IntersectionObserver((es) => {
        const e = es[es.length - 1];
        this.visible = e.isIntersecting;
        if (this.visible && !this.drawn && !this.drawing) this.drawIn();
        this.sync();
      }, { threshold: 0.18 });
      io.observe(this.plate);
      // choose the drawing again whenever the plate changes width enough to matter
      let last = this.plate.clientWidth;
      new ResizeObserver(() => {
        const w = this.plate.clientWidth;
        if (Math.abs(w - last) < 2) return;
        last = w;
        const l = this.pick();
        if (l !== this.layout) {
          this.mount(l);
          if (this.drawn) this.showDrawn();
          this.running = false; this.sync();
        }
      }).observe(this.plate);
    }

    /* ---------- the first look: lines draw, labels settle ---------- */
    // until it is drawn, a class keeps the figure blank (CSS does it, so nothing is measured at boot)
    hideForDraw() { this.svg.classList.add('is-pre'); }
    showDrawn() {
      const d = this.svg ? this.svg.querySelectorAll('.f-draw') : [];
      if (d.length) G.set(d, { clearProps: 'strokeDasharray,strokeDashoffset' });
    }
    drawIn() {
      if (calm || !G) { this.drawn = true; this.sync(); return; }
      this.drawing = true;
      const s = this.svg;
      // dashed strokes keep their dash pattern, so they fade in rather than draw
      const strokes = [...s.querySelectorAll('.f-draw:not(.f-dash)')];
      const soft = [...s.querySelectorAll('text, .f-dash, .f-soft, .f-qr, .f-bit, .f-cell, .f-rule, .f-slot, .f-dot, .f-junction, .f-road, .f-pt, .f-ci, .f-head, .f-ship, .f-tier, .f-bar, .f-mark, .f-chip, .f-packet')]
        .filter((e) => !strokes.includes(e) && !e.closest('[data-nodraw]'));
      if (window.DrawSVGPlugin && strokes.length) G.set(strokes, { drawSVG: '0%' });
      if (soft.length) G.set(soft, { opacity: 0 });
      s.classList.remove('is-pre');
      const tl = this.drawTl = G.timeline({ onComplete: () => {
        this.drawTl = null; this.drawing = false; this.drawn = true;
        this.showDrawn(); if (soft.length) G.set(soft, { clearProps: 'opacity' });
        this.sync();
      } });
      if (window.DrawSVGPlugin && strokes.length) {
        tl.to(strokes, { drawSVG: '100%', duration: 1.1, ease: 'power2.inOut', stagger: { each: Math.min(0.03, 0.9 / strokes.length) } }, 0);
      }
      if (soft.length) tl.to(soft, { opacity: 1, duration: 0.55, ease: 'power1.out', stagger: { each: Math.min(0.012, 0.8 / Math.max(1, soft.length)) } }, 0.3);
      else tl.to({}, { duration: 0.3 });
    }

    /* ---------- inspecting ---------- */
    inspect(k) {
      if (k && !this.notes[k]) k = null;
      if (k === this.inspected) return;
      this.inspected = k;
      const s = this.svg;
      s.classList.toggle('is-inspecting', !!k);
      s.querySelectorAll('.is-hl').forEach((e) => e.classList.remove('is-hl'));
      if (this.balloon) { this.balloon.remove(); this.balloon = null; }
      document.querySelectorAll(`.xref[data-fig="${this.id}"]`).forEach((x) => x.classList.toggle('is-on', !!k && x.dataset.part === k));
      if (k) {
        s.querySelectorAll(`[data-part="${k}"], [data-rel~="${k}"]`).forEach((e) => e.classList.add('is-hl'));
        this.drawBalloon(k);
        this.read.setAttribute('aria-live', 'polite');
      } else this.read.removeAttribute('aria-live');
      this.paintRead();
    }

    paintRead() {
      const k = this.inspected;
      if (k) {
        const [name, note] = this.notes[k];
        this.read.innerHTML = `<span class="fr-n">${this.present().indexOf(k) + 1}</span><b>${greek(name)}</b><span class="fr-t">${greek(note)}</span>`;
        this.read.classList.add('is-part');
      } else {
        this.read.classList.remove('is-part');
        this.read.innerHTML = this.statusText ? `<span class="fr-live" aria-hidden="true"></span><span class="fr-t">${greek(this.statusText)}</span>` : '&nbsp;';
      }
    }

    // a numbered balloon on a leader line, off the part's top corner
    drawBalloon(k) {
      const s = this.svg, el = s.querySelector(`[data-part="${k}"]`);
      if (!el) return;
      const vb = s.viewBox.baseVal;
      let b;
      try {
        const bb = el.getBBox();
        const m = s.getScreenCTM().inverse().multiply(el.getScreenCTM());
        const pt = (x, y) => { const p = s.createSVGPoint(); p.x = x; p.y = y; return p.matrixTransform(m); };
        const a = pt(bb.x, bb.y), c = pt(bb.x + bb.width, bb.y + bb.height);
        b = { x: Math.min(a.x, c.x), y: Math.min(a.y, c.y), w: Math.abs(c.x - a.x), h: Math.abs(c.y - a.y) };
      } catch (e) { return; }
      const r = this.layout === 'tall' ? 12 : 11;
      const right = b.x + b.w + 30 + r < vb.width;
      const ax = right ? b.x + b.w : b.x, ay = b.y;
      let bx = right ? ax + 22 : ax - 22, by = ay - 20;
      if (by - r < 2) by = Math.min(vb.height - r - 2, b.y + b.h + 20);
      bx = Math.max(r + 2, Math.min(vb.width - r - 2, bx));
      const n = this.present().indexOf(k) + 1;
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'f-balloon');
      g.setAttribute('aria-hidden', 'true');
      const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
      g.innerHTML = `<line class="fb-line" x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${(bx - dx / len * r).toFixed(1)}" y2="${(by - dy / len * r).toFixed(1)}"/>` +
        `<circle class="fb-dot" cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="2.2"/>` +
        `<g class="fb-head" transform="translate(${bx.toFixed(1)} ${by.toFixed(1)})"><circle r="${r}"/><text y="${(r * 0.36).toFixed(1)}" text-anchor="middle">${n}</text></g>`;
      s.appendChild(g);
      this.balloon = g;
      if (!calm && G) {
        G.fromTo(g.querySelector('.fb-line'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.18, ease: 'power2.out' });
        G.fromTo(g.querySelector('.fb-head'), { scale: 0.4, opacity: 0, svgOrigin: `${bx} ${by}` }, { scale: 1, opacity: 1, duration: 0.22, ease: 'back.out(2.2)', delay: 0.08 });
      }
    }

    /* ---------- controls ---------- */
    wrap(node) { this.own.appendChild(node); return node; }
    button(label, fn, o = {}) {
      const b = h('button', 'fk-btn' + (o.cls ? ' ' + o.cls : ''), `${o.icon ? `<span class="fk-ico" aria-hidden="true">${o.icon}</span>` : ''}<span class="fk-bl">${esc(label)}</span>`);
      b.type = 'button';
      if (o.title) b.title = o.title;
      if (o.aria) b.setAttribute('aria-label', `${label}: ${o.aria}`);
      b.addEventListener('click', () => { this.kit.interact(); fn(b); });
      b.setLabel = (t) => { b.querySelector('.fk-bl').textContent = t; };
      return this.wrap(b);
    }
    chip(label) {
      const c = h('span', 'fk-chip', `<span class="fk-ck">${esc(label)}</span><b>0</b>`);
      c.set = (v) => { c.querySelector('b').textContent = v; };
      return this.wrap(c);
    }
    // a value you can step with buttons, the arrow keys, or by dragging it sideways
    stepper(label, o) {
      const w = h('span', 'fk-step');
      const fmt = o.format || String;
      w.innerHTML = `<span class="fk-sl">${esc(label)}</span><button type="button" class="fk-sb" aria-label="Decrease ${esc(label)}">−</button>` +
        `<span class="fk-sv" role="spinbutton" tabindex="0" aria-label="${esc(label)}" aria-valuemin="${o.min}" aria-valuemax="${o.max}"></span>` +
        `<button type="button" class="fk-sb" aria-label="Increase ${esc(label)}">+</button>`;
      const [dec, val, inc] = [w.children[1], w.children[2], w.children[3]];
      let v = o.value;
      const set = (nv, fire = true) => {
        nv = Math.max(o.min, Math.min(o.max, Math.round(nv)));
        if (nv === v && fire) return;
        v = nv;
        val.textContent = fmt(v);
        val.setAttribute('aria-valuenow', v);
        val.setAttribute('aria-valuetext', fmt(v));
        if (fire) { this.kit.interact(); o.onChange(v); }
      };
      const step = o.step || 1;
      dec.addEventListener('click', () => set(v - step));
      inc.addEventListener('click', () => set(v + step));
      val.addEventListener('keydown', (e) => {
        const big = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); set(v + step * big); }
        if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); set(v - step * big); }
      });
      // drag sideways to scrub the value (a scrubbable number)
      let x0 = 0, v0 = 0, drag = false;
      val.addEventListener('pointerdown', (e) => { drag = true; x0 = e.clientX; v0 = v; val.setPointerCapture(e.pointerId); val.classList.add('is-drag'); });
      val.addEventListener('pointermove', (e) => { if (drag) set(v0 + Math.round((e.clientX - x0) / (o.px || 6)) * step); });
      const end = () => { drag = false; val.classList.remove('is-drag'); };
      val.addEventListener('pointerup', end); val.addEventListener('pointercancel', end);
      set(v, false);
      w.set = (nv) => set(nv, false);
      w.get = () => v;
      return this.wrap(w);
    }
    select(label, opts, value, fn) {
      const w = h('label', 'fk-sel', `<span class="fk-sl">${esc(label)}</span>`);
      const s = h('select');
      opts.forEach(([v, t]) => { const op = h('option', null, esc(t)); op.value = v; s.appendChild(op); });
      s.value = value;
      s.addEventListener('change', () => { this.kit.interact(); fn(s.value); });
      w.appendChild(s);
      w.set = (v) => { s.value = v; };
      return this.wrap(w);
    }
    segment(opts, value, fn, o = {}) {
      const w = h('span', 'fk-seg');
      w.setAttribute('role', 'group');
      if (o.label) w.setAttribute('aria-label', o.label);
      const btns = opts.map(([v, t]) => {
        const b = h('button', 'fk-sg', greek(t));
        b.type = 'button'; b.dataset.v = v;
        b.addEventListener('click', () => { this.kit.interact(); paint(v); fn(v); });
        w.appendChild(b);
        return b;
      });
      const paint = (v) => btns.forEach((b) => { const on = b.dataset.v === String(v); b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
      paint(value);
      w.set = paint;
      return this.wrap(w);
    }
  }

  /* ---------- cross-references: words in the text that point at a part ---------- */
  function xrefs() {
    document.addEventListener('pointerover', (e) => {
      const x = e.target.closest && e.target.closest('.xref');
      if (!x || e.pointerType !== 'mouse') return;
      const f = byId(x.dataset.fig);
      if (f && !f.pinned) f.inspect(x.dataset.part);
    });
    document.addEventListener('pointerout', (e) => {
      const x = e.target.closest && e.target.closest('.xref');
      if (!x || e.pointerType !== 'mouse' || (e.relatedTarget && x.contains(e.relatedTarget))) return;
      const f = byId(x.dataset.fig);
      if (f && !f.pinned) f.inspect(null);
    });
    document.addEventListener('focusin', (e) => {
      const x = e.target.closest && e.target.closest('.xref');
      if (!x) return;
      const f = byId(x.dataset.fig);
      if (f) f.inspect(x.dataset.part);
    });
    document.addEventListener('focusout', (e) => {
      const x = e.target.closest && e.target.closest('.xref');
      if (!x) return;
      const f = byId(x.dataset.fig);
      if (f && !f.pinned) f.inspect(null);
    });
    document.addEventListener('click', (e) => {
      const x = e.target.closest && e.target.closest('.xref');
      if (!x) return;
      e.preventDefault();
      e.stopPropagation();
      const f = byId(x.dataset.fig);
      if (!f) return;
      // bring the drawing into view when it is not, then point at the part
      const r = f.plate.getBoundingClientRect();
      const offscreen = r.top < 70 || r.bottom > innerHeight;
      if (offscreen && window.__scrollTo) {
        const y = scrollY + r.top - Math.max(80, (innerHeight - r.height) / 2);
        window.__scrollTo(Math.max(0, y));
      }
      f.pinned = true;
      f.inspect(null);
      f.inspect(x.dataset.part);
    }, true);
  }

  const byId = (id) => live.find((f) => f.id === id);

  /* ---------- public ---------- */
  // give the browser a turn: paint, input, the intro's next frame
  const breathe = () => new Promise((r) => (window.scheduler && scheduler.yield ? scheduler.yield().then(r) : setTimeout(r, 0)));

  // resolves once every figure is mounted. Widths are read first, in one layout; then each
  // figure is built in its own task, so a dozen of them never block the page in one go
  async function init() {
    if (!window.Figures) return;
    const els = [...document.querySelectorAll('.fig[data-fig]')].filter((el) => window.Figures.get(el.dataset.fig));
    const widths = els.map((el) => (el.querySelector('.fig-plate') || el).clientWidth);
    if (G) G.ticker.add((t, dt) => { const s = Math.min(0.05, dt / 1000); for (const f of live) f.tick(s); });
    document.addEventListener('visibilitychange', () => live.forEach((f) => f.sync()));
    xrefs();
    for (let i = 0; i < els.length; i++) {
      try { live.push(new Fig(els[i], widths[i])); } catch (err) { console.warn('[figkit]', els[i].dataset.fig, err); }
      await breathe();
    }
  }

  return { init, get: byId, all: () => live };
})();
