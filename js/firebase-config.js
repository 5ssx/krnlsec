/* ==========================================================================
   KRNLSec — Firebase Credentials Configuration
   ========================================================================== 
   To enable real production authentication on Cloudflare, follow these steps:
   
   1. Register/Login at https://console.firebase.google.com/
   2. Create a project named "KRNLSec".
   3. In the left menu, select Build -> Authentication. Click "Get Started", 
      and enable the "Email/Password" sign-in method.
   4. Go back to Project Overview (click the Home/Gear icon), select "</>" (Web)
      to register a web app.
   5. Copy the config properties from the code snippet provided and paste them below.
   ========================================================================== */

window.FIREBASE_CONFIG = {
  apiKey: "PLACEHOLDER_API_KEY",
  authDomain: "PLACEHOLDER_AUTH_DOMAIN",
  projectId: "PLACEHOLDER_PROJECT_ID",
  storageBucket: "PLACEHOLDER_STORAGE_BUCKET",
  messagingSenderId: "PLACEHOLDER_MESSAGING_SENDER_ID",
  appId: "PLACEHOLDER_APP_ID"
};
