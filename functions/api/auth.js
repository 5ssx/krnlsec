/* ==========================================================================
   KRNLSec Mobile & Desktop Cloudflare authentication backend provider.
   Handles api calls for signing in, registering, updating, and buying.
   ========================================================================== */

async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password + "krnlsec_salt_9283");
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function makeResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "POST, OPTIONS"
    }
  });
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "POST, OPTIONS"
    }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  
  const db = env.KRNL_DB || env.DB || env.DATABASE;
  if (!db) {
    return makeResponse({ error: "Cloudflare KV Database binding (KRNL_DB) not configured in Pages Project settings." }, 500);
  }

  try {
    const body = await request.json().catch(() => ({}));
    
    if (action === "probe") {
      return makeResponse({ enabled: true });
    }
    
    if (action === "register") {
      const { email, password, name } = body;
      if (!email || !password || !name) {
        return makeResponse({ error: "Required fields missing." }, 400);
      }
      
      const cleanEmail = email.trim().toLowerCase();
      const existingUserRaw = await db.get("user:" + cleanEmail);
      if (existingUserRaw) {
        return makeResponse({ error: "An account with this email already exists." }, 400);
      }
      
      const pHash = await hashPassword(password);
      const uid = "cf_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
      
      const newUser = {
        name,
        email: cleanEmail,
        passwordHash: pHash,
        joinedAt: Date.now(),
        uid,
        purchased: []
      };
      
      await db.put("user:" + cleanEmail, JSON.stringify(newUser));
      
      // Issue session token
      const sessionToken = "token_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      await db.put("session:" + sessionToken, cleanEmail, { expirationTtl: 86400 * 7 }); // 7 days
      
      return makeResponse({
        user: { name, email: cleanEmail, uid, isFirebase: false, isCloudflare: true },
        token: sessionToken,
        purchased: []
      });
    }
    
    if (action === "login") {
      const { email, password } = body;
      if (!email || !password) {
        return makeResponse({ error: "Email and password required." }, 400);
      }
      
      const cleanEmail = email.trim().toLowerCase();
      const userRaw = await db.get("user:" + cleanEmail);
      if (!userRaw) {
        return makeResponse({ error: "Invalid email or password." }, 400);
      }
      
      const user = JSON.parse(userRaw);
      const pHash = await hashPassword(password);
      if (user.passwordHash !== pHash) {
        return makeResponse({ error: "Invalid email or password." }, 400);
      }
      
      // Issue session token
      const sessionToken = "token_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      await db.put("session:" + sessionToken, cleanEmail, { expirationTtl: 86400 * 7 });
      
      return makeResponse({
        user: { name: user.name, email: cleanEmail, uid: user.uid, isFirebase: false, isCloudflare: true },
        token: sessionToken,
        purchased: user.purchased || []
      });
    }
    
    // Authenticated endpoints require verification
    const token = request.headers.get("Authorization")?.replace("Bearer ", "") || body.token;
    if (!token) {
      return makeResponse({ error: "Unauthenticated. Missing token." }, 401);
    }
    
    const email = await db.get("session:" + token);
    if (!email) {
      return makeResponse({ error: "Session expired or invalid token." }, 401);
    }
    
    const userRaw = await db.get("user:" + email);
    if (!userRaw) {
      return makeResponse({ error: "User profile not found in KV." }, 404);
    }
    const user = JSON.parse(userRaw);
    
    if (action === "sync") {
      return makeResponse({
        user: { name: user.name, email: user.email, uid: user.uid, isFirebase: false, isCloudflare: true },
        purchased: user.purchased || []
      });
    }
    
    if (action === "update-profile") {
      const { name: newName, email: newEmail } = body;
      if (!newName || !newEmail) return makeResponse({ error: "Required fields missing." }, 400);
      
      const cleanNewEmail = newEmail.trim().toLowerCase();
      
      if (cleanNewEmail !== email) {
        const collision = await db.get("user:" + cleanNewEmail);
        if (collision) return makeResponse({ error: "Email is already taken by another account." }, 400);
        
        user.name = newName;
        user.email = cleanNewEmail;
        await db.put("user:" + cleanNewEmail, JSON.stringify(user));
        await db.delete("user:" + email);
        
        // Update session mapping
        await db.put("session:" + token, cleanNewEmail, { expirationTtl: 86400 * 7 });
      } else {
        user.name = newName;
        await db.put("user:" + email, JSON.stringify(user));
      }
      
      return makeResponse({
        user: { name: user.name, email: user.email, uid: user.uid, isFirebase: false, isCloudflare: true }
      });
    }
    
    if (action === "update-password") {
      const { oldPassword, newPassword } = body;
      if (!oldPassword || !newPassword || newPassword.length < 8) {
        return makeResponse({ error: "Invalid password details." }, 400);
      }
      
      const oldHash = await hashPassword(oldPassword);
      if (user.passwordHash !== oldHash) {
        return makeResponse({ error: "Current password is incorrect." }, 400);
      }
      
      user.passwordHash = await hashPassword(newPassword);
      await db.put("user:" + email, JSON.stringify(user));
      return makeResponse({ success: true });
    }
    
    if (action === "add-purchase") {
      const { courseId } = body;
      if (!courseId) return makeResponse({ error: "Missing course" }, 400);
      
      user.purchased = user.purchased || [];
      if (!user.purchased.includes(courseId)) {
        user.purchased.push(courseId);
        await db.put("user:" + email, JSON.stringify(user));
      }
      return makeResponse({ purchased: user.purchased });
    }
    
    if (action === "logout") {
      await db.delete("session:" + token);
      return makeResponse({ success: true });
    }
    
    return makeResponse({ error: "Action not found." }, 404);
  } catch (err) {
    return makeResponse({ error: "Internal Server Error: " + err.message }, 500);
  }
}
