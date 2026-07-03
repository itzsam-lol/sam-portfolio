// Shared data — exposed on window for cross-script access
const PROFILE = {
  name: "SATYAM",
  number: "04",
  team: "IIIT DELHI / CSE",
  season: "2026",
  bio: [
    "B.Tech CS engineer at IIIT Delhi, racing through systems, ML, and full-stack builds with the same obsession Formula 1 teams have for laptime.",
    "Teaching Assistant for DSA, research at CoSY Lab on Foodoscope, and a garage of side projects spanning F1 prediction, RISC-V simulation, and quant research.",
  ],
  stats: [
    { lbl: "Problems Solved", val: "300", u: "+" },
    { lbl: "Mentees", val: "100", u: "+" },
    { lbl: "Footfall Managed", val: "50K", u: "+" },
  ],
};

const SKILLS = [
  { name: "Languages", w: 92, tags: ["C++", "Java", "Python", "C", "SQL"] },
  { name: "AI / ML & Data", w: 84, tags: ["Pandas", "NumPy", "Scikit-Learn", "XGBoost", "Jupyter"] },
  { name: "CS Fundamentals", w: 88, tags: ["DSA", "OOP", "OS", "DBMS", "System Design"] },
  { name: "Developer Tools", w: 86, tags: ["Git", "Linux", "REST APIs", "VS Code", "IntelliJ"] },
  { name: "Competitive Prog.", w: 78, tags: ["LeetCode 300+", "DP", "Graphs", "Trees"] },
  { name: "Backend & Systems", w: 74, tags: ["Schema Design", "APIs", "Backtesting", "Pipelines"] },
];

const RACES = [
  {
    pos: "P1",
    role: "Teaching Assistant — DSA",
    org: "IIIT Delhi",
    when: "JAN 2026 — MAY 2026",
    gist: "Mentoring 100+ undergrads in advanced data structures, OOP, and algorithmic problem solving. Designing assignments and tutorials on DP, graphs, and scalable design.",
    stat: "100+", statLbl: "Mentees", statColor: "mag",
    logo: "assets/iiitd.png",
  },
  {
    pos: "P2",
    role: "Research Intern — CoSY Lab",
    org: "Prof. Ganesh Bagler",
    when: "MAY 2025 — JUL 2025",
    gist: "Contributed to Foodoscope, a computational gastronomy platform. Built data viz dashboards and structured high-volume datasets powering downstream ML pipelines.",
    stat: "1×", statLbl: "Research Pipeline", statColor: "yel",
    logo: "assets/iiitd.png",
  },
  {
    pos: "P3",
    role: "Software Testing Intern",
    org: "Fam (formerly FamPay)",
    when: "MAY 2024 — JUL 2024",
    gist: "Streamlined bug-reporting workflow, cutting issue resolution time by 15%. Executed user-flow testing across payment infrastructure and identified edge cases in payment-gateway transactions.",
    stat: "−15%", statLbl: "Resolution Time",
    logo: "assets/fam.jpg",
  },
];

const PROJECTS = [
  {
    n: "01", w: "feat",
    title: "F1 Prediction Analytics",
    desc: "End-to-end ML pipeline forecasting Formula-1 race outcomes from historical driver stats, lap data, and track conditions. Random Forest + XGBoost with k-fold CV for season-robust accuracy.",
    stack: ["Python", "XGBoost", "Random Forest", "Pandas", "Scikit-Learn"],
    speed: "POLE",
    href: "https://github.com/itzsam-lol/F1-PREDICTION-APP",
  },
  {
    n: "02", w: "w-6",
    title: "RISC-V Simulator & Assembler",
    desc: "Python simulator translating RISC-V assembly into machine code with full instruction decoding, register-state tracking, and memory ops. OOP-modeled ALU, register file, and memory bus.",
    stack: ["Python", "Computer Arch", "OOP"],
    speed: "S1 1:18.402",
    href: "https://github.com/itzsam-lol/RISCV_Assembler_Simulator",
  },
  {
    n: "03", w: "w-6",
    title: "Ignite Hub",
    desc: "Scalable platform for managing campus ambassador programs with referral tracking, leaderboard algorithms, and analytics dashboards. Backend services + normalized schema for high-concurrency.",
    stack: ["System Design", "REST APIs", "DB Modeling"],
    speed: "S2 1:21.117",
    href: "https://github.com/Ignite-Room/ignite-hub",
    logo: "assets/igniteroom.png",
  },
  {
    n: "04", w: "w-6",
    title: "Satellite Parking Lot Momentum",
    desc: "Research framework using cross-asset momentum signals. Built scalable data pipelines, portfolio ranking, and a backtesting harness to evaluate alpha across market regimes.",
    stack: ["Python", "Pandas", "NumPy", "Backtesting"],
    speed: "S3 1:19.886",
    href: "https://github.com/itzsam-lol/SPLM",
  },
  {
    n: "05", w: "w-6",
    title: "Oceanic Edge",
    desc: "Python data pipeline for processing and visualizing large oceanographic datasets, surfacing environmental and marine-ecosystem patterns at scale.",
    stack: ["Python", "Data Pipelines", "Visualization"],
    speed: "L 1:20.554",
    href: "https://github.com/itzsam-lol/Oceanic-Edge",
  },
];

const CREW = [
  {
    role: "Organizer",
    title: "Hack The Flame",
    when: "Sept 2025 — Dec 2025 · Mumbai",
    gist: "Managed logistics and sponsor deliverables for a national hackathon; coordinated vendor operations and on-ground execution.",
    big: "500+", bigLbl: "Participants",
    logo: "assets/igniteroom.png",
  },
  {
    role: "Vice Chairperson",
    title: "IEEE-IIITD Student Branch",
    when: "Nov 2024 — Aug 2025 · IIITD",
    gist: "Led strategy and operations for one of IIIT Delhi's largest technical communities — coordinating workshops, technical events, and a 50-strong volunteer team.",
    big: "50+", bigLbl: "Volunteers",
    logo: "assets/ieee.png",
  },
  {
    role: "PR Team Lead",
    title: "Odyssey & E-Summit",
    when: "Aug 2024 — Mar 2025 · IIITD",
    gist: "Managed stakeholder partnerships and communications for flagship cultural and entrepreneurship events; led marketing campaigns and cross-team operations.",
    big: "50K+", bigLbl: "Footfall",
    logo: "assets/odysset.png",
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
