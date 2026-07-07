/* ==========================================================================
   KRNLSec — Core application script
   Shared data, layout injection (nav/footer), and global UI behaviours.
   Pure vanilla JavaScript, no dependencies.
   ========================================================================== */
(function () {
  "use strict";

  /* --------------------------------------------------------------------------
   * SVG icon library (inline so no network requests / no emoji icons)
   * ------------------------------------------------------------------------ */
  const ICONS = {
    logo: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 5v6c0 5 3.5 8 8 11 4.5-3 8-6 8-11V5l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    arrowUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>',
    arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m23 7-7 5 7 5V7Z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 10 5-10 5L2 7l10-5Z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></svg>',
    trend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m23 6-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    twitter: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.6 8.7L23 22h-6.8l-5.3-7-6.1 7H1.6l8.2-9.3L1 2h7l4.8 6.4L18.9 2Zm-2.4 18h1.9L7.6 3.9H5.6L16.5 20Z"/></svg>',
    github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5A2.5 2.5 0 1 1 0 3.5a2.5 2.5 0 0 1 4.98 0ZM0 8h5v16H0V8Zm7.5 0h4.78v2.19h.07c.67-1.2 2.3-2.46 4.73-2.46 5.06 0 6 3.33 6 7.66V24h-5v-7.4c0-1.77-.03-4.04-2.46-4.04-2.46 0-2.84 1.92-2.84 3.91V24h-5V8Z"/></svg>',
    discord: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.25.5a18.3 18.3 0 0 1 4.3 1.4 16.6 16.6 0 0 0-14.9 0A18.3 18.3 0 0 1 8.85 3.5L8.6 3a19.8 19.8 0 0 0-4.9 1.4C.7 8.9-.15 13.3.25 17.6a19.9 19.9 0 0 0 6.05 3.06l.75-1.05c-.66-.25-1.3-.55-1.9-.9l.47-.35a14.2 14.2 0 0 0 12.06 0l.47.35c-.6.35-1.24.65-1.9.9l.75 1.05a19.9 19.9 0 0 0 6.05-3.06c.5-5.16-.85-9.56-2.9-13.2ZM8.3 15.1c-1.18 0-2.15-1.08-2.15-2.4 0-1.32.95-2.4 2.15-2.4s2.17 1.09 2.15 2.4c0 1.32-.96 2.4-2.15 2.4Zm7.4 0c-1.18 0-2.15-1.08-2.15-2.4 0-1.32.95-2.4 2.15-2.4s2.17 1.09 2.15 2.4c0 1.32-.95 2.4-2.15 2.4Z"/></svg>',
    zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    award: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12"/></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>',
  };

  /* --------------------------------------------------------------------------
   * Course catalogue — single flagship course
   * ------------------------------------------------------------------------ */

  const catalogue = [
    {
      id: "z2h",
      title: "Zero to Hero in Cybersecurity",
      category: "Cybersecurity",
      level: "Beginner",
      hours: 18,
      lessons: 30,
      rating: 4.9,
      price: 10,
      oldPrice: 49,
      students: 12400,
      desc: "The complete beginner-to-professional cybersecurity roadmap. Go from zero knowledge to job-ready skills across networking, Linux, ethical hacking, web security, and more — in one structured course.",
      instructor: "Marcus Vale",
      thumb: "assets/images/thumb-1.png",
      newFlag: true,
      popular: true,
    },
  ];

  const CATEGORIES = ["Cybersecurity"];
  const LEVELS = ["Beginner", "Intermediate", "Advanced"];

  /* Curriculum — 6 sections × 5 videos = 30 lessons */
  const CURRICULUM = [
    {
      title: "Section 1: Foundations of Cybersecurity",
      lessons: [
        ["Welcome & What You'll Learn", "6:12", true],
        ["How Hackers Think: The Attacker Mindset", "14:30", true],
        ["Setting Up Your Security Lab (Kali Linux VM)", "18:45", false],
        ["The CIA Triad Explained", "10:20", false],
        ["Types of Hackers & Career Paths", "12:15", false],
      ],
    },
    {
      title: "Section 2: Networking for Security Professionals",
      lessons: [
        ["How Networks Work: IP, TCP & UDP", "20:10", false],
        ["DNS, DHCP & How the Web Connects", "17:33", false],
        ["Subnetting Made Simple", "22:45", false],
        ["Reading Traffic with Wireshark", "25:18", false],
        ["Identifying Suspicious Network Patterns", "19:40", false],
      ],
    },
    {
      title: "Section 3: Linux for Security",
      lessons: [
        ["Linux Command Line Crash Course", "24:00", false],
        ["File Permissions & User Management", "16:50", false],
        ["Scripting with Bash", "21:35", false],
        ["Log Analysis & System Monitoring", "18:22", false],
        ["Hardening a Linux Server", "23:10", false],
      ],
    },
    {
      title: "Section 4: Ethical Hacking & Penetration Testing",
      lessons: [
        ["Penetration Testing Methodology", "19:05", false],
        ["Reconnaissance with OSINT Tools", "28:40", false],
        ["Port Scanning & Service Enum with Nmap", "22:15", false],
        ["Exploitation Fundamentals with Metasploit", "30:10", false],
        ["Post-Exploitation & Privilege Escalation", "26:55", false],
      ],
    },
    {
      title: "Section 5: Web Application Security",
      lessons: [
        ["How Web Apps Work: HTTP, APIs & Sessions", "17:30", false],
        ["SQL Injection: Find & Exploit", "29:20", false],
        ["Cross-Site Scripting (XSS) Attacks", "24:45", false],
        ["Authentication Flaws & Session Hijacking", "21:18", false],
        ["Testing Web Apps with Burp Suite", "32:00", false],
      ],
    },
    {
      title: "Section 6: Defence, Detection & Career",
      lessons: [
        ["Introduction to Defensive Security & SOC", "15:40", false],
        ["Firewalls, IDS/IPS & SIEM Basics", "20:25", false],
        ["Incident Response: What to Do When Breached", "23:50", false],
        ["Writing a Penetration Test Report", "18:35", false],
        ["Your Cybersecurity Roadmap & Next Steps", "14:00", false],
      ],
    },
  ];

  const REVIEWS = [
    ["Alex Thompson", "Security Analyst", 5, "Best structured security course I've ever taken. Went from total beginner to passing my CEH exam."],
    ["Nadia Okonkwo", "Junior Pentester", 5, "I landed my first security job after finishing this. The labs are realistic and the price is unbeatable."],
    ["David Kim", "IT Manager", 4, "Enrolled my whole team. The networking and Linux sections alone are worth ten times the price."],
    ["Elena Petrova", "Student", 5, "Marcus explains everything clearly without watering it down. Finished all 30 videos in a week."],
    ["James Carter", "SOC Engineer", 5, "Section 6 on defence and detection is top tier. Instantly applicable to my day-to-day SOC work."],
    ["Aisha Rahman", "Developer", 5, "Finally understand how attackers think. My code is so much more secure now that I see through their eyes."],
  ];

  /* --------------------------------------------------------------------------
   * Small utilities
   * ------------------------------------------------------------------------ */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function formatNumber(n) {
    return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k" : String(n);
  }
  function money(n) { return "$" + n.toFixed(2); }
  function icon(name) { return ICONS[name] || ""; }

  /* localStorage helpers (frontend-only persistence) */
  const store = {
    get(key, fallback) {
      try { return JSON.parse(localStorage.getItem("krnl_" + key)) ?? fallback; }
      catch { return fallback; }
    },
    set(key, val) { localStorage.setItem("krnl_" + key, JSON.stringify(val)); },
  };

  /* Wishlist */
  function getWishlist() { return store.get("wishlist", []); }
  function toggleWishlist(id) {
    const list = getWishlist();
    const idx = list.indexOf(id);
    if (idx > -1) { list.splice(idx, 1); } else { list.push(id); }
    store.set("wishlist", list);
    return idx === -1;
  }

  /* --------------------------------------------------------------------------
   * Toast notifications
   * ------------------------------------------------------------------------ */
  function ensureToastWrap() {
    let wrap = $(".toast-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "toast-wrap";
      wrap.setAttribute("aria-live", "polite");
      document.body.appendChild(wrap);
    }
    return wrap;
  }
  function toast(message, type = "success") {
    const wrap = ensureToastWrap();
    const el = document.createElement("div");
    el.className = "toast " + type;
    el.innerHTML = `<span class="dot"></span><span>${message}</span>`;
    wrap.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 400);
    }, 3200);
  }

  /* --------------------------------------------------------------------------
   * Navigation + footer injection
   * ------------------------------------------------------------------------ */
  const NAV_LINKS = [
    ["Home", "index.html"],
    ["Courses", "courses.html"],
    ["Pricing", "pricing.html"],
    ["About", "about.html"],
    ["Contact", "contact.html"],
  ];

  function currentPage() {
    const path = location.pathname.split("/").pop();
    return path === "" ? "index.html" : path;
  }

  function renderNav() {
    const host = $("#site-nav");
    if (!host) return;
    const page = currentPage();
    const user = store.get("user");
    
    const links = NAV_LINKS.map(
      ([label, href]) =>
        `<a href="${href}" class="${href === page ? "active" : ""}">${label}</a>`
    ).join("");
    const mLinks = NAV_LINKS.map(
      ([label, href]) => `<a href="${href}">${label}</a>`
    ).join("");

    let actionsHTML = "";
    let mobileActionsHTML = "";
    
    if (user) {
      const initials = user.name ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase() : "U";
      actionsHTML = `
        <a href="dashboard.html" class="btn btn-ghost btn-sm">Dashboard</a>
        <a href="profile.html" class="avatar-sm" title="My Profile" aria-label="My Profile" style="text-decoration:none; width:38px; height:38px; font-size:0.85rem">${initials}</a>
        <button class="nav-toggle" id="navToggle" aria-label="Open menu" aria-expanded="false">${icon("menu")}</button>
      `;
      mobileActionsHTML = `
        <a href="dashboard.html" class="btn btn-ghost btn-block">Dashboard</a>
        <a href="profile.html" class="btn btn-outline btn-block">Profile</a>
        <button id="mobileLogoutBtn" class="btn btn-primary btn-block">Log Out</button>
      `;
    } else {
      actionsHTML = `
        <a href="login.html" class="btn btn-ghost">Login</a>
        <a href="register.html" class="btn btn-primary">Get Started</a>
        <button class="nav-toggle" id="navToggle" aria-label="Open menu" aria-expanded="false">${icon("menu")}</button>
      `;
      mobileActionsHTML = `
        <a href="login.html" class="btn btn-ghost btn-block">Login</a>
        <a href="register.html" class="btn btn-primary btn-block">Get Started</a>
      `;
    }

    host.innerHTML = `
      <header class="nav" id="mainNav">
        <div class="nav-inner">
          <a href="index.html" class="brand" aria-label="KRNLSec home">
            <span class="brand-mark">${icon("logo")}</span>
            KRNL<b>Sec</b>
          </a>
          <nav class="nav-links" aria-label="Primary">${links}</nav>
          <div class="nav-actions">
            ${actionsHTML}
          </div>
        </div>
      </header>
      <div class="mobile-menu" id="mobileMenu">
        ${mLinks}
        <div style="margin-top:12px; display:flex; flex-direction:column; gap:8px">
          ${mobileActionsHTML}
        </div>
      </div>`;

    const nav = $("#mainNav");
    const toggle = $("#navToggle");
    const menu = $("#mobileMenu");
    const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    
    if (toggle) {
      toggle.addEventListener("click", () => {
        const open = menu.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(open));
        toggle.innerHTML = open ? icon("close") : icon("menu");
      });
    }
    
    $$("a", menu).forEach((a) =>
      a.addEventListener("click", () => {
        menu.classList.remove("open");
        toggle.innerHTML = icon("menu");
      })
    );

    const logoutBtn = $("#mobileLogoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        store.set("user", null);
        store.set("purchased_courses", []);
        toast("Logged out. See you soon!", "info");
        setTimeout(() => { location.reload(); }, 800);
      });
    }
  }

  function renderFooter() {
    const host = $("#site-footer");
    if (!host) return;
    const year = new Date().getFullYear();
    host.innerHTML = `
      <footer class="footer">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-brand">
              <a href="index.html" class="brand"><span class="brand-mark">${icon("logo")}</span>KRNL<b>Sec</b></a>
              <p>Practical cybersecurity education that helps beginners and professionals build real-world, job-ready skills.</p>
              <div class="social">
                <a href="#" aria-label="Twitter">${icon("twitter")}</a>
                <a href="#" aria-label="GitHub">${icon("github")}</a>
                <a href="#" aria-label="LinkedIn">${icon("linkedin")}</a>
                <a href="#" aria-label="Discord">${icon("discord")}</a>
              </div>
            </div>
            <div class="footer-col">
              <h4>Platform</h4>
              <a href="courses.html">Courses</a>
              <a href="pricing.html">Pricing</a>
              <a href="dashboard.html">Dashboard</a>
              <a href="register.html">Get Started</a>
            </div>
            <div class="footer-col">
              <h4>Company</h4>
              <a href="about.html">About Us</a>
              <a href="contact.html">Contact</a>
              <a href="#">Careers</a>
              <a href="#">Blog</a>
            </div>
            <div class="footer-col">
              <h4>Legal</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookie Policy</a>
              <a href="mailto:hello@krnlsec.io">hello@krnlsec.io</a>
            </div>
          </div>
          <div class="footer-bottom">
            <span>&copy; ${year} KRNLSec. All rights reserved.</span>
            <span>Built for the security community.</span>
          </div>
        </div>
      </footer>`;
  }

  /* --------------------------------------------------------------------------
   * Loading screen, back-to-top
   * ------------------------------------------------------------------------ */
  function renderLoader() {
    if ($(".loader")) return;
    const el = document.createElement("div");
    el.className = "loader";
    el.innerHTML = `<div class="loader-inner">
        <div class="loader-ring"></div>
        <div class="brand"><span class="brand-mark">${icon("logo")}</span>KRNL<b>Sec</b></div>
      </div>`;
    document.body.appendChild(el);
    window.addEventListener("load", () => {
      setTimeout(() => {
        el.classList.add("hide");
        setTimeout(() => el.remove(), 600);
      }, 400);
    });
    // Safety: hide even if load already fired
    setTimeout(() => el.classList.add("hide"), 2500);
  }

  function renderBackToTop() {
    const btn = document.createElement("button");
    btn.className = "to-top";
    btn.setAttribute("aria-label", "Back to top");
    btn.innerHTML = icon("arrowUp");
    document.body.appendChild(btn);
    window.addEventListener(
      "scroll",
      () => btn.classList.toggle("show", window.scrollY > 500),
      { passive: true }
    );
    btn.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );
  }

  /* --------------------------------------------------------------------------
   * Scroll reveal (IntersectionObserver)
   * ------------------------------------------------------------------------ */
  function initReveal() {
    const els = $$(".reveal");
    if (!("IntersectionObserver" in window) || !els.length) {
      els.forEach((e) => e.classList.add("visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((e) => io.observe(e));
  }

  /* Animated counters (for hero stats etc.) */
  function initCounters() {
    const els = $$("[data-count]");
    if (!els.length) return;
    const run = (el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      const dur = 1400;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = target * eased;
        el.textContent =
          (target >= 1000 ? Math.round(val).toLocaleString() : val.toFixed(target % 1 ? 1 : 0)) +
          suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
      });
    });
    els.forEach((e) => io.observe(e));
  }

  /* --------------------------------------------------------------------------
   * Course card rendering (shared by home, catalogue, related)
   * ------------------------------------------------------------------------ */
  function starRow(rating) {
    return `<span class="rating">${icon("star")} ${rating.toFixed(1)}</span>`;
  }

  function courseCard(c) {
    const wished = getWishlist().includes(c.id);
    const flag = c.newFlag
      ? `<span class="badge">New</span>`
      : c.popular
      ? `<span class="badge">Bestseller</span>`
      : "";
    return `
      <article class="course-card glass reveal" data-id="${c.id}"
        data-category="${c.category}" data-level="${c.level}"
        data-price="${c.price}" data-rating="${c.rating}"
        data-students="${c.students}" data-title="${c.title.toLowerCase()}">
        <a class="course-thumb" href="course.html?id=${c.id}">
          <img src="${c.thumb}" alt="${c.title} course thumbnail" loading="lazy" width="400" height="250" />
          ${flag}
        </a>
        <button class="wishlist-btn ${wished ? "active" : ""}" data-wish="${c.id}"
          aria-label="Add ${c.title} to wishlist" aria-pressed="${wished}">${icon("heart")}</button>
        <div class="course-body">
          <div class="course-meta-top">
            <span class="badge gray">${c.category}</span>
            <span>${c.level}</span>
          </div>
          <h3><a href="course.html?id=${c.id}">${c.title}</a></h3>
          <p class="course-instructor">by ${c.instructor}</p>
          <p class="course-desc">${c.desc}</p>
          <div class="course-stats">
            ${starRow(c.rating)}
            <span>${icon("clock")} ${c.hours}h</span>
            <span>${icon("video")} ${c.lessons} lessons</span>
            <span>${icon("users")} ${formatNumber(c.students)}</span>
          </div>
          <div class="course-foot">
            <span class="price">${money(c.price)}<small>${money(c.oldPrice)}</small></span>
            <a href="course.html?id=${c.id}" class="btn btn-primary btn-sm">Enroll</a>
          </div>
        </div>
      </article>`;
  }

  /* Delegate wishlist button clicks globally */
  function initWishlistDelegation() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-wish]");
      if (!btn) return;
      e.preventDefault();
      const id = btn.dataset.wish;
      const added = toggleWishlist(id);
      btn.classList.toggle("active", added);
      btn.setAttribute("aria-pressed", String(added));
      const c = catalogue.find((x) => x.id === id);
      toast(added ? `Added "${c.title}" to wishlist` : "Removed from wishlist", added ? "success" : "info");
    });
  }

  /* Handle links that require purchase — uses real Whop links if configured */
  function initBuyDelegation() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-buy]");
      if (!btn) return;
      e.preventDefault();
      const id = btn.dataset.buy;

      // Build the return URL Whop will redirect the user back to after payment
      const origin = window.location.origin;
      const successUrl = `${origin}/dashboard.html?whop_success=true&course_id=${encodeURIComponent(id)}`;

      // Check if a real Whop link is configured for this course
      const cfg = window.WHOP_CONFIG;
      const whopBase = cfg && cfg.courses && cfg.courses[id];

      if (whopBase && !whopBase.includes("REPLACE")) {
        // Real Whop link — append the redirect param and go
        // Whop supports ?redirect= for post-payment destination
        const separator = whopBase.includes("?") ? "&" : "?";
        const whopUrl = `${whopBase}${separator}redirect=${encodeURIComponent(successUrl)}`;
        toast("Redirecting to Whop secure checkout…", "info");
        setTimeout(() => { window.location.href = whopUrl; }, 900);
      } else {
        // No real Whop link yet — use local simulator so site still works
        toast("Opening checkout (configure Whop link in js/whop-config.js)…", "info");
        setTimeout(() => { window.location.href = `whop-checkout.html?course_id=${encodeURIComponent(id)}`; }, 900);
      }
    });
  }

  /* Expose shared API for page scripts */
  window.KRNL = {
    icons: ICONS, icon,
    catalogue, categories: CATEGORIES, levels: LEVELS,
    curriculum: CURRICULUM, reviews: REVIEWS,
    courseCard, starRow, toast, store,
    getWishlist, toggleWishlist,
    formatNumber, money, $, $$,
    refresh() { initReveal(); initCounters(); },
  };

  /* --------------------------------------------------------------------------
   * Boot
   * ------------------------------------------------------------------------ */
  function boot() {
    // Restore saved theme
    if (store.get("theme", "dark") === "light") document.body.classList.add("light");
    renderLoader();
    renderNav();
    renderFooter();
    renderBackToTop();
    initWishlistDelegation();
    initBuyDelegation();
    // Delay reveal/counters slightly so page-injected content is present
    requestAnimationFrame(() => {
      initReveal();
      initCounters();
    });
    // Re-run reveal after full load for lazy content
    window.addEventListener("load", () => setTimeout(initReveal, 50));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
