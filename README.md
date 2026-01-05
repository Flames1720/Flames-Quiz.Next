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
