// Shared data — exposed on window for cross-script access
const PROFILE = {
  name: "SATYAM",
  number: "04",
  team: "IIIT DELHI / CS-AI",
  season: "2026",
  bio: [
    "B.Tech CS-AI engineer at IIIT Delhi, racing through distributed systems, optimization, and machine learning with the same obsession an F1 team has for laptime.",
    "Teaching Assistant for DSA and Computer Networks, research intern at CoSY Lab, and first author on a preprint (under review) on pre-experimental triage for single-cell perturbation modeling.",
    "A garage of builds spanning fault-tolerant distributed platforms, MILP traffic optimization, a RISC-V toolchain, and production AI backends serving live clients.",
  ],
  stats: [
    { lbl: "LeetCode Solved", val: "300", u: "+" },
    { lbl: "Students Mentored", val: "100", u: "+" },
    { lbl: "Community Built", val: "10K", u: "+" },
  ],
};

const SKILLS = [
  { name: "Languages", w: 92, tags: ["C++", "Python", "Java", "C", "TypeScript", "SQL"] },
  { name: "Distributed Systems & Backend", w: 82, tags: ["Microservices", "Job Queues", "Fault Tolerance", "FastAPI", "Express", "Node.js"] },
  { name: "Databases & Infra", w: 80, tags: ["PostgreSQL", "Redis", "Prisma ORM", "SQLite", "S3 / MinIO"] },
  { name: "Optimization & ML", w: 82, tags: ["MILP", "OR-Tools", "Dijkstra / A*", "scikit-learn", "XGBoost", "Random Forest"] },
  { name: "Cloud & DevOps", w: 78, tags: ["AWS EC2", "Docker Compose", "GitHub Actions", "Linux", "Vercel"] },
  { name: "CS Fundamentals", w: 88, tags: ["DSA", "OS", "Computer Arch", "Networks", "DBMS", "OOD"] },
];

const RACES = [
  {
    pos: "P1",
    role: "Teaching Assistant — DSA & Computer Networks",
    org: "IIIT Delhi",
    when: "JAN 2026 — PRESENT",
    gist: "Mentoring 100+ undergraduates across two courses — DSA (CSE102, C++) and Computer Networks (CSE232). Designing assignments and rubrics on data structures, complexity analysis, and object-oriented design; running weekly sessions on graph traversal, dynamic programming, and network protocols.",
    stat: "100+", statLbl: "Mentees · 2 Courses", statColor: "mag",
    logo: "assets/iiitd.png",
  },
  {
    pos: "P2",
    role: "Research Intern — CoSY Lab",
    org: "Prof. Ganesh Bagler",
    when: "MAY 2025 — JUL 2025",
    gist: "Engineered high-throughput data ingestion and query pipelines for Foodoscope, processing millions of structured records at scale. Built visualisation dashboards for multi-dimensional dataset exploration; benchmarked pipeline outputs against domain ground truths via statistical validation for reproducibility.",
    stat: "1M+", statLbl: "Records Piped", statColor: "yel",
    logo: "assets/iiitd.png",
  },
  {
    pos: "P3",
    role: "Software Testing Intern",
    org: "Fam (formerly FamPay)",
    when: "MAY 2024 — JUL 2024",
    gist: "Ran regression test suites across Android and iOS builds each sprint in an agile release cycle. Found edge-case failures in payment, onboarding, and card-management flows via structured defect triage; authored reproducible bug reports with root-cause analysis.",
    stat: "2×", statLbl: "iOS + Android",
    logo: "assets/fam.jpg",
  },
];

const PROJECTS = [
  {
    n: "01", w: "feat",
    title: "PGIP — Pre-Experimental Perturbation Triage",
    desc: "Two-stage ML system that predicts, before a costly single-cell CRISPR experiment is run, whether a perturbation will be saturated (an additive baseline suffices) or resistant (non-additive, worth deep modeling). Ridge / Random Forest over gene-intrinsic features — baseline expression, STRING PPI connectivity, Gene Ontology, and a frozen ESM-2 embedding — across seven public Perturb-seq screens. First-author preprint under review.",
    stack: ["Python", "scikit-learn", "Random Forest", "ESM-2", "STRING", "Perturb-seq"],
    speed: "POLE · ROC-AUC 0.86",
    href: "https://github.com/itzsam-lol/PGIP",
  },
  {
    n: "02", w: "w-6",
    title: "SynchroPulse AI",
    desc: "Traffic congestion prediction and mitigation on real Bengaluru road data. Mixed-Integer Linear Programming (Google OR-Tools) computes optimal personnel and barricade deployment in under 10 seconds; custom Dijkstra / A* routing runs over a live-updated spatial graph; a predictive model forecasts congestion 180 minutes ahead. Deployed on AWS EC2 via Docker Compose behind a FastAPI service layer.",
    stack: ["Python", "OR-Tools", "FastAPI", "OSMnx", "Docker", "AWS EC2"],
    speed: "S1 · < 10s plans",
    href: "https://github.com/itzsam-lol/synchroo",
  },
  {
    n: "03", w: "w-6",
    title: "CodeForge",
    desc: "Fault-tolerant distributed platform decoupling code execution, job orchestration, and analytics into independent services. Distributed job queues route concurrent grading loads to isolated execution workers, with Redis indexing, durable PostgreSQL state, and object storage for artifacts. Recovery via delayed-job deadlines and periodic state sweeps; untrusted code runs in restricted sandboxes with revocable session tokens.",
    stack: ["TypeScript", "Express", "Next.js 15", "PostgreSQL", "Redis", "Docker"],
    speed: "S2 · fault-tolerant",
    href: "https://github.com/itzsam-lol",
  },
  {
    n: "04", w: "w-6",
    title: "RISC-V Assembler & CPU Simulator",
    desc: "Complete RV32I toolchain — a two-pass assembler with label resolution and forward-reference handling, plus a cycle-accurate simulator implementing instruction decoding, register file and memory management, and ALU execution. Validated by 147 tests covering opcodes and boundary conditions.",
    stack: ["Python", "C++", "Computer Architecture", "OOP"],
    speed: "S3 · 147 tests",
    href: "https://github.com/itzsam-lol/RISCV_Assembler_Simulator",
  },
  {
    n: "05", w: "w-6",
    title: "Udyox AI — Production Backend",
    desc: "Modular voice-first service backend serving 18+ live clients with zero downtime. Low-latency pipeline — speech recognition to LLM intent extraction to confirmation-first database write — holding a 2–3s end-to-end response under real production load.",
    stack: ["FastAPI", "React 19", "Whisper", "LLMs", "SQLite"],
    speed: "L · 18+ clients",
    href: "https://github.com/itzsam-lol/udyoxAI",
  },
  {
    n: "06", w: "w-6",
    title: "RR-Arbiter Formal Verification",
    desc: "Formal proof of a parameterizable round-robin bus arbiter in SystemVerilog using SymbiYosys with k-induction — mutual exclusion, no spurious grants, liveness, reset correctness, and no-starvation. A deliberately injected bug that simulation misses is caught immediately under the unconstrained formal environment.",
    stack: ["SystemVerilog", "SymbiYosys", "Formal Methods"],
    speed: "S1 · RTL proofs",
    href: "https://github.com/itzsam-lol/rr-arbiter-formal",
  },
  {
    n: "07", w: "w-6",
    title: "SPLM — Cross-Asset Momentum Research",
    desc: "Quantitative research framework generating stock alpha from cross-asset momentum signals. Scalable data pipelines, portfolio ranking, and a backtesting harness evaluating alpha generation across multiple market regimes.",
    stack: ["Python", "Pandas", "NumPy", "Backtesting"],
    speed: "S2 · backtested",
    href: "https://github.com/itzsam-lol/SPLM",
  },
];

const CREW = [
  {
    role: "Co-Founder",
    title: "Ignite Room",
    when: "IIITD · Ongoing",
    gist: "Scaled a student tech community to 10,000+ members. Built and maintain the Ignite Room and CiPD (IIIT Delhi) web platforms powering events, outreach, and member operations.",
    big: "10K+", bigLbl: "Members",
    logo: "assets/igniteroom.png",
  },
  {
    role: "Vice Chairperson",
    title: "IEEE-IIITD Student Branch",
    when: "Nov 2024 — Aug 2025 · IIITD",
    gist: "Led strategy and operations for one of IIIT Delhi's largest technical communities — 50+ volunteers across technical events, workshops, and industry outreach.",
    big: "50+", bigLbl: "Volunteers",
    logo: "assets/ieee.png",
  },
  {
    role: "Lead Organizer",
    title: "Hack The Flame",
    when: "Sept 2025 — Dec 2025 · National",
    gist: "Lead organizer for a national hackathon with 500+ participants — logistics, sponsor deliverables, vendor operations, and on-ground execution.",
    big: "500+", bigLbl: "Participants",
    logo: "assets/igniteroom.png",
  },
];

const LINKS = {
  email: "satyam23495@iiitd.ac.in",
  github: "https://github.com/itzsam-lol",
  leetcode: "https://leetcode.com/u/samuraiiii",
  linkedin: "https://linkedin.com/in/satyam564774288",
  phone: "+91 9811230374",
};

window.PROFILE = PROFILE;
window.SKILLS = SKILLS;
window.RACES = RACES;
window.PROJECTS = PROJECTS;
window.CREW = CREW;
window.LINKS = LINKS;
