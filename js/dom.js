/* ============================================================
   DOM — builds the page from window.DATA. No framework.
   Everything renders synchronously into #app before motion runs.
   ============================================================ */

(function () {
  const D = window.DATA;

  /* ---------- helpers ---------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // "text with |red part" -> markup with the piece after | wrapped in .hot
  const hot = (s) => {
    const i = s.indexOf('|');
    return i < 0 ? esc(s) : esc(s.slice(0, i)) + '<span class="hot">' + esc(s.slice(i + 1)) + '</span>';
  };

  // split a word into individually animatable spans
  const chars = (word, cls) =>
    [...word].map((c) => `<span class="${cls}">${esc(c)}</span>`).join('');

  const secHead = (n, label, side) => `
    <div class="sec-head">
      <span class="n">${esc(n)} /</span>
      <span>${esc(label)}</span>
      <span class="rule"></span>
      <span class="side">${esc(side)}</span>
    </div>`;

  const chips = (arr) => arr.map((t) => `<span class="chip">${esc(t)}</span>`).join('');

  /* ---------- 0. HERO ---------- */
  function hero() {
    const d = D.driver;
    const head = d.name.slice(0, d.split);
    const tail = d.name.slice(d.split);

    const tick = D.ticker.map((t) =>
      `<span><b>&#9679;</b>&nbsp; ${esc(t)}</span>`).join('');

    const cells = D.heroCells.map((c) => `
      <div class="cell">
        <span>${esc(c.k)}</span>
        <b class="${c.tone === 'green' ? 'green' : ''}" ${c.k === 'Status' ? 'id="heroStatus"' : ''}>${esc(c.v)}</b>
      </div>`).join('');

    return `
    <section class="hero" id="top">
      <div class="hero-bg">
        <div class="hero-grid"></div>
        <div class="hero-glow"></div>
        <div class="hero-glow2"></div>
        <div class="hero-scan"></div>
      </div>

      <div class="ticker" aria-hidden="true">
        <div class="ticker-track" id="tickerA">${tick}</div>
        <div class="ticker-track" id="tickerB">${tick}</div>
      </div>

      <div class="hero-body">
        <div class="hero-top boot-hidden" id="heroTop">
          <div class="hero-kicker">
            <div>SESSION <b>RACE</b> &middot; ROUND <b>${esc(d.round)}</b> &middot; CIRCUIT <b>${esc(d.circuit)}</b></div>
            <div>TEAM <b>${esc(d.team)}</b> &middot; SEASON <b>${esc(d.season)}</b></div>
          </div>
          <div class="hero-lights" id="heroLights" aria-hidden="true">
            <i></i><i></i><i></i><i></i><i></i>
          </div>
        </div>

        <div class="hero-name">
          <h1 aria-label="${esc(d.name)}">
            ${chars(head, 'hero-ch')}<span class="red">${chars(tail, 'hero-ch')}</span>
          </h1>
          <div class="hero-role boot-hidden" id="heroRole">
            <span class="dash"></span><span>${esc(d.role)}</span>
          </div>
        </div>

        <div class="hero-strip boot-hidden" id="heroStrip">${cells}</div>
      </div>

      <div class="scroll-cue boot-hidden" id="scrollCue">
        <span>SCROLL &middot; BEGIN STINT</span><span class="tube"></span>
      </div>
    </section>`;
  }

  /* ---------- 1. DRIVER ---------- */
  function driver() {
    const p = D.profile, d = D.driver;

    const spec = p.spec.map((s) =>
      `<div class="r"><span>${esc(s.k)}</span><b>${esc(s.v)}</b></div>`).join('');

    const stats = p.stats.map((s) => `
      <div class="s">
        <div class="lbl">${esc(s.lbl)}</div>
        <div class="val"><span data-count="${s.to}" data-suffix="${esc(s.suffix)}">${s.to}${esc(s.suffix)}</span></div>
      </div>`).join('');

    const bio = p.bio.map((t) => `<p class="rise">${esc(t)}</p>`).join('');

    return `
    <section class="sec band" id="driver">
      <div class="sec-inner">
        ${secHead('01', 'Driver Profile', 'Installation Lap')}
        <div class="driver-grid">

          <div class="frame rise" id="driverFrame" data-cursor="driver">
            <span class="c tl"></span><span class="c tr"></span>
            <span class="c bl"></span><span class="c br"></span>
            <span class="tag a rec"><i></i>REC</span>
            <span class="tag b">04 &middot; IND</span>
            <span class="tag c2">${esc(d.coords)}</span>
            <span class="tag d">ISO 800 &middot; f/1.8</span>
            <div class="frame-media">
              <img src="${esc(d.photo)}" alt="Satyam" width="1100" height="1100" loading="lazy" decoding="async" id="driverImg" />
              <span class="frame-sweep"></span>
            </div>
          </div>

          <div class="driver-copy">
            <div class="eyebrow rise">// PROFILE.READ</div>
            <h3 class="split-lines">${hot(p.heading[0])}<br>${hot(p.heading[1])}</h3>
            ${bio}
            <div class="spec-list rise">${spec}</div>
            <div class="stat-row rise">${stats}</div>
          </div>

        </div>
      </div>
    </section>`;
  }

  /* ---------- 2. SETUP ---------- */
  function setup() {
    const comps = D.compounds.map((c) => `
      <button class="comp ${c.id === 'all' ? 'on' : ''}" data-c="${esc(c.id)}"
              aria-pressed="${c.id === 'all'}" data-cursor="filter">
        <span class="ring">${esc(c.letter)}</span>
        <span class="cl">${esc(c.label)}</span>
      </button>`).join('');

    const rows = D.skills.map((s, i) => `
      <div class="skill" data-c="${esc(s.compound)}" data-w="${s.w}">
        <span class="skill-mark"></span>
        <div class="skill-top">
          <span class="skill-name">${esc(s.name)}</span>
          <span class="skill-pct">${String(s.w).padStart(3, '0')} / 100</span>
        </div>
        <div class="skill-bar"><i class="${i % 2 ? 'alt' : ''}" style="width:${s.w}%"></i><u></u></div>
        <div class="skill-tags">${chips(s.tags)}</div>
      </div>`).join('');

    return `
    <section class="sec" id="setup">
      <div class="sec-inner">
        ${secHead('02', 'Setup Sheet', 'Tech Stack · Compound Analysis')}
        <div class="setup-grid">
          <div class="setup-left">
            <div class="eyebrow rise">// GARAGE.LOADOUT</div>
            <h3 class="split-lines">Tools<br>I race with.</h3>
            <p class="rise">Calibrated for high-stakes builds &mdash; from algorithmic problem sets
              through ML pipelines to production payment-flow testing. Pick a compound to filter
              the setup.</p>
            <div class="compounds rise" id="compounds" role="group" aria-label="Filter by compound">${comps}</div>
          </div>
          <div class="skill-grid" id="skillGrid">${rows}</div>
        </div>
      </div>
    </section>`;
  }

  /* ---------- 3. HISTORY ---------- */
  function history() {
    const rows = D.races.map((r, i) => `
      <div class="trow" data-i="${i}">
        <button class="trow-main" aria-expanded="false" aria-controls="det-${i}" data-cursor="expand">
          <span class="t-pos">${esc(r.pos)}</span>
          <span class="t-role">
            ${r.logo ? `<span class="t-logo"><img src="${esc(r.logo)}" alt="" width="220" height="220" loading="lazy" decoding="async"></span>` : ''}
            <span><b>${esc(r.role)}</b><span>${esc(r.org)}</span></span>
          </span>
          <span class="t-when">${esc(r.when)}</span>
          <span class="t-laps">${esc(r.laps)}</span>
          <span class="t-best ${esc(r.tone)}">${esc(r.best)}<span>${esc(r.bestLbl)}</span></span>
          <span class="t-tog" aria-hidden="true"></span>
        </button>
        <div class="t-detail" id="det-${i}">
          <div class="t-detail-in">
            <p>${esc(r.gist)}</p>
            <ul class="t-points">${r.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
          </div>
        </div>
      </div>`).join('');

    return `
    <section class="sec band" id="history">
      <div class="sec-inner">
        ${secHead('03', 'Race History', 'Seasons 2024 → 2026')}
        <h2 class="sec-title split-lines">Race <span class="hot">results.</span></h2>
        <div class="board">
          <div class="board-head">
            <span>Pos</span><span>Role &amp; Team</span><span>Window</span>
            <span>Duration</span><span>Best</span><span></span>
          </div>
          ${rows}
        </div>
      </div>
    </section>`;
  }

  /* ---------- 4. GARAGE ---------- */
  function garage() {
    const cards = D.projects.map((p) => `
      <a class="card ${p.featured ? 'wide' : ''}" href="${esc(p.href)}"
         target="_blank" rel="noreferrer noopener" data-cursor="open">
        <div class="card-top">
          <span class="card-n">${esc(p.n)}</span>
          <span class="card-badge"><i></i>${esc(p.badge)}</span>
        </div>
        <h4>${esc(p.title)}</h4>
        <div class="sub">${esc(p.subtitle)}</div>
        <p>${esc(p.desc)}</p>
        <div class="card-metrics">
          ${p.metrics.map((m) => `<div><div class="k">${esc(m.k)}</div><div class="v">${esc(m.v)}</div></div>`).join('')}
        </div>
        <div class="card-stack">${chips(p.stack)}</div>
        <div class="card-foot">
          <span>Chassis ${esc(p.n)}</span>
          <span class="go">Open repo <span class="arr"></span></span>
        </div>
      </a>`).join('');

    return `
    <section class="garage" id="garage">
      ${secHead('04', 'The Garage', 'Projects · Chassis Builds')}
      <h2 class="sec-title split-lines">What I&rsquo;m <span class="hot">shipping.</span></h2>
      <div class="rail-vp" id="railVp">
        <div class="rail-track" id="railTrack">${cards}</div>
      </div>
      <div class="rail-meter">
        <span class="rail-hint"><i></i><span id="railHint">Drag or scroll</span></span>
        <span class="bar"><i id="railMeter"></i></span>
        <span class="tnum" id="railCount">01 / ${String(D.projects.length).padStart(2, '0')}</span>
      </div>
    </section>`;
  }

  /* ---------- 5. CREW ---------- */
  function crew() {
    const tiles = D.crew.map((c) => `
      <article class="tile ${esc(c.size)}">
        <div class="tile-head">
          <span class="tile-role">${esc(c.role)}</span>
          ${c.logo ? `<span class="tile-logo"><img src="${esc(c.logo)}" alt="" width="220" height="220" loading="lazy" decoding="async"></span>` : ''}
        </div>
        <h4>${esc(c.title)}</h4>
        <div class="when">${esc(c.when)}</div>
        <p>${esc(c.gist)}</p>
        <div class="big"><span data-count="${c.to}" data-suffix="${esc(c.suffix)}">${c.to}${esc(c.suffix)}</span>
          <span>${esc(c.bigLbl)}</span></div>
      </article>`).join('');

    const stats = D.crewStats.map((s) => `
      <article class="tile stat sm">
        <span class="k">${esc(s.k)}</span>
        <span class="v" data-count="${s.to}" data-suffix="${esc(s.suffix)}">${s.to}${esc(s.suffix)}</span>
      </article>`).join('');

    return `
    <section class="sec" id="crew">
      <div class="sec-inner">
        ${secHead('05', 'Pit Crew', 'Leadership · Operations')}
        <h2 class="sec-title split-lines">Off-track <span class="hot">ops.</span></h2>
        <div class="bento" id="bento">${tiles}${stats}</div>
      </div>
    </section>`;
  }

  /* ---------- 6. PIT LANE ---------- */
  function pitlane() {
    const L = D.links;
    return `
    <section class="pitlane" id="pitlane">
      <div class="flag" aria-hidden="true"></div>
      <div class="pitlane-in">
        ${secHead('06', 'Pit Lane', 'Open to briefs · internships · collabs')}
        <h2 class="pit-h" aria-label="Box, box.">
          ${chars('BOX,', 'pit-ch')}<span class="pit-ch">&nbsp;</span><span class="red">${chars('BOX.', 'pit-ch')}</span>
        </h2>
        <p class="pit-lead rise">Got a build that needs a fast driver? Drop into the pit lane.
          I&rsquo;m open to internships, research collabs, and side-project chaos.</p>
        <div class="pit-ctas rise">
          <a class="btn primary magnet" href="mailto:${esc(L.email)}" data-cursor="mail">
            <span>Send transmission <span class="arr"></span></span></a>
          <a class="btn magnet" href="${esc(L.github)}" target="_blank" rel="noreferrer noopener" data-cursor="open"><span>GitHub</span></a>
          <a class="btn magnet" href="${esc(L.linkedin)}" target="_blank" rel="noreferrer noopener" data-cursor="open"><span>LinkedIn</span></a>
          <a class="btn magnet" href="${esc(L.leetcode)}" target="_blank" rel="noreferrer noopener" data-cursor="open"><span>LeetCode</span></a>
        </div>
        <div class="foot">
          <div><a href="mailto:${esc(L.email)}">${esc(L.email)}</a><span>Email</span></div>
          <div><a href="tel:${esc(L.phone.replace(/\s/g, ''))}">${esc(L.phone)}</a><span>Radio</span></div>
          <div><span>&copy; Satyam &middot; ${new Date().getFullYear()}</span><span>End &middot; Lap 07</span></div>
        </div>
      </div>
    </section>`;
  }

  /* ---------- nav ---------- */
  function navMarkup() {
    return D.sections.filter((s) => s.id !== 'top').map((s) =>
      `<a href="#${esc(s.id)}" data-sec="${esc(s.id)}" data-cursor="jump">
         <span class="idx">${esc(s.tag)}</span>${esc(s.nav)}</a>`).join('');
  }
  function drawerMarkup() {
    return D.sections.map((s) =>
      `<a href="#${esc(s.id)}" data-sec="${esc(s.id)}">
         <span class="idx">${esc(s.tag)}</span>${esc(s.nav)}</a>`).join('');
  }

  /* ---------- circuit sector buttons ---------- */
  function circuitSecs() {
    return [1, 2, 3].map((n) =>
      `<button data-sector="${n}" ${n === 1 ? 'class="on"' : ''}>S${n}</button>`).join('');
  }

  /* ---------- mount ---------- */
  window.buildDOM = function buildDOM() {
    document.getElementById('app').innerHTML =
      hero() + driver() + setup() + history() + garage() + crew() + pitlane();
    document.getElementById('navLinks').innerHTML = navMarkup();
    document.getElementById('drawerLinks').innerHTML = drawerMarkup();
    document.getElementById('circSecs').innerHTML = circuitSecs();
  };
})();
