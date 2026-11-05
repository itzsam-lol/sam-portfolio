/* ============================================================
   DATA: every word on the page lives here.
   Edit this file to update the site; nothing else needs touching.

   Source of truth is portfolio.json (kept out of git: it holds
   private notes). Claims that file flags under "verify" are left
   out until they are confirmed.

   In project text, {words|part} links the words to a part of that
   project's figure: hovering one points at the other.
   ============================================================ */

window.DATA = {

  person: {
    name: 'Satyam',
    code: 'SAT',                       // three-letter timing-screen code
    number: '04',
    role: 'Computer Science & AI',
    school: 'IIIT-Delhi',
    classOf: '2027',
    city: 'New Delhi',
    tz: 'Asia/Kolkata',
    email: 'satyam23495@iiitd.ac.in',
    resume: null,                      // set to a PDF path to show a résumé link
    portrait: {
      avif: 'assets/portrait.avif',
      webp: 'assets/portrait.webp',
      small: 'assets/portrait-640.webp',
      w: 900, h: 1191,
      alt: 'Satyam in a red race suit, arms crossed, smiling',
    },
    open: 'Open to software, ML and quantitative research roles from 2027, and to research collaborations now.',
    links: [
      { label: 'GitHub',       handle: 'itzsam-lol',      href: 'https://github.com/itzsam-lol' },
      { label: 'LinkedIn',     handle: 'satyam564774288', href: 'https://linkedin.com/in/satyam564774288' },
      { label: 'LeetCode',     handle: 'samuraiiii',      href: 'https://leetcode.com/u/samuraiiii' },
      { label: 'Kaggle',       handle: 'samuraiiii',      href: 'https://www.kaggle.com/samuraiiii' },
      { label: 'Hugging Face', handle: 'samisonhf',       href: 'https://huggingface.co/samisonhf' },
      { label: 'Instagram',    handle: 'sam_r.py',        href: 'https://www.instagram.com/sam_r.py/' },
    ],
    languages: 'English and Hindi; learning French and Japanese.',
  },

  hero: {
    lede: 'Final-year Computer Science and AI student at IIIT-Delhi. I build machine learning systems and backends, and I do quantitative research.',
    facts: [
      { k: 'Summer 2026',    v: 'Dell Technologies', d: 'LLM inference benchmarking on PowerEdge AI servers' },
      { k: 'Open data, 2026', v: 'FinChrona',        d: 'U.S. Treasury rates, 1990 to 2026, with a Zenodo DOI' },
      { k: 'Since Jan 2026', v: 'Teaching assistant', d: 'Data Structures and Computer Networks, 100+ students' },
      { k: 'Co-founder',     v: 'Ignite Room',        d: 'Student tech community of 10,000+ members' },
    ],
  },

  // read word by word as you scroll
  intro: 'I like problems that have to be measured before they can be solved. At Dell I benchmarked LLM inference on PowerEdge AI servers, changing one configuration at a time until the numbers explained themselves. BRDO measures how much of an Indian bond’s protection can be traced through public records, and writes down exactly where the trail stops. SecondAsk prices every payment retry before it makes one. Same instinct, different track.',

  machine: {
    line: 'Drawn first, then built.',
    note: 'Keep scrolling. The red line sweeps across the car, and behind it the drawing has become the machine.',
    caption: 'Fig. 0  Single-seater, rendered live in WebGL from a 269 KB Draco-compressed mesh of 122,000 triangles. Right of the red line is an ink drawing made from the car’s own normals and depth; left of it, the lit car.',
    still: 'Fig. 0  Single-seater, drawn from the car’s own normals and depth. This is a still; in a browser with WebGL the drawing turns into the lit car as you scroll.',
  },

  /* ---------- selected work: one drawing sheet each ---------- */
  work: [
    {
      id: 'careeros',
      title: 'CareerOS',
      area: 'AI agents, full-stack',
      status: 'Deployed',
      stamp: 'Deployed',
      line: 'A career agent that finds openings, matches them to a verified profile and tailors each application, without acting until a person signs off.',
      body: 'A FastAPI and SQLAlchemy backend on {PostgreSQL with pgvector|db}, a Next.js web app and an Expo mobile app, all in one pnpm monorepo that shares a {typed OpenAPI client|client}. {Validators|validate} reject any claim the profile cannot back up, and anything that would leave the system waits at an {approval gate|gate}. It runs on a Google Cloud VM.',
      points: [
        'Designed, built and deployed end to end',
        'Tests, linting and type-checking in the workflow',
        '80+ commits across the monorepo',
      ],
      metrics: [
        { v: '2', u: 'apps', k: 'Web and mobile, one typed client' },
        { v: '80+', u: '', k: 'Commits in the monorepo' },
      ],
      stack: ['Python', 'FastAPI', 'SQLAlchemy', 'PostgreSQL', 'pgvector', 'Next.js', 'React Native', 'Docker Compose', 'Google Cloud', 'OpenAPI'],
      links: [{ label: 'Repository', href: 'https://github.com/itzsam-lol/careeros' }],
      fig: 'careeros',
      caption: 'Applications move left to right. The red ones made a claim the profile could not support, so the validator stops them. Nothing leaves until the approval gate opens.',
    },
    {
      id: 'secondask',
      title: 'SecondAsk',
      area: 'Fintech, ML, agents',
      status: 'Razorpay AI Buildathon',
      stamp: '0 violations',
      line: 'A failed-payment recovery agent that prices every retry and reminder before it makes one.',
      body: 'It decides when and how to retry a failed payment. {One logistic regression per recovery action|model} estimates the chance it works; each action is then checked against {22 compliance rules|rules} that fail closed, so a rule that cannot be satisfied {blocks the action|act} instead of waving it through.',
      points: [
        'Evaluated on 12,000 simulated payments',
        'Calibrated probabilities, not just rankings',
        'Zero compliance violations in simulation',
      ],
      metrics: [
        { v: '18.2', u: '%', k: 'Value recovered, against 8.6% for a fixed schedule' },
        { v: '0.82', u: '', k: 'Held-out AUC' },
        { v: '0.022', u: '', k: 'Expected calibration error' },
      ],
      stack: ['Python', 'FastAPI', 'Logistic regression', 'AI agents', 'LLM applications', 'Simulation'],
      links: [{ label: 'Repository', href: 'https://github.com/itzsam-lol/SecondAsk' }],
      fig: 'secondask',
      caption: 'Each candidate action gets its own model and a price. All 22 rules must pass; one failure and the action is dropped. Right: value recovered across the same 12,000 simulated payments.',
    },
    {
      id: 'codeforge',
      title: 'CodeForge',
      area: 'Backend, security',
      status: 'Completed',
      stamp: 'Security reviewed',
      line: 'A self-hosted, white-label coding assessment platform with sandboxed execution.',
      body: 'Organisations write tests and invite candidates through expiring links. Every submission goes through a {BullMQ queue on Redis|queue} to workers that run it inside a {Judge0 sandbox|sandbox}. {The timer lives on the server|api}, so a paused tab or a changed clock buys nothing, and a {winnowing fingerprint engine|prints} flags likely plagiarism.',
      points: [
        'Load-tested, security-reviewed, end-to-end tested with Playwright',
        'Zero WCAG A/AA accessibility violations',
        'Results auto-scored and ready for review',
      ],
      metrics: [
        { v: '0', u: '', k: 'WCAG A/AA accessibility violations' },
      ],
      stack: ['TypeScript', 'Express', 'Next.js', 'Prisma', 'PostgreSQL', 'Redis', 'BullMQ', 'Judge0', 'Docker', 'Playwright'],
      links: [{ label: 'Repository', href: 'https://github.com/itzsam-lol/CodeForge' }],
      fig: 'codeforge',
      caption: 'Top: submissions queue up and workers pull them into the sandbox. Bottom: winnowing slides a window over hashed k-grams and keeps the smallest hash in each window as a fingerprint.',
    },
    {
      id: 'synchropulse',
      title: 'SynchroPulse AI',
      area: 'ML, optimisation, cloud',
      status: 'Four-person team',
      stamp: 'Deployed on EC2',
      line: 'Forecasts traffic congestion up to three hours ahead, then plans where traffic personnel and barricades should go.',
      body: 'Congestion is predicted on {real road networks|roads} built with OSMnx and NetworkX. Google OR-Tools turns each forecast into a {deployment plan|crew}, and a FastAPI and React dashboard serves it from AWS EC2 under Docker Compose. Built over five staged project reviews.',
      points: [
        'Three-hour-ahead congestion forecasts',
        'OR-Tools deployment optimisation',
        'Deployed on AWS EC2 with Docker Compose',
      ],
      metrics: [
        { v: '3', u: 'h', k: 'Forecast horizon' },
        { v: '5', u: '', k: 'Staged project reviews' },
      ],
      stack: ['Python', 'OSMnx', 'NetworkX', 'OR-Tools', 'FastAPI', 'React', 'Streamlit', 'AWS', 'Docker'],
      links: [{ label: 'Repository', href: 'https://github.com/itzsam-lol/synchroo' }],
      fig: 'synchropulse',
      caption: 'An illustrative network, not real data. As the forecast clock runs from now to three hours out, roads heat up and the plan moves crews and barricades to where they will matter.',
    },
    {
      id: 'campusfind',
      title: 'CampusFind',
      area: 'Full-stack, AI matching',
      status: 'Live',
      stamp: 'Live',
      line: 'A lost-and-found platform for Delhi colleges, with university-email sign-in and QR-verified handoffs.',
      body: 'You sign in with a {one-time code sent to your university email|signin}. An {LLM matches lost reports against found ones|llm}, and the handoff is confirmed by {scanning a QR code|qr}, so an item only closes when it reaches the right person. {Supabase row-level security|rls} guards both data and storage. Built with a student from IGDTUW.',
      points: [
        'University-email OTP sign-in and admin portals',
        'LLM matching of lost and found reports',
        'Row-level security on data and storage',
      ],
      metrics: [
        { v: 'QR', u: '', k: 'Verified handoffs' },
        { v: 'RLS', u: '', k: 'Row-level security throughout' },
      ],
      stack: ['Next.js', 'React', 'Supabase', 'PostgreSQL', 'Tailwind CSS', 'Groq', 'Vercel'],
      links: [
        { label: 'Live site', href: 'https://campusfind2.vercel.app/' },
        { label: 'Repository', href: 'https://github.com/itzsam-lol/campusfind' },
      ],
      fig: 'campusfind',
      caption: 'A lost report and a found report meet at the matcher. The item only changes hands when the QR code is scanned, and every row is fenced by Supabase row-level security.',
    },
    {
      id: 'riscv',
      title: 'RISC-V Toolchain',
      area: 'Systems, computer architecture',
      status: 'Completed',
      stamp: '147 tests pass',
      line: 'A complete RV32I assembler and simulator in Python, checked against a real RTL core.',
      body: 'A {two-pass assembler|pass1} resolves labels and forward references, then encodes. A {cycle-accurate simulator|sim} runs the result. Both are checked against the {PicoRV32 core|rtl} through a {differential harness and SymbiYosys formal verification|checks}.',
      points: [
        'Two-pass assembly with forward references',
        'Differential testing against PicoRV32',
        'Formal checks with SymbiYosys',
      ],
      metrics: [
        { v: '147', u: '', k: 'Passing tests' },
        { v: 'RV32I', u: '', k: 'Base integer ISA' },
      ],
      stack: ['Python', 'RISC-V', 'SymbiYosys', 'Verilator'],
      links: [{ label: 'Repository', href: 'https://github.com/itzsam-lol/RISCV_Assembler_Simulator' }],
      fig: 'riscv',
      caption: 'One instruction, end to end: addi x5, x0, 42 is split into I-type fields, encoded bit by bit, and comes out as 0x02A00293.',
    },
  ],

  /* ---------- research ----------
     FinChrona: from the v1.0.0 release, its README and quality report; the figure
     draws the release itself (assets/data/finchrona-monthly.json, built from its Parquet).
     BRDO: counts from the project’s README and observability report.            */
  finchrona: {
    title: 'FinChrona',
    version: '1.0.0',
    subtitle: 'Open Financial Time Series · U.S. Treasury Rates, 1990–2026',
    creator: 'Satyam',
    kind: 'Dataset, October 2026 · creator and maintainer',
    line: 'Thirty-six years of U.S. Treasury rates in one consistent table, built from the Treasury’s own daily files and checked against them cell by cell.',
    plain: 'The Treasury publishes its daily rates as yearly tables whose columns change over the decades. FinChrona puts them into one long table, a row per rate, and checks that every source cell arrives exactly once. The drawing below is the dataset itself: {the curve at every month-end since 1990|curve}, {real yields that went below zero|real}, and {every stretch when the curve was inverted|inv}.',
    doi: '10.5281/zenodo.23730813',
    cite: 'Satyam (2026). FinChrona v1.0.0: Open Financial Time Series | U.S. Treasury Rates, 1990–2026 [Dataset]. Zenodo.',
    schema: [
      ['observation_date', 'Treasury business date'],
      ['curve_type', 'par_nominal · par_real · bill_rate'],
      ['quote_basis', 'par_yield · bank_discount · coupon_equivalent'],
      ['maturity_label', '4W to 30Y'],
      ['maturity_value', 'a number, read with maturity_unit'],
      ['maturity_unit', 'week · month · year'],
      ['value_pct', '3.74 means 3.74%'],
    ],
    key: 'observation_date, curve_type, quote_basis, maturity_label',
    licence: 'Data CC0 1.0 · code MIT',
    source: 'U.S. Department of the Treasury, Daily Treasury Rates',
    results: [
      { k: 'Rows', v: '180,815', d: 'Seven columns, one rate per row', primary: true },
      { k: 'Years of daily nominal yields', v: '36', d: '2 January 1990 to 23 October 2026' },
      { k: 'Nulls and duplicate keys', v: '0', d: 'All 180,815 non-null source cells reconciled to 180,815 rows' },
      { k: 'Negative rates, kept', v: '5,032', d: '4,940 real yields and 92 bill rates, as published' },
    ],
    coverage: [
      { series: 'par_nominal', d: 'Nominal par yields', from: '1990-01-02', to: '2026-10-23', rows: '99,894' },
      { series: 'par_real', d: 'Real (TIPS) par yields', from: '2003-01-02', to: '2026-10-23', rows: '27,609' },
      { series: 'bill_rate', d: 'Bill rates, in two quote conventions', from: '2002-01-02', to: '2026-10-23', rows: '53,312' },
    ],
    note: 'A historical snapshot, not point-in-time: observation_date is the Treasury business date, not when the number became public. Blank source cells are left out, never filled.',
    stack: ['Python', 'pandas', 'Apache Parquet', 'pytest', 'Zenodo', 'Kaggle', 'Hugging Face'],
    links: [
      { label: 'Zenodo (DOI)', href: 'https://doi.org/10.5281/zenodo.23730813' },
      { label: 'Kaggle', href: 'https://www.kaggle.com/datasets/samuraiiii/finchrona-financial-time-series' },
      { label: 'Hugging Face', href: 'https://huggingface.co/datasets/samisonhf/finchrona' },
      { label: 'Repository', href: 'https://github.com/itzsam-lol/finchroma_01' },
    ],
  },

  brdo: {
    title: 'Bondholder Rights & Disclosure Observatory',
    short: 'BRDO',
    kind: 'Open research · in progress since November 2026',
    line: 'What does an Indian corporate bond promise its holders, and how much of what later happens to that promise can an outsider trace from public records?',
    plain: 'A bond’s protections sit in its trust deed; what happens to them afterwards is scattered across trustees’ reports, issuers’ filings, exchange approvals and rating rationales. BRDO joins them up ISIN by ISIN, and every statement in the record says who made it and points to a hashed file, a page and the words relied on. Starting from {the breach reports trustees must publish|s0}, the trace can often reach {the clause in the trustee’s own words|s3}, and then breaks at the last step, for a reason of access rather than existence: {no contract could be retrieved|s7}, because the exchanges and platforms that hold them refuse automated readers.',
    numbers: [
      { v: '93', k: 'ISINs listed in trustees’ breach reports' },
      { v: '1,254', k: 'Evidence anchors, each re-tested against its file' },
      { v: '18', k: 'Discrepancies kept open' },
      { v: '0', k: 'Contracts retrieved so far' },
    ],
    caveat: 'Not investment advice, and no finding about anyone’s compliance: a recorded breach means a trustee reported one, and no report is not evidence that nothing happened.',
    asof: 'Counts from the project’s observability report for the quarter to 30 June 2026, as of 4 November 2026.',
    // how far each listed ISIN can be traced towards its contract; the stages are not nested
    trace: [
      ['Listed in a trustee’s breach report', 93],
      ['Named in a notice to holders', 59],
      ['Trust deed or agreement cited', 52],
      ['Clause or required level printed', 44],
      ['Issuer’s own statement names it', 17],
      ['Linked to a transcribed clause', 14],
      ['Contract located, not retrievable', 5],
      ['Contract retrieved and hashed', 0],
    ],
    traceOf: 93,
    // status per instrument for the quarter: a closed list, never merged
    status: [
      ['reported_breach', 90],
      ['reported_no_breach', 0],
      ['no_information_reported', 0],
      ['no_report_found', 3],
      ['inaccessible', 0],
      ['ambiguous', 0],
      ['conflicting', 2],
      ['not_assessed', 1],
    ],
    anchors: { total: 1254, machine: 1147, visual: 107 },
    stack: ['Python', 'JSON Schema', 'SQLite', 'pytest', 'uv'],
    links: [
      { label: 'Repository', href: 'https://github.com/itzsam-lol/bondholder-rights-observatory' },
      { label: 'Research design', href: 'https://github.com/itzsam-lol/bondholder-rights-observatory/blob/main/docs/research-design.md' },
      { label: 'Observability report', href: 'https://github.com/itzsam-lol/bondholder-rights-observatory/blob/main/docs/observability-report.md' },
    ],
  },

  udyox: {
    title: 'Udyox AI',
    kind: 'B.Tech project with Dr. Pankaj Vajpayee',
    line: 'How do small shop owners in Delhi actually adopt AI? We went and asked, then built from what we found.',
    body: 'Field research across Delhi markets produced an 8-factor AI Readiness Framework that sorts businesses into three adoption tiers. From the findings we built a Hindi and Hinglish voice assistant (speech to text, an LLM, a FastAPI backend and a React front end), field-tested it with shop owners and compared it against a smart-speaker prototype. Two-person team; the phase 2 report is complete.',
    numbers: [
      { v: '20+', k: 'Businesses visited' },
      { v: '58',  k: 'Survey responses, 8 markets' },
      { v: '18',  k: 'Shop owners in the field test' },
      { v: '3',   k: 'Adoption tiers' },
    ],
    stack: ['React', 'TypeScript', 'FastAPI', 'Python', 'Firebase', 'SQLite', 'Groq'],
    links: [
      { label: 'Prototype', href: 'https://udyox-ai.web.app' },
      { label: 'Repository', href: 'https://github.com/itzsam-lol/udyoxAI' },
    ],
  },

  quant: [
    {
      id: 'macro',
      title: 'Macro Event Study',
      q: 'How do CPI, payrolls, PMI and FOMC releases move markets?',
      body: 'Release data from FRED and prices from yfinance; reactions measured in equities, FX, rates and volatility at T+0, T+1, T+2 and one week, with significance tests across regimes and a seven-panel dashboard.',
      finds: [
        'FOMC rate surprise: β = 0.303 on next-day equity variance (R² = 0.05). Small, but economically meaningful.',
        'Long bonds buy the rumour and sell the news.',
        'VIX compresses after positive surprises, most at one week.',
      ],
      fig: 'macro',
      href: 'https://github.com/itzsam-lol/macro-event-study-framework',
    },
    {
      id: 'ledgerlens',
      title: 'LedgerLens',
      q: 'Do company filings follow Benford’s Law?',
      body: 'Ten years of 10-K reports for 30 US companies in five sectors, scraped from SEC EDGAR, tested against the first-digit law, ranked by a suspicion score and written up as automated PDF audit reports.',
      finds: [
        'Retail filings deviated most, likely because prices cluster at points such as $9.99.',
      ],
      fig: 'benford',
      href: 'https://github.com/itzsam-lol/LedgerLens',
    },
    {
      id: 'splm',
      title: 'SPLM India',
      q: 'Can free satellite imagery anticipate revenue surprises for Indian retailers?',
      body: 'Sentinel-2 imagery at 10 m through Google Earth Engine, an NDBI index over the flagship stores of 12 listed retailers such as DMART, TRENT and JUBLFOOD, and a divergence engine that compares physical activity with analyst momentum. Validated point-in-time against look-ahead bias, with a test suite.',
      finds: [
        'A research framework aimed at ACM ICAIF, not a live trading signal.',
      ],
      fig: 'splm',
      href: 'https://github.com/itzsam-lol/SPLM',
    },
    {
      id: 'oceanic',
      title: 'Oceanic Edge',
      q: 'Does port congestion show up in ship-tracking data before it shows up in prices?',
      body: 'An AIS vessel pipeline that computes geofenced dwell-time congestion indices for six global ports, a backtested signal and an XGBoost model, plus YOLOv8 detection of ships and container stacks in satellite images.',
      finds: [],
      fig: 'oceanic',
      href: 'https://github.com/itzsam-lol/Oceanic-Edge',
    },
  ],

  ongoing: [
    { title: 'Priced Curiosity', d: 'ARC Prize 2026, paper track. Should an ARC-AGI-3 agent explore where an extra action costs the least score? I derived that cost under the scorer, then pre-registered a test on 15 held-out games (975 runs). The primary comparison was inconclusive (+0.0008 RHAE percentage points, 95% CI −0.0042 to +0.0078), and the write-up reports it as that.', href: 'https://www.kaggle.com/code/samuraiiii/priced-curiosity-ec', label: 'Kaggle write-up' },
    { title: 'MarketRule-ML', d: 'Do short-horizon order-flow signals survive a change in market rules? The design freezes models before the SEC Tick Size Pilot, then compares them across treated and control securities. The FINRA data audit is under way; there are no results yet.' },
    { title: 'TVC-GRPO', d: 'Reinforcement-learning fine-tuning for LLMs: GRPO extended with tri-vector reward decomposition and Lagrangian safety constraints, designed to fit Kaggle hardware.' },
    { title: 'Bank Sentinel', d: 'Bank failure prediction from FDIC Call Report ratios and signals a retrieval-augmented LangChain agent extracts from SEC filings, with walk-forward backtesting.', href: 'https://github.com/itzsam-lol/Bank-Sentinel', label: 'Repository' },
    { title: 'Foodoscope', d: 'Research at CoSY Lab with Prof. Ganesh Bagler on the Foodoscope computational gastronomy platform.' },
  ],

  /* ---------- career stints (dates as YYYY-MM) ----------
     compound: h = education (the long stint), s = internships,
     m = research, i = teaching, w = community                 */
  timeline: {
    from: '2023-08', to: '2027-06',
    rows: [
      { label: 'Education', stints: [
        { c: 'h', from: '2023-08', to: '2027-06', t: 'B.Tech, Computer Science & AI', at: 'IIIT-Delhi' },
      ] },
      { label: 'Internships', stints: [
        { c: 's', from: '2024-06', to: '2024-08', t: 'Software testing intern', at: 'Fam' },
        { c: 's', from: '2026-06', to: '2026-08', t: 'Summer intern, SPA team', at: 'Dell Technologies' },
      ] },
      { label: 'Research', stints: [
        { c: 'm', from: '2025-05', to: '2025-07', t: 'Research intern, Foodoscope', at: 'CoSY Lab' },
      ] },
      { label: 'Teaching', stints: [
        { c: 'i', from: '2026-01', to: null, t: 'Teaching assistant, DSA and Networks', at: 'IIIT-Delhi' },
      ] },
      { label: 'Community', stints: [
        { c: 'w', from: '2024-11', to: '2025-08', t: 'Vice chairperson', at: 'IEEE-IIITD' },
        { c: 'w', from: '2025-09', to: '2025-12', t: 'Lead organiser', at: 'Hack The Flame' },
      ] },
    ],
  },

  compounds: {
    h: { name: 'Hard',         means: 'Education' },
    s: { name: 'Soft',         means: 'Internships' },
    m: { name: 'Medium',       means: 'Research' },
    i: { name: 'Intermediate', means: 'Teaching' },
    w: { name: 'Wet',          means: 'Community' },
  },

  experience: [
    {
      org: 'Dell Technologies',
      role: 'Summer Intern, SPA team',
      where: 'Bengaluru',
      when: 'Jun – Aug 2026',
      d: 'Performance testing of large language models on Dell PowerEdge AI servers.',
      points: [
        'Benchmarked server and model configurations with NVIDIA AIPerf and worked out which settings improved inference performance.',
        'Isolated performance problems by changing one configuration at a time.',
        'Automated the repetitive benchmarking steps and widened data collection, so results were faster to produce and reproducible.',
        'Presented findings to the team in regular reviews with managers and mentors.',
      ],
      tags: ['NVIDIA AIPerf', 'PowerEdge', 'LLM inference', 'Python'],
    },
    {
      org: 'IIIT-Delhi',
      role: 'Teaching Assistant',
      where: 'New Delhi',
      when: 'Jan 2026 – now',
      d: 'Data Structures and Algorithms, and Computer Networks: two core undergraduate courses, 100+ students.',
      points: [
        'Run lab sessions for students with very different levels of experience.',
        'Review, debug and grade student code.',
        'Wrote debugging walkthroughs that are now course reference material.',
        'Received the Dean’s Award for Best Teaching Assistant.',
      ],
      tags: ['Data structures', 'Algorithms', 'Computer networks'],
      logo: 'assets/iiitd.webp',
    },
    {
      org: 'Fam (formerly FamPay)',
      role: 'Software Testing Intern',
      where: 'Hybrid',
      when: 'Jun – Aug 2024',
      d: 'Release testing for a consumer payments app on Android and iOS.',
      points: [
        'Tested every sprint’s release builds with regression, unit and integration tests.',
        'Traced payment and card-management defects to their root cause.',
        'Wrote each defect up as a reproducible report for engineers.',
      ],
      tags: ['Android', 'iOS', 'Regression testing', 'Agile'],
      logo: 'assets/fam.webp',
    },
  ],

  /* ---------- off track ---------- */
  offtrack: [
    { role: 'Co-founder, website maintainer', org: 'Ignite Room', d: 'A student tech community I co-founded. I also keep igniteroom.in running on AWS (EC2, App Runner, S3).', v: '10,000+', k: 'members', href: 'https://igniteroom.in', logo: 'assets/igniteroom.webp' },
    { role: 'Main organiser', org: 'HackArena 2.0', d: 'Ran it end to end: zonal rounds in six cities, then a final in New Delhi.', v: '6', k: 'cities' },
    { role: 'Lead organiser', org: 'Hack The Flame', d: 'A national hackathon: logistics, sponsor deliverables, vendors and the event floor.', v: '500+', k: 'participants' },
    { role: 'Vice chairperson', org: 'IEEE-IIITD Student Branch', d: 'Helped lead the branch and mentored teams at five hackathons. Nov 2024 to Aug 2025.', v: '50+', k: 'volunteers', logo: 'assets/ieee.webp' },
    { role: 'Website maintainer', org: 'CiPD, IIIT-Delhi', d: 'I build and maintain the site for the Centre for Intelligent Product Development: a public site and a CMS with a Medium-style editor, on React and FastAPI.' },
  ],

  awards: [
    { t: 'Dean’s Award for Best Teaching Assistant', d: 'IIIT-Delhi, for TA work across DSA and Computer Networks' },
    { t: 'Academic Scholar Award', d: 'Mira Model School' },
    { t: 'Creative Student Award', d: 'Mira Model School' },
    { t: 'About 360 LeetCode problems', d: '351 in C++ and 9 in SQL, with the 2025 100 Days badge', href: 'https://leetcode.com/u/samuraiiii' },
  ],

  /* ---------- toolkit (names match project stacks for cross-reference) ---------- */
  toolkit: [
    { group: 'Languages',          items: ['Python', 'C++', 'Java', 'TypeScript', 'JavaScript', 'SQL', 'SystemVerilog'] },
    { group: 'Backend',            items: ['FastAPI', 'Express', 'Node.js', 'SQLAlchemy', 'Prisma', 'BullMQ', 'REST APIs'] },
    { group: 'Frontend',           items: ['React', 'Next.js', 'Tailwind CSS', 'Streamlit'] },
    { group: 'Data stores',        items: ['PostgreSQL', 'pgvector', 'Redis', 'SQLite', 'Supabase'] },
    { group: 'Cloud and DevOps',   items: ['AWS', 'Google Cloud', 'Docker', 'Docker Compose', 'Playwright', 'pytest', 'Git'] },
    { group: 'ML and AI',          items: ['scikit-learn', 'XGBoost', 'TensorFlow', 'LLM applications', 'AI agents', 'RAG', 'LangChain', 'YOLOv8'] },
    { group: 'Data and statistics', items: ['pandas', 'NumPy', 'SciPy', 'Event studies', 'Backtesting', 'Monte Carlo', 'Bootstrap and permutation tests', 'Probability calibration', 'Plotly', 'Matplotlib'] },
    { group: 'Optimisation',       items: ['OR-Tools', 'Linear programming', 'Convex optimisation'] },
    { group: 'Systems and hardware', items: ['RISC-V', 'SymbiYosys', 'Verilator', 'Computer architecture'] },
    { group: 'Finance data',       items: ['FRED', 'yfinance', 'SEC EDGAR', 'FDIC Call Reports', 'NSE data', 'Treasury rates', 'Trustee disclosures'] },
    { group: 'Open data',          items: ['Apache Parquet', 'JSON Schema', 'Zenodo', 'Kaggle Datasets', 'Hugging Face Datasets'] },
  ],

  coursework: ['Data Structures and Algorithms', 'Algorithm Design and Analysis', 'Operating Systems', 'Database Management Systems', 'Computer Networks', 'Computer Architecture', 'Artificial Intelligence', 'Machine Learning', 'Statistical Machine Learning', 'Big Data Analytics', 'Collaborative Filtering', 'Convex Optimization', 'Human-AI Interaction'],

  /* ---------- archive: everything, in priority order ----------
     area: ai | ml | quant | systems | web | research               */
  archive: [
    { name: 'CareerOS', area: ['ai', 'web'], status: 'Deployed', d: 'Career agent with validators and human approval gates.', stack: ['Python', 'FastAPI', 'SQLAlchemy', 'PostgreSQL', 'pgvector', 'Next.js', 'React Native', 'Docker Compose', 'Google Cloud', 'AI agents', 'LLM applications'], links: { repo: 'https://github.com/itzsam-lol/careeros' }, see: 'careeros' },
    { name: 'FinChrona', area: ['research', 'quant'], status: 'Published', d: 'U.S. Treasury rates, 1990 to 2026, in one checked table; on Zenodo, Kaggle and Hugging Face.', stack: ['Python', 'pandas', 'Apache Parquet', 'pytest', 'Zenodo', 'Kaggle Datasets', 'Hugging Face Datasets', 'Treasury rates'], links: { data: 'https://doi.org/10.5281/zenodo.23730813', repo: 'https://github.com/itzsam-lol/finchroma_01' }, see: 'finchrona' },
    { name: 'BRDO', area: ['research', 'quant'], status: 'In progress', d: 'Indian bond covenants traced through public disclosures, every statement anchored to a page.', stack: ['Python', 'JSON Schema', 'SQLite', 'pytest', 'Trustee disclosures'], links: { repo: 'https://github.com/itzsam-lol/bondholder-rights-observatory' }, see: 'brdo' },
    { name: 'Udyox AI', area: ['research', 'ai', 'web'], status: 'B.Tech project', d: 'AI adoption research and a Hindi/Hinglish voice assistant for small businesses.', stack: ['React', 'TypeScript', 'FastAPI', 'Python', 'Firebase', 'SQLite', 'Groq', 'LLM applications'], links: { live: 'https://udyox-ai.web.app', repo: 'https://github.com/itzsam-lol/udyoxAI' }, see: 'udyox' },
    { name: 'SecondAsk', area: ['ai', 'ml'], status: 'Buildathon', d: 'Failed-payment recovery agent with a 22-rule compliance layer.', stack: ['Python', 'FastAPI', 'AI agents', 'LLM applications', 'Probability calibration'], links: { repo: 'https://github.com/itzsam-lol/SecondAsk' }, see: 'secondask' },
    { name: 'CodeForge', area: ['systems', 'web'], status: 'Completed', d: 'Self-hosted coding assessments with sandboxed execution.', stack: ['TypeScript', 'Express', 'Node.js', 'Next.js', 'Prisma', 'PostgreSQL', 'Redis', 'BullMQ', 'Docker', 'Playwright'], links: { repo: 'https://github.com/itzsam-lol/CodeForge' }, see: 'codeforge' },
    { name: 'SynchroPulse AI', area: ['ml', 'web'], status: 'Completed', d: 'Three-hour congestion forecasts and OR-Tools deployment plans.', stack: ['Python', 'NetworkX', 'OR-Tools', 'FastAPI', 'React', 'Streamlit', 'AWS', 'Docker'], links: { repo: 'https://github.com/itzsam-lol/synchroo' }, see: 'synchropulse' },
    { name: 'CampusFind', area: ['web', 'ai'], status: 'Live', d: 'Lost and found for Delhi colleges with QR-verified handoffs.', stack: ['Next.js', 'React', 'Supabase', 'PostgreSQL', 'Tailwind CSS', 'Groq', 'LLM applications'], links: { live: 'https://campusfind2.vercel.app/', repo: 'https://github.com/itzsam-lol/campusfind' }, see: 'campusfind' },
    { name: 'SPLM India', area: ['quant', 'research'], status: 'Research', d: 'Satellite parking-lot activity versus analyst momentum for Indian retailers.', stack: ['Python', 'Backtesting', 'yfinance', 'NSE data'], links: { repo: 'https://github.com/itzsam-lol/SPLM' }, see: 'splm' },
    { name: 'Macro Event Study', area: ['quant'], status: 'Completed', d: 'Cross-asset reactions to CPI, NFP, PMI and FOMC releases.', stack: ['Python', 'pandas', 'NumPy', 'SciPy', 'FRED', 'yfinance', 'Matplotlib', 'Event studies'], links: { repo: 'https://github.com/itzsam-lol/macro-event-study-framework' }, see: 'macro' },
    { name: 'LedgerLens', area: ['quant'], status: 'Completed', d: 'Benford’s Law audit analytics on SEC 10-K filings.', stack: ['Python', 'SEC EDGAR', 'Plotly', 'Matplotlib'], links: { repo: 'https://github.com/itzsam-lol/LedgerLens' }, see: 'ledgerlens' },
    { name: 'Oceanic Edge', area: ['quant', 'ml'], status: 'Completed', d: 'Port congestion from AIS data and satellite computer vision.', stack: ['Python', 'pandas', 'XGBoost', 'YOLOv8', 'Backtesting'], links: { repo: 'https://github.com/itzsam-lol/Oceanic-Edge' }, see: 'oceanic' },
    { name: 'Priced Curiosity', area: ['research', 'ai'], status: 'Paper track', d: 'When exploring is worth its score cost in ARC-AGI-3; pre-registered, and reported as inconclusive.', stack: ['Python', 'AI agents', 'Bootstrap and permutation tests'], links: { notes: 'https://www.kaggle.com/code/samuraiiii/priced-curiosity-ec' } },
    { name: 'Bank Sentinel', area: ['quant', 'ai'], status: 'In progress', d: 'Bank failure prediction from Call Reports and RAG-extracted filing signals.', stack: ['Python', 'XGBoost', 'LangChain', 'RAG', 'FastAPI', 'Streamlit', 'FDIC Call Reports', 'SEC EDGAR', 'Backtesting'], links: { repo: 'https://github.com/itzsam-lol/Bank-Sentinel' } },
    { name: 'MarketRule-ML', area: ['quant', 'research'], status: 'In progress', d: 'Whether order-flow signals survive a change in market rules, studied through the SEC Tick Size Pilot; data audit under way.', stack: ['Python', 'Event studies'], links: {} },
    { name: 'F1 2026 Season Predictor', area: ['ml'], status: 'Completed', d: 'Stacking-ensemble race predictor and Monte Carlo season simulator.', stack: ['Python', 'XGBoost', 'scikit-learn', 'Streamlit', 'Plotly', 'TensorFlow', 'Monte Carlo'], links: { repo: 'https://github.com/itzsam-lol/F1-PREDICTION-APP' } },
    { name: 'RISC-V Toolchain', area: ['systems'], status: 'Completed', d: 'RV32I assembler and simulator, verified against PicoRV32.', stack: ['Python', 'RISC-V', 'SymbiYosys', 'Verilator', 'Computer architecture'], links: { repo: 'https://github.com/itzsam-lol/RISCV_Assembler_Simulator' }, see: 'riscv' },
    { name: 'RR Arbiter', area: ['systems'], status: 'Completed', d: 'Round-robin bus arbiter with an unbounded formal proof by k-induction.', stack: ['SystemVerilog', 'SymbiYosys'], links: { repo: 'https://github.com/itzsam-lol/rr-arbiter-formal' } },
    { name: 'Ignite Room platform', area: ['web'], status: 'Live', d: 'The igniteroom.in campus-ambassador platform: sign-in, dashboards, task submissions and a live leaderboard, with an admin review portal.', stack: ['React', 'TypeScript', 'Tailwind CSS', 'REST APIs'], links: { live: 'https://igniteroom.in', repo: 'https://github.com/Ignite-Room/ignite-hub' } },
    { name: 'CiPD website', area: ['web'], status: 'Maintained', d: 'Site and CMS for IIIT-Delhi’s Centre for Intelligent Product Development, with a Medium-style editor.', stack: ['React', 'FastAPI', 'Tailwind CSS'], links: { repo: 'https://github.com/itzsam-lol/cipd' } },
    { name: 'TVC-GRPO', area: ['ai', 'research'], status: 'In research', d: 'Constrained GRPO fine-tuning with tri-vector rewards.', stack: ['LLM applications'], links: {} },
    { name: 'MirrorHire', area: ['web', 'ai'], status: 'Course project', d: 'An applicant-tracking-system simulator, for Human-AI Interaction.', stack: ['FastAPI', 'LLM applications'], links: { repo: 'https://github.com/itzsam-lol/mirrorhire' } },
    { name: 'PDF outline extractor', area: ['ai'], status: 'Hackathon', d: 'Adobe India Hackathon 2025: a PDF’s title and heading outline, from its own table of contents or from font and numbering cues.', stack: ['Python', 'Docker'], links: { repo: 'https://github.com/itzsam-lol/adobe-1a' } },
    { name: 'Colonist.io Review', area: ['ai'], status: 'Side project', d: 'Engine-style post-game review for online Catan, built on an MCTS simulator.', stack: ['FastAPI'], links: {} },
    { name: 'DocMind', area: ['ai'], status: 'Completed', d: 'Retrieval-augmented document chatbot.', stack: ['RAG', 'LLM applications'], links: {} },
  ],

  areas: [
    { id: 'all', label: 'All' },
    { id: 'ai', label: 'AI and agents' },
    { id: 'ml', label: 'Machine learning' },
    { id: 'quant', label: 'Quant and data' },
    { id: 'systems', label: 'Systems' },
    { id: 'web', label: 'Full-stack' },
    { id: 'research', label: 'Research' },
  ],

  /* ---------- figures: what each part of a drawing is, in balloon order ----------
     Shown when a reader hovers, taps or arrows onto a part.             */
  figures: {
    careeros: {
      openings: ['Openings', 'New openings come in from job sources.'],
      match:    ['Match', 'Each opening is matched against the verified profile with a pgvector similarity search.'],
      tailor:   ['Tailor', 'An LLM drafts an application tailored to that opening.'],
      validate: ['Validate', 'Validators check every claim against the profile and reject any it cannot back up.'],
      tray:     ['Rejected', 'An application with an unsupported claim stops here. It never reaches a person, let alone an employer.'],
      approve:  ['Approve', 'A person reads the application and signs it off. Click it, or press Sign off, to be that person.'],
      gate:     ['Approval gate', 'Anything that would leave the system waits here until it is signed off.'],
      send:     ['Send', 'Only signed-off applications leave the system.'],
      web:      ['Next.js web app', 'The web front end, one package in the pnpm monorepo.'],
      mobile:   ['Expo mobile app', 'The React Native app, in the same monorepo.'],
      client:   ['Typed OpenAPI client', 'One typed client that both apps share, so web and mobile call the API the same way.'],
      api:      ['FastAPI service', 'The backend: FastAPI with SQLAlchemy.'],
      db:       ['PostgreSQL', 'The database, with pgvector for the similarity search behind Match.'],
      vm:       ['Deployment', 'One pnpm monorepo, running on a Google Cloud VM.'],
    },
    secondask: {
      payment:    ['Failed payment', 'A payment has failed. The agent decides what to do next, and when.'],
      retrynow:   ['Retry now', 'Try the payment again straight away.'],
      retrylater: ['Retry later', 'Wait, then try again at a better moment.'],
      reminder:   ['Reminder', 'Remind the customer instead of retrying.'],
      hold:       ['Hold', 'Do nothing for now.'],
      model:      ['Logistic regressions', 'One logistic regression per action estimates the chance that action works. The probabilities are calibrated: expected calibration error 0.022, held-out AUC 0.82.'],
      price:      ['Price', 'Each action is priced before it is taken: the chance it works times the value recovered, minus its cost. The highest price wins. The prices drawn here are illustrative.'],
      rules:      ['22 compliance rules', 'The chosen action must pass all 22. Click any rule, or use Break rule, and watch what happens to the next action.'],
      act:        ['Act', 'The action runs only when every rule passes. One failure blocks it: the system fails closed. Zero violations in simulation.'],
      ours:       ['SecondAsk', '18.2% of the value recovered across 12,000 simulated payments.'],
      fixed:      ['Fixed schedule', 'The baseline, a fixed retry schedule: 8.6% on the same payments.'],
      ratio:      ['2.1 times as much', 'SecondAsk recovers 2.1 times the value of the fixed schedule (18.2 ÷ 8.6).'],
    },
    codeforge: {
      candidate: ['Candidate', 'Opens the test from an expiring invite link and submits code.'],
      api:       ['Express API', 'Accepts the submission. The test timer lives here, on the server, so a paused tab or a changed clock buys nothing.'],
      queue:     ['BullMQ queue', 'Submissions wait in a BullMQ queue on Redis until a worker is free, so a rush of candidates queues up instead of overloading the graders.'],
      workers:   ['Workers', 'Workers take submissions off the queue one at a time and hand each to the sandbox.'],
      sandbox:   ['Judge0 sandbox', 'Untrusted code runs inside Judge0, isolated from everything else.'],
      db:        ['PostgreSQL', 'Verdicts are stored through Prisma, auto-scored and ready for review.'],
      text:      ['The document', 'The submission with whitespace removed. Every run of k = 5 characters is a k-gram.'],
      hashes:    ['Hashes', 'One hash per 5-gram. The same run of text always gets the same hash, which is what lets copies be found.'],
      window:    ['Window', 'A window of w hashes slides along. In each window the smallest hash is kept, the rightmost one if there is a tie.'],
      prints:    ['Fingerprints', 'The hashes that were kept. Comparing fingerprints instead of whole files still catches every shared run of w + k − 1 characters or more.'],
    },
    synchropulse: {
      roads:     ['Road network', 'An illustrative network, junctions and road segments as OSMnx and NetworkX describe a real one. Colour is forecast congestion: grey free, amber slowing, red jammed.'],
      crew:      ['Traffic personnel', 'Where the OR-Tools plan sends people at the forecast time: the roads that will need them most.'],
      barricade: ['Barricade', 'Placed by the same plan, on the worst segment.'],
      clock:     ['Forecast horizon', 'From now to three hours ahead. Drag along it to move through the forecast.'],
    },
    campusfind: {
      signin: ['University email sign-in', 'You sign in with a one-time code sent to your university email address.'],
      lost:   ['Lost report', 'The owner describes what they lost, and where.'],
      found:  ['Found report', 'Whoever finds it files a report too.'],
      llm:    ['LLM matching', 'An LLM compares lost reports with found ones and suggests likely matches.'],
      qr:     ['QR handoff', 'The handoff is confirmed by scanning a QR code, so an item only closes when it reaches the right person. This code is drawn for the figure; it is not a real one.'],
      closed: ['Closed', 'The case closes once the scan confirms the handoff.'],
      rls:    ['Row-level security', 'Supabase row-level security guards both the data and the file storage.'],
    },
    riscv: {
      asm:    ['The instruction', 'Click it to change the operation, or use the controls below. Drag the immediate sideways to scrub it. Everything else is computed from it.'],
      imm:    ['imm[11:0]', 'The 12-bit immediate, in two’s complement: from −2048 to 2047.'],
      rs1:    ['rs1', 'The source register, x0 to x31. x0 always reads as zero.'],
      funct3: ['funct3', 'Picks the operation within OP-IMM: addi, slti, sltiu, xori, ori or andi.'],
      rd:     ['rd', 'The destination register, x0 to x31.'],
      opcode: ['opcode', '0010011, OP-IMM: arithmetic between a register and an immediate.'],
      hex:    ['Machine code', 'The 32 bits as hexadecimal, which is what the assembler writes out.'],
      pass1:  ['Pass 1', 'The first pass builds the symbol table, so a label can be used before it is defined.'],
      pass2:  ['Pass 2', 'The second pass encodes every instruction, with every label resolved.'],
      sim:    ['Simulator', 'A cycle-accurate simulator runs the program.'],
      rtl:    ['PicoRV32', 'A real RTL core that the simulator is checked against.'],
      checks: ['Checks', 'A differential harness compares the simulator with PicoRV32, and SymbiYosys runs formal checks. 147 tests pass.'],
    },
    finchrona: {
      curve: ['Nominal par yield curve', 'U.S. Treasury par yields at every maturity on the last trading day of the month. Where the Treasury published nothing there is no point: the 30-year is missing from February 2002 to February 2006. Hover a point for the row it comes from.'],
      real:  ['Real par yields', 'TIPS par yields, published from 2003. They spent long stretches below zero, and all 4,940 negative real yields are kept as published.'],
      spread: ['10-year minus 2-year', 'The month-end term spread. Below the line, two-year rates sit above ten-year ones: the curve is inverted.'],
      inv:   ['Inverted days', 'Each red tick is a month with inverted days; its height is the share of that month’s trading days. 1,052 of the release’s 9,209 days.'],
      clock: ['Month', 'Drag along the timeline, or use the month control, to move through all 442 month-ends from January 1990 to October 2026.'],
    },
    brdo: {
      s0: ['Listed in a breach report', '93 ISINs appear in the covenant-breach reports (Annex-VIIA, Table 5) that six debenture trustees published for the quarter to 30 June 2026. Every trace starts here.'],
      s1: ['Named in a notice', '59 are also named in a notice the trustee sent to the holders.'],
      s2: ['Deed cited', 'For 52 the trustee cites a dated trust deed or trustee agreement: the contract exists, and has a date.'],
      s3: ['Clause printed', 'For 44 the report itself prints the clause or the required level, so the promise survives in the trustee’s own words.'],
      s4: ['Issuer’s statement', 'For 17 the issuer’s or its auditor’s own statement names the covenant that was breached.'],
      s5: ['Clause transcribed', '14 reported breaches are linked to a clause transcribed in the dataset, and 13 of those agree with it.'],
      s6: ['Contract located', 'For 5, a candidate contract document turned up on a page that bars automated retrieval.'],
      s7: ['Contract retrieved', 'None yet. BSE refuses identified automated clients, NSE’s terms forbid automated collection, and a bond platform’s terms forbid extraction tools. The trace breaks at the last step, for access, not existence.'],
      k0: ['reported_breach', 'A trustee’s report, a notice or an explicit statement says a breach occurred. 90 of the 96 instruments this quarter.'],
      k1: ['reported_no_breach', 'An explicit statement covers the instrument and the period, and nothing disagrees. It records someone’s statement; the project does not adopt it.'],
      k2: ['no_information_reported', 'The reporting party says it received no information about the issuer.'],
      k3: ['no_report_found', 'The reviewed sources do not list it. Never read as compliance. 3 this quarter.'],
      k4: ['inaccessible', 'A relevant disclosure could not be reached, or the source policy excludes it.'],
      k5: ['ambiguous', 'The sources cannot settle it, for example when they disagree on who the trustee is.'],
      k6: ['conflicting', 'Sources or versions disagree. The record keeps both statements and the disagreement, and does not pick a winner. 2 this quarter.'],
      k7: ['not_assessed', 'Nobody has looked yet. 1 this quarter.'],
      mach:  ['Verified by machine', '1,147 quotations were found on the cited page of the hashed file: after folding case, spacing and punctuation, with spaces removed, or as the same words in order.'],
      vis:   ['Read from the rendered page', '107 passages are not in the file’s text layer (scans, or text drawn as outlines), so they were read from the rendered page. Reported separately and never counted as machine-verified.'],
      check: ['brdo verify', 'Re-tests every anchor against its source file. A file that has changed at its source shows up as a hash mismatch and is never silently accepted.'],
    },
    macro: {
      m0: ['TLT, event day', 'Long bonds rise 0.15% on the day of a release, on average.'],
      m1: ['TLT, next day', 'Then fall 0.29% the day after: buy the rumour, sell the news.'],
      m2: ['VIX, one week', 'Volatility falls 1.63% a week after positive surprises; the compression is strongest at one week.'],
    },
    splm: {
      sat:      ['Sentinel-2', 'Free 10 m satellite imagery through Google Earth Engine, with an NDBI index over the flagship stores of 12 listed retailers.'],
      analysts: ['Analyst momentum', 'What the analysts already expect.'],
      diverge:  ['Divergence engine', 'Compares physical activity at the stores with analyst momentum, point-in-time, so nothing from the future leaks in.'],
      signal:   ['Signal', 'A score from −1 to +1. A research framework aimed at ACM ICAIF, not a live trading signal.'],
    },
    oceanic: {
      fence: ['Geofence', 'A boundary around the port. The time each vessel spends inside it is its dwell time.'],
      ships: ['Vessels', 'Positions from AIS ship-tracking data. Long dwell times inside the fence mean congestion. The positions drawn here are illustrative.'],
    },
  },

  nav: [
    { id: 'work', label: 'Work' },
    { id: 'research', label: 'Research' },
    { id: 'experience', label: 'Experience' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' },
  ],
};
