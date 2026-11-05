/* ============================================================
   FIGURES: one working drawing per project, as inline SVG.

   Every figure draws a mechanism the project really has, in two
   layouts: `wide` for sheets and `tall` for phones (no sideways
   scrolling, no shrunken labels). Numbers are the real ones from
   data.js; where a drawing can only be schematic it says so.

   Each entry:
     label        what the figure shows, for screen readers
     tall         true when there is a phone layout
     svg(L)       markup for layout L ('wide' | 'tall')
     mount(kit)   runs the mechanism and adds its controls (see
                  figkit.js); returns { still, play, pause, destroy }
     activate(k)  optional: what clicking part k does

   The words for each part (the inspect readout) live in data.js
   under `figures`, so all copy stays in one file.
   ============================================================ */

window.Figures = (function () {
  const D = window.DATA;
  const G = () => window.gsap;

  /* ---------- tiny SVG vocabulary ---------- */
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const f = (n) => +(+n).toFixed(2);
  const rect = (x, y, w, h, cls = 'f-box', extra = '') =>
    `<rect class="${cls}" x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" ${extra}/>`;
  // Greek is only in STIX Two Text's subset, so route it there
  const text = (x, y, s, cls = 'f-label', anchor = 'start', extra = '') =>
    `<text class="${cls}" x="${f(x)}" y="${f(y)}" text-anchor="${anchor}" ${extra}>${esc(s).replace(/[\u0370-\u03ff]/g, (c) => `<tspan class="f-greek">${c}</tspan>`)}</text>`;
  const line = (x1, y1, x2, y2, cls = 'f-line', extra = '') =>
    `<line class="${cls}" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" ${extra}/>`;
  const path = (d, cls = 'f-line', extra = '') => `<path class="${cls}" d="${d}" ${extra}/>`;
  const circle = (cx, cy, r, cls = 'f-dot', extra = '') =>
    `<circle class="${cls}" cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" ${extra}/>`;
  const check = (cx, cy, cls = 'f-check') => path(`M${f(cx - 4.5)},${f(cy)} l3.4,3.4 l6,-7`, cls);
  const part = (key, inner, cls = '') => `<g class="f-part ${cls}" data-part="${key}">${inner}</g>`;

  // a labelled block: title centred, optional mono sub-label beneath
  function node(x, y, w, h, title, sub, cls = 'f-box', key = '', extra = '') {
    const cy = y + h / 2;
    const inner = rect(x, y, w, h, cls + ' f-draw') +
      (sub
        ? text(x + w / 2, cy - 3, title, 'f-label', 'middle') + text(x + w / 2, cy + 14, sub, 'f-mono', 'middle')
        : text(x + w / 2, cy + 5, title, 'f-label', 'middle'));
    return `<g class="f-node${key ? ' f-part' : ''}"${key ? ` data-part="${key}"` : ''} ${extra}>${inner}</g>`;
  }

  // arrow along a path; marker ids are namespaced per figure
  const arrow = (id, d, cls = 'f-line', rel = '', extra = '') =>
    path(d, cls + ' f-draw', `marker-end="url(#${id}-ah)"${rel ? ` data-rel="${rel}"` : ''} ${extra}`);
  const defs = (id) => `<defs>
      <marker id="${id}-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path class="f-ah" d="M0,1 L9,5 L0,9 z"/></marker>
      <marker id="${id}-ahr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path class="f-ah-red" d="M0,1 L9,5 L0,9 z"/></marker>
    </defs>`;

  const svg = (id, w, h, body, label) =>
    `<svg class="fig-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}" data-fig="${id}">${defs(id)}${body}</svg>`;

  // deterministic noise, so a figure looks the same on every visit
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  const setXY = (el, x, y) => { el.setAttribute('x', f(x)); el.setAttribute('y', f(y)); };
  const cls = (el, c) => el && el.setAttribute('class', c);

  // a dot that runs along a list of paths, one after another
  function courier(kit, dot, speed) {
    let route = [], i = 0, s = 0, len = 0;
    const go = (paths, done) => {
      route = paths.filter(Boolean); i = 0; s = 0;
      len = route.length ? route[0].getTotalLength() : 0;
      dot.style.opacity = route.length ? 1 : 0;
      dot._done = done;
    };
    kit.tick((dt) => {
      if (!route.length) return;
      s += speed * dt;
      while (route.length && s >= len) {
        s -= len; i++;
        if (i >= route.length) { route = []; dot.style.opacity = 0; dot._done && dot._done(); return; }
        len = route[i].getTotalLength();
      }
      const p = route[i].getPointAtLength(s);
      dot.setAttribute('cx', f(p.x)); dot.setAttribute('cy', f(p.y));
    });
    return { go, busy: () => route.length > 0 };
  }

  const REG = {};
  const def = (id, spec) => { REG[id] = spec; };

  /* =========================================================
     1. CareerOS: pipeline, validator, a person at the gate
     ========================================================= */
  const COS = {
    wide: {
      W: 600, H: 400,
      stages: [
        { k: 'openings', x: 12,  w: 78, t: 'Openings', s: 'sources' },
        { k: 'match',    x: 106, w: 78, t: 'Match',    s: 'pgvector' },
        { k: 'tailor',   x: 200, w: 78, t: 'Tailor',   s: 'LLM draft' },
        { k: 'validate', x: 294, w: 90, t: 'Validate', s: 'vs. profile', red: true },
        { k: 'approve',  x: 400, w: 78, t: 'Approve',  s: 'a person' },
        { k: 'send',     x: 512, w: 76, t: 'Send',     s: 'external' },
      ],
      Y: 52, SH: 56,
    },
    tall: {
      W: 360, H: 690,
      stages: [
        { k: 'openings', y: 44,  t: 'Openings', s: 'sources' },
        { k: 'match',    y: 102, t: 'Match',    s: 'pgvector' },
        { k: 'tailor',   y: 160, t: 'Tailor',   s: 'LLM draft' },
        { k: 'validate', y: 218, t: 'Validate', s: 'vs. profile', red: true },
        { k: 'approve',  y: 276, t: 'Approve',  s: 'a person' },
        { k: 'send',     y: 352, t: 'Send',     s: 'external' },
      ],
      X: 24, SW: 172, SH: 42,
    },
  };

  def('careeros', {
    label: 'CareerOS pipeline: openings are matched, tailored, validated against the verified profile and approved by a person before anything is sent. Below, the monorepo: web and mobile apps share a typed OpenAPI client in front of a FastAPI service on PostgreSQL with pgvector.',
    tall: true,
    svg(L) {
      const id = 'careeros';
      const C = COS[L];
      let b = '';
      if (L === 'wide') {
        const CY = C.Y + C.SH / 2;
        b += text(14, 30, 'Pipeline', 'f-kicker');
        // applications travel behind the stages, so they show in the gaps between them
        b += '<g class="cos-packets" data-nodraw></g>';
        C.stages.forEach((s) => { b += node(s.x, C.Y, s.w, C.SH, s.t, s.s, s.red ? 'f-box f-box-red' : 'f-box', s.k); });
        for (let i = 0; i < C.stages.length - 1; i++) {
          if (i === 4) continue;                                         // the gate sits in this gap
          const a = C.stages[i], n = C.stages[i + 1];
          b += arrow(id, `M${a.x + a.w + 2},${CY} L${n.x - 3},${CY}`, 'f-line', `${a.k} ${n.k}`);
        }
        b += path(`M339,${C.Y + C.SH} L339,146`, 'f-line f-red f-draw f-dash', `marker-end="url(#${id}-ahr)" data-rel="validate tray"`);
        b += part('tray', rect(297, 150, 84, 34, 'f-box f-tray f-draw f-dash') + text(339, 204, 'rejected', 'f-mono f-red-text', 'middle'));
        b += text(287, 172, 'unsupported claim', 'f-note', 'end');
        b += text(550, 128, 'sent 0', 'f-mono cos-sent', 'middle');
        b += text(339, 222, '0', 'f-mono f-red-text cos-rej', 'middle');
        // the gate: a bar across the gap into Send, hinged at the top
        b += part('gate', rect(486, CY - 26, 18, 48, 'f-hit') + rect(490, CY - 25, 10, 6, 'f-post') + line(495, CY - 19, 495, CY + 19, 'f-gate cos-gate'));
        b += text(439, 128, 'waits for sign-off', 'f-note cos-wait', 'middle');
        b += `<g class="cos-badge" opacity="0">${circle(474, C.Y + 2, 9, 'f-badge')}${text(474, C.Y + 6.5, '0', 'f-badge-t', 'middle')}</g>`;

        // monorepo
        const MY = 242;
        b += text(14, MY - 12, 'Monorepo', 'f-kicker');
        b += rect(8, MY, 584, 150, 'f-frame f-draw f-dash');
        b += node(24, MY + 16, 118, 42, 'Next.js', 'web', 'f-box', 'web');
        b += node(24, MY + 76, 118, 42, 'Expo', 'mobile', 'f-box', 'mobile');
        b += node(178, MY + 44, 132, 46, 'OpenAPI client', 'typed, shared', 'f-box f-box-soft', 'client');
        b += node(344, MY + 44, 112, 46, 'FastAPI', 'SQLAlchemy', 'f-box', 'api');
        b += node(484, MY + 44, 96, 46, 'PostgreSQL', 'pgvector', 'f-box', 'db');
        b += arrow(id, `M142,${MY + 37} C160,${MY + 37} 158,${MY + 62} 176,${MY + 64}`, 'f-line cos-p0', 'web client');
        b += arrow(id, `M142,${MY + 97} C160,${MY + 97} 158,${MY + 72} 176,${MY + 70}`, 'f-line cos-p1', 'mobile client');
        b += arrow(id, `M310,${MY + 67} L342,${MY + 67}`, 'f-line cos-p2', 'client api');
        b += arrow(id, `M456,${MY + 67} L482,${MY + 67}`, 'f-line cos-p3', 'api db');
        b += part('vm', text(584, MY + 138, 'pnpm workspace · Google Cloud VM', 'f-mono', 'end'));
        b += circle(-20, -20, 4, 'f-pulse cos-pulse', 'style="opacity:0"');
      } else {
        const CX = C.X + C.SW / 2;
        b += text(14, 28, 'Pipeline', 'f-kicker');
        b += '<g class="cos-packets" data-nodraw></g>';
        C.stages.forEach((s) => { b += node(C.X, s.y, C.SW, C.SH, s.t, s.s, s.red ? 'f-box f-box-red' : 'f-box', s.k); });
        for (let i = 0; i < C.stages.length - 1; i++) {
          if (i === 4) continue;
          const a = C.stages[i], n = C.stages[i + 1];
          b += arrow(id, `M${CX},${a.y + C.SH + 2} L${CX},${n.y - 3}`, 'f-line', `${a.k} ${n.k}`);
        }
        const VY = C.stages[3].y + C.SH / 2;
        b += path(`M${C.X + C.SW},${VY} L226,${VY}`, 'f-line f-red f-draw f-dash', `marker-end="url(#${id}-ahr)" data-rel="validate tray"`);
        b += part('tray', rect(230, VY - 17, 112, 34, 'f-box f-tray f-draw f-dash') + text(286, VY + 36, 'rejected', 'f-mono f-red-text', 'middle'));
        b += text(286, VY - 26, 'unsupported claim', 'f-note', 'middle');
        b += text(286, VY + 54, '0', 'f-mono f-red-text cos-rej', 'middle');
        const GY = 336;
        b += part('gate', rect(CX - 30, GY - 9, 54, 18, 'f-hit') + rect(CX - 27, GY - 5, 6, 10, 'f-post') + line(CX - 20, GY, CX + 20, GY, 'f-gate cos-gate'));
        b += text(CX + 30, GY + 5, 'waits for sign-off', 'f-note cos-wait');
        b += text(C.X + C.SW + 12, C.stages[5].y + 27, 'sent 0', 'f-mono cos-sent');
        b += `<g class="cos-badge" opacity="0">${circle(C.X + C.SW - 2, C.stages[4].y + 2, 10, 'f-badge')}${text(C.X + C.SW - 2, C.stages[4].y + 7, '0', 'f-badge-t', 'middle')}</g>`;

        const MY = 438;
        b += text(14, MY - 12, 'Monorepo', 'f-kicker');
        b += rect(8, MY, 344, 240, 'f-frame f-draw f-dash');
        b += node(22, MY + 16, 150, 44, 'Next.js', 'web', 'f-box', 'web');
        b += node(188, MY + 16, 150, 44, 'Expo', 'mobile', 'f-box', 'mobile');
        b += node(84, MY + 86, 192, 46, 'OpenAPI client', 'typed, shared', 'f-box f-box-soft', 'client');
        b += node(22, MY + 158, 150, 46, 'FastAPI', 'SQLAlchemy', 'f-box', 'api');
        b += node(188, MY + 158, 150, 46, 'PostgreSQL', 'pgvector', 'f-box', 'db');
        b += arrow(id, `M97,${MY + 60} C97,${MY + 74} 140,${MY + 72} 146,${MY + 84}`, 'f-line cos-p0', 'web client');
        b += arrow(id, `M263,${MY + 60} C263,${MY + 74} 220,${MY + 72} 214,${MY + 84}`, 'f-line cos-p1', 'mobile client');
        b += arrow(id, `M150,${MY + 132} C150,${MY + 146} 100,${MY + 142} 98,${MY + 156}`, 'f-line cos-p2', 'client api');
        b += arrow(id, `M172,${MY + 181} L186,${MY + 181}`, 'f-line cos-p3', 'api db');
        b += part('vm', text(338, MY + 228, 'pnpm workspace · Google Cloud VM', 'f-mono', 'end'));
        b += circle(-20, -20, 4, 'f-pulse cos-pulse', 'style="opacity:0"');
      }
      return svg(id, COS[L].W, COS[L].H, b, this.label);
    },

    mount(kit) {
      const L = kit.layout, C = COS[L], gsap = G();
      const NS = 'http://www.w3.org/2000/svg';
      const wide = L === 'wide';
      const PS = wide ? 10 : 11;                                 // packet size
      // the track: distance along the pipeline -> point
      const CY = wide ? C.Y + C.SH / 2 : 0, CX = wide ? 0 : C.X + C.SW / 2;
      const T = wide
        ? { start: 30, validate: 339, wait: 484, send: 550, at: (s) => [s, CY], speed: 112 }
        : { start: 60, validate: 239, wait: 325, send: 373, at: (s) => [CX, s], speed: 92 };
      const layer = kit.$('.cos-packets');
      const gate = kit.$('.cos-gate');
      const badge = kit.$('.cos-badge'), badgeT = badge.querySelector('text');
      const sentT = kit.$('.cos-sent'), rejT = kit.$('.cos-rej'), waitT = kit.$('.cos-wait');
      const approve = kit.$('[data-part="approve"]'), sendBox = kit.$('[data-part="send"] rect');
      // the barrier folds into its post: up in the wide drawing, sideways in the tall one
      const hinge = wide ? `495 ${CY - 19}` : `${CX - 20} 336`;
      const shut = wide ? { scaleY: 1 } : { scaleX: 1 }, open = wide ? { scaleY: 0 } : { scaleX: 0 };
      let packets = [], sent = 0, rejected = 0, inTray = [], fate = 0, spawnIn = 0.6, signIn = -1, gateOpen = false;
      const PATTERN = [0, 0, 1, 0];                              // one in four makes a claim it cannot back up

      const place = (p) => { const [x, y] = T.at(p.s); setXY(p.el, x - PS / 2, y - PS / 2); };
      function spawn(bad) {
        if (packets.filter((p) => p.state !== 'tray').length >= 5) return false;
        const el = document.createElementNS(NS, 'rect');
        el.setAttribute('width', PS); el.setAttribute('height', PS);
        cls(el, 'f-packet');
        layer.appendChild(el);
        const p = { el, s: T.start, state: 'run', bad: bad == null ? !!PATTERN[fate++ % PATTERN.length] : bad };
        place(p);
        packets.push(p);
        kit.status('A new opening is matched against the verified profile');
        return true;
      }
      const waiting = () => packets.filter((p) => p.state === 'wait');
      // everything past the validator that has not been signed off yet
      const pending = () => packets.filter((p) => p.state === 'wait' || (p.state === 'run' && !p.bad && p.s > T.validate + 1));
      const flash = (el) => { el.classList.add('is-flash'); kit.after(0.4, () => el.classList.remove('is-flash')); };
      function paintWait() {
        const n = pending().length;
        badge.setAttribute('opacity', n ? 1 : 0);
        badgeT.textContent = n;
        approve.classList.toggle('is-waiting', n > 0);
        waitT.textContent = n ? `${n} waiting for sign-off` : 'waits for sign-off';
        const unsigned = pending().filter((q) => !q.approved).length;
        if (signBtn) { signBtn.setLabel(unsigned ? `Sign off (${unsigned})` : 'Sign off'); signBtn.disabled = !unsigned; }
      }
      // signing off releases the application nearest the gate; one still on its way goes straight through
      function signOff() {
        const p = pending().filter((q) => !q.approved).sort((a, b) => b.s - a.s)[0];
        if (!p) return false;
        p.approved = true;
        if (p.state === 'wait') release(p);
        else kit.status('Signed off early: it will go straight through the gate');
        paintWait();
        return true;
      }
      function release(p) {
        p.state = 'pass';
        if (!gateOpen) { gateOpen = true; gsap.to(gate, { ...open, svgOrigin: hinge, duration: 0.24, ease: 'power2.out' }); }
        kit.status('Signed off by a person, so it can leave the system');
      }
      function closeGate() { if (gateOpen) { gateOpen = false; gsap.to(gate, { ...shut, svgOrigin: hinge, duration: 0.3, ease: 'power2.in' }); } }
      const slot = (i) => wide ? [303 + i * 15, 162] : [238 + i * 19, 239 - PS / 2];
      function toTray(p, instant) {
        p.state = 'tray';
        cls(p.el, 'f-packet is-bad');
        rejected++; rejT.textContent = rejected;
        inTray.push(p);
        if (inTray.length > 5) { const old = inTray.shift(); gsap.to(old.el, { opacity: 0, duration: 0.3, onComplete: () => old.el.remove() }); packets = packets.filter((q) => q !== old); }
        inTray.forEach((q, i) => {
          const [x, y] = slot(i);
          if (instant) setXY(q.el, x, y);
          // in the wide drawing it drops into the tray; in the tall one it slides across to it
          else gsap.to(q.el, { attr: { x, y }, duration: q === p ? 0.6 : 0.3, ease: q === p ? (wide ? 'bounce.out' : 'power3.out') : 'power2.out' });
        });
        kit.status('Validator: a claim the profile cannot back up, so it is rejected');
      }

      kit.tick((dt) => {
        // autoplay feeds the pipeline and signs off; once the reader takes over, both wait for them
        const manual = kit.manual();
        if (!manual) {
          spawnIn -= dt;
          if (spawnIn <= 0) { spawn(); spawnIn = 2.3; }
          if (waiting().some((q) => !q.approved) && signIn < 0) signIn = 1.1;
          if (signIn >= 0) { signIn -= dt; if (signIn < 0) signOff(); }
        } else signIn = -1;

        const order = packets.filter((p) => p.state === 'run' || p.state === 'wait' || p.state === 'pass').sort((a, b) => b.s - a.s);
        let changed = false;
        order.forEach((p, i) => {
          const ahead = order[i - 1];
          if (p.state === 'run') {
            let goal = p.bad ? T.validate : T.wait;
            if (ahead) goal = Math.min(goal, ahead.s - PS - 5);          // keep a packet's length apart
            p.s = Math.max(p.s, Math.min(goal, p.s + T.speed * dt));
            if (p.bad && p.s >= T.validate) { toTray(p); return; }
            if (!p.bad && p.s > T.validate + 1 && !p.cleared) { p.cleared = true; changed = true; kit.status('Validator: every claim is backed by the profile'); }
            if (!p.bad && p.s >= T.wait - 0.01) {
              changed = true;
              if (p.approved) release(p);
              else {
                p.state = 'wait';
                kit.status(manual ? 'Waiting for you: press Sign off, or click the gate' : 'Waiting at the gate for a person to sign off');
              }
            }
            place(p);
          } else if (p.state === 'pass') {
            p.s = Math.min(T.send, p.s + T.speed * 1.3 * dt);
            place(p);
            if (p.s >= T.send) {
              p.state = 'gone'; p.el.remove(); changed = true;
              sent++; sentT.textContent = `sent ${sent}`;
              flash(sendBox.parentNode);
            }
          }
        });
        // the gate shuts behind the last application through it
        if (gateOpen && !packets.some((p) => p.state === 'pass' && p.s < T.wait + PS + 10)) closeGate();
        packets = packets.filter((p) => p.state !== 'gone');
        if (changed) paintWait();
      });

      // requests run along the monorepo: one app, through the shared client, to the API and the database
      const dot = kit.$('.cos-pulse');
      const route = courier(kit, dot, wide ? 150 : 130);
      const legs = [0, 1, 2, 3].map((i) => kit.$('.cos-p' + i));
      let pulseIn = 1, side = 0;
      kit.tick((dt) => { if (route.busy()) return; pulseIn -= dt; if (pulseIn <= 0) { route.go([legs[side++ % 2], legs[2], legs[3]]); pulseIn = 1.4; } });

      // controls
      kit.button('Supported claim', () => spawn(false), { icon: '+', aria: 'adds an application whose claims the profile supports' });
      kit.button('Unsupported claim', () => spawn(true), { icon: '+', aria: 'adds an application with a claim the profile cannot support' });
      const signBtn = kit.button('Sign off', () => signOff(), { cls: 'fk-primary', icon: '✓' });
      paintWait();
      kit.status('Applications move through the pipeline; nothing leaves without a person');

      return {
        still() {
          // one rejected, one waiting at the gate, three already sent
          spawn(true); toTray(packets[packets.length - 1], true);
          spawn(false); const p = packets[packets.length - 1]; p.s = T.wait; p.state = 'wait'; place(p);
          sent = 3; sentT.textContent = 'sent 3';
          paintWait();
          kit.status('Waiting at the gate for a person to sign off');
        },
      };
    },

    // clicking the gate or the Approve block signs off the next application
    activate(k, kit) {
      if (k !== 'gate' && k !== 'approve') return false;
      const btn = kit.el.querySelector('.fk-primary');
      if (btn && !btn.disabled) { btn.click(); return true; }
      return false;
    },
  });

  /* =========================================================
     2. SecondAsk: price every action, then 22 rules that fail closed
     ========================================================= */
  const SA_ACTS = [
    { k: 'retrynow', t: 'Retry now' },
    { k: 'retrylater', t: 'Retry later' },
    { k: 'reminder', t: 'Reminder' },
    { k: 'hold', t: 'Hold' },
  ];
  // illustrative prices for three failed payments; the second hits a rule it cannot satisfy
  const SA_CASES = [
    { p: [0.58, 0.81, 0.47, 0.12], fail: -1 },
    { p: [0.86, 0.52, 0.61, 0.10], fail: 13 },
    { p: [0.34, 0.49, 0.77, 0.15], fail: -1 },
  ];
  // the real result: value recovered over the same 12,000 simulated payments
  const SA_OURS = 18.2, SA_FIXED = 8.6;

  def('secondask', {
    label: 'SecondAsk: a failed payment fans out to candidate actions, each scored by its own logistic regression and priced; the highest-priced action must then pass 22 compliance rules that fail closed. Value recovered over 12,000 simulated payments: 18.2% against 8.6% for a fixed retry schedule, 2.1 times as much.',
    tall: true,
    svg(L) {
      const id = 'secondask';
      let b = '';
      const ratio = (SA_OURS / SA_FIXED).toFixed(1) + '×';
      if (L === 'wide') {
        b += text(14, 30, 'Decision', 'f-kicker') + text(410, 30, 'prices illustrative', 'f-note', 'end');
        b += node(12, 156, 82, 60, 'Failed', 'payment', 'f-box', 'payment');
        SA_ACTS.forEach((a, i) => {
          const y = 66 + i * 58, cy = y + 17;
          b += arrow(id, `M94,186 C108,186 104,${cy} 118,${cy}`, 'f-line', `payment ${a.k}`);
          b += `<g class="f-node f-part sa-act" data-part="${a.k}">${rect(120, y, 96, 34, 'f-box f-draw')}${text(168, y + 22, a.t, 'f-label', 'middle')}</g>`;
          b += part('model', circle(236, cy, 12, 'f-chip f-draw') + text(236, cy + 4, 'LR', 'f-mono f-tiny', 'middle'));
          b += part('price', line(256, cy, 316, cy, 'f-grid') + rect(256, cy - 5, 0, 10, 'f-bar sa-price'));
          b += line(318, cy, 328, cy, 'f-thin', `data-rel="${a.k} rules"`);
        });
        b += text(286, 56, 'p·v − c', 'f-mono', 'middle');
        let r = '';
        for (let j = 0; j < 22; j++) r += rect(330, 66 + j * 9.5, 14, 7.5, 'f-rule', `data-j="${j}"`);
        b += text(337, 296, '22 rules', 'f-mono', 'middle');
        b += part('rules', rect(322, 60, 30, 218, 'f-hit') + r + rect(0, 0, 18, 11.5, 'sa-brk', 'display="none"'));
        b += arrow(id, 'M347,186 L361,186', 'f-line', 'rules act');
        b += `<g class="f-node f-part sa-actbox" data-part="act">${rect(364, 160, 44, 52, 'f-box f-draw')}${text(386, 191, 'Act', 'f-label', 'middle')}</g>`;
        b += text(337, 314, 'all must pass', 'f-note', 'middle') + text(386, 230, 'fails', 'f-note', 'middle') + text(386, 246, 'closed', 'f-note', 'middle');

        const X0 = 446, Y0 = 300, HS = 230 / 20;
        b += text(424, 30, 'Value recovered', 'f-kicker');
        [0, 5, 10, 15, 20].forEach((v) => {
          const y = Y0 - v * HS;
          b += line(X0 - 4, y, X0, y, 'f-axis') + text(X0 - 8, y + 4, v + '%', 'f-mono f-tiny', 'end');
          if (v) b += line(X0, y, 592, y, 'f-grid');
        });
        b += line(X0, Y0, 592, Y0, 'f-axis f-draw');
        const yT = Y0 - SA_OURS * HS, yF = Y0 - SA_FIXED * HS;
        b += part('ours', rect(468, yT, 46, SA_OURS * HS, 'f-bar f-bar-red') + text(491, yT - 8, SA_OURS + '%', 'f-num', 'middle') + text(491, Y0 + 18, 'SecondAsk', 'f-mono', 'middle'));
        b += part('fixed', rect(540, yF, 46, SA_FIXED * HS, 'f-bar') + text(563, yF - 8, SA_FIXED + '%', 'f-num', 'middle') +
          text(563, Y0 + 18, 'fixed', 'f-mono', 'middle') + text(563, Y0 + 32, 'schedule', 'f-mono', 'middle'));
        // a dimension line between the bar tops: how much more
        b += part('ratio', line(514, yT, 533, yT, 'f-thin') + line(521, yF, 539, yF, 'f-thin') +
          path(`M527,${yT + 2} L527,${yF - 2}`, 'f-dim', `marker-start="url(#${id}-ah)" marker-end="url(#${id}-ah)"`) +
          text(563, (yT + yF) / 2 + 2, ratio, 'f-big', 'middle') + text(563, (yT + yF) / 2 + 20, 'as much', 'f-mono', 'middle'));
        b += text(517, 364, '12,000 simulated payments', 'f-note', 'middle');
      } else {
        b += text(14, 28, 'Decision', 'f-kicker') + text(346, 28, 'prices illustrative', 'f-note', 'end');
        b += node(110, 40, 140, 46, 'Failed', 'payment', 'f-box', 'payment');
        b += path('M180,86 L180,96 L12,96 L12,' + (110 + 3 * 48 + 17), 'f-line f-draw', 'data-rel="payment"');
        SA_ACTS.forEach((a, i) => {
          const y = 110 + i * 48, cy = y + 17;
          b += arrow(id, `M12,${cy} L24,${cy}`, 'f-line', `payment ${a.k}`);
          b += `<g class="f-node f-part sa-act" data-part="${a.k}">${rect(26, y, 116, 34, 'f-box f-draw')}${text(84, y + 22, a.t, 'f-label', 'middle')}</g>`;
          b += part('model', circle(164, cy, 12, 'f-chip f-draw') + text(164, cy + 4.5, 'LR', 'f-mono f-tiny', 'middle'));
          b += part('price', line(184, cy, 300, cy, 'f-grid') + rect(184, cy - 5, 0, 10, 'f-bar sa-price'));
        });
        b += text(242, 104, 'p·v − c', 'f-mono', 'middle');
        let r = '';
        for (let j = 0; j < 22; j++) r += rect(24 + (j % 11) * 28, 326 + Math.floor(j / 11) * 16, 24, 12, 'f-rule', `data-j="${j}"`);
        b += text(14, 316, '22 rules, all must pass', 'f-mono');
        b += part('rules', rect(18, 320, 316, 38, 'f-hit') + r + rect(0, 0, 30, 16, 'sa-brk', 'display="none"'));
        b += arrow(id, 'M180,360 L180,372', 'f-line', 'rules act');
        b += `<g class="f-node f-part sa-actbox" data-part="act">${rect(130, 374, 100, 40, 'f-box f-draw')}${text(180, 399, 'Act', 'f-label', 'middle')}</g>`;
        b += text(120, 399, 'fail closed', 'f-note', 'end');

        const X0 = 112, K = 11;
        b += text(14, 452, 'Value recovered', 'f-kicker');
        const xT = X0 + SA_OURS * K, xF = X0 + SA_FIXED * K;
        b += part('ours', rect(X0, 468, SA_OURS * K, 24, 'f-bar f-bar-red') + text(xT - 7, 485.5, SA_OURS + '%', 'f-num f-on-bar', 'end'));
        b += text(104, 485, 'SecondAsk', 'f-mono', 'end');
        b += part('fixed', rect(X0, 512, SA_FIXED * K, 24, 'f-bar') + text(xF + 6, 529, SA_FIXED + '%', 'f-num'));
        b += text(104, 522, 'Fixed', 'f-mono', 'end') + text(104, 537, 'schedule', 'f-mono', 'end');
        b += part('ratio', line(xF, 510, xF, 497, 'f-thin') + line(xT, 494, xT, 506, 'f-thin') +
          path(`M${xF + 2},502 L${xT - 2},502`, 'f-dim', `marker-start="url(#${id}-ah)" marker-end="url(#${id}-ah)"`) +
          text(xT, 461, ratio + ' as much', 'f-mono', 'end'));
        [0, 5, 10, 15, 20].forEach((v) => {
          const x = X0 + v * K;
          b += line(x, 548, x, 553, 'f-axis') + text(x, 568, v + '%', 'f-mono f-tiny', 'middle');
          if (v) b += line(x, 462, x, 548, 'f-grid');
        });
        b += line(X0, 548, X0 + 20 * K, 548, 'f-axis f-draw');
        b += text(180, 596, '12,000 simulated payments', 'f-note', 'middle');
      }
      return svg(id, L === 'wide' ? 600 : 360, L === 'wide' ? 400 : 610, b, this.label);
    },

    mount(kit) {
      const wide = kit.layout === 'wide';
      const acts = kit.$$('.sa-act'), prices = kit.$$('.sa-price'), rules = kit.$$('.f-rule');
      const actBox = kit.$('.sa-actbox'), pay = kit.$('[data-part="payment"]'), brk = kit.$('.sa-brk');
      const PW = wide ? 60 : 116;
      let broken = 0, k = 0, cur = null;

      // every visual change is a tween or a set, so the timeline can be scrubbed and seeked
      function cycle() {
        const C = SA_CASES[k++ % SA_CASES.length];
        const best = C.p.indexOf(Math.max(...C.p));
        const fail = broken ? broken - 1 : C.fail;
        const name = SA_ACTS[best].t;
        const tl = cur = kit.timeline({ onComplete: cycle });
        tl.set(rules, { attr: { class: 'f-rule' } }, 0)
          .set(acts, { attr: { class: 'f-node f-part sa-act' } }, 0)
          .set(actBox, { attr: { class: 'f-node f-part sa-actbox' } }, 0)
          .set(prices, { attr: { width: 0, class: 'f-bar sa-price' } }, 0)
          .set(pay, { attr: { class: 'f-node f-part is-flash' } }, 0.05)
          .set(pay, { attr: { class: 'f-node f-part' } }, 0.45)
          .call(() => kit.status('A payment fails. Each possible next step gets its own model and a price'), null, 0.05);
        prices.forEach((p, i) => tl.to(p, { attr: { width: PW * C.p[i] }, duration: 0.5, ease: 'power2.out' }, 0.35 + i * 0.12));
        tl.set(acts[best], { attr: { class: 'f-node f-part sa-act is-best' } }, 1.25)
          .set(prices[best], { attr: { class: 'f-bar f-bar-red sa-price' } }, 1.25)
          .call(() => kit.status(`${name} has the highest price, so it goes to the rules`), null, 1.25);
        const n = fail >= 0 ? fail + 1 : 22;
        for (let j = 0; j < n; j++) tl.set(rules[j], { attr: { class: j === fail ? 'f-rule is-bad' : 'f-rule is-ok' } }, 1.5 + j * 0.07);
        const tEnd = 1.5 + n * 0.07 + 0.1;
        if (fail >= 0) {
          tl.set(acts[best], { attr: { class: 'f-node f-part sa-act is-best is-bad' } }, tEnd)
            .set(actBox, { attr: { class: 'f-node f-part sa-actbox is-bad' } }, tEnd)
            .call(() => kit.status(`Rule ${fail + 1} cannot be satisfied, so ${name.toLowerCase()} is blocked: the system fails closed`), null, tEnd);
        } else {
          tl.set(acts[best], { attr: { class: 'f-node f-part sa-act is-best is-go' } }, tEnd)
            .set(actBox, { attr: { class: 'f-node f-part sa-actbox is-go' } }, tEnd)
            .call(() => kit.status(`All 22 rules pass, so ${name.toLowerCase()} goes ahead`), null, tEnd);
        }
        tl.to({}, { duration: 1.9 }, tEnd);
      }

      // break a rule, from the stepper or by clicking a cell; every run after that blocks on it
      const paintBroken = () => {
        brk.setAttribute('display', broken ? 'inline' : 'none');
        if (!broken) return;
        const c = rules[broken - 1];
        brk.setAttribute('x', +c.getAttribute('x') - (wide ? 2 : 3));
        brk.setAttribute('y', +c.getAttribute('y') - 2);
      };
      const rerun = () => { if (cur) cur.kill(); k = Math.max(0, k - 1); cycle(); };
      const step = kit.stepper('Break rule', { value: 0, min: 0, max: 22, px: 8, format: (v) => (v ? '#' + v : 'none'),
        onChange: (v) => { broken = v; paintBroken(); rerun(); } });
      kit.on(kit.svg, 'click', (e) => {
        const c = e.target.closest && e.target.closest('.f-rule');
        if (!c) return;
        const j = +c.dataset.j + 1;
        broken = broken === j ? 0 : j;
        step.set(broken); paintBroken(); kit.interact();
        rerun();
      });
      cycle();
      return {
        still() { cur.progress(0.97, true); kit.status('Retry later had the highest price and passed all 22 rules, so it goes ahead'); },
      };
    },
  });

  /* =========================================================
     3. CodeForge: queue to sandbox, and winnowing
     ========================================================= */
  // the worked example from Schleimer, Wilkerson & Aiken (2003): the 5-grams of
  // "a do run run run, a do run run" with whitespace removed, and their example hashes
  const W_TEXT = 'adorunrunrunadorunrun';
  const W_HASH = [77, 74, 42, 17, 98, 50, 17, 98, 8, 88, 67, 39, 77, 74, 42, 17, 98];
  const W_K = 5;

  def('codeforge', {
    label: 'CodeForge: a candidate submission passes through the Express API, a BullMQ queue on Redis and a pool of workers into a Judge0 sandbox, with results stored in PostgreSQL. Below, winnowing: a window slides over the hashes of the document\'s 5-grams and keeps the smallest hash in each window as a fingerprint.',
    tall: true,
    svg(L) {
      const id = 'codeforge';
      const wide = L === 'wide';
      let b = '';
      if (wide) {
        b += text(14, 30, 'Grading path', 'f-kicker');
        b += text(148, 62, '45:00 left', 'f-mono cf-clock', 'middle');
        b += node(12, 70, 74, 50, 'Candidate', 'submits', 'f-box', 'candidate');
        b += node(98, 70, 100, 50, 'Express API', 'server clock', 'f-box', 'api');
        b += arrow(id, 'M86,95 L96,95', 'f-line cf-l0', 'candidate api');
        let q = rect(212, 70, 122, 50, 'f-box f-draw') + text(273, 62, 'BullMQ on Redis', 'f-mono', 'middle');
        for (let i = 0; i < 6; i++) q += rect(218 + i * 19.4, 85, 14, 20, 'f-slot');
        b += part('queue', q);
        b += text(339, 62, '', 'f-mono f-red-text cf-over');
        b += arrow(id, 'M198,95 L210,95', 'f-line cf-l1', 'api queue');
        let w = '';
        for (let i = 0; i < 3; i++) {
          w += rect(352, 62 + i * 24, 42, 20, 'f-box f-draw cf-w') + text(373, 76 + i * 24, 'W' + (i + 1), 'f-mono f-tiny', 'middle');
          b += path(`M334,95 C343,95 342,${72 + i * 24} 350,${72 + i * 24}`, 'f-thin f-draw', 'data-rel="queue workers"');
        }
        b += part('workers', w);
        b += part('sandbox', rect(412, 54, 82, 82, 'f-box f-sandbox f-draw') + text(453, 92, 'Judge0', 'f-label', 'middle') + text(453, 109, 'sandbox', 'f-mono', 'middle'));
        b += arrow(id, 'M394,95 L410,95', 'f-line', 'workers sandbox');
        b += node(508, 70, 84, 50, 'Postgres', 'Prisma', 'f-box', 'db');
        b += arrow(id, 'M494,95 L506,95', 'f-line cf-l2', 'sandbox db');
        b += `<g class="cf-verdict" opacity="0">${circle(453, 158, 10, 'f-chip')}${check(453, 158)}</g>`;
        b += text(550, 140, 'graded 0', 'f-mono cf-graded', 'middle');
        b += circle(-20, -20, 4, 'f-pulse cf-pulse', 'style="opacity:0"');

        // winnowing
        b += text(14, 198, 'Winnowing', 'f-kicker');
        b += text(14, 218, 'Hashes of the 5-grams of “a do run run run, a do run run”, the paper’s example', 'f-note');
        let t = rect(0, 236, 0, 24, 'cf-span') + line(0, 263, 0, 263, 'cf-kgram');
        [...W_TEXT].forEach((c, i) => { t += text(27 + i * 26 + 13, 253, c, 'f-mono cf-ch', 'middle'); });
        b += part('text', rect(22, 232, 556, 32, 'f-hit') + t);
        let cells = '';
        W_HASH.forEach((v, i) => {
          cells += rect(11 + i * 34, 274, 32, 32, 'f-cell', `data-i="${i}"`);
          cells += text(11 + i * 34 + 16, 294.5, String(v), 'f-mono f-cellnum', 'middle');
        });
        b += part('hashes', cells);
        b += part('window', rect(8, 270, 4 * 34 + 2, 40, 'f-window cf-win'));
        b += text(14, 345, 'fingerprints', 'f-mono');
        b += part('prints', rect(104, 326, 490, 30, 'f-hit') + '<g class="cf-prints" data-nodraw></g>');
        b += text(14, 392, '', 'f-note cf-guar');
      } else {
        b += text(14, 28, 'Grading path', 'f-kicker');
        b += text(261, 38, '45:00 left', 'f-mono cf-clock', 'middle');
        b += node(14, 46, 130, 44, 'Candidate', 'submits', 'f-box', 'candidate');
        b += node(176, 46, 170, 44, 'Express API', 'server clock', 'f-box', 'api');
        b += arrow(id, 'M144,68 L174,68', 'f-line cf-l0', 'candidate api');
        let q = rect(14, 120, 332, 44, 'f-box f-draw') + text(14, 112, 'BullMQ on Redis', 'f-mono');
        for (let i = 0; i < 6; i++) q += rect(24 + i * 52, 130, 44, 24, 'f-slot');
        b += part('queue', q);
        b += text(346, 112, '', 'f-mono f-red-text cf-over', 'end');
        b += arrow(id, 'M261,90 L261,118', 'f-line cf-l1', 'api queue');
        let w = '';
        for (let i = 0; i < 3; i++) {
          w += rect(14 + i * 116, 188, 100, 28, 'f-box f-draw cf-w') + text(64 + i * 116, 207, 'W' + (i + 1), 'f-mono', 'middle');
          b += path(`M180,164 L${64 + i * 116},186`, 'f-thin f-draw', 'data-rel="queue workers"');
        }
        b += part('workers', w);
        b += part('sandbox', rect(54, 240, 252, 56, 'f-box f-sandbox f-draw') + text(180, 265, 'Judge0', 'f-label', 'middle') + text(180, 283, 'sandbox', 'f-mono', 'middle'));
        b += arrow(id, 'M180,216 L180,238', 'f-line', 'workers sandbox');
        b += node(100, 320, 160, 44, 'Postgres', 'Prisma', 'f-box', 'db');
        b += arrow(id, 'M180,296 L180,318', 'f-line cf-l2', 'sandbox db');
        b += `<g class="cf-verdict" opacity="0">${circle(328, 268, 11, 'f-chip')}${check(328, 268)}</g>`;
        b += text(268, 347, 'graded 0', 'f-mono cf-graded');
        b += circle(-20, -20, 4, 'f-pulse cf-pulse', 'style="opacity:0"');

        b += text(14, 404, 'Winnowing', 'f-kicker');
        b += text(14, 424, 'Hashes of the 5-grams of “a do run run run,', 'f-note');
        b += text(14, 442, 'a do run run”, the paper’s example', 'f-note');
        let t = rect(0, 456, 0, 24, 'cf-span') + line(0, 483, 0, 483, 'cf-kgram');
        [...W_TEXT].forEach((c, i) => { t += text(12 + i * 16 + 8, 473, c, 'f-mono cf-ch', 'middle'); });
        b += part('text', rect(10, 452, 340, 34, 'f-hit') + t);
        let cells = '';
        W_HASH.forEach((v, i) => {
          const x = 6 + (i % 9) * 39, y = 494 + Math.floor(i / 9) * 38;
          cells += rect(x, y, 36, 32, 'f-cell', `data-i="${i}"`);
          cells += text(x + 18, y + 21, String(v), 'f-mono f-cellnum', 'middle');
        });
        b += part('hashes', cells);
        b += text(14, 596, 'fingerprints', 'f-mono');
        b += part('prints', rect(10, 602, 340, 64, 'f-hit') + '<g class="cf-prints" data-nodraw></g>');
        b += text(14, 676, '', 'f-note cf-guar') + text(14, 694, '', 'f-note cf-guar2');
      }
      return svg(id, wide ? 600 : 360, wide ? 410 : 700, b, this.label);
    },

    mount(kit) {
      const gsap = G(), wide = kit.layout === 'wide';
      /* ---- the grading path: a small queueing simulation ---- */
      const slots = kit.$$('.f-slot'), workers = kit.$$('.cf-w');
      const sandbox = kit.$('[data-part="sandbox"]'), db = kit.$('[data-part="db"]');
      const verdict = kit.$('.cf-verdict'), graded = kit.$('.cf-graded'), over = kit.$('.cf-over'), clock = kit.$('.cf-clock');
      const dot = kit.$('.cf-pulse');
      const legs = [kit.$('.cf-l0'), kit.$('.cf-l1')];
      const route = courier(kit, dot, wide ? 260 : 240);
      let queue = 0, busy = [0, 0, 0], done = 0, inbound = 0, left = 45 * 60, arrive = 0.4, burst = 0;
      const paintQ = () => {
        slots.forEach((s, i) => cls(s, (wide ? 5 - i : i) < queue ? 'f-slot is-full' : 'f-slot'));
        over.textContent = queue > 6 ? `+${queue - 6} more` : '';
      };
      const flash = (el) => { el.classList.add('is-flash'); kit.after(0.4, () => el.classList.remove('is-flash')); };
      // the status line belongs to winnowing unless the reader is feeding the queue
      const say = (t) => { if (kit.manual()) kit.status(t); };
      function submit(n = 1) {
        for (let i = 0; i < n; i++) {
          inbound++;
          kit.after(i * 0.16, () => {
            // the request runs candidate -> API -> queue, then joins the queue
            if (!route.busy()) route.go(legs, null);
            kit.after(0.45, () => { inbound--; queue++; paintQ(); say(`Submission queued in Redis: ${queue} waiting, ${busy.filter(Boolean).length} running`); });
          });
        }
      }
      kit.tick((dt) => {
        left = Math.max(0, left - dt);
        if (!left) left = 45 * 60;
        const m = Math.floor(left / 60), s = Math.floor(left % 60);
        clock.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} left`;
        if (!kit.manual()) {
          arrive -= dt;
          if (arrive <= 0) { submit(); burst++; arrive = burst % 4 ? 0.5 : 3.2; }
        }
        busy.forEach((t, i) => {
          if (t > 0) {
            busy[i] = Math.max(0, t - dt);
            if (!busy[i]) {
              cls(workers[i], 'f-box f-draw cf-w');
              done++; graded.textContent = `graded ${done}`;
              gsap.fromTo(verdict, { opacity: 1 }, { opacity: 0, duration: 0.5, delay: 0.35 });
              flash(db);
              say(`Verdict stored in Postgres. ${done} graded so far`);
            }
          } else if (queue > 0) {
            queue--; paintQ();
            busy[i] = 1.25 + (i * 0.37) % 0.6;
            cls(workers[i], 'f-box f-draw cf-w is-busy');
            say(`Worker ${i + 1} takes the next submission and runs it in the Judge0 sandbox`);
          }
        });
        sandbox.classList.toggle('is-running', busy.some(Boolean));
      });
      kit.button('Submit', () => submit(1), { icon: '+', aria: 'submits one solution' });
      kit.button('Rush ×8', () => submit(8), { icon: '+', aria: 'submits eight solutions at once' });

      /* ---- winnowing: a pure function of (window size, step) ---- */
      const cells = kit.$$('.f-cell'), nums = kit.$$('.f-cellnum'), chars = kit.$$('.cf-ch');
      const win = kit.$('.cf-win'), span = kit.$('.cf-span'), kgram = kit.$('.cf-kgram');
      const prints = kit.$('.cf-prints'), guar = kit.$('.cf-guar'), guar2 = kit.$('.cf-guar2');
      let w = 4, step = 0, tl = null;
      const CH = wide ? 26 : 16, CX0 = wide ? 27 : 12;
      const charX = (i) => CX0 + i * CH;
      const cellX = (i) => (wide ? 11 + i * 34 : 6 + (i % 9) * 39);
      function show(i, fresh) {
        const picks = window.Figures.winnow(W_HASH, w);
        const m = picks[i];
        const kept = [];
        for (let j = 0; j <= i; j++) if (!kept.length || kept[kept.length - 1] !== picks[j]) kept.push(picks[j]);
        cells.forEach((c, j) => {
          let k = 'f-cell';
          if (kept.includes(j)) k += ' is-pick';
          if (j >= i && j < i + w) k += ' is-in';
          if (j === m) k += ' is-min';
          cls(c, k);
          nums[j].classList.toggle('is-light', j === m);
        });
        if (wide) gsap.to(win, { attr: { x: 8 + i * 34, width: w * 34 + 2 }, duration: fresh ? 0 : 0.28, ease: 'power2.inOut' });
        // the window covers w hashes, so w + k - 1 characters of the document
        span.setAttribute('x', charX(i)); span.setAttribute('width', (w + W_K - 1) * CH);
        kgram.setAttribute('x1', charX(m) + 2); kgram.setAttribute('x2', charX(m + W_K) - 2);
        chars.forEach((c, j) => c.classList.toggle('is-in', j >= i && j < i + w + W_K - 1));
        // the fingerprints so far
        const PWd = wide ? 42 : 48, per = wide ? 12 : 7;
        let g = '';
        kept.forEach((p, n) => {
          const x = (wide ? 108 : 14) + (n % per) * PWd, y = (wide ? 328 : 606) + Math.floor(n / per) * 32;
          g += `<g class="cf-print${n === kept.length - 1 && !fresh && picks[i] !== picks[i - 1] ? ' is-new' : ''}">` +
            rect(x, y, PWd - 6, 26, 'f-cell is-min') + text(x + (PWd - 6) / 2, y + 17.5, String(W_HASH[p]), 'f-mono f-cellnum is-light', 'middle') + '</g>';
        });
        prints.innerHTML = g;
        const nw = prints.querySelector('.is-new');
        if (nw && !kit.calm) gsap.from(nw, { scale: 0.4, opacity: 0, svgOrigin: `${+nw.firstChild.getAttribute('x') + (PWd - 6) / 2} ${+nw.firstChild.getAttribute('y') + 13}`, duration: 0.35, ease: 'back.out(2)' });
        const t = w + W_K - 1;
        if (guar2) { guar.textContent = `w + k − 1 = ${t}: any shared run of`; guar2.textContent = `${t} or more characters is always caught`; }
        else guar.textContent = `w + k − 1 = ${t}: any shared run of ${t} or more characters is always caught`;
        return { m, isNew: i === 0 || picks[i] !== picks[i - 1], kept };
      }
      function sweep() {
        const n = W_HASH.length - w + 1;
        tl = kit.timeline({ onComplete: sweep });
        tl.call(() => { step = 0; show(0, true); kit.status(`Window size w = ${w}: in each window keep the smallest hash`); }, null, 0);
        for (let i = 1; i < n; i++) {
          tl.call(() => {
            step = i;
            const r = show(i);
            if (r.isNew && !kit.manual()) kit.status(`New minimum ${W_HASH[r.m]} at position ${r.m}: it becomes fingerprint ${r.kept.length}`);
          }, null, 0.5 + (i - 1) * 0.45);
        }
        tl.call(() => kit.status(`${show(n - 1, true).kept.length} fingerprints stand in for ${W_HASH.length} hashes`), null, 0.5 + (n - 1) * 0.45);
        tl.to({}, { duration: 2.2 });
      }
      kit.stepper('Window w', { value: w, min: 2, max: 8, onChange: (v) => { w = v; if (tl) tl.kill(); sweep(); if (!kit.running()) show(0, true); } });
      sweep();
      paintQ();
      kit.status('Submissions queue up; workers take them one at a time into the sandbox');
      return {
        still() {
          queue = 2; paintQ(); busy = [0.6, 0.9, 0]; cls(workers[0], 'f-box f-draw cf-w is-busy'); cls(workers[1], 'f-box f-draw cf-w is-busy');
          done = 5; graded.textContent = 'graded 5';
          if (tl) tl.kill();
          show(W_HASH.length - w, true);
          kit.status('Winnowing keeps 5 fingerprints out of 17 hashes, enough to catch any shared run of 8 or more characters');
        },
      };
    },
  });

  /* =========================================================
     4. SynchroPulse: a forecast clock heats a road network
     ========================================================= */
  // an illustrative city: a jittered grid of junctions, two corridors that build up over three hours
  function spNet(L) {
    const tall = L === 'tall';
    const r = rng(tall ? 3061 : 1147);
    const cols = tall ? 5 : 8, rows = tall ? 8 : 5;
    const X0 = 44, Y0 = tall ? 84 : 82, DX = tall ? 68 : 73, DY = tall ? 46 : 51;
    const nodes = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      nodes.push({ x: X0 + i * DX + (r() - 0.5) * DX * 0.4, y: Y0 + j * DY + (r() - 0.5) * DY * 0.4 });
    }
    const idx = (i, j) => j * cols + i;
    const edges = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      if (i < cols - 1) edges.push([idx(i, j), idx(i + 1, j)]);
      if (j < rows - 1 && r() > 0.18) edges.push([idx(i, j), idx(i, j + 1)]);
      if (i < cols - 1 && j < rows - 1 && r() > 0.78) edges.push([idx(i, j), idx(i + 1, j + 1)]);
    }
    // corridors in the network's own 0..1 coordinates
    const W = (cols - 1) * DX, H = (rows - 1) * DY;
    const c1 = tall ? [0.62, 0.32, 0.30, 0.20] : [0.52, 0.42, 0.22, 0.24];
    const c2 = tall ? [0.25, 0.74, 0.26, 0.14] : [0.17, 0.80, 0.16, 0.20];
    const hot = (e, t) => {
      const a = nodes[e[0]], b = nodes[e[1]];
      const u = ((a.x + b.x) / 2 - X0) / W, v = ((a.y + b.y) / 2 - Y0) / H;
      const g = (c) => Math.exp(-(((u - c[0]) / c[2]) ** 2 + ((v - c[1]) / c[3]) ** 2));
      return Math.min(1, 0.1 + g(c1) * (0.25 + 0.75 * t) + g(c2) * (0.9 * t * t));
    };
    return { nodes, edges, hot };
  }
  const SPN = {};
  const spGet = (L) => (SPN[L] = SPN[L] || spNet(L));
  const spTime = (t) => { const m = Math.round(t * 180 / 10) * 10; return m === 0 ? 'now' : `+${Math.floor(m / 60)} h${m % 60 ? ' ' + (m % 60) + ' min' : ''}`; };

  def('synchropulse', {
    label: 'SynchroPulse, illustrative: as the forecast clock moves from now to three hours ahead, congestion builds along two corridors, and the deployment plan moves traffic personnel and a barricade to the worst roads.',
    tall: true,
    svg(L) {
      const id = 'synchropulse', tall = L === 'tall';
      const N = spGet(L);
      const W = tall ? 360 : 600, H = tall ? 520 : 410;
      let b = text(14, 30, 'Forecast', 'f-kicker');
      // legend: what the road colours mean, set flush right from the label widths
      const cw = tall ? 7.4 : 6.6, keys = [['free', 'f-road-k0'], ['slowing', 'f-road-k1'], ['jammed', 'f-road-k2']];
      let lx = W - 14 - keys.reduce((s, [t]) => s + 21 + t.length * cw, 0) - 16 * (keys.length - 1);
      keys.forEach(([t, c]) => {
        b += line(lx, 26, lx + 16, 26, 'f-road-key ' + c) + text(lx + 21, 30, t, 'f-mono f-tiny');
        lx += 21 + t.length * cw + 16;
      });
      b += `<pattern id="${id}-stripe" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="8" class="f-stripe-a"/><rect x="4" width="4" height="8" class="f-stripe-b"/></pattern>`;
      let roads = '';
      N.edges.forEach((e, i) => {
        const a = N.nodes[e[0]], c = N.nodes[e[1]];
        roads += line(a.x, a.y, c.x, c.y, 'f-road', `data-i="${i}"`);
      });
      N.nodes.forEach((n) => { roads += circle(n.x, n.y, 2.4, 'f-junction'); });
      b += part('roads', roads);
      b += `<g class="f-part sp-barr" data-part="barricade" opacity="0">${rect(-11, -4, 22, 8, 'f-barr')}</g>`;
      for (let i = 0; i < 2; i++) b += `<g class="f-part sp-crew" data-part="crew" opacity="0">${circle(0, 0, 8, 'f-crew')}${circle(0, 0, 2.6, 'f-crew-dot')}</g>`;
      // the clock: drag along it
      const TX0 = tall ? 40 : 64, TX1 = tall ? 320 : 536, TY = tall ? 462 : 368;
      let ck = rect(TX0 - 16, TY - 34, TX1 - TX0 + 32, 62, 'f-hit sp-hit') + line(TX0, TY, TX1, TY, 'f-axis f-draw');
      ['now', '+1 h', '+2 h', '+3 h'].forEach((s, i) => {
        const x = TX0 + (TX1 - TX0) * i / 3;
        ck += line(x, TY - 4, x, TY + 4, 'f-axis') + text(x, TY + 20, s, 'f-mono', 'middle');
      });
      ck += `<g class="sp-head">${path(`M${TX0},${TY - 5} l-6,-10 h12 z`, 'f-head')}${text(TX0, TY - 22, 'now', 'f-num sp-when', 'middle')}</g>`;
      b += part('clock', ck);
      b += text(W - 14, 52, 'illustrative network', 'f-note', 'end');
      return svg(id, W, H, b, this.label);
    },

    mount(kit) {
      const gsap = G(), tall = kit.layout === 'tall';
      const N = spGet(kit.layout);
      const roads = kit.$$('.f-road'), crews = kit.$$('.sp-crew'), barr = kit.$('.sp-barr');
      const head = kit.$('.sp-head'), when = kit.$('.sp-when'), hit = kit.$('.sp-hit');
      const TX0 = tall ? 40 : 64, TX1 = tall ? 320 : 536;
      const at = { crew: [-1, -1], barr: -1 };
      let t = 0, dir = 1, hold = 0, lastMsg = '';
      function paint() {
        const scored = N.edges.map((e, i) => ({ i, h: N.hot(e, t) }));
        let jam = 0, slow = 0;
        scored.forEach(({ i, h }) => {
          const r = roads[i];
          r.style.strokeWidth = (1.1 + h * 4.4).toFixed(2);
          const k = h > 0.62 ? 2 : h > 0.38 ? 1 : 0;
          if (k === 2) jam++; else if (k === 1) slow++;
          if (r._k !== k) { r._k = k; r.setAttribute('class', 'f-road f-road-k' + k); }
        });
        scored.sort((a, b) => b.h - a.h);
        // the plan: personnel on the two worst roads, a barricade on the worst, once they are bad enough
        const mid = (i) => { const e = N.edges[i], a = N.nodes[e[0]], d = N.nodes[e[1]]; return { x: (a.x + d.x) / 2, y: (a.y + d.y) / 2, ang: Math.atan2(d.y - a.y, d.x - a.x) * 180 / Math.PI }; };
        crews.forEach((c, k) => {
          const s = scored[k + 1], on = s.h > 0.45;
          const key = on ? s.i : -1;
          if (at.crew[k] === key) return;
          at.crew[k] = key;
          if (on) { const m = mid(s.i); gsap.to(c, { x: m.x, y: m.y + (k ? 0 : 0), opacity: 1, duration: 0.55, ease: 'power2.inOut', overwrite: true }); }
          else gsap.to(c, { opacity: 0, duration: 0.3, overwrite: true });
        });
        const w = scored[0], bOn = w.h > 0.7, bKey = bOn ? w.i : -1;
        if (at.barr !== bKey) {
          at.barr = bKey;
          if (bOn) { const m = mid(w.i); gsap.to(barr, { x: m.x, y: m.y, rotation: m.ang + 90, svgOrigin: '0 0', opacity: 1, duration: 0.5, overwrite: true }); }
          else gsap.to(barr, { opacity: 0, duration: 0.3, overwrite: true });
        }
        const x = TX0 + (TX1 - TX0) * t;
        gsap.set(head, { x: x - TX0 });
        when.textContent = spTime(t);
        const msg = t < 0.02 ? 'Forecast for now: traffic is moving' :
          `Forecast for ${spTime(t)}: ${jam} road${jam === 1 ? '' : 's'} jammed, ${slow} slowing. The plan moves people${bOn ? ' and a barricade' : ''} to them`;
        if (msg !== lastMsg) { lastMsg = msg; kit.status(msg); }
        if (stepper) stepper.set(Math.round(t * 18) * 10);
      }
      // autoplay sweeps the forecast out to three hours and back; the reader can grab it any time
      kit.tick((dt) => {
        if (kit.manual() || dragging) return;
        if (hold > 0) { hold -= dt; return; }
        t += dir * dt / (dir > 0 ? 6.5 : 1.6);
        if (t >= 1) { t = 1; dir = -1; hold = 1.6; }
        if (t <= 0) { t = 0; dir = 1; hold = 0.9; }
        paint();
      });
      let dragging = false;
      const toT = (e) => {
        const p = kit.svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
        const v = p.matrixTransform(kit.svg.getScreenCTM().inverse());
        return Math.max(0, Math.min(1, (v.x - TX0) / (TX1 - TX0)));
      };
      kit.on(hit, 'pointerdown', (e) => { dragging = true; hit.setPointerCapture(e.pointerId); kit.interact(); t = toT(e); paint(); e.preventDefault(); });
      kit.on(hit, 'pointermove', (e) => { if (!dragging) return; kit.interact(); t = toT(e); paint(); });
      const end = () => { dragging = false; dir = t > 0.5 ? -1 : 1; };
      kit.on(hit, 'pointerup', end); kit.on(hit, 'pointercancel', end);
      const stepper = kit.stepper('Horizon', { value: 0, min: 0, max: 180, step: 10, px: 4,
        format: (m) => (m === 0 ? 'now' : `+${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`),
        onChange: (m) => { t = m / 180; paint(); } });
      paint();
      return { still() { t = 0.72; paint(); } };
    },
  });

  /* =========================================================
     5. CampusFind: sign in, two reports, a match, a QR handoff
     ========================================================= */
  const CF_STEPS = [
    'Sign in with a one-time code sent to a university email address',
    'The owner reports a lost item',
    'Someone else reports finding one',
    'An LLM compares lost and found reports and suggests the match',
    'The finder shows a QR code; scanning it confirms the handoff',
    'Closed: the item only closes once it reaches the right person',
  ];
  def('campusfind', {
    label: 'CampusFind: sign-in by university email code; a lost report and a found report are matched by an LLM; the item is handed over by scanning a QR code and the case closes; data and storage sit behind Supabase row-level security.',
    tall: true,
    svg(L) {
      const id = 'campusfind', tall = L === 'tall';
      let b = text(14, 30, 'Handoff', 'f-kicker');
      const card = (x, y, w, key, title, l1, l2) => `<g class="f-node f-part cf-card cf-${key}" data-part="${key}">${rect(x, y, w, 70, 'f-box f-draw')}` +
        text(x + 12, y + 23, title, 'f-label') + text(x + 12, y + 42, l1, 'f-mono') + text(x + 12, y + 58, l2, 'f-mono') + '</g>';
      const otp = (x, y) => { let o = ''; '481927'.split('').forEach((d, i) => { o += rect(x + i * 23, y, 19, 22, 'cf-otp') + text(x + i * 23 + 9.5, y + 16, d, 'f-mono cf-dig', 'middle'); }); return o; };
      const qr = (QX, QY) => {
        // generated for the drawing, not a real code
        const r = rng(42), Q = 9, S = 11;
        let q = rect(QX - 8, QY - 8, Q * S + 16, Q * S + 16, 'f-box f-draw');
        for (let j = 0; j < Q; j++) for (let i = 0; i < Q; i++) {
          const finder = (i < 3 && j < 3) || (i > 5 && j < 3) || (i < 3 && j > 5);
          const on = finder ? !(i % 6 === 1 && j % 6 === 1) : r() > 0.52;
          if (on) q += rect(QX + i * S, QY + j * S, S - 1.4, S - 1.4, 'f-qr');
        }
        return q + line(QX - 6, QY, QX + Q * S + 6, QY, 'f-scan');
      };
      if (!tall) {
        b += `<g class="f-node f-part cf-signin" data-part="signin">${rect(12, 46, 156, 80, 'f-box f-box-soft f-draw')}${text(90, 68, 'University email', 'f-label', 'middle')}${otp(22, 84)}</g>`;
        b += card(12, 150, 140, 'lost', 'Lost', 'blue bottle', 'library, 2 pm');
        b += card(12, 238, 140, 'found', 'Found', 'blue bottle', 'block C desk');
        b += arrow(id, 'M82,126 L82,148', 'f-line', 'signin lost');
        b += path('M152,185 C196,185 190,222 222,226', 'f-line f-draw cf-m1', 'data-rel="lost llm"');
        b += path('M152,273 C196,273 190,238 222,234', 'f-line f-draw cf-m2', 'data-rel="found llm"');
        b += `<g class="f-part cf-llm" data-part="llm">${circle(250, 230, 28, 'f-box f-draw')}${text(250, 227, 'LLM', 'f-label', 'middle')}${text(250, 243, 'match', 'f-mono', 'middle')}</g>`;
        b += arrow(id, 'M278,230 L314,230', 'f-line', 'llm qr');
        b += part('qr', qr(330, 180), 'cf-qr');
        b += text(379, 308, 'scan to hand over', 'f-note', 'middle');
        b += arrow(id, 'M445,230 L470,230', 'f-line', 'qr closed');
        b += `<g class="f-node f-part cf-done" data-part="closed">${rect(472, 206, 116, 48, 'f-box f-draw')}${text(530, 227, 'Closed', 'f-label', 'middle')}${text(530, 244, 'right person', 'f-mono', 'middle')}</g>`;
        b += part('rls', rect(232, 334, 356, 56, 'f-frame f-dash f-draw') + text(248, 357, 'Supabase', 'f-label') + text(248, 376, 'Postgres + storage', 'f-mono') +
          text(574, 357, 'row-level security', 'f-mono f-red-text', 'end') + text(574, 376, 'on data and storage', 'f-mono', 'end'));
      } else {
        b += `<g class="f-node f-part cf-signin" data-part="signin">${rect(24, 44, 312, 84, 'f-box f-box-soft f-draw')}${text(180, 68, 'University email', 'f-label', 'middle')}${otp(112, 84)}</g>`;
        b += arrow(id, 'M99,128 L99,148', 'f-line', 'signin lost');
        b += card(24, 150, 150, 'lost', 'Lost', 'blue bottle', 'library, 2 pm');
        b += card(186, 150, 150, 'found', 'Found', 'blue bottle', 'block C desk');
        b += path('M99,220 C99,250 150,254 160,264', 'f-line f-draw cf-m1', 'data-rel="lost llm"');
        b += path('M261,220 C261,250 210,254 200,264', 'f-line f-draw cf-m2', 'data-rel="found llm"');
        b += `<g class="f-part cf-llm" data-part="llm">${circle(180, 286, 28, 'f-box f-draw')}${text(180, 283, 'LLM', 'f-label', 'middle')}${text(180, 299, 'match', 'f-mono', 'middle')}</g>`;
        b += arrow(id, 'M180,314 L180,334', 'f-line', 'llm qr');
        b += part('qr', qr(131, 352), 'cf-qr');
        b += text(258, 398, 'scan to', 'f-note') + text(258, 416, 'hand over', 'f-note');
        b += arrow(id, 'M180,467 L180,486', 'f-line', 'qr closed');
        b += `<g class="f-node f-part cf-done" data-part="closed">${rect(110, 488, 140, 48, 'f-box f-draw')}${text(180, 509, 'Closed', 'f-label', 'middle')}${text(180, 526, 'right person', 'f-mono', 'middle')}</g>`;
        b += part('rls', rect(12, 560, 336, 104, 'f-frame f-dash f-draw') + text(28, 586, 'Supabase', 'f-label') + text(28, 606, 'Postgres + storage', 'f-mono') +
          text(28, 632, 'row-level security', 'f-mono f-red-text') + text(28, 651, 'on data and storage', 'f-mono'));
      }
      return svg(id, tall ? 360 : 600, tall ? 676 : 400, b, this.label);
    },

    mount(kit) {
      const gsap = G();
      const els = {
        signin: kit.$('.cf-signin'), lost: kit.$('.cf-lost'), found: kit.$('.cf-found'),
        llm: kit.$('.cf-llm'), qr: kit.$('.cf-qr'), done: kit.$('.cf-done'),
      };
      const digits = kit.$$('.cf-dig'), m1 = kit.$('.cf-m1'), m2 = kit.$('.cf-m2');
      const cells = kit.$$('.f-qr'), scan = kit.$('.f-scan');
      let step = -1, tl = null;
      const order = ['signin', 'lost', 'found', 'llm', 'qr', 'done'];
      // later steps stay on the drawing, faint, so the whole route is always readable
      // steps are short one-shot transitions, so they run even while the figure is paused
      function show(s, instant) {
        step = s;
        if (tl) tl.kill();
        tl = gsap.timeline({ paused: !!instant });
        const d = instant ? 0 : 1;
        order.forEach((k, i) => {
          tl.to(els[k], { opacity: i <= s ? 1 : 0.22, duration: 0.35 * d }, 0);
          els[k].classList.toggle('is-now', i === s);
        });
        tl.set([m1, m2], { opacity: s >= 3 ? 1 : 0.22 }, 0);
        if (s === 0) tl.fromTo(digits, { opacity: 0 }, { opacity: 1, duration: 0.01, stagger: 0.16 * d }, 0.2 * d);
        else tl.set(digits, { opacity: 1 }, 0);
        if (s === 1 || s === 2) tl.fromTo(els[order[s]], { x: -10 }, { x: 0, duration: 0.45 * d, ease: 'power3.out' }, 0);
        if (s === 3 && window.DrawSVGPlugin) tl.fromTo([m1, m2], { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.6 * d, stagger: 0.12 }, 0.1);
        if (s === 4) {
          tl.fromTo(cells, { opacity: 0 }, { opacity: 1, duration: 0.01, stagger: { each: 0.008 * d, from: 'random' } }, 0.1 * d)
            .fromTo(scan, { y: 0, opacity: 1 }, { y: 99, duration: 0.9 * d, ease: 'sine.inOut', yoyo: true, repeat: instant ? 0 : 1 }, 0.6 * d)
            .to(scan, { opacity: 0, duration: 0.2 }, instant ? 0 : 2.5);
        } else tl.set(scan, { opacity: 0 }, 0).set(cells, { opacity: 1 }, 0);
        if (instant) tl.progress(1);
        els.done.classList.toggle('is-go', s === 5);
        kit.status(CF_STEPS[s]);
        counter.set(`${s + 1} of 6`);
        back.disabled = s === 0;
      }
      const back = kit.button('Back', () => show(Math.max(0, step - 1)), { icon: '‹' });
      kit.button('Next', () => show((step + 1) % 6), { icon: '›', cls: 'fk-primary' });
      const counter = kit.chip('Step');
      // autoplay walks the steps; the scan step gets longer
      let wait = 0.4;
      kit.tick((dt) => {
        if (kit.manual()) return;
        wait -= dt;
        if (wait <= 0) { show((step + 1) % 6); wait = step === 4 ? 3.4 : step === 5 ? 2.6 : 2.1; }
      });
      show(0, true);
      return { still() { show(5, true); } };
    },
  });

  /* =========================================================
     6. RISC-V: an I-type encoder you can drive
     ========================================================= */
  const RV_OPS = { addi: 0, slti: 2, sltiu: 3, xori: 4, ori: 6, andi: 7 };
  const RV_DEMO = [
    ['addi', 5, 0, 42], ['slti', 6, 5, 100], ['xori', 7, 6, -1],
    ['andi', 8, 5, 15], ['ori', 9, 0, 2047], ['addi', 10, 9, -2048],
  ];
  const rvEncode = (op, rd, rs1, imm) => (((imm & 0xFFF) << 20) | (rs1 << 15) | (RV_OPS[op] << 12) | (rd << 7) | 0x13) >>> 0;
  const rvFields = (op, rd, rs1, imm) => {
    const bin = (v, n) => (v >>> 0).toString(2).padStart(32, '0').slice(-n);
    return [
      { k: 'imm',    name: 'imm[11:0]', bits: bin(imm & 0xFFF, 12), val: imm < 0 ? '−' + Math.abs(imm) : String(imm), hi: 31, lo: 20 },
      { k: 'rs1',    name: 'rs1',       bits: bin(rs1, 5),          val: 'x' + rs1, hi: 19, lo: 15 },
      { k: 'funct3', name: 'funct3',    bits: bin(RV_OPS[op], 3),   val: op,        hi: 14, lo: 12 },
      { k: 'rd',     name: 'rd',        bits: bin(rd, 5),           val: 'x' + rd,  hi: 11, lo: 7 },
      { k: 'opcode', name: 'opcode',    bits: '0010011',            val: 'OP-IMM',  hi: 6,  lo: 0 },
    ];
  };

  def('riscv', {
    label: 'RISC-V: an I-type instruction such as addi x5, x0, 42 split into its fields (immediate, source register, funct3, destination register and the OP-IMM opcode) and encoded bit by bit, giving 0x02A00293. Below, the toolchain: two assembler passes, the cycle-accurate simulator, and differential and formal checks against the PicoRV32 core.',
    tall: true,
    svg(L) {
      const id = 'riscv', tall = L === 'tall';
      const F = rvFields('addi', 5, 0, 42);
      let b = text(14, 30, 'Encode', 'f-kicker') + text(tall ? 346 : 586, 30, 'I-type', 'f-mono', 'end');
      b += `<text class="f-asm rv-asm" x="14" y="${tall ? 74 : 76}"><tspan class="rv-t-op" data-part="asm">addi</tspan> <tspan class="f-asm-args rv-t-rd">x5</tspan><tspan class="f-asm-args">, </tspan><tspan class="f-asm-args rv-t-rs1">x0</tspan><tspan class="f-asm-args">, </tspan><tspan class="f-asm-args rv-t-imm" data-part="imm">42</tspan></text>`;
      if (!tall) {
        const X0 = 20, CW = 17.5, Y = 126;
        let k = 0;
        F.forEach((fl) => {
          const x0 = X0 + k * CW, w = fl.bits.length * CW;
          let g = text(x0 + w / 2 - 0.75, Y - 12, fl.name, 'f-mono', 'middle');
          [...fl.bits].forEach((bit, bi) => {
            const x = x0 + bi * CW;
            g += `<g class="rv-bit" data-cx="${f(x + 8)}" data-cy="${Y + 16}">${rect(x, Y, CW - 1.5, 32, 'f-bit')}${text(x + (CW - 1.5) / 2, Y + 21, bit, 'f-mono f-bitnum', 'middle')}</g>`;
          });
          g += line(x0, Y + 42, x0 + w - 1.5, Y + 42, 'f-thin');
          g += text(x0 + w / 2 - 0.75, Y + 60, fl.val, 'f-label rv-val', 'middle');
          g += line(x0 - 0.75, Y + 66, x0 - 0.75, Y + 82, 'f-thin');
          g += text(x0 + 3, Y + 79, String(fl.hi), 'f-mono f-tiny') + text(x0 + w - 5, Y + 79, String(fl.lo), 'f-mono f-tiny', 'end');
          b += part(fl.k, g, 'rv-field');
          k += fl.bits.length;
        });
        b += part('hex', text(20, 254, '0x02A00293', 'f-hex rv-hex') + text(222, 254, '', 'f-mono rv-nib'));
        b += text(20, 280, '', 'f-note rv-note');
        const Y2 = 310;
        b += node(20, Y2, 100, 50, 'Pass 1', 'symbol table', 'f-box', 'pass1');
        b += node(134, Y2, 92, 50, 'Pass 2', 'encode', 'f-box', 'pass2');
        b += node(240, Y2, 118, 50, 'Simulator', 'cycle-accurate', 'f-box', 'sim');
        b += node(466, Y2, 114, 50, 'PicoRV32', 'RTL core', 'f-box f-box-soft', 'rtl');
        b += arrow(id, `M120,${Y2 + 25} L132,${Y2 + 25}`, 'f-line', 'pass1 pass2');
        b += arrow(id, `M226,${Y2 + 25} L238,${Y2 + 25}`, 'f-line', 'pass2 sim');
        b += part('checks', path(`M362,${Y2 + 16} L462,${Y2 + 16}`, 'f-line f-draw rv-diff', `marker-end="url(#${id}-ah)" marker-start="url(#${id}-ah)"`) +
          text(412, Y2 + 36, 'differential', 'f-mono f-tiny', 'middle') + text(412, Y2 + 50, 'formal checks', 'f-mono f-tiny', 'middle') +
          `<g class="rv-ok" opacity="0">${circle(412, Y2 - 6, 9, 'f-chip')}${check(412, Y2 - 6)}</g>`);
        b += text(580, Y2 + 82, '147 tests passing', 'f-mono', 'end');
      } else {
        const Y0 = 98, RH = 54;
        F.forEach((fl, r) => {
          const y = Y0 + r * RH;
          let g = text(14, y + 18, fl.name, 'f-mono') + text(14, y + 41, fl.val, 'f-label rv-val');
          [...fl.bits].forEach((bit, bi) => {
            const x = 106 + bi * 20.5;
            g += `<g class="rv-bit" data-cx="${f(x + 9)}" data-cy="${y + 23}">${rect(x, y + 8, 18.5, 30, 'f-bit')}${text(x + 9.25, y + 28, bit, 'f-mono f-bitnum', 'middle')}</g>`;
          });
          g += text(346, y + 52, `${fl.hi}–${fl.lo}`, 'f-mono f-tiny', 'end');
          b += part(fl.k, g, 'rv-field');
        });
        b += part('hex', text(14, 402, '0x02A00293', 'f-hex rv-hex') + text(14, 426, '', 'f-mono rv-nib') + text(14, 444, '', 'f-mono rv-nib2'));
        b += text(14, 466, '', 'f-note rv-note');
        b += node(14, 488, 158, 46, 'Pass 1', 'symbol table', 'f-box', 'pass1');
        b += node(188, 488, 158, 46, 'Pass 2', 'encode', 'f-box', 'pass2');
        b += node(14, 572, 158, 46, 'Simulator', 'cycle-accurate', 'f-box', 'sim');
        b += node(188, 572, 158, 46, 'PicoRV32', 'RTL core', 'f-box f-box-soft', 'rtl');
        b += arrow(id, 'M172,511 L186,511', 'f-line', 'pass1 pass2');
        b += arrow(id, 'M267,534 C267,554 93,550 93,570', 'f-line', 'pass2 sim');
        b += part('checks', path('M174,595 L186,595', 'f-line f-draw rv-diff', `marker-end="url(#${id}-ah)" marker-start="url(#${id}-ah)"`) +
          text(180, 640, 'differential and formal checks', 'f-mono', 'middle') +
          `<g class="rv-ok" opacity="0">${circle(180, 557, 9, 'f-chip')}${check(180, 557)}</g>`);
        b += text(180, 660, '147 tests passing', 'f-mono', 'middle');
      }
      return svg(id, tall ? 360 : 600, tall ? 672 : 400, b, this.label);
    },

    mount(kit) {
      const gsap = G();
      const st = { op: 'addi', rd: 5, rs1: 0, imm: 42 };
      const bits = kit.$$('.rv-bit'), vals = kit.$$('.rv-val');
      const tOp = kit.$('.rv-t-op'), tRd = kit.$('.rv-t-rd'), tRs1 = kit.$('.rv-t-rs1'), tImm = kit.$('.rv-t-imm');
      const hex = kit.$('.rv-hex'), nib = kit.$('.rv-nib'), nib2 = kit.$('.rv-nib2'), note = kit.$('.rv-note');
      let prev = '';
      function render(instant) {
        const word = rvEncode(st.op, st.rd, st.rs1, st.imm);
        const all = word.toString(2).padStart(32, '0');
        const F = rvFields(st.op, st.rd, st.rs1, st.imm);
        // only the bits that changed flip over
        bits.forEach((g, i) => {
          const v = all[i], was = prev[i];
          const set = () => { g.firstChild.setAttribute('class', v === '1' ? 'f-bit is-one' : 'f-bit is-zero'); g.lastChild.textContent = v; };
          if (instant || was === v || kit.calm) { set(); return; }
          const o = `${g.dataset.cx} ${g.dataset.cy}`;
          gsap.timeline().to(g, { scaleY: 0, svgOrigin: o, duration: 0.11, ease: 'power1.in', delay: (i % 12) * 0.012 })
            .call(set).to(g, { scaleY: 1, svgOrigin: o, duration: 0.16, ease: 'power2.out' });
        });
        prev = all;
        F.forEach((fl, i) => { vals[i].textContent = fl.val; });
        tOp.textContent = st.op; tRd.textContent = 'x' + st.rd; tRs1.textContent = 'x' + st.rs1;
        tImm.textContent = st.imm < 0 ? '−' + Math.abs(st.imm) : String(st.imm);
        hex.textContent = '0x' + word.toString(16).toUpperCase().padStart(8, '0');
        const nibbles = all.replace(/(.{4})/g, '$1 ').trim();
        if (nib2) { nib.textContent = nibbles.slice(0, 19); nib2.textContent = nibbles.slice(20); }
        else nib.textContent = nibbles;
        note.textContent = st.imm < 0 ? `${tImm.textContent} is stored as 0x${(st.imm & 0xFFF).toString(16).toUpperCase().padStart(3, '0')}, sign-extended to 32 bits` : '';
        kit.status(`${st.op} x${st.rd}, x${st.rs1}, ${tImm.textContent}  →  ${hex.textContent}`);
        if (sel) { sel.set(st.op); sRd.set(st.rd); sRs.set(st.rs1); sImm.set(st.imm); }
      }
      const sel = kit.select('op', Object.keys(RV_OPS).map((k) => [k, k]), st.op, (v) => { st.op = v; render(); });
      const sRd = kit.stepper('rd', { value: st.rd, min: 0, max: 31, format: (v) => 'x' + v, px: 10, onChange: (v) => { st.rd = v; render(); } });
      const sRs = kit.stepper('rs1', { value: st.rs1, min: 0, max: 31, format: (v) => 'x' + v, px: 10, onChange: (v) => { st.rs1 = v; render(); } });
      const sImm = kit.stepper('imm', { value: st.imm, min: -2048, max: 2047, format: (v) => (v < 0 ? '−' + Math.abs(v) : String(v)), px: 3, onChange: (v) => { st.imm = v; render(); } });
      // the immediate in the drawing is a scrubbable number too
      let drag = null;
      kit.on(tImm, 'pointerdown', (e) => { drag = { x: e.clientX, v: st.imm }; tImm.setPointerCapture(e.pointerId); kit.interact(); e.preventDefault(); });
      kit.on(tImm, 'pointermove', (e) => { if (!drag) return; kit.interact(); const v = Math.max(-2048, Math.min(2047, drag.v + Math.round((e.clientX - drag.x) / 3))); if (v !== st.imm) { st.imm = v; render(); } });
      const up = () => { drag = null; };
      kit.on(tImm, 'pointerup', up); kit.on(tImm, 'pointercancel', up);
      // autoplay walks a few real instructions
      let k = 0, wait = 2.8;
      kit.tick((dt) => {
        if (kit.manual()) return;
        wait -= dt;
        if (wait <= 0) { k = (k + 1) % RV_DEMO.length; [st.op, st.rd, st.rs1, st.imm] = RV_DEMO[k]; render(); wait = 3.1; }
      });
      // a differential check every few seconds: the simulator and the core agree
      const ok = kit.$('.rv-ok');
      let chk = 1.2;
      kit.tick((dt) => { chk -= dt; if (chk <= 0) { chk = 2.6; gsap.fromTo(ok, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3, ease: 'back.out(2)' }); gsap.to(ok, { opacity: 0, duration: 0.4, delay: 1.3 }); } });
      render(true);
      return { still() { gsap.set(ok, { opacity: 1 }); } };
    },
    activate(k, kit) {
      if (k !== 'asm') return false;
      const sel = kit.el.querySelector('.fk-sel select');
      if (!sel) return false;
      const ks = Object.keys(RV_OPS);
      sel.value = ks[(ks.indexOf(sel.value) + 1) % ks.length];
      sel.dispatchEvent(new Event('change'));
      return true;
    },
  });

  /* =========================================================
     Research: FinChrona, the Treasury curve at every month-end
     ========================================================= */
  // the curves are the dataset itself: the last trading day of each month from the
  // v1.0.0 Parquet, in basis points (assets/data/finchrona-monthly.json, 10 KB
  // compressed). Fetched once, when the figure is first built
  const FC_URL = 'assets/data/finchrona-monthly.json';
  let fcData = null, fcLoad = null, fcLast = null;
  const fcFetch = () => fcLoad || (fcLoad = fetch(FC_URL)
    .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then((d) => (fcData = d), (e) => { fcLoad = null; throw e; }));
  const FC_NOM = ['1M', '3M', '6M', '1Y', '2Y', '3Y', '5Y', '7Y', '10Y', '20Y', '30Y'];
  const FC_REAL = ['5Y', '7Y', '10Y', '20Y', '30Y'];
  const FC_YRS = { '1M': 1 / 12, '3M': 0.25, '6M': 0.5, '1Y': 1, '2Y': 2, '3Y': 3, '5Y': 5, '7Y': 7, '10Y': 10, '20Y': 20, '30Y': 30 };
  const FC_MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const FC_LO = -2, FC_HI = 10, FC_SLO = -1.5, FC_SHI = 3;      // percent: the curve's scale, then the spread's
  // one step per month, from January 1990 to the release's last month (October 2026 in v1.0.0)
  const FC_MONTHS = (() => { const [y, m] = D.finchrona.coverage[0].to.split('-').map(Number); return (y - 1990) * 12 + m; })();
  const FC_L = {
    wide: { W: 600, H: 436, X0: 54, X1: 586, CY0: 62, CY1: 246, MY: 265, TY0: 320, TY1: 388, RY: 394, YY: 424, years: 5, mats: FC_NOM },
    tall: { W: 360, H: 560, X0: 46, X1: 346, CY0: 98, CY1: 330, MY: 350, TY0: 410, TY1: 494, RY: 500, YY: 532, years: 10, mats: ['1M', '6M', '2Y', '5Y', '10Y', '30Y'] },
  };
  const fcX = (G, k) => G.X0 + (G.X1 - G.X0) * Math.log(FC_YRS[k] * 12) / Math.log(30 * 12);
  const fcY = (G, v) => G.CY1 - (G.CY1 - G.CY0) * (v - FC_LO) / (FC_HI - FC_LO);
  const fcT = (G, i) => G.X0 + (G.X1 - G.X0) * i / (FC_MONTHS - 1);
  const fcS = (G, s) => G.TY1 - (G.TY1 - G.TY0) * (Math.max(FC_SLO, Math.min(FC_SHI, s)) - FC_SLO) / (FC_SHI - FC_SLO);
  const fcYM = (i) => ({ y: 1990 + Math.floor(i / 12), m: i % 12 });
  const fcPct = (bp) => (bp < 0 ? '−' : '') + (Math.abs(bp) / 100).toFixed(2);

  def('finchrona', {
    label: 'FinChrona: the U.S. Treasury nominal par yield curve at every month-end from January 1990 to October 2026, with real (TIPS) par yields from 2003, drawn from the dataset itself. Below it, the month-end spread between the 10-year and 2-year yields, red where the curve was inverted, with a tick for every month that had inverted days.',
    tall: true,
    // the timeline is dragged, not pinned: a tap on it moves the month instead
    activate: (k) => k === 'clock',
    svg(L) {
      const id = 'finchrona', g = FC_L[L], tall = L === 'tall', z = fcS(g, 0);
      let b = `<defs><clipPath id="${id}-${L}-up"><rect x="0" y="0" width="${g.W}" height="${f(z)}"/></clipPath>` +
        `<clipPath id="${id}-${L}-dn"><rect x="0" y="${f(z)}" width="${g.W}" height="${f(g.H - z)}"/></clipPath></defs>`;
      b += text(14, 26, 'Par yield curve, month-end', 'f-kicker');
      b += text(tall ? 14 : g.X1, tall ? 58 : 30, '', 'f-big fc-date', tall ? 'start' : 'end');
      const lx = tall ? 14 : g.X0, ly = tall ? 82 : 50;
      b += line(lx, ly - 4, lx + 22, ly - 4, 'fc-nom') + text(lx + 28, ly, 'nominal', 'f-mono f-tiny');
      b += `<g class="fc-real-g">${line(lx + 108, ly - 4, lx + 130, ly - 4, 'fc-real')}${text(lx + 136, ly, 'real (TIPS)', 'f-mono f-tiny')}</g>`;
      for (let v = FC_LO; v <= FC_HI; v += 2) {
        const y = fcY(g, v);
        b += line(g.X0, y, g.X1, y, v === 0 ? 'f-axis' : 'f-grid') +
          text(g.X0 - 8, y + 4, v === FC_HI ? v + '%' : (v < 0 ? '−' : '') + Math.abs(v), 'f-mono f-tiny', 'end');
      }
      FC_NOM.forEach((k) => { const x = fcX(g, k); b += line(x, g.CY1, x, g.CY1 + 4, 'f-axis'); });
      g.mats.forEach((k) => { b += text(fcX(g, k), g.MY, k, 'f-mono f-tiny', 'middle'); });
      // the curves are filled in once the data is in
      b += part('real', `<g class="fc-real-g">${path('M0,0', 'fc-hitline')}${path('M0,0', 'fc-real fc-real-c')}</g>`);
      b += part('curve', path('M0,0', 'fc-hitline') + path('M0,0', 'fc-gap') + path('M0,0', 'fc-nom fc-nom-c f-draw'));
      // the points are not parts: hovering one shows the dataset row it comes from
      let pts = '';
      FC_NOM.forEach((k, q) => { pts += `<g class="fc-pg fc-pn f-soft" data-q="${q}" style="display:none">${circle(0, 0, 9, 'f-hit')}${circle(0, 0, 3.6, 'fc-pt')}</g>`; });
      FC_REAL.forEach((k, q) => { pts += `<g class="fc-pg fc-pr fc-real-g f-soft" data-q="${q}" style="display:none">${circle(0, 0, 9, 'f-hit')}${circle(0, 0, 3.4, 'fc-pt fc-pt-r')}</g>`; });
      b += `<g class="fc-pts">${pts}</g>`;

      // the timeline: drag anywhere along it
      b += text(14, g.TY0 - 26, '10-year minus 2-year, month-end', 'f-note');
      let tl = part('clock', rect(g.X0 - 10, g.TY0 - 22, g.X1 - g.X0 + 20, g.RY - g.TY0 + 40, 'f-hit'));
      tl += part('spread', path('M0,0', 'fc-sp-up', `clip-path="url(#${id}-${L}-up)"`) +
        path('M0,0', 'fc-sp-dn', `clip-path="url(#${id}-${L}-dn)"`) + path('M0,0', 'fc-sp f-draw') + line(g.X0, z, g.X1, z, 'f-axis'));
      tl += part('inv', rect(g.X0, g.RY - 2, g.X1 - g.X0, 14, 'f-hit') + path('M0,0', 'fc-rug'));
      for (let y = 1990; y <= 2026; y += g.years) {
        const x = fcT(g, (y - 1990) * 12);
        tl += line(x, g.RY + 12, x, g.RY + 16, 'f-axis') + text(x, g.YY, String(y), 'f-mono f-tiny', 'middle');
      }
      tl += `<g class="fc-cur" transform="translate(${g.X0} 0)">${line(0, g.TY0 - 8, 0, g.RY + 12, 'fc-cur-l')}` +
        `${path(`M0,${g.TY0 - 8} l-6,-10 h12 z`, 'f-head')}${text(9, g.TY0 - 10, '', 'f-num f-num-sm fc-sv')}</g>`;
      b += `<g class="fc-tl">${tl}</g>`;
      b += text(g.X0 - 8, fcS(g, 2) + 4, '+2', 'f-mono f-tiny', 'end') + text(g.X0 - 8, z + 4, '0', 'f-mono f-tiny', 'end');
      return svg(id, g.W, g.H, b, this.label);
    },
    mount(kit) {
      const g = FC_L[kit.layout], $ = kit.$;
      const nom = $('.fc-nom-c'), real = $('.fc-real-c'), gap = $('.fc-gap'), hits = kit.$$('.fc-hitline');
      const pn = kit.$$('.fc-pn'), pr = kit.$$('.fc-pr');
      const date = $('.fc-date'), cur = $('.fc-cur'), sv = $('.fc-sv'), strip = $('.fc-tl');
      const st = { t: fcLast != null ? fcLast : 0 };
      let d = null, shown = -1, hover = null, showReal = true, dragging = false, hold = 0, alive = true, still = false;

      // a curve between two month-ends: interpolated where both exist, never filled across a gap
      const at = (rows, t, w) => {
        const i = Math.floor(t), j = Math.min(FC_MONTHS - 1, i + 1), u = t - i, a = rows[i], c = rows[j];
        return Array.from({ length: w }, (_, q) => {
          const va = a ? a[q] : null, vc = c ? c[q] : null;
          if (va == null || vc == null) return u < 0.5 ? (va == null ? null : va / 100) : (vc == null ? null : vc / 100);
          return (va + (vc - va) * u) / 100;
        });
      };
      // solid between neighbouring maturities; across a missing one, only a dashed bridge
      const trace = (keys, vals) => {
        let s = '', br = '', last = '', broke = false;
        keys.forEach((k, q) => {
          if (vals[q] == null) { broke = !!last; return; }
          const p = f(fcX(g, k)) + ',' + f(fcY(g, vals[q]));
          if (broke) br += `M${last}L${p}`;
          s += (last && !broke ? 'L' : 'M') + p;
          last = p; broke = false;
        });
        return [s || 'M0,0', br || 'M0,0'];
      };
      const place = (pts, keys, vals) => pts.forEach((p, q) => {
        if (vals[q] == null) { p.style.display = 'none'; return; }
        p.style.display = ''; p.setAttribute('transform', `translate(${f(fcX(g, keys[q]))} ${f(fcY(g, vals[q]))})`);
      });

      function say(i) {
        const n = d.n[i], v2 = n[4], v10 = n[8], { y, m } = fcYM(i);
        let s = `${FC_MON[m]} ${y}: 2-year ${fcPct(v2)}%, 10-year ${fcPct(v10)}%, spread ${v10 >= v2 ? '+' : '−'}${(Math.abs(v10 - v2) / 100).toFixed(2)} points`;
        if (d.inv[i]) s += `, inverted on ${d.inv[i]} of ${d.td[i]} trading days`;
        const r = d.r[i];
        if (showReal && r && r[2] != null) s += `; real 10-year ${fcPct(r[2])}%`;
        return s;
      }
      // the row a point comes from, in the dataset's own columns
      function row(kind, q) {
        const i = Math.round(st.t), rows = kind === 'n' ? d.n : d.r, v = rows[i] && rows[i][q];
        if (v == null) return null;
        const k = (kind === 'n' ? FC_NOM : FC_REAL)[q], mo = k.endsWith('M');
        const { y, m } = fcYM(i);
        return `observation_date ${y}-${String(m + 1).padStart(2, '0')}-${String(d.day[i]).padStart(2, '0')} · curve_type ${kind === 'n' ? 'par_nominal' : 'par_real'} · quote_basis par_yield · maturity_label ${k} · maturity_value ${parseFloat(k).toFixed(1)} · maturity_unit ${mo ? 'month' : 'year'} · value_pct ${(v / 100).toFixed(2)}`;
      }

      function paint() {
        if (!d) return;
        const t = st.t, vn = at(d.n, t, FC_NOM.length), vr = showReal ? at(d.r, t, FC_REAL.length) : FC_REAL.map(() => null);
        const [pn0, gn0] = trace(FC_NOM, vn), [pr0] = trace(FC_REAL, vr);
        nom.setAttribute('d', pn0); gap.setAttribute('d', gn0); hits[1].setAttribute('d', pn0);
        real.setAttribute('d', pr0); hits[0].setAttribute('d', pr0);
        place(pn, FC_NOM, vn); place(pr, FC_REAL, vr);
        const x = fcT(g, t);
        cur.setAttribute('transform', `translate(${f(x)} 0)`);
        const i = Math.round(t);
        if (i === shown) return;
        shown = i;
        const { y, m } = fcYM(i), n = d.n[i], s = n[8] - n[4];
        date.textContent = `${d.day[i]} ${FC_MON[m]} ${y}`;
        sv.textContent = (s >= 0 ? '+' : '−') + (Math.abs(s) / 100).toFixed(2);
        sv.setAttribute('text-anchor', x > g.X1 - 60 ? 'end' : 'start');
        sv.setAttribute('x', x > g.X1 - 60 ? -9 : 9);
        sv.classList.toggle('f-red-text', s < 0);
        if (stepper) stepper.set(i);
        if (!hover) kit.status(say(i));
      }

      // the spread, its two shaded sides and a tick for every month with inverted days
      function build() {
        let ln = '', rug = '';
        d.n.forEach((r, i) => {
          const x = f(fcT(g, i));
          ln += (i ? 'L' : 'M') + x + ',' + f(fcS(g, (r[8] - r[4]) / 100));
          if (d.inv[i]) rug += `M${x},${f(g.RY)}v${f(Math.max(1.5, 10 * d.inv[i] / d.td[i]))}`;
        });
        const z = f(fcS(g, 0)), area = ln + `L${f(g.X1)},${z}L${f(g.X0)},${z}Z`;
        $('.fc-sp').setAttribute('d', ln);
        $('.fc-sp-up').setAttribute('d', area);
        $('.fc-sp-dn').setAttribute('d', area);
        $('.fc-rug').setAttribute('d', rug || 'M0,0');
      }
      function ready(data) {
        if (!alive) return;
        d = data;
        build();
        if (still) st.t = FC_MONTHS - 1;
        shown = -1;
        paint();
      }

      // hover or tap a point for its row
      const show = (p) => {
        if (!d) return;
        const r = row(p.classList.contains('fc-pr') ? 'r' : 'n', +p.dataset.q);
        if (!r) return;
        if (hover) hover.classList.remove('is-on');
        hover = p; p.classList.add('is-on');
        kit.interact(); kit.status(r);
      };
      const hide = () => { if (!hover) return; hover.classList.remove('is-on'); hover = null; if (d) kit.status(say(Math.round(st.t))); };
      // a finger on the drawing holds the month still, and a point answers as soon as it is
      // touched, so it cannot slide away from under the finger before the tap ends
      kit.on(kit.svg, 'pointerdown', (e) => { if (e.pointerType !== 'mouse') kit.interact(); });
      [...pn, ...pr].forEach((p) => {
        kit.on(p, 'pointerenter', (e) => { if (e.pointerType === 'mouse') show(p); });
        kit.on(p, 'pointerleave', (e) => { if (e.pointerType === 'mouse') hide(); });
        kit.on(p, 'pointerdown', (e) => { if (e.pointerType === 'mouse') return; e.stopPropagation(); if (hover === p) hide(); else show(p); });
        kit.on(p, 'click', (e) => { e.stopPropagation(); if ((e.pointerType || 'mouse') === 'mouse' && hover !== p) show(p); });
      });

      // drag along the timeline to choose the month
      const toT = (e) => {
        const p = kit.svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
        const q = p.matrixTransform(kit.svg.getScreenCTM().inverse());
        return Math.round(Math.max(0, Math.min(FC_MONTHS - 1, (q.x - g.X0) / (g.X1 - g.X0) * (FC_MONTHS - 1))));
      };
      kit.on(strip, 'pointerdown', (e) => {
        if (!d) return;
        dragging = true; strip.setPointerCapture(e.pointerId); kit.interact(); hide();
        st.t = toT(e); hold = 0; paint(); e.preventDefault();
      });
      kit.on(strip, 'pointermove', (e) => { if (!dragging) return; kit.interact(); st.t = toT(e); paint(); });
      const end = () => { dragging = false; };
      kit.on(strip, 'pointerup', end); kit.on(strip, 'pointercancel', end);

      // left alone, it runs through the decades, waits at the latest month, then starts again
      kit.tick((dt) => {
        if (!d || dragging || hover || kit.manual()) return;
        if (hold > 0) { hold -= dt; if (hold <= 0) { st.t = 0; paint(); } return; }
        st.t = Math.min(FC_MONTHS - 1, st.t + 15 * dt);
        paint();
        if (st.t >= FC_MONTHS - 1) hold = 2.8;
      });

      const stepper = kit.stepper('Month', { value: Math.round(st.t), min: 0, max: FC_MONTHS - 1, px: 2,
        format: (v) => { const { y, m } = fcYM(v); return `${FC_MON[m]} ${y}`; },
        onChange: (v) => { hide(); st.t = v; hold = 0; paint(); } });
      kit.segment([['n', 'Nominal'], ['nr', 'Nominal and real']], 'nr', (v) => {
        showReal = v === 'nr';
        kit.svg.classList.toggle('fc-no-real', !showReal);
        hide(); shown = -1; paint();
      }, { label: 'Which curves to draw' });

      if (fcData) ready(fcData);
      else {
        kit.status('Loading the 442 month-end curves from the dataset');
        fcFetch().then(ready, () => { if (alive) kit.status('The curves could not be loaded here; the dataset itself is linked below.'); });
      }
      return {
        still() { still = true; if (d) { st.t = FC_MONTHS - 1; shown = -1; paint(); } },
        destroy() { alive = false; fcLast = st.t; },
      };
    },
  });

  /* =========================================================
     Research: BRDO, three readings of the first sample
     ========================================================= */
  const BR = () => D.brdo;
  const BR_VIEWS = [['trace', 'Trace'], ['status', 'Status'], ['anchors', 'Anchors']];
  const BR_SAY = {
    trace: 'How many of the 93 listed ISINs reach each stage on the way back to the contract. The stages are not nested',
    status: 'What the reviewed record says about each instrument this quarter: one status each, from a closed list that is never merged',
    anchors: 'Every anchor names a file by its hash, a page and the words relied on, and the checker re-tests all of them',
  };
  const BR_H = { wide: 392, tall: 520 };
  // the waffle: one cell per anchor, column by column, so the scan reads them in order
  const BR_GRID = { wide: { x: 14, y: 70, cols: 57, rows: 22, p: 10, c: 8 }, tall: { x: 28, y: 70, cols: 38, rows: 33, p: 8, c: 6.4 } };

  function brView(view, L) {
    const B = BR(), tall = L === 'tall', W = tall ? 360 : 600;
    let b = '';
    if (view === 'trace') {
      const top = 48, step = tall ? 58 : 41, bh = tall ? 12 : 10, BW = W - 28;
      b += text(14, 22, 'From breach report to contract', 'f-kicker');
      B.trace.forEach(([t, n], i) => {
        const y = top + i * step, last = i === B.trace.length - 1;
        let gg = rect(4, y - 8, W - 8, step - 2, 'f-hit') + text(14, y + 10, t, 'f-label') +
          text(W - 14, y + 10, String(n), 'f-num' + (last ? ' f-red-text' : ''), 'end') +
          rect(14, y + 18, BW, bh, 'br-track f-soft') + rect(14, y + 18, Math.max(0.01, BW * n / B.traceOf), bh, 'f-bar br-bar');
        if (last) gg += rect(14, y + 18, BW, bh, 'br-break');
        b += part('s' + i, gg, 'br-row');
      });
      b += text(14, top + B.trace.length * step + (tall ? 4 : 6), `Out of ${B.traceOf} listed ISINs; the stages are not nested`, 'f-note');
    } else if (view === 'status') {
      const S = B.status, total = S.reduce((a, s) => a + s[1], 0);
      const cell = tall ? 24 : 20, cw = tall ? 20 : 16, cols = 12;
      const gx = tall ? (W - cols * cell) / 2 : 344, gy = tall ? 64 : 66;
      b += text(14, 26, tall ? 'Status, quarter to 30 June 2026' : 'Status per instrument, quarter to 30 June 2026', 'f-kicker');
      b += text(14, 46, `${total} instruments · one status each`, 'f-note');
      let k = 0, cells = '';
      S.forEach(([, n], s) => {
        for (let j = 0; j < n; j++, k++) {
          const x = gx + (k % cols) * cell, y = gy + Math.floor(k / cols) * cell;
          cells += rect(x, y, cw, cw, `br-cell br-k${s} f-soft`, `data-rel="k${s}"`);
        }
      });
      b += `<g class="br-cells">${cells}</g>`;
      const lx = 14, ly = tall ? gy + 8 * cell + 34 : 84, lstep = tall ? 27 : 32, lw = tall ? W - 28 : 304;
      S.forEach(([name, n], s) => {
        const y = ly + s * lstep;
        b += part('k' + s, rect(lx - 6, y - 17, lw + 12, lstep - 2, 'f-hit') + rect(lx, y - 10, 11, 11, `br-sw br-k${s} f-soft`) +
          text(lx + 20, y, name, 'f-mono') + text(lx + lw, y, String(n), 'f-num f-num-sm' + (n ? '' : ' br-zero'), 'end'), 'br-st');
      });
      b += text(14, ly + S.length * lstep + 4, 'None implies another: no report is not compliance', 'f-note');
    } else {
      const A = B.anchors, G0 = BR_GRID[L], gw = G0.cols * G0.p, gh = G0.rows * G0.p;
      b += text(14, 26, 'Evidence anchors, re-tested', 'f-kicker');
      b += text(14, 46, tall ? `${A.total.toLocaleString('en-GB')} anchors: hash, page and quotation` : `${A.total.toLocaleString('en-GB')} anchors: a file by its hash, a page, the words relied on`, 'f-note');
      b += `<defs><pattern id="brdo-${L}-pend" width="${G0.p}" height="${G0.p}" patternUnits="userSpaceOnUse" x="${G0.x}" y="${G0.y}"><rect class="br-pend" width="${G0.c}" height="${G0.c}"/></pattern>` +
        `<pattern id="brdo-${L}-ink" width="${G0.p}" height="${G0.p}" patternUnits="userSpaceOnUse" x="${G0.x}" y="${G0.y}"><rect class="br-ink" width="${G0.c}" height="${G0.c}"/></pattern>` +
        `<clipPath id="brdo-${L}-scan"><rect class="br-scan-r" x="${G0.x}" y="${G0.y - 2}" width="0" height="${gh + 4}"/></clipPath></defs>`;
      // which anchors were read from the rendered page: a fixed scatter, so it looks the same on every visit
      const rnd = rng(1254), vis = new Set();
      while (vis.size < A.visual) vis.add(Math.floor(rnd() * A.total));
      let vcells = '';
      vis.forEach((k) => {
        const x = G0.x + Math.floor(k / G0.rows) * G0.p, y = G0.y + (k % G0.rows) * G0.p;
        vcells += rect(x, y, G0.c, G0.c, 'br-vis');
      });
      b += rect(G0.x, G0.y, gw, gh, 'br-pendr f-soft', `fill="url(#brdo-${L}-pend)"`);
      b += `<g clip-path="url(#brdo-${L}-scan)">${rect(G0.x, G0.y, gw, gh, 'br-inkr', `fill="url(#brdo-${L}-ink)" data-rel="mach"`)}<g data-rel="vis">${vcells}</g></g>`;
      b += part('check', `<g class="br-scan" transform="translate(${G0.x} 0)">${line(0, G0.y - 10, 0, G0.y + gh + 6, 'br-scan-l')}` +
        `${text(5, G0.y - 4, 'brdo verify', 'f-mono f-tiny f-red-text br-scan-t')}</g>`);
      const ly = G0.y + gh + (tall ? 36 : 34), lstep = tall ? 34 : 30, lw = W - 28;
      [['mach', 'br-sw br-ink', tall ? 'Verified by machine' : 'Verified by machine against the text layer', A.machine],
       ['vis', 'br-sw br-vis', tall ? 'Read from the rendered page' : 'Read from the rendered page, reported separately', A.visual]].forEach(([k, c, t, n], i) => {
        const y = ly + i * lstep;
        b += part(k, rect(8, y - 17, lw + 12, lstep - 2, 'f-hit') + rect(14, y - 10, 11, 11, c) + text(34, y, t, 'f-label') +
          text(14 + lw, y, n.toLocaleString('en-GB'), 'f-num', 'end'));
      });
    }
    return b;
  }

  def('brdo', {
    label: 'BRDO, from its own report for the quarter to 30 June 2026. Trace: of 93 ISINs listed in trustees’ breach reports, 59 are named in a notice to holders, 52 have a trust deed cited, 44 have the clause printed, 17 are named in the issuer’s own statement, 14 are linked to a transcribed clause, 5 have a contract located that cannot be retrieved, and none has its contract retrieved. Status: 90 reported breach, 3 no report found, 2 conflicting, 1 not assessed. Anchors: 1,254, of which 1,147 verified by machine and 107 read from the rendered page.',
    tall: true,
    svg(L) {
      return svg('brdo', L === 'tall' ? 360 : 600, BR_H[L], `<g class="br-view">${brView('trace', L)}</g>`, this.label);
    },
    mount(kit) {
      const gsap = G(), g = kit.$('.br-view'), tall = kit.layout === 'tall';
      let cur = 'trace', tl = null;
      const B = BR(), n = B.trace.length;
      const replay = kit.button('Replay the trace', () => trace());
      const verify = kit.button('Run verify', () => scan(), { icon: '›' });
      verify.hidden = true;

      function trace() {
        if (tl) { tl.kill(); tl = null; }
        const bars = kit.$$('.br-bar');
        kit.status(BR_SAY.trace);
        if (kit.calm) { gsap.set(bars, { scaleX: 1 }); return; }
        gsap.set(bars, { scaleX: 0, transformOrigin: '0% 50%' });
        // one stage at a time, the way a reader would follow an ISIN back towards its contract
        tl = kit.timeline({ repeat: -1, repeatDelay: 3.4 });
        tl.set(bars, { scaleX: 0 });
        B.trace.forEach(([t, v], i) => {
          tl.to(bars[i], { scaleX: 1, duration: 0.7, ease: 'expo.out' }, i * 0.62)
            .call(() => kit.status(i === n - 1 ? `${i + 1} of ${n} · ${t}: ${v}. The trace breaks here, for access: the exchanges and platforms that hold the contracts refuse automated readers` : `${i + 1} of ${n} · ${t}: ${v} of ${B.traceOf}`), null, i * 0.62);
        });
        const brk = kit.$('.br-break');
        if (brk) tl.fromTo(brk, { opacity: 0.25 }, { opacity: 1, duration: 0.18, repeat: 3, yoyo: true, ease: 'none' }, (n - 1) * 0.62 + 0.2);
      }
      function scan() {
        if (tl) { tl.kill(); tl = null; }
        const G0 = BR_GRID[kit.layout], A = B.anchors, gw = G0.cols * G0.p;
        const r = kit.$('.br-scan-r'), ln = kit.$('.br-scan'), lab = kit.$('.br-scan-t'), total = A.total.toLocaleString('en-GB');
        // the label rides on the right of the line, then crosses to its left so it never leaves the drawing
        const side = (p) => { const end = p > 0.78; lab.setAttribute('x', end ? -5 : 5); lab.setAttribute('text-anchor', end ? 'end' : 'start'); };
        const done = `brdo verify: ${A.machine.toLocaleString('en-GB')} verified by machine and ${A.visual} read from the rendered page, so all ${total} are accounted for`;
        if (kit.calm) { r.setAttribute('width', gw + 1); ln.setAttribute('transform', `translate(${f(G0.x + gw)} 0)`); side(1); kit.status(done); return; }
        const s = { p: 0 };
        tl = kit.timeline({ onComplete: () => kit.status(done) });
        tl.to(s, { p: 1, duration: 3.2, ease: 'none', onUpdate: () => {
          r.setAttribute('width', f(gw * s.p + (s.p >= 1 ? 1 : 0)));
          ln.setAttribute('transform', `translate(${f(G0.x + gw * s.p)} 0)`);
          side(s.p);
          kit.status(`brdo verify: checking ${Math.round(A.total * s.p).toLocaleString('en-GB')} of ${total} anchors against their files`);
        } });
      }
      function go(v) {
        if (v === cur) return;
        cur = v;
        if (tl) { tl.kill(); tl = null; }
        kit.redrawn();
        replay.hidden = v !== 'trace';
        verify.hidden = v !== 'anchors';
        const swap = () => {
          g.innerHTML = brView(v, kit.layout);
          if (v === 'trace') trace();
          else if (v === 'anchors') scan();
          else {
            kit.status(BR_SAY.status);
            if (!kit.calm) gsap.from(kit.$$('.br-cell'), { scale: 0, transformOrigin: '50% 50%', duration: 0.4, ease: 'back.out(2)', stagger: 0.008 });
          }
          if (kit.calm) return;
          gsap.fromTo(g, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.35, ease: 'power3.out' });
        };
        if (kit.calm) swap(); else gsap.to(g, { opacity: 0, x: 8, duration: 0.15, ease: 'power1.in', onComplete: swap });
      }
      kit.segment(BR_VIEWS, 'trace', go, { label: 'Which reading to show' });
      // until the trace runs, its bars wait at zero, so the first look does not flash them full
      if (!kit.calm) gsap.set(kit.$$('.br-bar'), { scaleX: 0, transformOrigin: '0% 50%' });
      trace();
      return { still() { gsap.set(kit.$$('.br-bar'), { scaleX: 1 }); kit.status(BR_SAY.trace); } };
    },
  });

  /* =========================================================
     Quant: small working drawings for the cards
     ========================================================= */
  const MACRO = [['TLT, event day', 0.15], ['TLT, next day', -0.29], ['VIX, one week', -1.63]];
  def('macro', {
    label: 'Average reactions after macro releases: long bonds (TLT) up 0.15% on the event day and down 0.29% the next; VIX down 1.63% one week after positive surprises.',
    compact: true, still: true,
    svg() {
      const Z = 238, S = 56;
      let b = '';
      [-2, -1, 0].forEach((v) => {
        const x = Z + v * S;
        b += line(x, 6, x, 150, v ? 'f-grid' : 'f-axis') + text(x, 168, (v < 0 ? '−' : '') + Math.abs(v) + '%', 'f-mono f-tiny', 'middle');
      });
      MACRO.forEach(([k, v], i) => {
        const y = 10 + i * 48, w = Math.abs(v) * S;
        b += part('m' + i, rect(0, y - 4, 300, 46, 'f-hit') + text(10, y + 11, k, 'f-mono') +
          rect(v < 0 ? Z - w : Z, y + 20, w, 16, v < 0 ? 'f-bar f-bar-red q-bar' : 'f-bar q-bar') +
          text(v < 0 ? Z - w - 6 : Z + w + 6, y + 33, (v > 0 ? '+' : '−') + Math.abs(v).toFixed(2) + '%', 'f-num f-num-sm', v < 0 ? 'end' : 'start'));
      });
      return svg('macro', 300, 178, b, this.label);
    },
  });

  def('benford', {
    label: 'Benford’s first-digit law: a leading 1 appears about 30.1% of the time, falling to about 4.6% for a leading 9, against 11.1% each if digits were uniform.',
    compact: true, still: true,
    notes() {
      const n = {};
      for (let d = 1; d <= 9; d++) n['d' + d] = [`Leading ${d}`, `Benford’s Law expects ${(100 * Math.log10(1 + 1 / d)).toFixed(1)}% of figures to start with a ${d}.`];
      n.uni = ['Uniform', 'If every leading digit were equally likely: 11.1% each. Real financial figures follow Benford instead, so large departures are worth a closer look.'];
      return n;
    },
    svg() {
      const P = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => Math.log10(1 + 1 / d));
      const X0 = 30, BW = 24, GP = 5, Y0 = 146, S = 330;
      let b = line(X0 - 6, Y0, X0 + 9 * (BW + GP), Y0, 'f-axis');
      let pts = '';
      P.forEach((p, i) => {
        const x = X0 + i * (BW + GP), h = p * S;
        b += part('d' + (i + 1), rect(x, Y0 - h, BW, h, i === 0 ? 'f-bar f-bar-red q-bar' : 'f-bar q-bar') + text(x + BW / 2, Y0 + 16, String(i + 1), 'f-mono f-tiny', 'middle'));
        pts += (i ? ' L' : 'M') + f(x + BW / 2) + ',' + f(Y0 - h - 7);
      });
      b += path(pts, 'f-curve');
      const yu = Y0 - S / 9;
      b += part('uni', line(X0 - 6, yu, X0 + 9 * (BW + GP), yu, 'f-uni') + text(X0 + 9 * (BW + GP), yu - 6, 'uniform 11.1%', 'f-mono f-tiny', 'end'));
      b += text(X0 + BW / 2, Y0 - P[0] * S - 14, '30.1%', 'f-num f-num-sm', 'middle');
      b += `<text class="f-mono" x="292" y="22" text-anchor="end">P(d) = log<tspan class="f-sub" dy="4">10</tspan><tspan dy="-4">(1 + 1/d)</tspan></text>`;
      return svg('benford', 300, 178, b, this.label);
    },
  });

  def('splm', {
    label: 'SPLM: parking-lot activity from Sentinel-2 imagery and analyst momentum feed a divergence engine that outputs a signal between minus one and plus one.',
    compact: true,
    svg() {
      const id = 'splm';
      let b = node(6, 14, 112, 44, 'Sentinel-2', 'NDBI, 10 m', 'f-box', 'sat');
      b += node(6, 96, 112, 44, 'Analysts', 'momentum', 'f-box', 'analysts');
      b += node(144, 54, 74, 44, 'Diverge', '', 'f-box f-box-ink', 'diverge');
      b += arrow(id, 'M118,36 C132,36 128,68 142,70', 'f-line', 'sat diverge');
      b += arrow(id, 'M118,118 C132,118 128,84 142,82', 'f-line', 'analysts diverge');
      b += arrow(id, 'M218,76 L232,76', 'f-line', 'diverge signal');
      const X0 = 240, X1 = 292;
      let s = line(X0, 76, X1, 76, 'f-axis');
      [[-1, X0], [0, (X0 + X1) / 2], [1, X1]].forEach(([v, x]) => { s += line(x, 71, x, 81, 'f-axis') + text(x, 98, (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v), 'f-mono f-tiny', 'middle'); });
      s += `<g class="splm-needle">${path(`M${(X0 + X1) / 2},67 l-5,-10 h10 z`, 'f-head')}</g>`;
      b += part('signal', rect(X0 - 8, 50, X1 - X0 + 16, 56, 'f-hit') + s);
      b += text(150, 166, '12 retailers · point-in-time, no look-ahead', 'f-note', 'middle');
      return svg(id, 300, 178, b, this.label);
    },
    mount(kit) {
      const n = kit.$('.splm-needle');
      kit.timeline({ repeat: -1, yoyo: true }).to(n, { x: 22, duration: 1.6, ease: 'sine.inOut' }).to(n, { x: -24, duration: 2.2, ease: 'sine.inOut' });
      return {};
    },
  });

  def('oceanic', {
    label: 'Oceanic Edge, illustrative: ships inside a port geofence are timed, and dwell time becomes a congestion index.',
    compact: true,
    svg() {
      let b = path('M14,154 C36,120 28,98 56,86 C90,72 94,42 132,38 C168,34 176,60 212,64 C236,66 250,52 286,48', 'f-coast f-draw');
      b += part('fence', path('M90,98 L186,76 L204,130 L116,152 Z', 'f-fence f-draw f-dash') + text(214, 106, 'geofence', 'f-mono f-tiny'));
      const ships = [[118, 112], [148, 100], [166, 122], [134, 134], [238, 84], [262, 116], [282, 74]];
      let s = '';
      // the hull moves inside a positioned group, so resetting it never loses the ship's place
      ships.forEach(([x, y], i) => { s += `<g transform="translate(${x} ${y})"><g class="oc-ship">${path('M-5,3 L0,-6 L5,3 Z', i < 4 ? 'f-ship f-ship-in' : 'f-ship')}</g></g>`; });
      b += part('ships', s);
      b += text(292, 170, 'dwell time becomes congestion · 6 ports', 'f-note', 'end');
      return svg('oceanic', 300, 178, b, this.label);
    },
    mount(kit) {
      const out = kit.$$('.oc-ship').slice(4);
      kit.timeline({ repeat: -1, repeatDelay: 0.4 })
        .to(out, { x: '-=72', y: '+=24', duration: 3.2, ease: 'none', stagger: 0.5 })
        .to(out, { opacity: 0, duration: 0.3 }, '>-0.3')
        .set(out, { clearProps: 'transform,opacity' });
      return {};
    },
  });

  /* ---------- registry ---------- */
  return {
    get: (id) => REG[id],
    ids: () => Object.keys(REG),
    winnow: (h, w) => winnow(h, w),
  };

  function winnow(h, w) {
    const picks = [];
    for (let i = 0; i + w <= h.length; i++) {
      let m = i;
      for (let j = i; j < i + w; j++) if (h[j] <= h[m]) m = j;     // rightmost minimum
      picks.push(m);
    }
    return picks;
  }
})();
