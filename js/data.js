/* ============================================================
   DATA — this is the only file you need to edit to update the site.
   Everything else reads from here.
   ============================================================ */

window.DATA = {

  /* ---------- identity ---------- */
  driver: {
    name: "SATYAM",
    split: 3,                       // first N letters stay white, rest go red
    number: "04",
    team: "IIIT DELHI / CS-AI",
    season: "2026",
    role: "CS Engineer · Systems Builder · Researcher",
    circuit: "NEW DELHI",
    round: "04 / 24",
    photo: "assets/sam.webp",
    coords: "28.6448° N · 77.2167° E",
  },

  /* ---------- hero strip cells ---------- */
  heroCells: [
    { k: "Session",    v: "RACE" },
    { k: "Round",      v: "04/24" },
    { k: "Circuit",    v: "NEW DELHI" },
    { k: "Conditions", v: "27°C DRY" },
    { k: "Status",     v: "ON TRACK", tone: "green" },
  ],

  /* ---------- scrolling ticker ---------- */
  ticker: [
    "ROUND 04 — IIIT DELHI GP",
    "DRIVER 04 · SATYAM",
    "SEASON 2026",
    "TEAM CS-AI",
    "300+ LEETCODE",
    "100+ MENTEES",
    "PREPRINT · UNDER REVIEW",
    "18+ LIVE CLIENTS",
    "SECTOR 2 — RESEARCH",
    "DRS ENABLED",
  ],

  /* ---------- driver profile ---------- */
  profile: {
    heading: ["Builder running", "at |racing pace."],   // "|" marks the red part
    bio: [
      "B.Tech CS-AI engineer at IIIT Delhi, racing through distributed systems, optimization, and machine learning with the same obsession an F1 team has for laptime.",
      "Teaching Assistant for DSA and Computer Networks, research intern at CoSY Lab, and first author on a preprint (under review) on pre-experimental triage for single-cell perturbation modeling.",
      "A garage of builds spanning fault-tolerant distributed platforms, MILP traffic optimization, a RISC-V toolchain, and production AI backends serving live clients.",
    ],
    spec: [
      { k: "Based",     v: "New Delhi, IN" },
      { k: "Programme", v: "B.Tech CS-AI" },
      { k: "Seasons",   v: "2023 — 2027" },
      { k: "Licence",   v: "Superlicence" },
    ],
    stats: [
      { lbl: "LeetCode Solved",   to: 300, suffix: "+" },
      { lbl: "Students Mentored", to: 100, suffix: "+" },
      { lbl: "Community Built",   to: 10,  suffix: "K+" },
    ],
  },

  /* ---------- setup sheet (skills) ----------
     compound: "s" = soft (sharpest, daily)
               "m" = medium (balanced)
               "h" = hard  (durable fundamentals)          */
  skills: [
    { name: "Languages",                    w: 92, compound: "s",
      tags: ["C++", "Python", "Java", "C", "TypeScript", "SQL"] },
    { name: "Distributed Systems & Backend", w: 82, compound: "s",
      tags: ["Microservices", "Job Queues", "Fault Tolerance", "FastAPI", "Express", "Node.js"] },
    { name: "Databases & Infra",             w: 80, compound: "m",
      tags: ["PostgreSQL", "Redis", "Prisma ORM", "SQLite", "S3 / MinIO"] },
    { name: "Optimization & ML",             w: 82, compound: "m",
      tags: ["MILP", "OR-Tools", "Dijkstra / A*", "scikit-learn", "XGBoost", "Random Forest"] },
    { name: "Cloud & DevOps",                w: 78, compound: "m",
      tags: ["AWS EC2", "Docker Compose", "GitHub Actions", "Linux", "Vercel"] },
    { name: "CS Fundamentals",               w: 88, compound: "h",
      tags: ["DSA", "OS", "Computer Arch", "Networks", "DBMS", "OOD"] },
  ],

  compounds: [
    { id: "all", label: "All",    letter: "A", note: "Full setup" },
    { id: "s",   label: "Soft",   letter: "S", note: "Sharpest · daily" },
    { id: "m",   label: "Medium", letter: "M", note: "Balanced" },
    { id: "h",   label: "Hard",   letter: "H", note: "Fundamentals" },
  ],

  /* ---------- race history (experience) ---------- */
  races: [
    {
      pos: "P1",
      role: "Teaching Assistant — DSA & Computer Networks",
      org: "IIIT Delhi",
      when: "JAN 2026 — PRESENT",
      laps: "2 courses",
      best: "100+",
      bestLbl: "Mentees",
      tone: "mag",
      logo: "assets/iiitd.webp",
      gist: "Mentoring 100+ undergraduates across two courses — DSA (CSE102, C++) and Computer Networks (CSE232). Designing assignments and rubrics on data structures, complexity analysis, and object-oriented design; running weekly sessions on graph traversal, dynamic programming, and network protocols.",
      points: [
        "Authored assignment specs and grading rubrics for 2 core courses",
        "Weekly doubt sessions on graphs, DP, and network protocols",
        "Reviewed and debugged student C++ submissions at scale",
      ],
    },
    {
      pos: "P2",
      role: "Research Intern — CoSY Lab",
      org: "Prof. Ganesh Bagler",
      when: "MAY 2025 — JUL 2025",
      laps: "3 months",
      best: "1M+",
      bestLbl: "Records piped",
      tone: "yel",
      logo: "assets/iiitd.webp",
      gist: "Engineered high-throughput data ingestion and query pipelines for Foodoscope, processing millions of structured records at scale. Built visualisation dashboards for multi-dimensional dataset exploration; benchmarked pipeline outputs against domain ground truths via statistical validation for reproducibility.",
      points: [
        "High-throughput ingestion + query pipelines over millions of records",
        "Dashboards for multi-dimensional dataset exploration",
        "Statistical validation against domain ground truths",
      ],
    },
    {
      pos: "P3",
      role: "Software Testing Intern",
      org: "Fam (formerly FamPay)",
      when: "MAY 2024 — JUL 2024",
      laps: "3 months",
      best: "2×",
      bestLbl: "iOS + Android",
      tone: "grn",
      logo: "assets/fam.webp",
      gist: "Ran regression test suites across Android and iOS builds each sprint in an agile release cycle. Found edge-case failures in payment, onboarding, and card-management flows via structured defect triage; authored reproducible bug reports with root-cause analysis.",
      points: [
        "Sprint-cadence regression suites on Android + iOS",
        "Edge-case defects in payment, onboarding, card management",
        "Reproducible bug reports with root-cause analysis",
      ],
    },
  ],

  /* ---------- the garage (projects) ---------- */
  projects: [
    {
      n: "01",
      featured: true,
      title: "PGIP",
      subtitle: "Pre-Experimental Perturbation Triage",
      badge: "POLE",
      desc: "Two-stage ML system that predicts, before a costly single-cell CRISPR experiment is run, whether a perturbation will be saturated (an additive baseline suffices) or resistant (non-additive, worth deep modeling). Ridge / Random Forest over gene-intrinsic features — baseline expression, STRING PPI connectivity, Gene Ontology, and a frozen ESM-2 embedding — across seven public Perturb-seq screens. First-author preprint under review.",
      stack: ["Python", "scikit-learn", "Random Forest", "ESM-2", "STRING", "Perturb-seq"],
      metrics: [
        { k: "ROC-AUC",  v: "0.86" },
        { k: "Screens",  v: "07" },
        { k: "Stage",    v: "Preprint" },
      ],
      href: "https://github.com/itzsam-lol/PGIP",
    },
    {
      n: "02",
      title: "SynchroPulse AI",
      subtitle: "Traffic Optimisation at City Scale",
      badge: "S1",
      desc: "Traffic congestion prediction and mitigation on real Bengaluru road data. Mixed-Integer Linear Programming (Google OR-Tools) computes optimal personnel and barricade deployment in under 10 seconds; custom Dijkstra / A* routing runs over a live-updated spatial graph; a predictive model forecasts congestion 180 minutes ahead. Deployed on AWS EC2 via Docker Compose behind a FastAPI service layer.",
      stack: ["Python", "OR-Tools", "FastAPI", "OSMnx", "Docker", "AWS EC2"],
      metrics: [
        { k: "Plan time", v: "<10s" },
        { k: "Forecast",  v: "180min" },
        { k: "Deploy",    v: "EC2" },
      ],
      href: "https://github.com/itzsam-lol/synchroo",
    },
    {
      n: "03",
      title: "CodeForge",
      subtitle: "Fault-Tolerant Execution Platform",
      badge: "S2",
      desc: "Fault-tolerant distributed platform decoupling code execution, job orchestration, and analytics into independent services. Distributed job queues route concurrent grading loads to isolated execution workers, with Redis indexing, durable PostgreSQL state, and object storage for artifacts. Recovery via delayed-job deadlines and periodic state sweeps; untrusted code runs in restricted sandboxes with revocable session tokens.",
      stack: ["TypeScript", "Express", "Next.js 15", "PostgreSQL", "Redis", "Docker"],
      metrics: [
        { k: "Services", v: "03" },
        { k: "Recovery", v: "Auto" },
        { k: "Sandbox",  v: "Isolated" },
      ],
      href: "https://github.com/itzsam-lol",
    },
    {
      n: "04",
      title: "RISC-V Toolchain",
      subtitle: "Assembler & Cycle-Accurate Simulator",
      badge: "S3",
      desc: "Complete RV32I toolchain — a two-pass assembler with label resolution and forward-reference handling, plus a cycle-accurate simulator implementing instruction decoding, register file and memory management, and ALU execution. Validated by 147 tests covering opcodes and boundary conditions.",
      stack: ["Python", "C++", "Computer Architecture", "OOP"],
      metrics: [
        { k: "Tests",  v: "147" },
        { k: "ISA",    v: "RV32I" },
        { k: "Passes", v: "02" },
      ],
      href: "https://github.com/itzsam-lol/RISCV_Assembler_Simulator",
    },
    {
      n: "05",
      title: "Udyox AI",
      subtitle: "Production Voice-First Backend",
      badge: "L",
      desc: "Modular voice-first service backend serving 18+ live clients with zero downtime. Low-latency pipeline — speech recognition to LLM intent extraction to confirmation-first database write — holding a 2–3s end-to-end response under real production load.",
      stack: ["FastAPI", "React 19", "Whisper", "LLMs", "SQLite"],
      metrics: [
        { k: "Clients",  v: "18+" },
        { k: "Latency",  v: "2–3s" },
        { k: "Downtime", v: "Zero" },
      ],
      href: "https://github.com/itzsam-lol/udyoxAI",
    },
    {
      n: "06",
      title: "RR-Arbiter",
      subtitle: "Formal Verification of RTL",
      badge: "S1",
      desc: "Formal proof of a parameterizable round-robin bus arbiter in SystemVerilog using SymbiYosys with k-induction — mutual exclusion, no spurious grants, liveness, reset correctness, and no-starvation. A deliberately injected bug that simulation misses is caught immediately under the unconstrained formal environment.",
      stack: ["SystemVerilog", "SymbiYosys", "Formal Methods"],
      metrics: [
        { k: "Method",   v: "k-induct" },
        { k: "Props",    v: "05" },
        { k: "Coverage", v: "Formal" },
      ],
      href: "https://github.com/itzsam-lol/rr-arbiter-formal",
    },
    {
      n: "07",
      title: "SPLM",
      subtitle: "Cross-Asset Momentum Research",
      badge: "S2",
      desc: "Quantitative research framework generating stock alpha from cross-asset momentum signals. Scalable data pipelines, portfolio ranking, and a backtesting harness evaluating alpha generation across multiple market regimes.",
      stack: ["Python", "Pandas", "NumPy", "Backtesting"],
      metrics: [
        { k: "Regimes", v: "Multi" },
        { k: "Harness", v: "Backtest" },
        { k: "Signal",  v: "Momentum" },
      ],
      href: "https://github.com/itzsam-lol/SPLM",
    },
  ],

  /* ---------- pit crew (leadership) ---------- */
  crew: [
    {
      size: "lg",
      role: "Co-Founder",
      title: "Ignite Room",
      when: "IIITD · Ongoing",
      gist: "Scaled a student tech community to 10,000+ members. Built and maintain the Ignite Room and CiPD (IIIT Delhi) web platforms powering events, outreach, and member operations.",
      to: 10, suffix: "K+", bigLbl: "Members",
      logo: "assets/igniteroom.webp",
    },
    {
      size: "md",
      role: "Vice Chairperson",
      title: "IEEE-IIITD",
      when: "Nov 2024 — Aug 2025",
      gist: "Led strategy and operations for one of IIIT Delhi's largest technical communities — 50+ volunteers across technical events, workshops, and industry outreach.",
      to: 50, suffix: "+", bigLbl: "Volunteers",
      logo: "assets/ieee.webp",
    },
    {
      size: "wide",
      role: "Lead Organizer",
      title: "Hack The Flame",
      when: "Sept 2025 — Dec 2025 · National",
      gist: "Lead organizer for a national hackathon with 500+ participants — logistics, sponsor deliverables, vendor operations, and on-ground execution.",
      to: 500, suffix: "+", bigLbl: "Participants",
      logo: "assets/igniteroom.webp",
    },
  ],

  crewStats: [
    { k: "Communities led", to: 3,   suffix: "" },
    { k: "Events run",      to: 40,  suffix: "+" },
    { k: "Reach",          to: 10,  suffix: "K+" },
  ],

  /* ---------- pit lane (contact) ---------- */
  links: {
    email: "satyam23495@iiitd.ac.in",
    github: "https://github.com/itzsam-lol",
    leetcode: "https://leetcode.com/u/samuraiiii",
    linkedin: "https://linkedin.com/in/satyam564774288",
    phone: "+91 9811230374",
  },

  /* ---------- nav / sector map ---------- */
  sections: [
    { id: "top",        nav: "Grid",     tag: "00", label: "Lights Out",     sector: 1 },
    { id: "driver",     nav: "Driver",   tag: "01", label: "Driver Profile", sector: 1 },
    { id: "setup",      nav: "Setup",    tag: "02", label: "Setup Sheet",    sector: 1 },
    { id: "history",    nav: "History",  tag: "03", label: "Race History",   sector: 2 },
    { id: "garage",     nav: "Garage",   tag: "04", label: "The Garage",     sector: 2 },
    { id: "crew",       nav: "Crew",     tag: "05", label: "Pit Crew",       sector: 3 },
    { id: "pitlane",    nav: "Pit Lane", tag: "06", label: "Pit Lane",       sector: 3 },
  ],
};
