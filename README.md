# Flames Quiz — Vercel Deployment Notes

Quick steps to deploy this Next.js app on Vercel and enable server-side Firebase Admin access.

1) Add environment variables in Vercel Dashboard (Project → Settings → Environment Variables):

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

Server-side Admin (required for SSR/API routes):

- `FIREBASE_PROJECT_ID` (same as projectId)
- `FIREBASE_CLIENT_EMAIL` (from service account)
- `FIREBASE_PRIVATE_KEY` (private key JSON value with newlines replaced by `\n`)

2) Build & Deploy:

Vercel will run `npm run build` automatically. The app uses a server-side Firebase Admin initializer in `src/lib/firebaseAdmin.js` and an API route at `/api/quizzes/[id]`.

3) Local development:

Copy `.env.example` to `.env.local` and fill values. For local Admin use, set `FIREBASE_PRIVATE_KEY` with `\n`-escaped newlines.

4) Additional notes:

- The project stubs `undici` during build to avoid bundling Node-only code. This is handled in `next.config.js`.
- Client-side Firebase usage remains for realtime features; Admin is used for SSR and secure server APIs.

🔥 FLAMES QUIZ: MASTER ARCHITECTURAL BLUEPRINT (v2.0)Role: Senior Frontend Architect & UI/UX DesignerObjective: Migrate "Flames Quiz" from a static HTML prototype to a scalable, modular Next.js 14+ (App Router) SaaS platform.Tech Stack: Next.js, Tailwind CSS, Firebase (Auth/Firestore), KaTeX (Math), Framer Motion (optional), Lucide React.1. 🎨 VISUAL DESIGN SYSTEM: "THE SLOW BURN LIQUID AURORA"The application must feel organic, premium, and alive. It is not a flat web page; it is a window into a cosmic void.A. Global Atmosphere (The Background)Canvas: bg-slate-950 (Hex: #020617). A deep, near-black void.The Aurora (Living Background):Concept: Four massive, glowing orbs floating in an infinite, slow-motion dance behind the UI.Colors:Orb 1: bg-red-600 (The Core)Orb 2: bg-orange-500 (The Heat)Orb 3: bg-purple-700 (The Mystery)Orb 4: bg-yellow-600 (The Spark)Physics: blur-[120px]. This is critical. They must not look like circles; they must look like diffusing light.Animation: Custom @keyframes blob translating X/Y and scaling up/down over 25 seconds infinite alternate.B. The "Glass" Component StandardAll UI containers (Cards, Modals, Dashboards) must strictly adhere to this Glassmorphism spec:Surface: bg-slate-900/40 (Dark slate, 40% opacity).Texture: backdrop-blur-md (12px blur).Edge: border border-white/10 (Subtle 1px frost line).Depth: shadow-xl.Shape: rounded-2xl (Modern, friendly geometry).C. Typography & IconographyFont: Sans-serif (Inter or System).Math/Science: Must use KaTeX for rendering $$E=mc^2$$. Serif font for equations.Icons: Lucide-React. Thin strokes (stroke-width={2}), sized 16px to 24px.2. 🧠 CORE LOGIC & DATA FLOWA. Authentication & User RolesThe app is a SaaS platform. Users have distinct roles.Database: Firebase Firestore.Collection: users/{uid}.Fields:email: stringdisplayName: string (Nickname)isCreator: boolean (Default: false)stats: Object { totalQuizzes, totalScore, categoryWins: {} }nicknameSetAt: Timestamp (Used for 30-day lock).Logic:Admin Override: Email kingflames200717@gmail.com is hardcoded to always have Creator/Admin access.Guest Access: Supported via signInAnonymously. Guests can play but data is local-session based unless they link accounts.Creator Upgrade: A "Become Creator" button triggers a Mock Paystack modal. On success, isCreator becomes true.B. The Quiz Engine (Gameplay)State Machine: Start -> Playing -> Result.Timer: A circular SVG progress ring. Colors shift: Blue (safe) -> Yellow (warn) -> Red (critical). Throbbing effect when < 10s.Modes:Study Mode: Instant feedback. Clicking an option reveals Green/Red state + Explanation (R: field).Test Mode: Silent selection (Orange border). No answers shown until the end.Submission:Anti-Double-Submit: Use a local state lock (isSubmitting) to prevent multiple writes.Atomic Updates: Use increment(1) for updating User Stats to avoid race conditions.C. The Quiz Creator (Parser)Input: A raw text area for high-speed creation.Syntax:Q: Question text here (supports LaTeX like $x^2$)
A: Option A
B: Option B ##  <-- '##' marks correct answer
C: Option C
R: Explanation (optional)
Parsing Logic: Regex to split by \n\n, identify keys (Q:, A:, ##), and construct a JSON object.3. 🏗️ NEXT.JS FILE ARCHITECTURE (App Router)This specific structure ensures Dynamic Link Previews work (critical for WhatsApp sharing)./flames-quiz-next
 ├── package.json
  ├── next.config.js
   ├── tailwind.config.js
    ├── .env.local                  # Stores FIREBASE_API_KEY, ADMIN_EMAIL
     └── src
           ├── lib
                 │    └── firebase.js       # Firebase Initialization (Singleton)
                       ├── context
                             │    └── AuthContext.js    # Global User State & Stats Listener
                                   ├── components
                                         │    ├── ui
                                               │    │    ├── Shared.js    # Export GlassCard, Button
                                                     │    │    └── Loading.js   # Export LoaderRing
                                                           │    ├── utils
                                                                 │    │    └── Helpers.js   # parseQuiz, formatTime, LatexText
                                                                       │    ├── GameEngine.js     # The Playable Quiz Component
                                                                             │    ├── GameWrapper.js    # Handles Nickname check -> Starts Engine
                                                                                   │    ├── QuizCreator.js    # The Admin Dashboard Tool
                                                                                         │    ├── ResultView.js     # The Downloadable Score Card
                                                                                               │    ├── PerformanceCard.js# The 16:9 Profile Card (Hidden/Downloadable)
                                                                                                     │    └── NicknameModal.js  # The 30-Day Lock Logic
                                                                                                                                                                                                                                                                                                                                                                                                                                                └── app
                                                                                                                                                                                                                                                                                                                                                                  ├── layout.js         # <Head> (KaTeX), AuthProvider, Background
                                                                                                                                                                                                                                                                                                                                                                                                      ├── page.js           # Landing Page (Hero)
                                                                                                                                                                                                                                                                                                                                                                                                                                     ├── globals.css       # Tailwind Imports & Keyframes
                                                                                                                                                                                                                                                                                                                                                                                                                                                                        ├── dashboard
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       │    └── page.js      # Main App Hub (Library | Creator | Profile)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          ├── profile
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         │    └── page.js      # Dedicated User Stats Page
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            └── quiz
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            └── [id]
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         └── page.js # SERVER COMPONENT (Fetches Meta Tags)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         Critical Implementation Notes for Copilot:Dynamic Metadata: src/app/quiz/[id]/page.js MUST be an async Server Component. It fetches the quiz title from Firestore generateMetadata so that social bots (WhatsApp/Twitter) can scrape the title and description. It then passes data to the client-side GameWrapper.No "White Screen" on Refresh: AuthContext must handle the loading state correctly. Do not render children until Firebase onAuthStateChanged resolves.Mobile Viewport: Use min-h-[100dvh] for the Game Engine container to prevent mobile browser address bars from covering the "Next" button.>

## Updates (added Jan 05, 2026)

- Flames Quiz review & verification (Jan 05, 2026):
      - Inspected deployment config and Firebase integrations.
      - Ran smoke requests against the Vercel deployment; discovered Vercel Authentication protection is enabled (returns HTTP 401 interstitial).
      - Identified required environment variables:
            - Client (browser): NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, NEXT_PUBLIC_FIREBASE_APP_ID, NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
            - Server/Admin: FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_PROJECT_ID (note: `FIREBASE_PRIVATE_KEY` may contain escaped `\\n` and must be stored accordingly)
      - Confirmed server API uses `firebase-admin` and Firestore path conventions under `artifacts/flames_quiz_app/public/data/*`.
      - Recommendation: set env vars in Vercel (or disable deployment protection) to allow public access and server-side admin SDK usage.

If you want me to append more details or automate setting Vercel env vars via the Vercel CLI, tell me and I will prepare the commands.