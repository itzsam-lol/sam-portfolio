const { useEffect, useRef, useState, useCallback } = React;

// GSAP helpers — safe wrappers
const G = window.gsap || null;
const ST = window.ScrollTrigger || null;

function gsapReveal(container, selector, extra) {
  if (!G || !ST || !container) return;
  const els = container.querySelectorAll(selector);
  els.forEach((el, i) => {
    G.fromTo(el,
      { opacity: 0, y: 44 },
      {
        opacity: 1, y: 0, duration: 0.85,
        ease: 'power3.out',
        delay: i * 0.09,
        scrollTrigger: { trigger: el, start: 'top 86%', toggleActions: 'play none none none' },
        ...extra,
      }
    );
  });
}

// ============================================================
// HERO
// ============================================================
function Hero() {
  const [lights, setLights] = useState(0);
  const [out, setOut] = useState(false);
  const animatedRef = useRef(false);

  // Race lights sequence
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      if (i <= 5) setLights(i);
      else if (i === 6) { setLights(0); setOut(true); clearInterval(id); }
    }, 700);
    return () => clearInterval(id);
  }, []);

  // Hero text animation (runs after loader finishes)
  useEffect(() => {
    function runAnim() {
      if (animatedRef.current || !G) return;
      animatedRef.current = true;

      const chars = document.querySelectorAll('.hero-char');
      const tl = G.timeline();

      tl.fromTo(chars,
        { y: 90, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.038, duration: 0.75, ease: 'power4.out' }
      )
      .fromTo('.hero-top',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.3'
      )
      .fromTo('.hero-name .sub',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4'
      )
      .fromTo('.hero-foot',
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.3'
      )
      .fromTo('.scroll-cue',
        { opacity: 0 },
        { opacity: 1, duration: 0.5 }, '-=0.2'
      );
    }

    // If loader already done, run immediately; else wait for event
    if (document.getElementById('loader') && document.getElementById('loader').classList.contains('done')) {
      setTimeout(runAnim, 100);
    } else {
      document.addEventListener('loaderDone', runAnim, { once: true });
    }
    return () => document.removeEventListener('loaderDone', runAnim);
  }, []);

  const marqueeItems = [
    'ROUND 04 — IIIT DELHI GP', 'DRIVER 04 · SATYAM',
    'SEASON 2026', 'TEAM CSE',
    '300+ LEETCODE', '100+ MENTEES',
    'SECTOR 2 — RESEARCH', 'DRS ENABLED',
  ];

  return (
    <section className="hero first" id="top">
      <div className="bg-grid" />
      <div className="bg-stripes" />
      <div className="bg-glow" />
      <div className="bg-glow2" />

      <div className="marquee">
        <div className="track">
          {[0, 1].flatMap((k) =>
            marqueeItems.map((t, i) => (
              <span key={k + '-' + i}><b>●</b>&nbsp; {t} &nbsp;<span className="sep">/</span></span>
            ))
          )}
        </div>
      </div>

      <div className="hero-wrap">
        <div className="hero-top" style={{ opacity: 0 }}>
          <div className="small">
            <div>SESSION <b>RACE</b>&nbsp;·&nbsp;ROUND <b>04 / 24</b>&nbsp;·&nbsp;CIRCUIT <b>NEW DELHI</b></div>
            <div style={{ marginTop: 6 }}>WEATHER <b>27°C / DRY</b>&nbsp;·&nbsp;AIR <b>24°C</b>&nbsp;·&nbsp;WIND <b>NE 6 KPH</b></div>
          </div>
          <div className="lights" aria-hidden="true">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={'l ' + ((!out && lights >= i) ? 'on' : '')} />
            ))}
          </div>
        </div>

        <div className="hero-name">
          <h1>
            {['S','A','T'].map((c, i) => <span key={i} className="hero-char" style={{ opacity: 0 }}>{c}</span>)}
            <span className="ital">
              {['Y','A','M'].map((c, i) => <span key={i} className="hero-char" style={{ opacity: 0 }}>{c}</span>)}
            </span>
          </h1>
          <div className="sub" style={{ opacity: 0 }}>
            <h2>CS Engineer · Builder · Race Strategist</h2>
          </div>
        </div>

        <div className="hero-foot" style={{ opacity: 0 }}>
          <div className="cell">
            <span>Top Speed · LeetCode</span>
            <span className="v">300+</span>
          </div>
          <div className="cell">
            <span>Pit Stops · Internships</span>
            <span className="v green">03</span>
          </div>
          <div className="cell">
            <span>Status</span>
            <span className="v" style={{ color: out ? 'var(--green)' : 'var(--red)' }}>
              {out ? 'ON TRACK' : 'LIGHTS OUT'}
            </span>
          </div>
        </div>
      </div>

      <div className="scroll-cue" style={{ opacity: 0 }}>
        <span>SCROLL · BEGIN STINT</span>
        <span className="arr" />
      </div>
    </section>
  );
}

// ============================================================
// PROFILE
// ============================================================
function Profile() {
  const secRef = useRef(null);
  const statsRef = useRef(null);
  const countersRan = useRef(false);

  useEffect(() => {
    if (!secRef.current) return;
    gsapReveal(secRef.current, '.gsap-reveal');

    // Counter animation for stats
    if (!G || !ST) return;
    const statEls = secRef.current.querySelectorAll('[data-count]');
    statEls.forEach(el => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const isFloat = el.dataset.float === '1';
      const obj = { n: 0 };
      G.to(obj, {
        n: target, duration: 2, ease: 'power2.out',
        onUpdate: () => {
          el.textContent = isFloat ? obj.n.toFixed(2) : Math.floor(obj.n) + suffix;
        },
        scrollTrigger: { trigger: el, start: 'top 82%', toggleActions: 'play none none none' },
      });
    });
  }, []);

  return (
    <section id="about" ref={secRef}>
      <div className="container">
        <div className="sec-tag gsap-reveal">
          <span className="n">01 /</span><span>DRIVER PROFILE</span>
          <span className="ln" /><span>INSTALLATION LAP</span>
        </div>

        <div className="profile">
          <div className="photo-card gsap-reveal">
            <span className="frame tl" /><span className="frame tr" />
            <span className="frame bl" /><span className="frame br" />
            <span className="corner">REC ●</span>
            <span className="corner r mono">04 · IND</span>
            <span className="corner b mono">28.6448° N · 77.2167° E</span>
            <div className="img">
              <img src="assets/sam.png" alt="Satyam" />
            </div>
          </div>

          <div className="copy">
            <div className="gsap-reveal" style={{ fontFamily:"'JetBrains Mono'", fontSize: 11, color: 'var(--red)', letterSpacing: '.22em', marginBottom: 14 }}>
              // PROFILE.READ
            </div>
            <h3 className="gsap-reveal">Builder running<br />at <span className="accent">racing pace.</span></h3>
            {window.PROFILE.bio.map((p, i) => (
              <p key={i} className="gsap-reveal">{p}</p>
            ))}
            <div className="stats" ref={statsRef}>
              {[
                { lbl: 'Problems Solved', n: '300', count: 300, suffix: '+', u: '+' },
                { lbl: 'Mentees', n: '100', count: 100, suffix: '+', u: '+' },
                { lbl: 'Footfall Managed', n: '50K', count: 50, suffix: 'K+', u: '+' },
              ].map((s, i) => (
                <div className="s" key={i}>
                  <div className="lbl">{s.lbl}</div>
                  <div className="val">
                    <span
                      data-count={s.count}
                      data-suffix={s.suffix}
                      data-float={s.float || '0'}
                    >{s.n}</span>
                    <span className="u">{s.u}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// SETUP (Skills)
// ============================================================
function Setup() {
  const secRef = useRef(null);

  useEffect(() => {
    if (!secRef.current || !G || !ST) return;
    gsapReveal(secRef.current, '.gsap-reveal');

    // Animate skill bars
    secRef.current.querySelectorAll('.setup .grid .row').forEach((row, i) => {
      const bar = row.querySelector('.bar i');
      if (!bar) return;
      const w = (row.dataset.w || '80') + '%';
      G.fromTo(bar,
        { width: 0 },
        {
          width: w, duration: 1.4, ease: 'power3.out',
          delay: i * 0.08,
          scrollTrigger: { trigger: row, start: 'top 88%', toggleActions: 'play none none none' },
        }
      );

      // Fade in row
      G.fromTo(row,
        { opacity: 0, x: -20 },
        {
          opacity: 1, x: 0, duration: 0.7, ease: 'power3.out',
          delay: i * 0.08,
          scrollTrigger: { trigger: row, start: 'top 88%', toggleActions: 'play none none none' },
        }
      );
    });
  }, []);

  return (
    <section id="skills" ref={secRef}>
      <div className="container">
        <div className="sec-tag gsap-reveal">
          <span className="n">02 /</span><span>SETUP SHEET</span>
          <span className="ln" /><span>TECH STACK · COMPOUND ANALYSIS</span>
        </div>

        <div className="setup">
          <div className="left">
            <div className="gsap-reveal" style={{ fontFamily:"'JetBrains Mono'", fontSize: 11, color: 'var(--red)', letterSpacing: '.22em', marginBottom: 14 }}>
              // GARAGE.LOADOUT
            </div>
            <h3 className="gsap-reveal">Tools<br />I race with.</h3>
            <p className="gsap-reveal">Calibrated for high-stakes builds — from algorithmic problem sets through ML pipelines to production payment-flow testing. Each compound tuned to the stint.</p>
            <div className="compounds gsap-reveal">
              <div className="compound s"><div className="ring">S</div><span>Soft</span></div>
              <div className="compound m"><div className="ring">M</div><span>Medium</span></div>
              <div className="compound h"><div className="ring">H</div><span>Hard</span></div>
            </div>
          </div>

          <div className="grid">
            {window.SKILLS.map((s, i) => (
              <div className="row" key={i} data-w={s.w} style={{ opacity: 0 }}>
                <div className="top">
                  <div className="name">{s.name}</div>
                  <div className="pct mono">{String(s.w).padStart(3, '0')} / 100</div>
                </div>
                <div className="bar"><i className={i % 2 ? '' : 'red'} /></div>
                <div className="tags">
                  {s.tags.map((t, j) => <span className="tag" key={j}>{t}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// HISTORY (Experience)
// ============================================================
function History() {
  const secRef = useRef(null);

  useEffect(() => {
    if (!secRef.current) return;
    gsapReveal(secRef.current, '.gsap-reveal');
    if (!G || !ST) return;

    secRef.current.querySelectorAll('.race-row').forEach((row, i) => {
      G.fromTo(row,
        { opacity: 0, x: -32 },
        {
          opacity: 1, x: 0, duration: 0.8, ease: 'power3.out',
          delay: i * 0.12,
          scrollTrigger: { trigger: row, start: 'top 85%', toggleActions: 'play none none none' },
        }
      );
    });
  }, []);

  return (
    <section id="experience" ref={secRef}>
      <div className="container">
        <div className="sec-tag gsap-reveal">
          <span className="n">03 /</span><span>RACE HISTORY</span>
          <span className="ln" /><span>SEASONS 2024 → 2026</span>
        </div>
        <h3 className="sec-h gsap-reveal">
          Race&nbsp;<span style={{ color: 'var(--red)' }}>results.</span>
        </h3>
        <div className="race-table">
          {window.RACES.map((r, i) => (
            <div className="race-row" key={i} style={{ opacity: 0 }}>
              <div className="pos-wrap">
                <div className="pos">{r.pos}</div>
              </div>
              <div className="role" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {r.logo && (
                  <div className="org-logo"><img src={r.logo} alt={r.org} /></div>
                )}
                <div>{r.role}<span className="org">{r.org}</span></div>
              </div>
              <div className="when">{r.when}</div>
              <div className="gist">{r.gist}</div>
              <div className={'stat ' + (r.statColor || '')}>
                {r.stat}<span className="lbl">{r.statLbl}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// GARAGE (Projects)
// ============================================================
function Garage() {
  const secRef = useRef(null);

  useEffect(() => {
    if (!secRef.current) return;
    gsapReveal(secRef.current, '.gsap-reveal');
    if (!G || !ST) return;

    secRef.current.querySelectorAll('.car').forEach((card, i) => {
      G.fromTo(card,
        { opacity: 0, y: 40, scale: 0.97 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.75, ease: 'power3.out',
          delay: (i % 3) * 0.1,
          scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none none' },
        }
      );
    });
  }, []);

  return (
    <section id="projects" ref={secRef}>
      <div className="container">
        <div className="sec-tag gsap-reveal">
          <span className="n">04 /</span><span>THE GARAGE</span>
          <span className="ln" /><span>PROJECTS · CHASSIS BUILDS</span>
        </div>
        <h3 className="sec-h gsap-reveal">
          What I'm <span style={{ color: 'var(--red)', fontStyle: 'italic' }}>shipping.</span>
        </h3>
        <div className="garage">
          {window.PROJECTS.map((p, i) => (
            <a key={i} href={p.href} target="_blank" rel="noreferrer" className={'car ' + p.w} style={{ opacity: 0 }}>
              <div className="speed"><b>●</b> {p.speed}</div>
              <div className="num">{p.n}</div>
              {p.w === 'feat' ? (
                <>
                  <h4>{p.title}</h4>
                  <div className="right">
                    <p>{p.desc}</p>
                    <div className="stack">{p.stack.map((s, j) => <span key={j}>{s}</span>)}</div>
                    <div className="foot" style={{ width: '100%', marginTop: 8, borderTop: '1px dashed var(--line-2)', paddingTop: 14, display: 'flex', justifyContent: 'space-between' }}>
                      <span>VIEW · LAP RECORD</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--ink)', fontWeight: 700 }}>
                        OPEN GITHUB <span className="arr" />
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h4>{p.title}</h4>
                  <p>{p.desc}</p>
                  <div className="stack">{p.stack.map((s, j) => <span key={j}>{s}</span>)}</div>
                  <div className="foot">
                    <span>OPEN</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>GITHUB <span className="arr" /></span>
                  </div>
                  {p.logo && (
                    <div className="car-logo">
                      <img src={p.logo} alt={p.title} />
                    </div>
                  )}
                </>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// CREW (Leadership)
// ============================================================
function Crew() {
  const secRef = useRef(null);

  useEffect(() => {
    if (!secRef.current) return;
    gsapReveal(secRef.current, '.gsap-reveal');
    if (!G || !ST) return;

    secRef.current.querySelectorAll('.pit').forEach((card, i) => {
      G.fromTo(card,
        { opacity: 0, y: 48 },
        {
          opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          delay: i * 0.14,
          scrollTrigger: { trigger: card, start: 'top 86%', toggleActions: 'play none none none' },
        }
      );
    });
  }, []);

  return (
    <section id="leadership" ref={secRef}>
      <div className="container">
        <div className="sec-tag gsap-reveal">
          <span className="n">05 /</span><span>PIT CREW</span>
          <span className="ln" /><span>LEADERSHIP · OPERATIONS</span>
        </div>
        <h3 className="sec-h gsap-reveal">
          Off-track <span style={{ color: 'var(--red)' }}>ops.</span>
        </h3>
        <div className="crew">
          {window.CREW.map((c, i) => (
            <div className="pit" key={i} style={{ opacity: 0 }}>
              <div className="pit-header">
                <div className="role">{c.role}</div>
                {c.logo && (
                  <div className="pit-logo">
                    <img src={c.logo} alt={c.title} />
                  </div>
                )}
              </div>
              <h4>{c.title}</h4>
              <div className="when">{c.when}</div>
              <p>{c.gist}</p>
              <div className="big">{c.big}<span className="lbl">{c.bigLbl}</span></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// PIT LANE (Contact)
// ============================================================
function PitLane() {
  const secRef = useRef(null);

  useEffect(() => {
    if (!secRef.current || !G || !ST) return;
    G.fromTo(secRef.current.querySelector('h2'),
      { opacity: 0, scale: 0.92 },
      {
        opacity: 1, scale: 1, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: secRef.current, start: 'top 75%', toggleActions: 'play none none none' },
      }
    );
    G.fromTo(secRef.current.querySelectorAll('.gsap-reveal'),
      { opacity: 0, y: 28 },
      {
        opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1,
        scrollTrigger: { trigger: secRef.current, start: 'top 70%', toggleActions: 'play none none none' },
      }
    );
  }, []);

  const L = window.LINKS;
  return (
    <section id="contact" className="pitlane" ref={secRef}>
      <div className="checker" />
      <div className="sec-tag gsap-reveal" style={{ maxWidth: 1480, margin: '0 auto 24px', justifyContent: 'center' }}>
        <span className="n">06 /</span><span>PIT LANE</span>
        <span className="ln" style={{ maxWidth: 200 }} />
        <span>OPEN TO BRIEFS · INTERNSHIPS · COLLABS</span>
      </div>
      <h2 style={{ opacity: 0 }}>BOX,&nbsp;<span className="red">BOX.</span></h2>
      <p className="lead gsap-reveal">
        Got a build that needs a fast driver? Drop into the pit lane. I'm open to internships, research collabs, and side-project chaos.
      </p>
      <div className="ctas gsap-reveal">
        <a className="btn red" href={'mailto:' + L.email}>
          <div className="btn-bg" /><span>SEND TRANSMISSION →</span>
        </a>
        <a className="btn" href={L.github} target="_blank" rel="noreferrer">
          <div className="btn-bg" /><span>GITHUB</span>
        </a>
        <a className="btn" href={L.linkedin} target="_blank" rel="noreferrer">
          <div className="btn-bg" /><span>LINKEDIN</span>
        </a>
        <a className="btn" href={L.leetcode} target="_blank" rel="noreferrer">
          <div className="btn-bg" /><span>LEETCODE</span>
        </a>
      </div>

      <div className="footer-strip">
        <div><span>{L.email}</span><span>EMAIL</span></div>
        <div><span>{L.phone}</span><span>RADIO</span></div>
        <div><span>© SATYAM · {new Date().getFullYear()}</span><span>END / LAP 07</span></div>
      </div>
    </section>
  );
}

window.Hero = Hero;
window.Profile = Profile;
window.Setup = Setup;
window.History = History;
window.Garage = Garage;
window.Crew = Crew;
window.PitLane = PitLane;
