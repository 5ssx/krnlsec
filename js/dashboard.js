/* ==========================================================================
   KRNLSec — Learning Dashboard Script
   Handles user interface, session verification, course access and settings.
   ========================================================================== */
(function () {
  "use strict";

  const { icon, catalogue, store, toast, $, $$ } = window.KRNL;

  // 1. Session restriction
  const user = window.KRNLAuth.checkSession();
  if (!user) {
    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `login.html?next=${returnUrl}`;
    return;
  }

  // 2. Process real Whop payment callbacks
  const params = new URLSearchParams(window.location.search);
  if (params.get("whop_success")) {
    const courseId = params.get("course_id");
    
    // Clear URL parameters to avoid repeating on refreshes
    window.history.replaceState({}, document.title, window.location.pathname);

    if (courseId) {
      const course = catalogue.find(c => c.id === courseId);
      if (course) {
        // Safe sync with Cloudflare native DB backend if active
        window.KRNLAuth.syncCoursePurchase(courseId);

        if (user.isFirebase) {
          // Sync purchasing data for this specific Firebase UID
          const purchasesMap = store.get("firebase_purchases", {});
          const userPurchases = purchasesMap[user.uid] || [];
          if (!userPurchases.includes(courseId)) {
            userPurchases.push(courseId);
            purchasesMap[user.uid] = userPurchases;
            store.set("firebase_purchases", purchasesMap);
          }
          store.set("purchased_courses", userPurchases);
        } else {
          // LocalStorage Mode
          const users = store.get("krnl_users", []);
          const idx = users.findIndex(u => u.email === user.email);
          
          if (idx !== -1) {
            users[idx].purchased = users[idx].purchased || [];
            if (!users[idx].purchased.includes(courseId)) {
              users[idx].purchased.push(courseId);
              store.set("krnl_users", users);
            }
          }
          
          const activePurchased = store.get("purchased_courses", []);
          if (!activePurchased.includes(courseId)) {
            activePurchased.push(courseId);
            store.set("purchased_courses", activePurchased);
          }
        }
        
        // Write simulated billing invoice receipt
        const bills = store.get("billing_history", [
          { id: "INV-891023", date: "07/01/2026", item: "Starter Plan Registration", amount: 0.00, status: "Paid" }
        ]);
        const invoiceId = "INV-" + Math.floor(100000 + Math.random() * 900000);
        const today = new Date().toLocaleDateString();
        
        if (!bills.find(b => b.item.includes(course.title))) {
          bills.push({
            id: invoiceId,
            date: today,
            item: `Course Purchase: ${course.title}`,
            amount: course.price,
            status: "Paid"
          });
          store.set("billing_history", bills);
        }
        
        toast(`Access granted! "${course.title}" is now permanently unlocked.`, "success");
      }
    } else {
      toast("Payment completed successfully!", "success");
    }
  }

  // 3. Helper to determine course access
  function isUnlocked(cId) {
    if (store.get("membership_unlocked", false)) return true;
    const purchased = store.get("purchased_courses", []);
    return purchased.includes(cId);
  }

  // 4. Sidebar toggles (mobile drawer)
  function initAppShell() {
    const sidebar = $("#sidebar");
    const toggleBtn = $("#menuOpenBtn");
    if (toggleBtn) toggleBtn.innerHTML = icon("menu");

    const notifBtn = $("#notifBtn");
    if (notifBtn) notifBtn.innerHTML = icon("bell");

    // Initials rendering for user
    const initials = user.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase() : "US";
    const userAvatar = $("#userAvatar");
    if (userAvatar) userAvatar.textContent = initials;

    // Handle Mobile Drawer Open
    if (toggleBtn && sidebar) {
      const backdrop = document.createElement("div");
      backdrop.className = "overlay-backdrop";
      document.body.appendChild(backdrop);

      toggleBtn.addEventListener("click", () => {
        const isOpen = sidebar.classList.toggle("open");
        backdrop.classList.toggle("show", isOpen);
        toggleBtn.innerHTML = isOpen ? icon("close") : icon("menu");
      });

      // Close drawer on backdrop close
      backdrop.addEventListener("click", () => {
        sidebar.classList.remove("open");
        backdrop.classList.remove("show");
        toggleBtn.innerHTML = icon("menu");
      });
    }

    // Bind logout buttons
    const sideLogout = $("#sidebarLogout");
    if (sideLogout) {
      sideLogout.addEventListener("click", (e) => {
        e.preventDefault();
        window.KRNLAuth.logout();
      });
    }

    // Highlight active sidebar navigation based on pathname
    const currentPath = window.location.pathname.split("/").pop();
    $$(".side-nav a").forEach(link => {
      const linkPath = link.getAttribute("href");
      if (linkPath === currentPath) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }

  // 5. Populate Dashboard (dashboard.html specific)
  function populateDashboard() {
    const content = $("#dashboardContent");
    if (!content) return;

    // Filter catalogue categories
    const enrolled = catalogue.filter(c => isUnlocked(c.id));
    const locked = catalogue.filter(c => !isUnlocked(c.id));

    // Calculate dynamic stats
    const totalEnrolled = enrolled.length;
    
    let completedCount = 0;
    enrolled.forEach(c => {
      const completed = store.get(`completed_${c.id}_${user.uid}`, []);
      completedCount += completed.length;
    });

    const totalHours = enrolled.reduce((acc, c) => acc + c.hours, 0);

    // Render Stats
    const statsHTML = `
      <div class="stat-grid reveal">
        <div class="stat-card glass">
          <div class="top">
            <span>Enrolled Courses</span>
            <div class="icon">${icon("book")}</div>
          </div>
          <b>${totalEnrolled}</b>
          <span>Access active</span>
        </div>
        <div class="stat-card glass">
          <div class="top">
            <span>Finished Lessons</span>
            <div class="icon">${icon("check")}</div>
          </div>
          <b>${completedCount}</b>
          <span>Across all tracks</span>
        </div>
        <div class="stat-card glass">
          <div class="top">
            <span>Hours Studied</span>
            <div class="icon">${icon("clock")}</div>
          </div>
          <b>${completedCount > 0 ? Math.round(completedCount * 0.6) : 0}h</b>
          <span>Estimated study</span>
        </div>
        <div class="stat-card glass">
          <div class="top">
            <span>Earned Certificates</span>
            <div class="icon">${icon("award")}</div>
          </div>
          <b>${completedCount >= 30 ? 1 : 0}</b>
          <span>Approved certification</span>
        </div>
      </div>
    `;

    // Welcome block
    const welcomeHTML = `
      <div class="welcome-block reveal">
        <h1>Welcome back, <span class="text-primary">${user.name}</span></h1>
        <p>Your current academy status is looking good. Continue your learning path below.</p>
      </div>
    `;

    // Continue Learning widget Or Buy widget
    let continueHTML = "";
    if (enrolled.length > 0) {
      const activeCourse = enrolled[0];
      const completed = store.get(`completed_${activeCourse.id}_${user.uid}`, []);
      const totalLessons = activeCourse.lessons || 30;
      const progressNum = Math.round((completed.length / totalLessons) * 100);

      // Find first uncompleted lesson
      const flat = [];
      window.KRNL.curriculum.forEach((section) => {
        section.lessons.forEach(([title, time]) => {
          flat.push({ title });
        });
      });
      const nextIndex = completed.length < flat.length ? completed.length : flat.length - 1;
      const nextTitle = flat[nextIndex] ? flat[nextIndex].title : "Essential Walkthrough";

      continueHTML = `
        <div class="panel glass reveal" style="margin-bottom:24px">
          <div class="panel-head">
            <h2>Continue Learning</h2>
            <a href="lesson.html?id=${activeCourse.id}">Resume Class ${icon("arrowRight")}</a>
          </div>
          <div class="continue-card" style="margin-bottom:0">
            <img src="${activeCourse.thumb}" alt="${activeCourse.title}" />
            <div>
              <h3>${activeCourse.title}</h3>
              <p class="meta">Next lesson: ${nextTitle} | Instructor: ${activeCourse.instructor}</p>
              <div class="progress-label">
                <span>Overall Progress</span>
                <span>${progressNum}% Complete</span>
              </div>
              <div class="progress"><i style="width: ${progressNum}%"></i></div>
              <a href="lesson.html?id=${activeCourse.id}" class="btn btn-primary" style="margin-top:16px">${icon("play")} Resume Lesson</a>
            </div>
          </div>
        </div>
      `;
    } else {
      const c = catalogue[0]; // flagship course
      continueHTML = `
        <div class="panel glass reveal" style="margin-bottom:24px">
          <div class="panel-head">
            <h2>Get Started</h2>
            <a href="course.html?id=${c.id}">View Details ${icon("arrowRight")}</a>
          </div>
          <div class="continue-card" style="margin-bottom:0">
            <img src="${c.thumb}" alt="${c.title}" />
            <div>
              <h3>${c.title}</h3>
              <p class="meta">Unlock the complete cybersecurity roadmap today. Go from zero knowledge to defensive and offensive job-ready skills.</p>
              <div style="display:flex; align-items:center; gap:20px; margin-top:20px">
                <span class="price" style="font-size:1.44rem; font-weight:700; color:#fff">$${c.price.toFixed(2)}</span>
                <a href="#" class="btn btn-primary" data-buy="${c.id}" style="margin-top:0">${icon("zap")} Enroll Now</a>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // Dashboard Grid
    const dashGridHTML = `
      <div class="dash-grid">
        <!-- Left Side: Courses list -->
        <div>
          ${continueHTML}
          
          ${enrolled.length > 0 ? `
          <div class="panel glass reveal" style="margin-bottom:24px">
            <div class="panel-head">
              <h2>My Unlocked Courses (${enrolled.length})</h2>
              <a href="courses.html">Browse All</a>
            </div>
            <div style="display:flex; flex-direction:column; gap:12px">
              ${enrolled.map(c => {
                const completed = store.get(`completed_${c.id}_${user.uid}`, []);
                const progressNum = Math.round((completed.length / (c.lessons || 30)) * 100);
                return `
                  <div class="course-row">
                    <img src="${c.thumb}" alt="${c.title}" />
                    <div class="info">
                      <h4><a href="course.html?id=${c.id}" style="color:#fff">${c.title}</a></h4>
                      <div class="progress-label" style="font-size:0.75rem; margin-bottom:2px">
                        <span>${c.level} • ${c.category}</span>
                        <span>${progressNum}%</span>
                      </div>
                      <div class="progress" style="height:6px"><i style="width: ${progressNum}%"></i></div>
                    </div>
                    <a href="course.html?id=${c.id}" class="btn btn-ghost btn-sm" style="flex-shrink:0">Enter</a>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
          ` : ""}

          ${locked.length > 0 ? `
          <div class="panel glass reveal">
            <div class="panel-head">
              <h2>Explore Locked Courses (${locked.length})</h2>
              <a href="pricing.html">Unlock All via Whop</a>
            </div>
            <div style="display:flex; flex-direction:column; gap:12px">
              ${locked.map(c => `
                <div class="course-row">
                  <img src="${c.thumb}" alt="${c.title}" style="filter: grayscale(0.8); opacity:0.6" />
                  <div class="info">
                    <h4 style="color:var(--text-muted)">${c.title}</h4>
                    <span style="font-size:0.78rem; color:var(--text-dim)">${c.level} • ${c.category}</span>
                  </div>
                  <a href="#" class="btn btn-outline btn-sm" data-buy="${c.id}" style="flex-shrink:0">${icon("lock")} Enroll $${c.price}</a>
                </div>
              `).join("")}
            </div>
          </div>
          ` : ""}
        </div>

        <!-- Right Side: Announcements & Downloads -->
        <div>
          <div class="panel glass reveal" style="margin-bottom:24px">
            <div class="panel-head">
              <h2>Announcements</h2>
            </div>
            <div>
              <div class="list-item">
                <h4 style="color:#fff">AD Attack Lab Refreshed</h4>
                <p>We've added Kerberoasting and AS-REP roasting templates to the Active Directory hands-on lab sandbox downloads.</p>
                <time>July 05, 2026</time>
              </div>
              <div class="list-item">
                <h4 style="color:#fff">AWS Security Module Added</h4>
                <p>Discover misconfigured IAM policies in AWS. A new 3-hour walkthrough is now active for Professional members.</p>
                <time>June 29, 2026</time>
              </div>
              <div class="list-item">
                <h4 style="color:#fff">Wireshark Captures Update</h4>
                <p>New packet capture profiles (PCAP) representing Cobalt Strike beacons have been added to the Wireshark unit.</p>
                <time>June 18, 2026</time>
              </div>
            </div>
          </div>

          <div class="panel glass reveal">
            <div class="panel-head">
              <h2>Cheat Sheets & Tools</h2>
            </div>
            <div class="resource-list" style="display:flex; flex-direction:column; gap:10px">
              <a href="#" class="btn btn-ghost btn-block" style="justify-content:flex-start">${icon("file")} Command Cheat Sheet (PDF)</a>
              <a href="#" class="btn btn-ghost btn-block" style="justify-content:flex-start">${icon("download")} Kali virtual machine config</a>
              <a href="#" class="btn btn-ghost btn-block" style="justify-content:flex-start">${icon("lock")} Secure lab VPN credentials</a>
            </div>
          </div>
        </div>
      </div>
    `;

    content.innerHTML = welcomeHTML + statsHTML + dashGridHTML;
    window.KRNL.refresh();
  }

  // 6. Populate profile page (profile.html specific)
  function initProfilePage() {
    const avatar = $("#profAvatar");
    const nameInput = $("#profName");
    const emailInput = $("#profEmail");
    const listWrap = $("#billingList");

    if (!avatar) return; // Not on profile page

    // Update avatar text
    const initials = user.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase() : "US";
    avatar.textContent = initials;
    $("#profileNameHeading").textContent = user.name;
    $("#profileEmailHeading").textContent = user.email;

    // Fill form elements
    if (nameInput) nameInput.value = user.name;
    if (emailInput) emailInput.value = user.email;

    // Populate billing values (checks localStorage)
    const bills = store.get("billing_history", [
      { id: "INV-891023", date: "07/01/2026", item: "Starter Plan Registration", amount: 0.00, status: "Paid" }
    ]);
    
    if (listWrap) {
      listWrap.innerHTML = bills
        .map(b => `
          <tr>
            <td style="color:#fff">${b.id}</td>
            <td>${b.date}</td>
            <td>${b.item}</td>
            <td style="color:#fff">$${b.amount.toFixed(2)}</td>
            <td class="paid">${b.status}</td>
          </tr>
        `).join("");
    }

    // Save profile changes
    const form = $("#profileUpdateForm");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const newName = nameInput.value.trim();
        const newEmail = emailInput.value.trim().toLowerCase();
        if (!newName || !newEmail) return;

        window.KRNLAuth.updateProfileDetails(newName, newEmail)
          .then((updatedUser) => {
            toast("Profile updated successfully", "success");
            setTimeout(() => { location.reload(); }, 900);
          })
          .catch((err) => {
            toast(err.message || "Failed to update profile.", "error");
          });
      });
    }

    // Save password change
    const passForm = $("#passUpdateForm");
    if (passForm) {
      passForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const curPass = $("#curPass").value;
        const newPass = $("#newPass").value;

        if (newPass.length < 8) {
          toast("New password must be at least 8 characters.", "info");
          return;
        }

        window.KRNLAuth.updatePasswordDetails(curPass, newPass)
          .then(() => {
            toast("Password updated successfully", "success");
            passForm.reset();
          })
          .catch((err) => {
            toast(err.message || "Failed to update password.", "error");
          });
      });
    }

    // Bind profile tabs
    $$('[data-tab]').forEach(tab => {
      tab.addEventListener("click", () => {
        $$('[data-tab]').forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        
        const targetPanel = tab.dataset.tab;
        $$('[data-panel]').forEach(panel => {
          if (panel.dataset.panel === targetPanel) {
            panel.classList.add("active");
          } else {
            panel.classList.remove("active");
          }
        });
      });
    });

    // Theme, Newsletter & Lab configurations persistence
    const themeSwitch = $("#themeSwitch");
    if (themeSwitch) {
      themeSwitch.checked = store.get("theme", "dark") === "light";
      themeSwitch.addEventListener("change", (e) => {
        const theme = e.target.checked ? "light" : "dark";
        store.set("theme", theme);
        document.body.classList.toggle("light", theme === "light");
        toast(`Adjusted dashboard UI to ${theme} view.`, "success");
      });
    }
  }

  // 7. On DOM Boot
  function boot() {
    initAppShell();
    populateDashboard();
    initProfilePage();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
