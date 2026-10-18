/* ============================================================
   DATA: every word on the page lives here.
   Edit this file to update the site; nothing else needs touching.

   Source of truth is portfolio.json (kept out of git: it holds
   private notes). Claims that file flags under "verify" are left
   out until they are confirmed.
   ============================================================ */

window.DATA = {

  updated: '2026-10-18',

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
      { label: 'Hugging Face', handle: 'Phantomcloak19',  href: 'https://huggingface.co/Phantomcloak19' },
    ],
    languages: 'English and Hindi; learning French and Japanese.',
  },

  hero: {
    lede: 'Final-year Computer Science and AI student at IIIT-Delhi. I build machine learning systems and backends, and I do quantitative research.',
    facts: [
      { k: 'Summer 2026',    v: 'Dell Technologies', d: 'LLM inference benchmarking on PowerEdge AI servers' },
      { k: 'Preprint, 2026', v: 'bioRxiv',           d: 'Forecasting non-additivity before the experiment' },
      { k: 'Since Jan 2026', v: 'Teaching assistant', d: 'Data Structures and Computer Networks, 100+ students' },
      { k: 'Co-founder',     v: 'Ignite Room',        d: 'Student tech community of 10,000+ members' },
    ],
  },

  // read word by word as you scroll
  intro: 'I like problems that have to be measured before they can be solved. At Dell I benchmarked LLM inference on PowerEdge AI servers, changing one configuration at a time until the numbers explained themselves. My preprint asks whether a gene perturbation is worth running before anyone runs it. SecondAsk prices every payment retry before it makes one. Same instinct, different track.',

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
      line: 'A career agent that finds openings, matches them to a verified profile and tailors each application, without acting until a person signs off.',
      body: 'A FastAPI and SQLAlchemy backend on PostgreSQL with pgvector, a Next.js web app and an Expo mobile app, all in one pnpm monorepo that shares a typed OpenAPI client. Validators reject any claim the profile cannot back up, and anything that would leave the system waits at an approval gate. It runs on a Google Cloud VM.',
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
      line: 'A failed-payment recovery agent that prices every retry and reminder before it makes one.',
      body: 'It decides when and how to retry a failed payment. One logistic regression per recovery action estimates the chance it works; each action is then checked against 22 compliance rules that fail closed, so a rule that cannot be satisfied blocks the action instead of waving it through.',
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
      line: 'A self-hosted, white-label coding assessment platform with sandboxed execution.',
      body: 'Organisations write tests and invite candidates through expiring links. Every submission goes through a BullMQ queue on Redis to workers that run it inside a Judge0 sandbox. The timer lives on the server, so a paused tab or a changed clock buys nothing, and a winnowing fingerprint engine flags likely plagiarism.',
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
      line: 'Forecasts traffic congestion up to three hours ahead, then plans where traffic personnel and barricades should go.',
      body: 'Congestion is predicted on real road networks built with OSMnx and NetworkX. Google OR-Tools turns each forecast into a deployment plan, and a FastAPI and React dashboard serves it from AWS EC2 under Docker Compose. Built over five staged project reviews.',
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
      line: 'A lost-and-found platform for Delhi colleges, with university-email sign-in and QR-verified handoffs.',
      body: 'You sign in with a one-time code sent to your university email. An LLM matches lost reports against found ones, and the handoff is confirmed by scanning a QR code, so an item only closes when it reaches the right person. Supabase row-level security guards both data and storage. Built with a student from IGDTUW.',
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
      line: 'A complete RV32I assembler and simulator in Python, checked against a real RTL core.',
      body: 'A two-pass assembler resolves labels and forward references, then encodes. A cycle-accurate simulator runs the result. Both are checked against the PicoRV32 core through a differential harness and SymbiYosys formal verification.',
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

  /* ---------- research ---------- */
  paper: {
    title: 'Forecasting Non-Additivity Before the Experiment: A Pre-Experimental Triage for Single-Cell Perturbation Modeling',
    authors: 'Satyam',
    affiliation: 'Department of Computer Science and Engineering, IIIT-Delhi',
    venue: 'bioRxiv preprint, 2026',
    note: 'Preprint, not peer reviewed',
    abstract: 'Deep models for single-cell perturbation response are frequently reported to be no better, in aggregate, than a simple additive or mean-based baseline. We ask the complementary, experiment-facing question: can we predict, before running a perturbation, whether it will be saturated (an additive baseline suffices) or resistant (non-additive, worth the modeling and measurement cost)?',
    plain: 'Single-cell CRISPR screens are expensive, and for many perturbations a simple additive model already explains the result. This work predicts which ones those are before the experiment is run, so compute and follow-up go to the perturbations where a deep model can actually learn something.',
    results: [
      { k: 'Spearman ρ', v: '0.65', ci: [0.61, 0.69], d: 'Random forest, Replogle K562, 1,086 single-gene perturbations', primary: true },
      { k: 'ROC-AUC', v: '0.86', d: 'Same screen; label-permutation p = 0.003', primary: true },
      { k: 'Spearman ρ', v: '0.58', d: 'Ridge regression, the conservative model, same screen' },
      { k: 'ROC-AUC', v: '0.77', d: 'Gene-pair triage, Wessels CaRPool-seq, 158 doubles (ρ = 0.50)' },
    ],
    features: ['Baseline expression', 'STRING network connectivity', 'Gene Ontology annotation', 'Frozen ESM-2 embedding'],
    methods: ['Ridge regression', 'Random forests', 'Permutation nulls', 'Bootstrap confidence intervals', 'Feature-group ablation'],
    datasets: [
      { name: 'Norman19',       cell: 'K562',  kind: 'CRISPRa',           unit: 'double', n: '124' },
      { name: 'Adamson16',      cell: 'K562',  kind: 'CRISPRi (UPR)',     unit: 'single', n: '86' },
      { name: 'Replogle22 K562', cell: 'K562', kind: 'CRISPRi essential', unit: 'single', n: '1,086' },
      { name: 'Replogle22 RPE1', cell: 'RPE1', kind: 'CRISPRi essential', unit: 'single', n: '1,533' },
      { name: 'Wessels23',      cell: 'THP-1', kind: 'Cas13 CaRPool-seq', unit: 'double', n: '158' },
      { name: 'Sunshine23',     cell: 'Calu-3', kind: 'Cas9 host factors', unit: 'single', n: '178' },
    ],
    links: [{ label: 'Code and data', href: 'https://github.com/itzsam-lol/PGIP' }],
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
    { title: 'TVC-GRPO', d: 'Reinforcement-learning fine-tuning for LLMs: GRPO extended with tri-vector reward decomposition and Lagrangian safety constraints, designed to fit Kaggle hardware.', href: 'https://huggingface.co/Phantomcloak19', label: 'Datasets' },
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
    { role: 'Website maintainer', org: 'CiPD, IIIT-Delhi', d: 'I build and maintain the site for the Centre for Innovation, Prototyping and Design.' },
  ],

  awards: [
    { t: 'Dean’s Award for Best Teaching Assistant', d: 'IIIT-Delhi, for TA work across DSA and Computer Networks' },
    { t: 'Academic Scholar Award', d: '' },
    { t: 'Creative Student Award', d: '' },
    { t: 'About 360 LeetCode problems', d: '351 in C++ and 9 in SQL, with the 2025 100 Days badge', href: 'https://leetcode.com/u/samuraiiii' },
  ],

  /* ---------- toolkit (names match project stacks for cross-reference) ---------- */
  toolkit: [
    { group: 'Languages',          items: ['Python', 'C++', 'Java', 'TypeScript', 'JavaScript', 'SQL', 'SystemVerilog'] },
    { group: 'Backend',            items: ['FastAPI', 'Express', 'Node.js', 'SQLAlchemy', 'Prisma', 'BullMQ', 'REST APIs'] },
    { group: 'Frontend',           items: ['React', 'Next.js', 'Tailwind CSS', 'Streamlit'] },
    { group: 'Data stores',        items: ['PostgreSQL', 'pgvector', 'Redis', 'SQLite', 'Supabase'] },
    { group: 'Cloud and DevOps',   items: ['AWS', 'Google Cloud', 'Docker', 'Docker Compose', 'Playwright', 'Git'] },
    { group: 'ML and AI',          items: ['scikit-learn', 'XGBoost', 'TensorFlow', 'LLM applications', 'AI agents', 'RAG', 'LangChain', 'YOLOv8'] },
    { group: 'Data and statistics', items: ['pandas', 'NumPy', 'SciPy', 'Event studies', 'Backtesting', 'Monte Carlo', 'Bootstrap and permutation tests', 'Probability calibration', 'Plotly', 'Matplotlib'] },
    { group: 'Optimisation',       items: ['OR-Tools', 'Linear programming', 'Convex optimisation'] },
    { group: 'Systems and hardware', items: ['RISC-V', 'SymbiYosys', 'Verilator', 'Computer architecture'] },
    { group: 'Finance data',       items: ['FRED', 'yfinance', 'SEC EDGAR', 'FDIC Call Reports', 'NSE data'] },
  ],

  coursework: ['Data Structures and Algorithms', 'Algorithm Design and Analysis', 'Operating Systems', 'Database Management Systems', 'Computer Networks', 'Computer Architecture', 'Artificial Intelligence', 'Machine Learning', 'Statistical Machine Learning', 'Big Data Analytics', 'Collaborative Filtering', 'Convex Optimization', 'Human-AI Interaction'],

  /* ---------- archive: everything, in priority order ----------
     area: ai | ml | quant | systems | web | research               */
  archive: [
    { name: 'CareerOS', area: ['ai', 'web'], status: 'Deployed', d: 'Career agent with validators and human approval gates.', stack: ['Python', 'FastAPI', 'SQLAlchemy', 'PostgreSQL', 'pgvector', 'Next.js', 'React Native', 'Docker Compose', 'Google Cloud', 'AI agents', 'LLM applications'], links: { repo: 'https://github.com/itzsam-lol/careeros' }, see: 'careeros' },
    { name: 'Udyox AI', area: ['research', 'ai', 'web'], status: 'B.Tech project', d: 'AI adoption research and a Hindi/Hinglish voice assistant for small businesses.', stack: ['React', 'TypeScript', 'FastAPI', 'Python', 'Firebase', 'SQLite', 'Groq', 'LLM applications'], links: { live: 'https://udyox-ai.web.app', repo: 'https://github.com/itzsam-lol/udyoxAI' }, see: 'udyox' },
    { name: 'SecondAsk', area: ['ai', 'ml'], status: 'Buildathon', d: 'Failed-payment recovery agent with a 22-rule compliance layer.', stack: ['Python', 'FastAPI', 'AI agents', 'LLM applications', 'Probability calibration'], links: { repo: 'https://github.com/itzsam-lol/SecondAsk' }, see: 'secondask' },
    { name: 'CodeForge', area: ['systems', 'web'], status: 'Completed', d: 'Self-hosted coding assessments with sandboxed execution.', stack: ['TypeScript', 'Express', 'Node.js', 'Next.js', 'Prisma', 'PostgreSQL', 'Redis', 'BullMQ', 'Docker', 'Playwright'], links: { repo: 'https://github.com/itzsam-lol/CodeForge' }, see: 'codeforge' },
    { name: 'SynchroPulse AI', area: ['ml', 'web'], status: 'Completed', d: 'Three-hour congestion forecasts and OR-Tools deployment plans.', stack: ['Python', 'NetworkX', 'OR-Tools', 'FastAPI', 'React', 'Streamlit', 'AWS', 'Docker'], links: { repo: 'https://github.com/itzsam-lol/synchroo' }, see: 'synchropulse' },
    { name: 'CampusFind', area: ['web', 'ai'], status: 'Live', d: 'Lost and found for Delhi colleges with QR-verified handoffs.', stack: ['Next.js', 'React', 'Supabase', 'PostgreSQL', 'Tailwind CSS', 'Groq', 'LLM applications'], links: { live: 'https://campusfind2.vercel.app/', repo: 'https://github.com/itzsam-lol/campusfind' }, see: 'campusfind' },
    { name: 'SPLM India', area: ['quant', 'research'], status: 'Research', d: 'Satellite parking-lot activity versus analyst momentum for Indian retailers.', stack: ['Python', 'Backtesting', 'yfinance', 'NSE data'], links: { repo: 'https://github.com/itzsam-lol/SPLM' }, see: 'splm' },
    { name: 'Macro Event Study', area: ['quant'], status: 'Completed', d: 'Cross-asset reactions to CPI, NFP, PMI and FOMC releases.', stack: ['Python', 'pandas', 'NumPy', 'SciPy', 'FRED', 'yfinance', 'Matplotlib', 'Event studies'], links: { repo: 'https://github.com/itzsam-lol/macro-event-study-framework' }, see: 'macro' },
    { name: 'LedgerLens', area: ['quant'], status: 'Completed', d: 'Benford’s Law audit analytics on SEC 10-K filings.', stack: ['Python', 'SEC EDGAR', 'Plotly', 'Matplotlib'], links: { repo: 'https://github.com/itzsam-lol/LedgerLens' }, see: 'ledgerlens' },
    { name: 'Oceanic Edge', area: ['quant', 'ml'], status: 'Completed', d: 'Port congestion from AIS data and satellite computer vision.', stack: ['Python', 'pandas', 'XGBoost', 'YOLOv8', 'Backtesting'], links: { repo: 'https://github.com/itzsam-lol/Oceanic-Edge' }, see: 'oceanic' },
    { name: 'Bank Sentinel', area: ['quant', 'ai'], status: 'In progress', d: 'Bank failure prediction from Call Reports and RAG-extracted filing signals.', stack: ['Python', 'XGBoost', 'LangChain', 'RAG', 'FastAPI', 'Streamlit', 'FDIC Call Reports', 'SEC EDGAR', 'Backtesting'], links: { repo: 'https://github.com/itzsam-lol/Bank-Sentinel' } },
    { name: 'PGIP', area: ['research', 'ml'], status: 'Preprint', d: 'Predicting baseline saturation before a perturbation experiment.', stack: ['Python', 'scikit-learn', 'Bootstrap and permutation tests'], links: { repo: 'https://github.com/itzsam-lol/PGIP' }, see: 'research' },
    { name: 'F1 2026 Season Predictor', area: ['ml'], status: 'Completed', d: 'Stacking-ensemble race predictor and Monte Carlo season simulator.', stack: ['Python', 'XGBoost', 'scikit-learn', 'Streamlit', 'Plotly', 'TensorFlow', 'Monte Carlo'], links: { repo: 'https://github.com/itzsam-lol/F1-PREDICTION-APP' } },
    { name: 'RISC-V Toolchain', area: ['systems'], status: 'Completed', d: 'RV32I assembler and simulator, verified against PicoRV32.', stack: ['Python', 'RISC-V', 'SymbiYosys', 'Verilator', 'Computer architecture'], links: { repo: 'https://github.com/itzsam-lol/RISCV_Assembler_Simulator' }, see: 'riscv' },
    { name: 'RR Arbiter', area: ['systems'], status: 'Completed', d: 'Round-robin bus arbiter with an unbounded formal proof by k-induction.', stack: ['SystemVerilog', 'SymbiYosys'], links: { repo: 'https://github.com/itzsam-lol/rr-arbiter-formal' } },
    { name: 'TVC-GRPO', area: ['ai', 'research'], status: 'In research', d: 'Constrained GRPO fine-tuning with tri-vector rewards.', stack: ['LLM applications'], links: { data: 'https://huggingface.co/Phantomcloak19' } },
    { name: 'MirrorHire', area: ['web', 'ai'], status: 'Course project', d: 'An applicant-tracking-system simulator, for Human-AI Interaction.', stack: ['FastAPI', 'LLM applications'], links: {} },
    { name: 'Colonist.io Review', area: ['ai'], status: 'Side project', d: 'Engine-style post-game review for online Catan, built on an MCTS simulator.', stack: ['FastAPI'], links: {} },
    { name: 'DocMind', area: ['ai'], status: 'Completed', d: 'Retrieval-augmented document chatbot.', stack: ['RAG', 'LLM applications'], links: {} },
    { name: 'Ignite Hub', area: ['web'], status: 'Completed', d: 'Backend platform for the Ignite Room community.', stack: ['REST APIs'], links: { repo: 'https://github.com/Ignite-Room/ignite-hub' } },
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

  nav: [
    { id: 'work', label: 'Work' },
    { id: 'research', label: 'Research' },
    { id: 'experience', label: 'Experience' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' },
  ],
};
