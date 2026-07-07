/* ==========================================================================
   KRNLSec — Unified Authentication & User Sessions Actions Handler
   ========================================================================== */

(function () {
  "use strict";

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validateEmail(email) {
    return emailRe.test(email);
  }

  function getPasswordStrength(p) {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return Math.min(s, 4);
  }

  // Simple deterministic hash (djb2) to avoid keeping plain passwords in localStorage
  function hashPass(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
    return (h >>> 0).toString(36);
  }

  // Helper check to see if Firebase is configured
  function isFirebaseConfigured() {
    const fb = window.FIREBASE_CONFIG;
    return !!(fb && fb.apiKey && !fb.apiKey.includes("PLACEHOLDER"));
  }

  let useCloudflareApi = false;
  const probePromise = (async () => {
    try {
      const res = await fetch("/api/auth?action=probe", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        useCloudflareApi = data.enabled === true;
        return useCloudflareApi;
      }
    } catch (e) {}
    return false;
  })();

  // Background session sync for Cloudflare to verify token and refresh purchases
  (async () => {
    const isCloudflare = await probePromise;
    if (isCloudflare) {
      const { store } = window.KRNL || {};
      const token = store ? store.get("krnl_token") : null;
      if (token) {
        try {
          const res = await fetch("/api/auth?action=sync", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token }
          });
          if (res.ok) {
            const data = await res.json();
            if (store) {
              store.set("user", data.user);
              store.set("purchased_courses", data.purchased || []);
            }
          } else {
            // Session expired
            if (store) {
              store.set("user", null);
              store.set("krnl_token", null);
              store.set("purchased_courses", []);
            }
          }
        } catch (e) {}
      }
    }
  })();

  let firebaseAuthInstance = null;
  let firebaseAuthModule = null;

  async function getFirebaseAuth() {
    if (firebaseAuthInstance) return firebaseAuthInstance;
    
    // Dynamically load the modules so we don't load external resources unless configuration is valid
    try {
      const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");
      firebaseAuthModule = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
      
      const app = initializeApp(window.FIREBASE_CONFIG);
      firebaseAuthInstance = firebaseAuthModule.getAuth(app);
      
      // Keep localStorage in sync with Firebase state changes to allow synchronous session checks
      firebaseAuthModule.onAuthStateChanged(firebaseAuthInstance, (user) => {
        const { store } = window.KRNL || {};
        if (store) {
          if (user) {
            const sessionUser = {
              name: user.displayName || user.email.split("@")[0],
              email: user.email,
              uid: user.uid,
              isFirebase: true
            };
            store.set("user", sessionUser);
            
            // Sync purchasing data for this specific Firebase UID
            const purchasesMap = store.get("firebase_purchases", {});
            const userPurchases = purchasesMap[user.uid] || [];
            store.set("purchased_courses", userPurchases);
          } else {
            // Null out session locally
            store.set("user", null);
            store.set("purchased_courses", []);
          }
        }
      });
      
      return firebaseAuthInstance;
    } catch (err) {
      console.error("Firebase module loading failed: ", err);
      return null;
    }
  }

  function checkSession() {
    const { store } = window.KRNL || {};
    if (!store) return null;
    return store.get("user");
  }

  function requireAuth() {
    const user = checkSession();
    if (!user) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `login.html?next=${returnUrl}`;
      return false;
    }
    return true;
  }

  // Unified Registration Interface
  async function register(email, password, name) {
    const { store } = window.KRNL || {};
    email = email.trim().toLowerCase();

    const isCloudflare = await probePromise;
    if (isCloudflare) {
      const res = await fetch("/api/auth?action=register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed.");
      if (store) {
        store.set("user", data.user);
        store.set("krnl_token", data.token);
        store.set("purchased_courses", data.purchased || []);
        store.set("membership_unlocked", false);
      }
      return data.user;
    }

    if (isFirebaseConfigured()) {
      const auth = await getFirebaseAuth();
      if (!auth) throw new Error("Authentication module load failure.");
      
      // Perform Firebase Auth registration
      const userCredential = await firebaseAuthModule.createUserWithEmailAndPassword(auth, email, password);
      // Update display name profile
      await firebaseAuthModule.updateProfile(userCredential.user, { displayName: name });
      
      const sessionUser = {
        name: name,
        email: email,
        uid: userCredential.user.uid,
        isFirebase: true
      };
      
      if (store) {
        store.set("user", sessionUser);
        store.set("purchased_courses", []);
        store.set("membership_unlocked", false);
      }
      return sessionUser;
    } else {
      // LocalStorage Mode registration
      const users = store ? store.get("krnl_users", []) : [];
      if (users.find(u => u.email === email)) {
        throw new Error("An account with this email already exists.");
      }

      const uid = "local_" + Math.random().toString(36).substring(2, 11);
      const newUser = {
        name,
        email,
        passwordHash: hashPass(password),
        joinedAt: Date.now(),
        uid,
        purchased: []
      };
      
      users.push(newUser);
      if (store) {
        store.set("krnl_users", users);
        store.set("user", { name, email, uid, joinedAt: newUser.joinedAt, isFirebase: false });
        store.set("purchased_courses", []);
        store.set("membership_unlocked", false);
      }
      return newUser;
    }
  }

  // Unified Sign In Interface
  async function login(email, password) {
    const { store } = window.KRNL || {};
    email = email.trim().toLowerCase();

    const isCloudflare = await probePromise;
    if (isCloudflare) {
      const res = await fetch("/api/auth?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed.");
      if (store) {
        store.set("user", data.user);
        store.set("krnl_token", data.token);
        store.set("purchased_courses", data.purchased || []);
      }
      return data.user;
    }

    if (isFirebaseConfigured()) {
      const auth = await getFirebaseAuth();
      if (!auth) throw new Error("Authentication module load failure.");

      const userCredential = await firebaseAuthModule.signInWithEmailAndPassword(auth, email, password);
      const name = userCredential.user.displayName || email.split("@")[0];
      
      const sessionUser = {
        name,
        email,
        uid: userCredential.user.uid,
        isFirebase: true
      };

      if (store) {
        store.set("user", sessionUser);
        // Sync purchases for this UID
        const purchasesMap = store.get("firebase_purchases", {});
        const userPurchases = purchasesMap[userCredential.user.uid] || [];
        store.set("purchased_courses", userPurchases);
      }
      return sessionUser;
    } else {
      // LocalStorage Mode sign in
      const users = store ? store.get("krnl_users", []) : [];
      const found = users.find(u => u.email === email);

      if (!found) {
        throw new Error("No account found with this email.");
      }
      if (found.passwordHash !== hashPass(password)) {
        throw new Error("Incorrect password.");
      }

      const sessionUser = {
        name: found.name,
        email: found.email,
        uid: found.uid || ("local_" + Math.random().toString(36).substring(2, 11)),
        joinedAt: found.joinedAt,
        isFirebase: false
      };

      if (store) {
        store.set("user", sessionUser);
        store.set("purchased_courses", found.purchased || []);
      }
      return sessionUser;
    }
  }

  // Unified Log Out Interface
  async function logout() {
    const { store, toast } = window.KRNL || {};
    
    const isCloudflare = await probePromise;
    if (isCloudflare) {
      const token = store ? store.get("krnl_token") : null;
      if (token) {
        await fetch("/api/auth?action=logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        }).catch(() => {});
      }
    } else if (isFirebaseConfigured()) {
      try {
        const auth = await getFirebaseAuth();
        if (auth) {
          await firebaseAuthModule.signOut(auth);
        }
      } catch (err) {
        console.error("Firebase SignOut error: ", err);
      }
    }

    if (store) {
      store.set("user", null);
      store.set("purchased_courses", []);
      store.set("krnl_token", null);
      store.set("membership_unlocked", false);
      store.set("billing_history", []);
    }

    if (toast) {
      toast("Logged out successfully", "success");
    }

    setTimeout(() => {
      window.location.href = "index.html";
    }, 800);
  }

  // Unified Profile Settings Modification
  async function updateProfileDetails(name, email) {
    const { store } = window.KRNL || {};
    const currentUser = checkSession();
    if (!currentUser) throw new Error("User session is inactive.");

    email = email.trim().toLowerCase();

    const isCloudflare = await probePromise;
    if (isCloudflare) {
      const token = store ? store.get("krnl_token") : null;
      const res = await fetch("/api/auth?action=update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile.");
      if (store) store.set("user", data.user);
      return data.user;
    }

    if (isFirebaseConfigured() && currentUser.isFirebase) {
      const auth = await getFirebaseAuth();
      if (!auth || !auth.currentUser) throw new Error("Firebase User state sync failure.");

      // update display name
      await firebaseAuthModule.updateProfile(auth.currentUser, { displayName: name });
      
      // Attempt to update email (might require reauthentication in production)
      try {
        if (auth.currentUser.email !== email) {
          await firebaseAuthModule.updateEmail(auth.currentUser, email);
        }
      } catch (e) {
        console.warn("Email could not be updated without recent login: ", e.message);
        throw new Error("Changing email requires logging in again.");
      }

      const updatedUser = { ...currentUser, name, email };
      if (store) store.set("user", updatedUser);
      return updatedUser;
    } else {
      // LocalStorage Mode profile update
      const users = store ? store.get("krnl_users", []) : [];
      const idx = users.findIndex(u => u.email === currentUser.email);
      if (idx !== -1) {
        users[idx].name = name;
        users[idx].email = email;
        if (store) store.set("krnl_users", users);
      }
      const updatedUser = { ...currentUser, name, email };
      if (store) store.set("user", updatedUser);
      return updatedUser;
    }
  }

  // Unified Password Change Interface
  async function updatePasswordDetails(oldPassword, newPassword) {
    const { store } = window.KRNL || {};
    const currentUser = checkSession();
    if (!currentUser) throw new Error("User session is inactive.");

    const isCloudflare = await probePromise;
    if (isCloudflare) {
      const token = store ? store.get("krnl_token") : null;
      const res = await fetch("/api/auth?action=update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, oldPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password.");
      return true;
    }

    if (isFirebaseConfigured() && currentUser.isFirebase) {
      const auth = await getFirebaseAuth();
      if (!auth || !auth.currentUser) throw new Error("Firebase User state sync failure.");

      // Reauthenticate user before password updates (Firebase rules)
      const cred = firebaseAuthModule.EmailAuthProvider.credential(currentUser.email, oldPassword);
      await firebaseAuthModule.reauthenticateWithCredential(auth.currentUser, cred);
      await firebaseAuthModule.updatePassword(auth.currentUser, newPassword);
      return true;
    } else {
      // LocalStorage Mode update
      const users = store ? store.get("krnl_users", []) : [];
      const idx = users.findIndex(u => u.email === currentUser.email);

      if (idx === -1 || users[idx].passwordHash !== hashPass(oldPassword)) {
        throw new Error("Current password is incorrect.");
      }

      users[idx].passwordHash = hashPass(newPassword);
      if (store) store.set("krnl_users", users);
      return true;
    }
  }

  // Unified Course Purchase Synchronization
  async function syncCoursePurchase(courseId) {
    const { store } = window.KRNL || {};
    const isCloudflare = await probePromise;
    if (isCloudflare) {
      const token = store ? store.get("krnl_token") : null;
      if (token) {
        const res = await fetch("/api/auth?action=add-purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, courseId })
        });
        const data = await res.json();
        if (res.ok && store) {
          store.set("purchased_courses", data.purchased || []);
        }
      }
    }
  }

  // Auto Boot Firebase state listeners on startup if configured
  if (isFirebaseConfigured()) {
    getFirebaseAuth();
  }

  // Expose on window.KRNLAuth
  window.KRNLAuth = {
    validateEmail,
    getPasswordStrength,
    checkSession,
    requireAuth,
    login,
    register,
    logout,
    updateProfileDetails,
    updatePasswordDetails,
    syncCoursePurchase,
    isFirebaseConfigured
  };
})();
