/* ============================================================
   DOM: builds the page from window.DATA.
   Plain template strings. Page.render() returns the markup (the
   prerender script in tools/ writes it into index.html for search
   engines and a fast first paint); Page.mount() puts it in the page
   when the shipped HTML is missing or out of date.
   ============================================================ */

(function () {
  const D = window.DATA;
  const P = D.person;

  /* ---------- helpers ---------- */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const ext = '<svg class="ico-ext" viewBox="0 0 12 12" aria-hidden="true"><path d="M3.5 8.5 8.5 3.5M4.5 3.5h4v4"/></svg>';
  // `about` names the thing being linked, for anyone navigating by links alone
  const extLink = (l, cls = 'lnk', about = '') =>
    `<a class="${cls}" href="${esc(l.href)}" target="_blank" rel="noopener"${about ? ` aria-label="${esc(about)}: ${esc(l.label)}"` : ''}>${esc(l.label)}${ext}</a>`;
  // Greek letters only exist in STIX's subset
  const greek = (s) => esc(s).replace(/ρ/g, '<span class="gr">ρ</span>');
  // Hubot's zero carries a notch that reads as θ at display sizes; set digits in Mona
  const dg = (s) => esc(s).replace(/\d[\d.,]*/g, '<span class="dg">$&</span>');
  // {words|part} in data.js: words that point at a part of a figure
  const xref = (s, fig) => esc(s).replace(/\{([^|{}]+)\|([a-z0-9]+)\}/g,
    (m, t, k) => `<a class="xref" href="#fig-${fig}" data-fig="${fig}" data-part="${k}">${t}</a>`);

  // a figure waits as a described placeholder until figkit draws it
  const AR = { careeros: '600/520', secondask: '600/520', codeforge: '600/530', synchropulse: '600/530', campusfind: '600/520',
    riscv: '600/520', pgip: '600/450', pgipres: '600/420', macro: '300/178', benford: '300/178', splm: '300/178', oceanic: '300/178' };
  function figure(id, n, caption, cls = '') {
    const spec = window.Figures && window.Figures.get(id);
    return `<figure class="fig ${cls}" data-fig="${id}" id="fig-${id}">
        <div class="fig-plate is-pending" style="--ar:${AR[id] || '3/2'}"><p class="fig-alt">${esc(spec ? spec.label : '')}</p></div>
        ${caption ? `<figcaption>${n ? `<span class="fig-n">Fig. ${n}</span>` : ''}${caption}</figcaption>` : ''}
      </figure>`;
  }

  // a section header: hairline row (label + aside), then the big title
  function head(label, title, aside, intro) {
    return `
      <header class="sec-head">
        <div class="sec-row"><span class="sec-label">${esc(label)}</span><span class="sec-aside">${esc(aside)}</span></div>
        <div class="sec-main ${title.length <= 7 ? 'is-short' : ''}">
          <h2 class="sec-title split">${esc(title)}</h2>
          ${intro ? `<p class="sec-intro reveal">${esc(intro)}</p>` : ''}
        </div>
      </header>`;
  }

  /* ---------- 0. hero ---------- */
  function hero() {
    const name = P.name.toUpperCase();
    const facts = D.hero.facts.map((f) => `
      <li class="hf">
        <span class="hf-k">${esc(f.k)}</span>
        <b class="hf-v">${dg(f.v)}</b>
        <span class="hf-d">${esc(f.d)}</span>
      </li>`).join('');
    const sizes = '(max-width: 760px) 92vw, 44vw';
    const p = P.portrait;

    return `
    <section class="hero" id="top" aria-label="Introduction">
      <div class="hero-meta">
        <p class="hero-role">${esc(P.role)}<br>${esc(P.school)}, class of ${esc(P.classOf)}</p>
        <p class="hero-where"><span>${esc(P.city)}</span> <time class="clock" id="clock">--:--</time> <span class="hero-tz">IST</span></p>
      </div>

      <div class="hero-stage">
        <h1 class="hero-name" id="heroName" aria-label="${esc(P.name)}">
          <span class="hn" aria-hidden="true">${[...name].map((c) => `<span class="hn-ch">${esc(c)}</span>`).join('')}</span>
        </h1>
        <picture class="hero-portrait" id="portrait">
          <source type="image/avif" srcset="${esc(p.small.replace('.webp', '.avif'))} 640w, ${esc(p.avif)} 900w" sizes="${sizes}">
          <source type="image/webp" srcset="${esc(p.small)} 640w, ${esc(p.webp)} 900w" sizes="${sizes}">
          <img src="${esc(p.webp)}" width="${p.w}" height="${p.h}" alt="${esc(p.alt)}" fetchpriority="high" decoding="async">
        </picture>
        <div class="hero-plate boot" aria-hidden="true">
          <span class="hp-bar"></span><span class="hp-code">${esc(P.code)}</span><span class="hp-num">${esc(P.number)}</span>
        </div>
      </div>

      <p class="hero-lede boot">${esc(D.hero.lede)}</p>
      <ul class="hero-facts boot" aria-label="At a glance">${facts}</ul>

      <div class="lights" id="lights" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
    </section>`;
  }

  /* ---------- 1. intro statement ---------- */
  function intro() {
    return `
    <section class="intro" id="intro" aria-label="In short">
      <div class="intro-grid">
        <p class="intro-k">In short</p>
        <p class="intro-text" id="introText">${esc(D.intro)}</p>
      </div>
    </section>`;
  }

  /* ---------- 2. interlude: drawing to machine ---------- */
  function machine() {
    const M = D.machine;
    return `
    <section class="machine" id="machine" aria-label="Interlude">
      <div class="machine-stage">
        <canvas class="machine-canvas" id="machineCanvas" aria-hidden="true"></canvas>
        <img class="machine-fallback" id="machineFallback" data-src="assets/car-drawing.webp" alt="" width="1217" height="318" decoding="async">
        <div class="machine-scan" id="machineScan" aria-hidden="true">
          <span class="ms-l">Machine</span><span class="ms-r">Drawing</span>
        </div>
        <div class="machine-copy">
          <h2 class="machine-line split">${esc(M.line)}</h2>
          <p class="machine-note">${esc(M.note)}</p>
        </div>
        <p class="machine-cap machine-cap-live">${esc(M.caption)}</p>
        <p class="machine-cap machine-cap-still">${esc(M.still)}</p>
        <div class="machine-meter" aria-hidden="true"><span id="machineDeg">000°</span><i><b id="machineBar"></b></i><span id="machinePct">0%</span></div>
      </div>
    </section>`;
  }

  /* ---------- 3. selected work: drawing sheets ---------- */
  function metricsDL(ms) {
    if (!ms || !ms.length) return '';
    return `<dl class="metrics">${ms.map((m) => `
      <div class="metric"><dt>${esc(m.k)}</dt><dd><span class="m-v num-roll">${esc(m.v)}</span>${m.u ? `<span class="m-u">${esc(m.u)}</span>` : ''}</dd></div>`).join('')}
    </dl>`;
  }

  function work() {
    const total = D.work.length;
    // the anchor stays in normal flow; the sticky sheet itself is a poor scroll target
    const sheets = D.work.map((w, i) => `
      <div class="anchor" id="${esc(w.id)}"></div>
      <article class="sheet" style="--i:${i}" aria-labelledby="t-${esc(w.id)}">
        <div class="sheet-in">
          <header class="sheet-top">
            <span class="sheet-n">${pad(i + 1)}</span>
            <span class="sheet-area">${esc(w.area)}</span>
            <span class="sheet-status">${esc(w.status)}</span>
            <span class="sheet-links">${w.links.map((l) => extLink(l, 'lnk', w.title)).join('')}</span>
          </header>
          <div class="sheet-body">
            <div class="sheet-text">
              <h3 class="sheet-title" id="t-${esc(w.id)}">${dg(w.title)}</h3>
              <p class="sheet-line">${esc(w.line)}</p>
              <p class="sheet-desc">${xref(w.body, w.fig)}</p>
              <ul class="sheet-points">${w.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
              ${metricsDL(w.metrics)}
            </div>
            ${figure(w.fig, i + 1, esc(w.caption), 'sheet-fig')}
          </div>
          <footer class="tblock">
            <div class="tb"><span>Project</span><b>${esc(w.title)}</b></div>
            <div class="tb tb-wide"><span>Stack</span><b>${esc(w.stack.join(' · '))}</b></div>
            <div class="tb"><span>Sheet</span><b>${i + 1} of ${total}</b></div>
            <div class="tb tb-stamp"><span>Status</span>${w.stamp ? `<b class="stamp"><span>${esc(w.stamp)}</span></b>` : ''}</div>
          </footer>
        </div>
      </article>`).join('');

    return `
    <section class="work" id="work">
      ${head('Selected work', 'Work', `${pad(total)} of ${D.archive.length} projects`,
        'Six projects I would happily walk an engineer through. Each sheet has a working drawing of how the thing works: run it, poke at it, inspect any part. Everything else is in the archive.')}
      <div class="sheets">${sheets}</div>
    </section>`;
  }

  /* ---------- 4. research ---------- */
  function research() {
    const R = D.paper;
    const U = D.udyox;

    const results = R.results.map((r) => `
      <div class="res ${r.primary ? 'is-primary' : ''}">
        <dt>${greek(r.k)}</dt>
        <dd><span class="res-v num-roll">${esc(r.v)}</span>${r.ci ? `<span class="res-ci">95% CI ${r.ci[0].toFixed(2)} to ${r.ci[1].toFixed(2)}</span>` : ''}<span class="res-d">${esc(r.d)}</span></dd>
      </div>`).join('');

    const rows = R.datasets.map((d) => `
      <tr><th scope="row">${esc(d.name)}</th><td>${esc(d.cell)}</td><td>${esc(d.kind)}</td><td>${esc(d.unit)}</td><td class="num">${esc(d.n)}</td></tr>`).join('');

    const quant = D.quant.map((q, i) => `
      <article class="qcard" id="${esc(q.id)}">
        <header class="qcard-top"><span class="qcard-n">${String.fromCharCode(97 + i)}</span><h4 class="qcard-title">${dg(q.title)}</h4>
          ${q.href ? `<a class="lnk lnk-sm" href="${esc(q.href)}" target="_blank" rel="noopener" aria-label="${esc(q.title)} repository">Code${ext}</a>` : ''}</header>
        <p class="qcard-q">${esc(q.q)}</p>
        ${figure(q.fig, 0, '', 'qfig')}
        <p class="qcard-body">${esc(q.body)}</p>
        ${q.finds.length ? `<ul class="qcard-finds">${q.finds.map((x) => `<li>${greek(x)}</li>`).join('')}</ul>` : ''}
      </article>`).join('');

    const ongoing = D.ongoing.map((o) => `
      <li class="og"><b>${dg(o.title)}</b><span>${esc(o.d)}</span>${o.href ? extLink({ href: o.href, label: o.label }, 'lnk lnk-sm', o.title) : '<i class="og-tag">Ongoing</i>'}</li>`).join('');

    return `
    <section class="research" id="research">
      ${head('Research', 'Research', 'A preprint, a field study, four quant projects',
        'The questions I keep coming back to are about deciding before spending: which experiment to run, which retry to make, which signal to trust.')}

      <div class="paper" id="research-paper">
        <div class="paper-sheet-wrap">
          <article class="paper-sheet" aria-label="First page of the preprint">
            <p class="ps-run"><span>${esc(R.note)}</span></p>
            <h3 class="ps-title">${esc(R.title)}</h3>
            <p class="ps-auth">${esc(R.authors)}<sup>1</sup></p>
            <p class="ps-aff"><sup>1</sup>${esc(R.affiliation)}</p>
            <p class="ps-abs-h">Abstract</p>
            <p class="ps-abs">${esc(R.abstract)} On the genome-scale Replogle K562 essential screen the triage achieves Random Forest <mark class="hl">Spearman ρ 0.65</mark> (95% CI [0.61, 0.69]) and <mark class="hl">ROC-AUC 0.86</mark>.</p>
            <p class="ps-foot"><span>${esc(R.venue)}</span><span>1</span></p>
          </article>
        </div>
        <div class="paper-side">
          <p class="paper-kicker">${esc(R.venue)} · first author</p>
          <p class="paper-plain">${xref(R.plain, 'pgip')}</p>
          ${figure('pgip', 7, 'Two-stage triage. Stage 1 predicts Baseline Saturation from features known before the experiment; Stage 2 sends each perturbation to the free baseline or the costly model. Drag the prediction to see where it goes.')}
          <dl class="results">${results}</dl>
          ${figure('pgipres', 8, 'The results, four ways, all from the preprint: accuracy per screen with 95% bootstrap intervals, ROC-AUC, which feature group matters most on each screen, and how much of each screen is saturated.')}
          <div class="ds">
            <table class="ds-table">
              <caption>The six screens used, with scored perturbations</caption>
              <thead><tr><th scope="col">Dataset</th><th scope="col">Cell line</th><th scope="col">Perturbation</th><th scope="col">Unit</th><th scope="col" class="num">Scored</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
          <p class="paper-meta"><span>Methods</span>${esc(R.methods.join(', '))}</p>
          <p class="paper-links">${R.links.map((l) => extLink(l, 'lnk', 'Preprint')).join('')}</p>
        </div>
      </div>

      <div class="udyox" id="udyox">
        <div class="udyox-head">
          <p class="udyox-kind">${esc(U.kind)}</p>
          <h3 class="udyox-title">${dg(U.title)}</h3>
          <p class="udyox-line">${esc(U.line)}</p>
          <p class="udyox-links">${U.links.map((l) => extLink(l, 'lnk', U.title)).join('')}</p>
        </div>
        <div class="udyox-body">
          <ul class="udyox-nums">${U.numbers.map((n) => `<li><b class="num-roll">${esc(n.v)}</b><span>${esc(n.k)}</span></li>`).join('')}</ul>
          <p class="udyox-text">${esc(U.body)}</p>
          <p class="udyox-stack">${esc(U.stack.join(' · '))}</p>
        </div>
      </div>

      <div class="quant">
        <div class="quant-head"><h3 class="sub-title">Quant and data</h3><p class="sub-note">Four questions, answered with public data.</p></div>
        <div class="quant-grid">${quant}</div>
      </div>

      <div class="ongoing">
        <h3 class="sub-title">On the bench</h3>
        <ul class="og-list">${ongoing}</ul>
      </div>
    </section>`;
  }

  /* ---------- 5. experience: stint chart + entries ---------- */
  const ym = (s) => { const [y, m] = s.split('-').map(Number); return y * 12 + (m - 1); };
  const monthName = (s) => new Date(s + '-01T00:00:00').toLocaleString('en-GB', { month: 'short', year: 'numeric' });
  const nowYM = () => { const n = new Date(); return `${n.getFullYear()}-${pad(n.getMonth() + 1)}`; };
  // where "now" falls on the chart, as a percentage; the page sets it again on load
  function nowPct() {
    const T = D.timeline, a = ym(T.from), b = ym(T.to) + 1;
    return ((Math.min(Math.max(ym(nowYM()), a), b) - a) / (b - a)) * 100;
  }

  function stints() {
    const T = D.timeline;
    const a = ym(T.from), b = ym(T.to) + 1, span = b - a;
    const pct = (s) => ((Math.min(Math.max(ym(s), a), b) - a) / span) * 100;

    const years = [];
    for (let y = +T.from.slice(0, 4) + 1; y <= +T.to.slice(0, 4); y++) years.push(y);
    const axis = years.map((y) => `<span class="st-year" style="left:${pct(y + '-01').toFixed(3)}%">${y}</span>`).join('');

    const rows = T.rows.map((r) => `
      <div class="st-row">
        <span class="st-label">${esc(r.label)}</span>
        <div class="st-track">
          ${r.stints.map((s) => {
            const open = !s.to;
            const l = pct(s.from);
            // an open stint runs to "now", which is a CSS variable the page keeps current
            const width = open ? `calc(max(1.4%, var(--now) - ${l.toFixed(3)}%))` : `${Math.max(1.4, pct(s.to) - l + 100 / span).toFixed(3)}%`;
            const months = ym(open ? nowYM() : s.to) - ym(s.from) + 1;
            const narrow = !open && months <= 5;       // label rides outside short stints
            const C = D.compounds[s.c];
            const when = `${monthName(s.from)} to ${open ? 'now' : monthName(s.to)}`;
            const label = `<span class="stint-t">${esc(s.at)}</span>`;
            return `<div class="stint c-${s.c} ${open ? 'is-open' : ''} ${narrow ? 'is-narrow' : ''}" style="left:${l.toFixed(3)}%;width:${width}" tabindex="0"
                      data-from="${s.from}" data-to="${s.to || ''}" role="img" aria-label="${esc(`${s.t}, ${s.at}, ${when}`)}">
                <span class="stint-bar"><span class="tyre" aria-hidden="true">${esc(C.name[0])}</span>${narrow ? '' : label}</span>
                ${narrow ? label : ''}
                <span class="stint-tip" role="tooltip"><b>${esc(s.t)}</b><span>${esc(s.at)}</span><span class="stint-when">${esc(when)}</span></span>
              </div>`;
          }).join('')}
        </div>
      </div>`).join('');

    const legend = Object.entries(D.compounds).map(([k, c]) => `
      <li class="lg c-${k}"><span class="tyre" aria-hidden="true">${esc(c.name[0])}</span><span><b>${esc(c.means)}</b> <i>${esc(c.name.toLowerCase())}</i></span></li>`).join('');

    return `
      <figure class="stints" id="stints">
        <div class="st-scroll" id="stScroll">
          <div class="st-chart" style="--now:${nowPct().toFixed(3)}%" data-from="${T.from}" data-to="${T.to}">
            <div class="st-axis">${axis}</div>
            <div class="st-row st-head" aria-hidden="true"><span class="st-label"></span><span></span></div>
            ${rows}
            <div class="st-now" aria-hidden="true"><span>Now</span></div>
            <div class="st-future" aria-hidden="true"></div>
            <div class="st-cursor" aria-hidden="true"><span></span></div>
          </div>
        </div>
        <figcaption class="st-cap">
          <ul class="st-legend">${legend}</ul>
          <p>Read it like a tyre-strategy graphic: one row per kind of work, one bar per stint, compound by type. Hatched area is still to come.</p>
        </figcaption>
      </figure>`;
  }

  function experience() {
    const jobs = D.experience.map((e) => `
      <li class="job">
        <div class="job-when"><span>${esc(e.when)}</span><span class="job-where">${esc(e.where)}</span></div>
        <div class="job-main">
          <h3 class="job-org">${dg(e.org)}</h3>
          <p class="job-role">${esc(e.role)}</p>
          <p class="job-d">${esc(e.d)}</p>
          <ul class="job-points">${e.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
          <p class="job-tags">${esc(e.tags.join(' · '))}</p>
        </div>
      </li>`).join('');

    return `
    <section class="experience" id="experience">
      ${head('Experience', 'Experience', 'August 2023 to graduation, 2027',
        'Two internships, a teaching role, a research stint and a lot of hackathon logistics, laid out the way a race engineer would read them.')}
      ${stints()}
      <ol class="jobs">${jobs}</ol>
    </section>`;
  }

  /* ---------- 6. about: off track, awards, toolkit ---------- */
  function about() {
    const off = D.offtrack.map((o) => `
      <li class="ot">
        <div class="ot-main">
          <p class="ot-role">${esc(o.role)}</p>
          <h3 class="ot-org">${o.href ? `<a class="lnk lnk-quiet" href="${esc(o.href)}" target="_blank" rel="noopener">${dg(o.org)}${ext}</a>` : dg(o.org)}</h3>
          <p class="ot-d">${esc(o.d)}</p>
        </div>
        ${o.v ? `<p class="ot-num"><b class="num-roll">${esc(o.v)}</b><span>${esc(o.k)}</span></p>` : '<p class="ot-num ot-num-none" aria-hidden="true"></p>'}
      </li>`).join('');

    const awards = D.awards.map((a) => `
      <li class="aw"><b>${a.href ? `<a class="lnk lnk-quiet" href="${esc(a.href)}" target="_blank" rel="noopener">${esc(a.t)}${ext}</a>` : esc(a.t)}</b>${a.d ? `<span>${esc(a.d)}</span>` : ''}</li>`).join('');

    // how many projects use each tool
    const uses = {};
    D.archive.forEach((p) => p.stack.forEach((s) => { const k = s.toLowerCase(); (uses[k] = uses[k] || []).push(p.name); }));
    const groups = D.toolkit.map((g) => `
      <div class="tk-group">
        <h4 class="tk-h">${esc(g.group)}</h4>
        <ul class="tk-list">${g.items.map((it) => {
          const u = uses[it.toLowerCase()] || [];
          return `<li><button class="tk" type="button" data-tool="${esc(it)}" ${u.length ? '' : 'data-none'}
                    aria-label="${esc(it)}${u.length ? `, used in ${u.length} project${u.length > 1 ? 's' : ''}` : ''}">${esc(it)}${u.length ? `<sup>${u.length}</sup>` : ''}</button></li>`;
        }).join('')}</ul>
      </div>`).join('');

    return `
    <section class="about" id="about">
      ${head('About', 'Off track', 'Community, teaching and the rest',
        'Most of what I have learned about running things came from organising events for people who did not have to show up.')}
      <ol class="ot-list">${off}</ol>

      <div class="about-split">
        <div class="awards">
          <h3 class="sub-title">Recognition</h3>
          <ul class="aw-list">${awards}</ul>
          <p class="langs"><span>Languages</span>${esc(P.languages)}</p>
        </div>
        <div class="courses">
          <h3 class="sub-title">Coursework</h3>
          <p class="course-list">${D.coursework.map((c) => `<span>${esc(c)}</span>`).join('')}</p>
        </div>
      </div>

      <div class="toolkit" id="toolkit">
        <div class="tk-head">
          <h3 class="sub-title">Toolkit</h3>
          <p class="tk-readout" id="tkReadout" aria-live="polite">The small number is how many projects on this page use it. Pick one to see them in the archive.</p>
        </div>
        <div class="tk-grid">${groups}</div>
      </div>
    </section>`;
  }

  /* ---------- 7. archive ---------- */
  function archive() {
    const count = (id) => id === 'all' ? D.archive.length : D.archive.filter((p) => p.area.includes(id)).length;
    const filters = D.areas.map((a, i) => `
      <button class="flt ${i === 0 ? 'is-on' : ''}" type="button" data-area="${esc(a.id)}" aria-pressed="${i === 0}">
        ${esc(a.label)}<sup>${count(a.id)}</sup></button>`).join('');

    const areaLabel = Object.fromEntries(D.areas.map((a) => [a.id, a.label]));
    const LINK = { repo: 'Code', live: 'Live', data: 'Data' };
    const rows = D.archive.map((p, i) => {
      const links = Object.entries(p.links).map(([k, v]) =>
        `<a class="lnk lnk-sm" href="${esc(v)}" target="_blank" rel="noopener" aria-label="${esc(p.name)}: ${LINK[k]}">${LINK[k]}${ext}</a>`).join('');
      return `
        <li class="ar" data-area="${esc(p.area.join(' '))}" data-stack="${esc(p.stack.join('|').toLowerCase())}">
          <span class="ar-n">${pad(i + 1)}</span>
          <span class="ar-name">${p.see ? `<a class="ar-jump" href="#${esc(p.see)}">${dg(p.name)}</a>` : dg(p.name)}</span>
          <span class="ar-d">${esc(p.d)}</span>
          <span class="ar-area">${esc(p.area.map((a) => areaLabel[a]).join(', '))}</span>
          <span class="ar-status s-${esc(p.status.toLowerCase().replace(/[^a-z]+/g, '-'))}">${esc(p.status)}</span>
          <span class="ar-links">${links || '<span class="ar-nolink">No link yet</span>'}</span>
        </li>`;
    }).join('');

    return `
    <section class="archive" id="archive">
      ${head('Archive', 'Archive', `All ${D.archive.length} projects`,
        'Everything I have built, strongest first. Names with a link jump to the full write-up above.')}
      <div class="flt-bar" role="toolbar" aria-label="Filter projects">${filters}
        <button class="flt flt-tool" type="button" id="toolChip" hidden></button>
      </div>
      <div class="ar-head" aria-hidden="true"><span>#</span><span>Project</span><span>What it is</span><span>Area</span><span>Status</span><span>Links</span></div>
      <ul class="ar-list" id="arList">${rows}</ul>
    </section>`;
  }

  /* ---------- 8. contact + footer ---------- */
  function contact() {
    const links = P.links.map((l) => `
      <li><a class="cl" href="${esc(l.href)}" target="_blank" rel="noopener"><span class="cl-l">${esc(l.label)}</span><span class="cl-h">${esc(l.handle)}</span>${ext}</a></li>`).join('');

    return `
    <section class="contact" id="contact">
      <div class="sec-row"><span class="sec-label">Contact</span><span class="sec-aside"><span class="radio-dot" aria-hidden="true"></span>Team radio
        <span class="wave" aria-hidden="true">${Array.from({ length: 14 }, (_, i) => `<i style="--k:${i}"></i>`).join('')}</span></span></div>
      <h2 class="contact-title split">Radio&rsquo;s open.</h2>
      <div class="contact-grid">
        <p class="contact-open">${esc(P.open)} Email is the quickest way to reach me.</p>
        <div class="contact-mail">
          <a class="mail" href="mailto:${esc(P.email)}" id="mail">${esc(P.email)}</a>
          <button class="copy" type="button" id="copyMail" data-copy="${esc(P.email)}"><span>Copy</span></button>
        </div>
        <ul class="contact-links">${links}</ul>
        ${P.resume ? `<p class="contact-cv"><a class="lnk" href="${esc(P.resume)}">Résumé (PDF)${ext}</a></p>` : ''}
      </div>
      <footer class="foot">
        <p class="foot-c">&copy; <span id="year">${new Date().getFullYear()}</span> ${esc(P.name)}</p>
        <p class="foot-col">Set in Hubot Sans, Mona Sans, Martian Mono and STIX Two Text. Built by hand with GSAP, Lenis and three.js; no framework, no build step.</p>
        <a class="foot-top lnk" href="#top" id="toGrid">Back to the grid</a>
      </footer>
      <div class="flag" aria-hidden="true"></div>
    </section>`;
  }

  /* ---------- nav ---------- */
  const nav = () => D.nav.map((n) => `<a href="#${esc(n.id)}" data-sec="${esc(n.id)}">${esc(n.label)}</a>`).join('');
  const menuNav = () => D.nav.map((n, i) => `<a href="#${esc(n.id)}" data-sec="${esc(n.id)}"><span class="mn-i">${pad(i + 1)}</span>${esc(n.label)}</a>`).join('');
  const menuFoot = () => `<a href="mailto:${esc(P.email)}">${esc(P.email)}</a>` +
    P.links.slice(0, 3).map((l) => `<a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('');

  /* ---------- a fingerprint of the content, so a stale prerender is noticed ---------- */
  function sig() {
    const s = JSON.stringify(D);
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return (h >>> 0).toString(36);
  }

  /* ---------- public ---------- */
  window.Page = {
    sig,
    render() {
      return {
        main: hero() + intro() + machine() + work() + research() + experience() + about() + archive() + contact(),
        nav: nav(), menuNav: menuNav(), menuFoot: menuFoot(),
      };
    },
    // keep the shipped HTML when it was built from this exact content; otherwise draw it now
    mount() {
      const main = document.getElementById('main');
      const fresh = main.dataset.sig === sig() && main.children.length;
      if (!fresh) {
        const r = this.render();
        main.innerHTML = r.main;
        main.dataset.sig = sig();
        document.getElementById('nav').innerHTML = r.nav;
        document.getElementById('menuNav').innerHTML = r.menuNav;
        document.getElementById('menuFoot').innerHTML = r.menuFoot;
      }
      // the parts that depend on today's date
      const chart = main.querySelector('.st-chart');
      if (chart) chart.style.setProperty('--now', nowPct().toFixed(3) + '%');
      const yr = document.getElementById('year');
      if (yr) yr.textContent = new Date().getFullYear();
      return fresh;
    },
  };
  window.buildDOM = () => window.Page.mount();
})();
