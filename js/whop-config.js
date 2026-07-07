/* ==========================================================================
   KRNLSec — Whop Payment Link Configuration
   =========================================================================
   Your real Whop checkout link is set below.

   POST-PAYMENT REDIRECT SETUP:
   In your Whop dashboard go to:
     Company Settings → After Purchase → Redirect URL
   Set it to (replace with your real domain when deployed):
     https://YOUR-DOMAIN/dashboard.html?whop_success=true&course_id=z2h

   While testing on localhost, after completing the Whop checkout navigate
   manually to: http://localhost:3000/dashboard.html?whop_success=true&course_id=z2h
   ========================================================================== */

window.WHOP_CONFIG = {

  courses: {
    // Zero to Hero in Cybersecurity — test link provided by user
    "z2h": "https://whop.com/checkout/plan_YRssNYIIm1Oga/?session=ch_XPY3vYsXFQI6Rz7",
  },

  siteUrl: window.location.origin + "/",
};
