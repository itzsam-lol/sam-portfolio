/* ============================================================
   FIGURES: one technical drawing per project, as inline SVG.

   Every figure draws a mechanism the project really has. Where
   a drawing needs numbers it uses the real ones from data.js;
   where it can only be schematic, the caption says so.

   render(id)  -> SVG markup (styled by .fig rules in main.css,
                  so both themes work)
   play(id, el) -> a paused GSAP timeline that loops the
                  mechanism while the figure is on screen
   ============================================================ */

window.Figures = (function () {
  const D = window.DATA;

  /* ---------- tiny SVG vocabulary ---------- */
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const f = (n) => +n.toFixed(2);

  const rect = (x, y, w, h, cls = 'f-box', extra = '') =>
    `<rect class="${cls}" x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" ${extra}/>`;
  // Greek is only in STIX Two Text's subset, so route it there
  const text = (x, y, s, cls = 'f-label', anchor = 'start', extra = '') =>
    `<text class="${cls}" x="${f(x)}" y="${f(y)}" text-anchor="${anchor}" ${extra}>${esc(s).replace(/ρ/g, '<tspan class="f-greek">ρ</tspan>')}</text>`;
  const check = (cx, cy, cls = 'f-check') => path(`M${cx - 4},${cy} l3,3 l5,-6`, cls);
  const line = (x1, y1, x2, y2, cls = 'f-line', extra = '') =>
    `<line class="${cls}" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" ${extra}/>`;
  const path = (d, cls = 'f-line', extra = '') => `<path class="${cls}" d="${d}" ${extra}/>`;
  const circle = (cx, cy, r, cls = 'f-dot', extra = '') =>
    `<circle class="${cls}" cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" ${extra}/>`;

  // a labelled block: title centred, optional mono sub-label beneath
  function node(x, y, w, h, title, sub, cls = 'f-box', extra = '') {
    const cy = y + h / 2;
    return `<g class="f-node" ${extra}>${rect(x, y, w, h, cls + ' f-draw')}` +
      (sub
        ? text(x + w / 2, cy - 2, title, 'f-label', 'middle') + text(x + w / 2, cy + 13, sub, 'f-mono', 'middle')
        : text(x + w / 2, cy + 4.5, title, 'f-label', 'middle')) + '</g>';
  }

  // arrow along a path; marker ids are namespaced per figure
  const arrow = (id, d, cls = 'f-line') => path(d, cls + ' f-draw', `marker-end="url(#${id}-ah)"`);
  const defs = (id) => `<defs>
      <marker id="${id}-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path class="f-ah" d="M0,1 L9,5 L0,9 z"/></marker>
      <marker id="${id}-ahr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path class="f-ah-red" d="M0,1 L9,5 L0,9 z"/></marker>
      <pattern id="${id}-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line class="f-hatch" x1="0" y1="0" x2="0" y2="6"/></pattern>
    </defs>`;

  const svg = (id, w, h, body, label) =>
    `<svg class="fig-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}" data-fig="${id}">${defs(id)}${body}</svg>`;

  // deterministic noise, so a figure looks the same on every visit
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  /* =========================================================
     1. CareerOS: pipeline with a validator and a human gate
     ========================================================= */
  function careeros() {
    const id = 'careeros';
    const Y = 66, H = 54, CY = Y + H / 2;
    const N = [
      { x: 14,  w: 76, t: 'Openings', s: 'sources' },
      { x: 108, w: 80, t: 'Match',    s: 'pgvector' },
      { x: 206, w: 76, t: 'Tailor',   s: 'LLM draft' },
      { x: 300, w: 92, t: 'Validate', s: 'vs. profile', cls: 'f-box f-box-red' },
      { x: 410, w: 80, t: 'Approve',  s: 'a person' },
      { x: 508, w: 78, t: 'Send',     s: 'external' },
    ];
    let b = text(14, 34, 'Pipeline', 'f-kicker');
    // applications travel *behind* the stages, so they show between them
    for (let i = 0; i < 4; i++) b += rect(80, CY - 5, 10, 10, 'f-packet', `data-i="${i}" opacity="0"`);
    N.forEach((n) => { b += node(n.x, Y, n.w, H, n.t, n.s, n.cls || 'f-box'); });
    for (let i = 0; i < N.length - 1; i++) {
      if (i === 4) continue;                                   // the gate sits in this gap
      b += arrow(id, `M${N[i].x + N[i].w + 2},${CY} L${N[i + 1].x - 3},${CY}`);
    }
    // reject tray under the validator
    b += path(`M346,${Y + H} L346,156`, 'f-line f-red f-draw f-dash', `marker-end="url(#${id}-ahr)"`);
    b += rect(304, 160, 84, 30, 'f-box f-tray f-draw');
    b += text(346, 179, 'rejected', 'f-mono f-red-text', 'middle');
    b += text(294, 179, 'unsupported claim', 'f-note', 'end');
    // the gate: a bar across the gap into Send, hinged at the top
    b += `<g class="cos-gate">${line(499, CY - 17, 499, CY + 17, 'f-gate')}</g>`;
    b += text(450, 142, 'waits for sign-off', 'f-note', 'middle');

    // monorepo, below
    const MY = 232;
    b += text(14, MY - 18, 'Monorepo', 'f-kicker');
    b += rect(8, MY - 4, 584, 136, 'f-frame f-draw f-dash');
    b += node(24, MY + 14, 118, 40, 'Next.js', 'web', 'f-box');
    b += node(24, MY + 70, 118, 40, 'Expo', 'mobile', 'f-box');
    b += node(176, MY + 40, 128, 44, 'OpenAPI client', 'typed, shared', 'f-box f-box-soft');
    b += node(338, MY + 40, 116, 44, 'FastAPI', 'SQLAlchemy', 'f-box');
    b += node(484, MY + 40, 94, 44, 'PostgreSQL', 'pgvector', 'f-box');
    b += arrow(id, `M142,${MY + 34} C160,${MY + 34} 158,${MY + 56} 174,${MY + 58}`);
    b += arrow(id, `M142,${MY + 90} C160,${MY + 90} 158,${MY + 68} 174,${MY + 66}`);
    b += arrow(id, `M304,${MY + 62} L336,${MY + 62}`);
    b += arrow(id, `M454,${MY + 62} L482,${MY + 62}`);
    b += text(584, MY + 124, 'pnpm workspace · Google Cloud VM', 'f-mono', 'end');

    return svg(id, 600, 380, b, 'CareerOS pipeline: openings are matched, tailored, validated against the profile and approved by a person before anything is sent. Below, the monorepo: web and mobile apps share a typed OpenAPI client in front of a FastAPI service on PostgreSQL with pgvector.');
  }

  function careerosPlay(el) {
    const G = window.gsap;
    const packets = [...el.querySelectorAll('.f-packet')];
    const gate = el.querySelector('.cos-gate');
    const CY = 93;
    G.set(gate, { svgOrigin: '499 76' });
    const tl = G.timeline({ paused: true, repeat: -1, repeatDelay: 0.4 });
    // fate per packet: 1 = rejected at the validator
    const fate = [0, 1, 0, 0];
    packets.forEach((p, i) => {
      const t0 = i * 1.5;
      tl.set(p, { opacity: 0, attr: { x: 80, y: CY - 5, class: 'f-packet' } }, t0)
        .to(p, { opacity: 1, duration: 0.2 }, t0)
        .to(p, { attr: { x: 341 }, duration: 2, ease: 'none' }, t0);
      if (fate[i]) {
        tl.set(p, { attr: { class: 'f-packet is-bad' } }, t0 + 2)
          .to(p, { attr: { y: 170 }, duration: 0.55, ease: 'power2.in' }, t0 + 2)
          .to(p, { opacity: 0, duration: 0.4 }, t0 + 3);
      } else {
        tl.to(p, { attr: { x: 476 }, duration: 0.85, ease: 'none' }, t0 + 2)
          .to(gate, { rotation: -82, duration: 0.35, ease: 'power2.out' }, t0 + 3.2)
          .to(p, { attr: { x: 590 }, duration: 0.7, ease: 'power1.in' }, t0 + 3.3)
          .to(p, { opacity: 0, duration: 0.2 }, t0 + 3.9)
          .to(gate, { rotation: 0, duration: 0.3, ease: 'power2.in' }, t0 + 3.75);
      }
    });
    return tl;
  }

  /* =========================================================
     2. SecondAsk: per-action models, 22 fail-closed rules, results
     ========================================================= */
  function secondask() {
    const id = 'secondask';
    const acts = ['Retry now', 'Retry later', 'Reminder', 'Hold'];
    let b = text(14, 34, 'Decision', 'f-kicker');
    b += node(12, 150, 78, 60, 'Failed', 'payment', 'f-box');
    acts.forEach((a, i) => {
      const y = 72 + i * 58;
      b += arrow(id, `M90,180 C108,180 104,${y + 17} 122,${y + 17}`);
      b += `<g class="sa-act" data-i="${i}">` + rect(124, y, 92, 34, 'f-box f-draw') + text(170, y + 21.5, a, 'f-label', 'middle') + '</g>';
      b += circle(232, y + 17, 11, 'f-chip f-draw') + text(232, y + 21, 'LR', 'f-mono f-tiny', 'middle');
      b += text(250, y + 21, 'p·v−c', 'f-mono');
      b += path(`M292,${y + 17} L320,${y + 17}`, 'f-thin f-draw');
    });
    // rules column
    b += text(330, 62, '22 rules', 'f-mono', 'middle');
    for (let i = 0; i < 22; i++) b += rect(323, 70 + i * 10.4, 14, 8, 'f-rule', `data-i="${i}"`);
    b += arrow(id, 'M340,180 L352,180');
    b += node(354, 152, 38, 56, 'Act', '', 'f-box');
    b += text(330, 312, 'fail closed', 'f-note', 'middle');

    // results: value recovered, real numbers
    const X0 = 432, Y0 = 300, Hs = 230 / 20;               // 20% full scale
    b += text(X0 - 10, 34, 'Value recovered', 'f-kicker');
    b += line(X0, Y0, 588, Y0, 'f-axis');
    [0, 5, 10, 15, 20].forEach((v) => {
      const y = Y0 - v * Hs;
      b += line(X0 - 4, y, X0, y, 'f-axis') + text(X0 - 8, y + 3.5, v + '%', 'f-mono f-tiny', 'end');
      if (v) b += line(X0, y, 588, y, 'f-grid');
    });
    b += rect(458, Y0 - 18.2 * Hs, 46, 18.2 * Hs, 'f-bar f-bar-red sa-bar', 'data-h="' + 18.2 * Hs + '"');
    b += rect(530, Y0 - 8.6 * Hs, 46, 8.6 * Hs, 'f-bar sa-bar', 'data-h="' + 8.6 * Hs + '"');
    b += text(481, Y0 - 18.2 * Hs - 8, '18.2%', 'f-num', 'middle');
    b += text(553, Y0 - 8.6 * Hs - 8, '8.6%', 'f-num', 'middle');
    b += text(481, Y0 + 18, 'SecondAsk', 'f-mono', 'middle');
    b += text(553, Y0 + 18, 'fixed', 'f-mono', 'middle');
    b += text(553, Y0 + 31, 'schedule', 'f-mono', 'middle');
    b += text(510, 360, '12,000 simulated payments', 'f-note', 'middle');

    return svg(id, 600, 380, b, 'SecondAsk: a failed payment fans out to candidate actions, each scored by its own logistic regression and priced; every action must pass 22 fail-closed compliance rules. Value recovered over 12,000 simulated payments: 18.2% versus 8.6% for a fixed retry schedule.');
  }

  function secondaskPlay(el) {
    const G = window.gsap;
    const rules = [...el.querySelectorAll('.f-rule')];
    const acts = [...el.querySelectorAll('.sa-act')];
    const tl = G.timeline({ paused: true, repeat: -1, repeatDelay: 0.6 });
    // two passes: one action blocked by rule 14, then one cleared
    const passes = [{ a: 0, fail: 14 }, { a: 2, fail: -1 }];
    let t = 0;
    passes.forEach((ps) => {
      tl.set(rules, { attr: { class: 'f-rule' } }, t)
        .set(acts, { attr: { class: 'sa-act' } }, t)
        .set(acts[ps.a], { attr: { class: 'sa-act is-on' } }, t);
      const n = ps.fail >= 0 ? ps.fail + 1 : 22;
      for (let i = 0; i < n; i++) {
        tl.set(rules[i], { attr: { class: i === ps.fail ? 'f-rule is-bad' : 'f-rule is-ok' } }, t + 0.25 + i * 0.07);
      }
      t += 0.25 + n * 0.07;
      tl.set(acts[ps.a], { attr: { class: ps.fail >= 0 ? 'sa-act is-bad' : 'sa-act is-go' } }, t);
      t += 1.4;
    });
    return tl;
  }

  /* =========================================================
     3. CodeForge: queue to sandbox, and winnowing
     ========================================================= */
  // the worked example from Schleimer, Wilkerson & Aiken (2003): hashes of
  // the 5-grams of "a do run run run, a do run run", windows of 4
  const W_HASH = [77, 74, 42, 17, 98, 50, 17, 98, 8, 88, 67, 39, 77, 74, 42, 17, 98];
  const W_K = 4;
  function winnow(h, w) {
    const picks = []; let last = -1;
    for (let i = 0; i + w <= h.length; i++) {
      let m = i;
      for (let j = i; j < i + w; j++) if (h[j] <= h[m]) m = j;     // rightmost minimum
      picks.push(m);
      if (m !== last) last = m;
    }
    return picks;                                                  // per-window choice
  }

  function codeforge() {
    const id = 'codeforge';
    const Y = 70, H = 50, CY = Y + H / 2;
    let b = text(14, 34, 'Grading path', 'f-kicker');
    b += node(12, Y, 74, H, 'Candidate', '', 'f-box');
    b += node(100, Y, 100, H, 'Express API', 'server clock', 'f-box');
    b += arrow(id, `M86,${CY} L98,${CY}`);
    // queue
    b += rect(214, Y, 124, H, 'f-box f-draw');
    b += text(276, Y - 8, 'BullMQ on Redis', 'f-mono', 'middle');
    for (let i = 0; i < 6; i++) b += rect(220 + i * 19.6, Y + 15, 14, 20, 'f-slot', `data-i="${i}"`);
    b += arrow(id, `M200,${CY} L212,${CY}`);
    // workers
    for (let i = 0; i < 3; i++) {
      b += rect(362, Y - 8 + i * 24, 44, 18, 'f-box f-draw cf-w', `data-i="${i}"`);
      b += text(384, Y + 5 + i * 24, 'W' + (i + 1), 'f-mono f-tiny', 'middle');
      b += path(`M338,${CY} C350,${CY} 350,${Y + 1 + i * 24} 360,${Y + 1 + i * 24}`, 'f-thin f-draw');
    }
    // sandbox
    b += rect(426, Y - 14, 82, H + 28, 'f-box f-sandbox f-draw');
    b += text(467, CY - 2, 'Judge0', 'f-label', 'middle');
    b += text(467, CY + 13, 'sandbox', 'f-mono', 'middle');
    b += arrow(id, `M406,${CY} L424,${CY}`);
    b += node(522, Y, 68, H, 'Postgres', 'Prisma', 'f-box');
    b += arrow(id, `M508,${CY} L520,${CY}`);
    b += `<g class="cf-verdict" opacity="0">${circle(467, Y + H + 26, 9, 'f-chip')}${check(467, Y + H + 26)}</g>`;

    // winnowing
    const WY = 236, CW = 32, GX = 11;
    b += text(14, WY - 34, 'Winnowing', 'f-kicker');
    b += text(14, WY - 14, 'hashes of 5-grams, window of 4', 'f-note');
    W_HASH.forEach((v, i) => {
      b += rect(GX + i * (CW + 2), WY, CW, 32, 'f-cell', `data-i="${i}"`);
      b += text(GX + i * (CW + 2) + CW / 2, WY + 20.5, String(v), 'f-mono f-cellnum', 'middle', `data-i="${i}"`);
    });
    b += rect(GX - 3, WY - 4, W_K * (CW + 2) + 4, 40, 'f-window');
    b += text(14, WY + 74, 'fingerprints', 'f-mono');
    b += `<g class="cf-prints"></g>`;
    return svg(id, 600, 380, b, 'CodeForge: a candidate submission passes through the Express API, a BullMQ queue on Redis and a pool of workers into a Judge0 sandbox, with results stored in PostgreSQL. Below, winnowing selects the smallest hash in each window of four k-gram hashes as a fingerprint.');
  }

  function codeforgePlay(el) {
    const G = window.gsap;
    const tl = G.timeline({ paused: true, repeat: -1, repeatDelay: 0.8 });
    const slots = [...el.querySelectorAll('.f-slot')];
    const workers = [...el.querySelectorAll('.cf-w')];
    const verdict = el.querySelector('.cf-verdict');
    const cells = [...el.querySelectorAll('.f-cell')];
    const win = el.querySelector('.f-window');
    const prints = el.querySelector('.cf-prints');
    const picks = winnow(W_HASH, W_K);
    const CW = 34;

    // queue fills, drains through workers
    tl.set(slots, { attr: { class: 'f-slot' } }, 0);
    slots.forEach((s, i) => tl.set(s, { attr: { class: 'f-slot is-full' } }, 0.15 + i * 0.12));
    for (let k = 0; k < 6; k++) {
      const t = 1.0 + k * 0.38;
      tl.set(slots[5 - k], { attr: { class: 'f-slot' } }, t)
        .set(workers[k % 3], { attr: { class: 'f-box cf-w is-busy' } }, t)
        .set(workers[k % 3], { attr: { class: 'f-box cf-w' } }, t + 0.32);
    }
    tl.to(verdict, { opacity: 1, duration: 0.25 }, 2.4).to(verdict, { opacity: 0, duration: 0.3 }, 3.3);

    // window slides; record each new fingerprint position
    const picked = new Set();
    const paintCells = (i, m) => cells.forEach((c, j) => c.setAttribute('class', 'f-cell' +
      (picked.has(j) ? ' is-pick' : '') + (j >= i && j < i + W_K ? ' is-in' : '') + (j === m ? ' is-min' : '')));
    tl.set(win, { x: 0 }, 0)
      .call(() => { prints.innerHTML = ''; picked.clear(); paintCells(-9, -1); }, null, 0);
    let last = -1, n = 0;
    picks.forEach((m, i) => {
      const t = 0.4 + i * 0.42;
      tl.to(win, { x: i * CW, duration: 0.3, ease: 'power2.inOut' }, t);
      tl.call(() => paintCells(i, m), null, t + 0.3);
      if (m !== last) {
        const k = n++;
        tl.call(() => {
          picked.add(m); paintCells(i, m);
          const x = 108 + k * 46;
          prints.insertAdjacentHTML('beforeend',
            `<g class="cf-print"><rect class="f-cell is-min" x="${x}" y="296" width="38" height="24"/>` +
            `<text class="f-mono f-cellnum" x="${x + 19}" y="312" text-anchor="middle">${W_HASH[m]}</text></g>`);
        }, null, t + 0.32);
        last = m;
      }
    });
    tl.to({}, { duration: 1.2 });
    return tl;
  }

  /* =========================================================
     4. SynchroPulse: forecast clock heats a road network
     ========================================================= */
  const SP = (function build() {
    const r = rng(1147);
    const cols = 8, rows = 5, X0 = 40, Y0 = 50, DX = 74, DY = 56;
    const nodes = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      nodes.push({ x: X0 + i * DX + (r() - 0.5) * 30, y: Y0 + j * DY + (r() - 0.5) * 22 });
    }
    const idx = (i, j) => j * cols + i;
    const edges = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      if (i < cols - 1) edges.push([idx(i, j), idx(i + 1, j)]);
      if (j < rows - 1 && r() > 0.18) edges.push([idx(i, j), idx(i, j + 1)]);
      if (i < cols - 1 && j < rows - 1 && r() > 0.78) edges.push([idx(i, j), idx(i + 1, j + 1)]);
    }
    // two corridors that build up over the forecast window
    const hot = (e, t) => {
      const a = nodes[e[0]], b = nodes[e[1]];
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const c1 = Math.exp(-(((mx - 330) / 120) ** 2 + ((my - 150) / 60) ** 2));
      const c2 = Math.exp(-(((mx - 150) / 90) ** 2 + ((my - 240) / 50) ** 2));
      return Math.min(1, 0.12 + c1 * (0.25 + 0.75 * t) + c2 * (0.85 * t * t));
    };
    return { nodes, edges, hot };
  })();

  function synchropulse() {
    const id = 'synchropulse';
    let b = text(14, 30, 'Forecast', 'f-kicker');
    SP.edges.forEach((e, i) => {
      const a = SP.nodes[e[0]], c = SP.nodes[e[1]];
      b += line(a.x, a.y, c.x, c.y, 'f-road', `data-i="${i}"`);
    });
    SP.nodes.forEach((n) => { b += circle(n.x, n.y, 2.4, 'f-junction'); });
    for (let i = 0; i < 3; i++) b += `<g class="sp-crew" data-i="${i}" opacity="0">${circle(0, 0, 7, 'f-crew')}${line(-5, 0, 5, 0, 'f-crew-mark')}</g>`;
    // clock
    const TX0 = 60, TX1 = 540, TY = 344;
    b += line(TX0, TY, TX1, TY, 'f-axis');
    ['now', '+1 h', '+2 h', '+3 h'].forEach((s, i) => {
      const x = TX0 + (TX1 - TX0) * i / 3;
      b += line(x, TY - 4, x, TY + 4, 'f-axis') + text(x, TY + 20, s, 'f-mono', 'middle');
    });
    b += `<g class="sp-head">${path(`M${TX0},${TY - 6} l-5,-9 h10 z`, 'f-head')}</g>`;
    b += text(586, 30, 'illustrative network', 'f-note', 'end');
    return svg(id, 600, 380, b, 'SynchroPulse, illustrative: as the forecast clock moves from now to three hours ahead, congestion builds along two corridors and the deployment plan moves crews to the worst roads.');
  }

  function synchropulsePlay(el) {
    const G = window.gsap;
    const roads = [...el.querySelectorAll('.f-road')];
    const crews = [...el.querySelectorAll('.sp-crew')];
    const head = el.querySelector('.sp-head');
    const st = { t: 0 };
    const at = crews.map(() => ({ e: -1, on: false }));
    const paint = () => {
      const scored = SP.edges.map((e, i) => ({ i, h: SP.hot(e, st.t) }));
      scored.forEach(({ i, h }) => {
        const r = roads[i];
        r.style.strokeWidth = (1 + h * 4.2).toFixed(2);
        r.style.stroke = h > 0.62 ? 'var(--red)' : h > 0.38 ? 'var(--amber)' : 'var(--ink-3)';
      });
      scored.sort((a, b) => b.h - a.h);
      // crews only re-plan when the worst roads actually change
      crews.forEach((c, k) => {
        const s = scored[k * 2], on = s.h > 0.45;
        if (s.i === at[k].e && on === at[k].on) return;
        at[k] = { e: s.i, on };
        const e = SP.edges[s.i], a = SP.nodes[e[0]], d = SP.nodes[e[1]];
        G.to(c, { x: (a.x + d.x) / 2, y: (a.y + d.y) / 2, opacity: on ? 1 : 0, duration: 0.5, overwrite: true });
      });
      G.set(head, { x: st.t * 480 });
    };
    paint();
    const tl = G.timeline({ paused: true, repeat: -1, repeatDelay: 0.8, onUpdate: paint });
    tl.to(st, { t: 1, duration: 5, ease: 'none' }).to(st, { t: 1, duration: 1.2 }).to(st, { t: 0, duration: 0.8, ease: 'power2.inOut' });
    return tl;
  }

  /* =========================================================
     5. CampusFind: two reports, a match, a QR handoff
     ========================================================= */
  function campusfind() {
    const id = 'campusfind';
    let b = text(14, 34, 'Handoff', 'f-kicker');
    b += node(12, 56, 120, 40, 'University email', 'one-time code', 'f-box f-box-soft');
    // reports
    const card = (x, y, title, l1, l2, cls) =>
      `<g class="cf-card ${cls}">${rect(x, y, 132, 66, 'f-box f-draw')}${text(x + 12, y + 22, title, 'f-label')}` +
      text(x + 12, y + 40, l1, 'f-mono') + text(x + 12, y + 54, l2, 'f-mono') + '</g>';
    b += card(12, 128, 'Lost', 'blue bottle', 'library, 2 pm', 'cf-lost');
    b += card(12, 214, 'Found', 'blue bottle', 'block C desk', 'cf-found');
    b += arrow(id, 'M72,96 L72,126');
    // matcher
    b += path('M144,161 C186,161 182,196 214,198', 'f-line f-draw cf-m1');
    b += path('M144,247 C186,247 182,204 214,202', 'f-line f-draw cf-m2');
    b += circle(240, 200, 25, 'f-box f-draw');
    b += text(240, 197, 'LLM', 'f-label', 'middle') + text(240, 211, 'match', 'f-mono', 'middle');
    b += arrow(id, 'M266,200 L310,200');
    // QR, generated (not a real code)
    const r = rng(42), QX = 322, QY = 150, Q = 9, S = 11;
    let q = rect(QX - 8, QY - 8, Q * S + 16, Q * S + 16, 'f-box f-draw');
    for (let j = 0; j < Q; j++) for (let i = 0; i < Q; i++) {
      const finder = (i < 3 && j < 3) || (i > 5 && j < 3) || (i < 3 && j > 5);
      const on = finder ? !(i % 6 === 1 && j % 6 === 1) : r() > 0.52;
      if (on) q += rect(QX + i * S, QY + j * S, S - 1.4, S - 1.4, 'f-qr');
    }
    b += `<g class="cf-qr">${q}${line(QX - 6, QY, QX + Q * S + 6, QY, 'f-scan')}</g>`;
    b += text(371, 284, 'scan to hand over', 'f-note', 'middle');
    b += arrow(id, 'M432,200 L470,200');
    b += `<g class="cf-done">${node(472, 176, 112, 48, 'Closed', 'right person', 'f-box')}</g>`;
    // RLS fence
    b += rect(250, 306, 334, 50, 'f-frame f-dash f-draw');
    b += text(266, 326, 'Supabase', 'f-label') + text(266, 343, 'Postgres + storage', 'f-mono');
    b += text(572, 326, 'row-level security', 'f-mono f-red-text', 'end') + text(572, 343, 'on every row', 'f-mono', 'end');
    return svg(id, 600, 380, b, 'CampusFind: sign-in by university email code; a lost report and a found report are matched by an LLM; the item is handed over by scanning a QR code and the case closes; data and storage sit behind Supabase row-level security.');
  }

  function campusfindPlay(el) {
    const G = window.gsap;
    const tl = G.timeline({ paused: true, repeat: -1, repeatDelay: 0.8 });
    const scan = el.querySelector('.f-scan');
    const done = el.querySelector('.cf-done rect');
    tl.set(scan, { y: 0, opacity: 0 })
      .fromTo(el.querySelectorAll('.cf-card'), { x: -8, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, stagger: 0.25 }, 0)
      .fromTo([el.querySelector('.cf-m1'), el.querySelector('.cf-m2')], { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.6, stagger: 0.1 }, 0.7)
      .to(scan, { opacity: 1, duration: 0.1 }, 1.5)
      .to(scan, { y: 99, duration: 1.1, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 1.5)
      .to(scan, { opacity: 0, duration: 0.2 }, 3.7)
      .set(done, { attr: { class: 'f-box is-go' } }, 3.8)
      .set(done, { attr: { class: 'f-box' } }, 5.2);
    return tl;
  }

  /* =========================================================
     6. RISC-V: addi x5, x0, 42 -> 0x02A00293
     ========================================================= */
  function riscvFields() {
    const bin = (v, n) => v.toString(2).padStart(n, '0');
    return [
      { name: 'imm[11:0]', bits: bin(42, 12), val: '42',     hi: 31, lo: 20 },
      { name: 'rs1',       bits: bin(0, 5),   val: 'x0',     hi: 19, lo: 15 },
      { name: 'funct3',    bits: bin(0, 3),   val: 'addi',   hi: 14, lo: 12 },
      { name: 'rd',        bits: bin(5, 5),   val: 'x5',     hi: 11, lo: 7 },
      { name: 'opcode',    bits: '0010011',   val: 'OP-IMM', hi: 6,  lo: 0 },
    ];
  }

  function riscv() {
    const id = 'riscv';
    const F = riscvFields();
    const all = F.map((x) => x.bits).join('');
    const hex = '0x' + parseInt(all, 2).toString(16).toUpperCase().padStart(8, '0');
    let b = text(14, 34, 'Encode', 'f-kicker');
    b += text(14, 70, 'addi', 'f-asm') + text(76, 70, 'x5, x0, 42', 'f-asm f-asm-args');
    b += text(586, 70, 'I-type', 'f-mono', 'end');
    const X0 = 12, CW = 18, Y = 116;
    let k = 0;
    F.forEach((fl, fi) => {
      const x0 = X0 + k * CW, w = fl.bits.length * CW;
      b += `<g class="rv-field" data-f="${fi}">`;
      b += text(x0 + w / 2, Y - 12, fl.name, 'f-mono', 'middle');
      [...fl.bits].forEach((bit, bi) => {
        b += rect(x0 + bi * CW, Y, CW - 1.5, 30, 'f-bit', `data-b="${bit}"`);
        b += text(x0 + bi * CW + (CW - 1.5) / 2, Y + 20, bit, 'f-mono f-bitnum', 'middle');
      });
      b += line(x0, Y + 40, x0 + w - 1.5, Y + 40, 'f-thin');
      b += text(x0 + w / 2, Y + 58, fl.val, 'f-label', 'middle');
      // bit numbers sit inside their own field, either side of a boundary tick
      b += line(x0 - 0.75, Y + 64, x0 - 0.75, Y + 80, 'f-thin');
      b += text(x0 + 3, Y + 76, String(fl.hi), 'f-mono f-tiny') + text(x0 + w - 5, Y + 76, String(fl.lo), 'f-mono f-tiny', 'end');
      b += '</g>';
      k += fl.bits.length;
    });
    b += text(14, 262, hex, 'f-hex rv-hex');
    b += text(212, 262, all.replace(/(.{4})/g, '$1 ').trim(), 'f-mono rv-nib');
    // toolchain strip
    const Y2 = 300;
    b += node(12, Y2, 100, 50, 'Pass 1', 'symbol table', 'f-box');
    b += node(128, Y2, 92, 50, 'Pass 2', 'encode', 'f-box');
    b += node(236, Y2, 118, 50, 'Simulator', 'cycle-accurate', 'f-box');
    b += node(472, Y2, 114, 50, 'PicoRV32', 'RTL core', 'f-box f-box-soft');
    b += arrow(id, `M112,${Y2 + 25} L126,${Y2 + 25}`);
    b += arrow(id, `M220,${Y2 + 25} L234,${Y2 + 25}`);
    b += path(`M358,${Y2 + 18} L468,${Y2 + 18}`, 'f-line f-draw', `marker-end="url(#${id}-ah)" marker-start="url(#${id}-ah)"`);
    b += text(413, Y2 + 36, 'differential', 'f-mono f-tiny', 'middle');
    b += text(413, Y2 + 48, 'and formal checks', 'f-mono f-tiny', 'middle');
    return svg(id, 600, 380, b, `RISC-V: the instruction addi x5, x0, 42 encoded as I-type fields: immediate 42, source register x0, funct3 for addi, destination x5 and the OP-IMM opcode, giving ${hex}. Below, the toolchain: two assembler passes, the simulator, and differential and formal checks against the PicoRV32 core.`);
  }

  function riscvPlay(el) {
    const G = window.gsap;
    const bits = [...el.querySelectorAll('.f-bit')];
    const nums = [...el.querySelectorAll('.f-bitnum')];
    const hex = el.querySelector('.rv-hex');
    const nib = el.querySelector('.rv-nib');
    const tl = G.timeline({ paused: true, repeat: -1, repeatDelay: 1.4 });
    tl.set(bits, { attr: { class: 'f-bit' } }, 0).set(nums, { opacity: 0.15 }, 0).set([hex, nib], { opacity: 0 }, 0);
    bits.forEach((b, i) => {
      const t = 0.3 + i * 0.07;
      tl.set(b, { attr: { class: b.dataset.b === '1' ? 'f-bit is-one' : 'f-bit is-zero' } }, t)
        .set(nums[i], { opacity: 1 }, t);
    });
    tl.to(nib, { opacity: 1, duration: 0.4 }, 0.3 + 32 * 0.07 + 0.1)
      .to(hex, { opacity: 1, duration: 0.4 }, '>-0.1')
      .to({}, { duration: 1.6 });
    return tl;
  }

  /* =========================================================
     Research: PGIP two-stage triage
     ========================================================= */
  function pgip() {
    const id = 'pgip';
    let b = text(14, 30, 'Before the experiment', 'f-kicker');
    b += node(12, 128, 104, 64, 'Candidate', 'perturbation', 'f-box');
    const feats = D.paper.features;
    feats.forEach((s, i) => {
      const y = 62 + i * 50;
      b += `<g class="pg-feat">${rect(140, y, 150, 34, 'f-box f-box-soft f-draw')}${text(215, y + 21.5, s.replace(' connectivity', '').replace(' annotation', '').replace('Frozen ', ''), 'f-label', 'middle')}</g>`;
      b += path(`M116,160 C128,160 126,${y + 17} 138,${y + 17}`, 'f-thin f-draw');
      b += path(`M290,${y + 17} C304,${y + 17} 302,160 314,160`, 'f-thin f-draw');
    });
    b += node(316, 124, 102, 72, 'Stage 1', 'predict BS', 'f-box f-box-ink');
    b += arrow(id, 'M418,160 L474,160');
    // saturation scale with the paper's tiers
    const SX = 478, SY = 52, SH = 216;
    b += rect(SX, SY, 22, SH, 'f-box f-draw');
    b += rect(SX, SY, 22, SH * 0.34, 'f-tier-sat');
    b += rect(SX, SY + SH * 0.34, 22, SH * 0.33, 'f-tier-mid');
    b += rect(SX, SY + SH * 0.67, 22, SH * 0.33, 'f-tier-res');
    [[1, 0], [0.66, 0.34], [0.33, 0.67], [0, 1]].forEach(([v, p]) =>
      { b += text(SX - 6, SY + SH * p + 4, v.toFixed(2).replace(/\.00$/, ''), 'f-mono f-tiny', 'end'); });
    b += text(SX + 11, SY - 10, 'BS', 'f-mono', 'middle');
    b += `<g class="pg-mark" transform="translate(0 120)">${path(`M${SX + 24},0 l9,-6 v12 z`, 'f-head')}</g>`;
    // stage 2 router
    b += text(512, 92, 'saturated', 'f-mono');
    b += node(512, 100, 80, 46, 'Baseline', 'free', 'f-box');
    b += text(512, 192, 'resistant', 'f-mono f-red-text');
    b += node(512, 200, 80, 46, 'Deep model', 'costly', 'f-box f-box-red');
    b += text(14, 286, 'Stage 2', 'f-kicker') + text(84, 286, 'routes saturated perturbations to the free baseline and resistant ones to the costly model', 'f-note');
    return svg(id, 600, 300, b, 'PGIP: before an experiment, gene-intrinsic features (baseline expression, STRING connectivity, Gene Ontology, ESM-2 embedding) feed a Stage 1 model that predicts Baseline Saturation. Stage 2 routes saturated perturbations to the free additive baseline and resistant ones to a costlier model.');
  }

  function pgipPlay(el) {
    const G = window.gsap;
    const mark = el.querySelector('.pg-mark');
    const tl = G.timeline({ paused: true, repeat: -1, repeatDelay: 0.5 });
    // a few candidates land on the scale: two saturated, one resistant
    [0.82, 0.18, 0.71, 0.5].forEach((v, i) => {
      const y = 52 + 216 * (1 - v);
      tl.to(mark, { y, duration: 0.7, ease: 'power3.inOut' }, i * 1.4);
    });
    return tl;
  }

  // results: interval plot of the headline numbers
  function pgipResults() {
    const id = 'pgipres';
    const X0 = 150, X1 = 580, lo = 0.4, hi = 1.0;
    const X = (v) => X0 + (X1 - X0) * (v - lo) / (hi - lo);
    const rows = [
      { y: 44,  k: 'ρ  Random forest', v: 0.65, ci: [0.61, 0.69], note: 'K562', red: true },
      { y: 78,  k: 'ρ  Ridge',         v: 0.58, note: 'K562' },
      { y: 112, k: 'ρ  Ridge, pairs',  v: 0.50, note: 'Wessels' },
      { y: 156, k: 'AUC  K562',        v: 0.86, note: 'p = 0.003', red: true },
      { y: 190, k: 'AUC  pairs',       v: 0.77, note: 'Wessels' },
    ];
    let b = '';
    [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].forEach((v) => {
      b += line(X(v), 24, X(v), 206, 'f-grid') + text(X(v), 224, v.toFixed(1), 'f-mono f-tiny', 'middle');
    });
    rows.forEach((r) => {
      b += text(14, r.y + 4, r.k, 'f-mono');
      if (r.ci) b += line(X(r.ci[0]), r.y, X(r.ci[1]), r.y, 'f-ci') + line(X(r.ci[0]), r.y - 5, X(r.ci[0]), r.y + 5, 'f-ci') + line(X(r.ci[1]), r.y - 5, X(r.ci[1]), r.y + 5, 'f-ci');
      b += circle(X(r.v), r.y, 5, r.red ? 'f-pt f-pt-red' : 'f-pt');
      b += text(X(r.v) + 12, r.y + 4, r.v.toFixed(2) + (r.ci ? '  [0.61, 0.69]' : ''), 'f-num f-num-sm');
    });
    return svg(id, 600, 236, b, 'Headline results: random forest Spearman rho 0.65 with 95% interval 0.61 to 0.69 and ROC-AUC 0.86 on the Replogle K562 screen; ridge rho 0.58; on Wessels gene pairs, ridge rho 0.50 and ROC-AUC 0.77.');
  }

  /* =========================================================
     Quant: small multiples
     ========================================================= */
  function macro() {
    const id = 'macro';
    const Z = 196, S = 54;                                  // px per 1%, −2.5%…+2%
    const bars = [
      { k: 'TLT, event day', v: 0.15 },
      { k: 'TLT, next day', v: -0.29 },
      { k: 'VIX, one week', v: -1.63 },
    ];
    let b = '';
    [-2, -1, 0, 1, 2].forEach((v) => {
      const x = Z + v * S;
      if (x < 40 || x > 312) return;
      b += line(x, 10, x, 152, v ? 'f-grid' : 'f-axis') + text(x, 168, (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v) + '%', 'f-mono f-tiny', 'middle');
    });
    bars.forEach((r, i) => {
      const y = 12 + i * 48, w = Math.abs(r.v) * S;
      b += text(14, y + 10, r.k, 'f-mono');
      b += rect(r.v < 0 ? Z - w : Z, y + 18, w, 16, r.v < 0 ? 'f-bar f-bar-red q-bar' : 'f-bar q-bar', `data-neg="${r.v < 0 ? 1 : 0}"`);
      b += text(r.v < 0 ? Z + 8 : Z + w + 6, y + 30.5, (r.v > 0 ? '+' : '−') + Math.abs(r.v).toFixed(2) + '%', 'f-num f-num-sm', 'start');
    });
    return svg(id, 320, 176, b, 'Average reactions after macro releases: long bonds (TLT) up 0.15% on the event day and down 0.29% the next; VIX down 1.63% one week after positive surprises.');
  }

  function benford() {
    const id = 'benford';
    const P = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => Math.log10(1 + 1 / d));
    const X0 = 30, BW = 26, G = 6, Y0 = 146, S = 400;
    let b = line(X0 - 6, Y0, X0 + 9 * (BW + G), Y0, 'f-axis');
    let pts = '';
    P.forEach((p, i) => {
      const x = X0 + i * (BW + G), h = p * S;
      b += rect(x, Y0 - h, BW, h, i === 0 ? 'f-bar f-bar-red q-bar' : 'f-bar q-bar');
      b += text(x + BW / 2, Y0 + 15, String(i + 1), 'f-mono f-tiny', 'middle');
      pts += (i ? ' L' : 'M') + f(x + BW / 2) + ',' + f(Y0 - h - 7);
    });
    b += path(pts, 'f-curve f-draw');
    b += text(X0 + BW / 2, Y0 - P[0] * S - 14, '30.1%', 'f-num f-num-sm', 'middle');
    b += `<text class="f-mono" x="300" y="40" text-anchor="end">P(d) = log<tspan class="f-sub" dy="4">10</tspan><tspan dy="-4">(1 + 1/d)</tspan></text>`;
    return svg(id, 320, 176, b, 'Benford’s first-digit law: a leading 1 appears about 30.1% of the time, falling to about 4.6% for a leading 9.');
  }

  function splm() {
    const id = 'splm';
    let b = node(6, 14, 108, 40, 'Sentinel-2', 'NDBI, 10 m', 'f-box');
    b += node(6, 92, 108, 40, 'Analysts', 'momentum', 'f-box');
    b += node(140, 52, 74, 42, 'Diverge', '', 'f-box f-box-ink');
    b += arrow(id, 'M114,34 C128,34 126,66 138,68');
    b += arrow(id, 'M114,112 C128,112 126,80 138,78');
    b += arrow(id, 'M214,73 L232,73');
    // signal scale −1..+1
    const X0 = 240, X1 = 314;
    b += line(X0, 73, X1, 73, 'f-axis');
    [[-1, X0], [0, (X0 + X1) / 2], [1, X1]].forEach(([v, x]) => { b += line(x, 68, x, 78, 'f-axis') + text(x, 94, (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v), 'f-mono f-tiny', 'middle'); });
    b += `<g class="splm-needle">${path(`M${(X0 + X1) / 2},64 l-5,-9 h10 z`, 'f-head')}</g>`;
    b += text(160, 156, '12 retailers · point-in-time · no look-ahead', 'f-note', 'middle');
    return svg(id, 320, 176, b, 'SPLM: parking-lot activity from Sentinel-2 imagery and analyst momentum feed a divergence engine that outputs a signal between minus one and plus one.');
  }

  function splmPlay(el) {
    const G = window.gsap;
    const n = el.querySelector('.splm-needle');
    return G.timeline({ paused: true, repeat: -1, yoyo: true }).to(n, { x: 24, duration: 1.6, ease: 'sine.inOut' }).to(n, { x: -30, duration: 2.2, ease: 'sine.inOut' });
  }

  function oceanic() {
    const id = 'oceanic';
    let b = path('M18,150 C40,118 30,96 58,84 C92,70 96,40 134,36 C170,32 178,58 214,62', 'f-coast f-draw');
    b += path('M92,96 L188,74 L206,128 L118,150 Z', 'f-fence f-draw f-dash');
    b += text(150, 116, 'geofence', 'f-mono f-tiny', 'middle');
    const ships = [[120, 110], [150, 98], [168, 120], [136, 132], [240, 70], [268, 104], [292, 60]];
    ships.forEach(([x, y], i) => { b += `<g class="oc-ship" data-i="${i}" transform="translate(${x} ${y})">${path('M-5,3 L0,-6 L5,3 Z', i < 4 ? 'f-ship f-ship-in' : 'f-ship')}</g>`; });
    b += text(304, 156, 'dwell time becomes congestion · 6 ports', 'f-note', 'end');
    return svg(id, 320, 176, b, 'Oceanic Edge, illustrative: ships inside a port geofence are timed; dwell time becomes a congestion index.');
  }

  function oceanicPlay(el) {
    const G = window.gsap;
    const out = [...el.querySelectorAll('.oc-ship')].slice(4);
    return G.timeline({ paused: true, repeat: -1, repeatDelay: 0.4 })
      .to(out, { x: '-=70', y: '+=26', duration: 3.2, ease: 'none', stagger: 0.5 })
      .to(out, { opacity: 0, duration: 0.3 }, '>-0.3')
      .set(out, { clearProps: 'all' });
  }

  /* ---------- registry ---------- */
  const REG = {
    careeros:     [careeros, careerosPlay],
    secondask:    [secondask, secondaskPlay],
    codeforge:    [codeforge, codeforgePlay],
    synchropulse: [synchropulse, synchropulsePlay],
    campusfind:   [campusfind, campusfindPlay],
    riscv:        [riscv, riscvPlay],
    pgip:         [pgip, pgipPlay],
    pgipres:      [pgipResults, null],
    macro:        [macro, null],
    benford:      [benford, null],
    splm:         [splm, splmPlay],
    oceanic:      [oceanic, oceanicPlay],
  };

  return {
    render: (id) => (REG[id] ? REG[id][0]() : ''),
    play: (id, el) => (REG[id] && REG[id][1] && window.gsap ? REG[id][1](el) : null),
    winnow,
  };
})();
