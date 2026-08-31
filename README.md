# InterviewIQ

**InterviewIQ** is a full-stack AI-powered mock interview platform that helps job seekers prepare smarter. Upload your resume, get an AI-generated analysis of your strengths and weaknesses, then sit down for a fully personalized mock interview — questions are generated on the fly by Google Gemini, tailored to your resume, target role, and chosen difficulty. Every session is saved so you can track your progress over time.

---

## What It Does

The platform walks a user through a four-stage preparation flow:

1. **Upload a Resume** — PDF or DOCX, up to 5 MB. The server extracts the raw text immediately and stores it in the database so no re-downloading is needed later.

2. **AI Resume Analysis** — Gemini reads your resume text and returns a structured JSON report: an overall score, an ATS compatibility score, strengths, weaknesses, missing keywords, recommended skills, and a prioritized action plan.

3. **Mock Interview** — You pick the interview type (technical, behavioral, HR, or mixed), difficulty (easy, medium, hard), target role, and number of questions (5–20). Gemini generates a personalized set of questions — it looks at your resume's actual projects, probes the weaknesses the analysis flagged, and follows type-specific distribution rules. Answers are autosaved every 10 seconds with a `navigator.sendBeacon` fallback on tab close.

4. **Dashboard & History** — A Recharts-powered dashboard aggregates your practice statistics using real MongoDB aggregation pipelines: total sessions, questions answered, practice time, a per-day activity chart, and a current/longest streak tracker.

---

## Tech Stack

### Backend

| Concern | Technology |
|---|---|
| Runtime | Node.js with native ESM (`"type": "module"`) |
| Framework | Express 5 |
| Database | MongoDB via Mongoose 9 |
| Authentication | JSON Web Tokens + httpOnly cookies |
| Password Hashing | bcryptjs (12 salt rounds) |
| File Uploads | Multer (memory storage — no disk writes) |
| File Storage | Cloudinary SDK v2 |
| AI / LLM | Google Gemini (`@google/generative-ai`) |
| PDF Parsing | pdf-parse |
| DOCX Parsing | mammoth |
| Security | helmet, cors, express-rate-limit |
| Validation | express-validator |
| Logging | morgan |

### Frontend

| Concern | Technology |
|---|---|
| Framework | React 19 + Vite 8 |
| Routing | React Router v7 |
| State Management | Zustand v5 |
| Forms | React Hook Form v7 |
| HTTP Client | Axios |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Toasts | React Hot Toast |
| Charts | Recharts |

---

## Architecture Overview

```
InterviewIQ/
├── client/          React SPA (Vite)
│   ├── src/
│   │   ├── pages/           Route-level page components
│   │   ├── components/      Reusable UI and feature components
│   │   ├── store/           Zustand state stores (7 domain slices)
│   │   ├── hooks/           Custom React hooks
│   │   ├── lib/             Axios instance, format utilities
│   │   └── router/          React Router config with route guards
│
└── server/          Node.js REST API (Express)
    └── src/
        ├── routes/          Express routers (auth, resume, interview, dashboard, user)
        ├── controllers/     HTTP layer — reads req, calls services, writes res
        ├── services/        Business logic (resume, analysis, interview, dashboard, AI)
        ├── models/          Mongoose schemas (User, Resume, ResumeAnalysis, InterviewSession, ResumeHistory)
        ├── middleware/       protect (auth guard), upload (multer), rateLimiter, errorHandler
        ├── prompts/         Gemini prompt templates (separated from logic)
        ├── config/          Gemini client factory, Cloudinary config, DB connection
        └── utils/           JWT helpers, cookie helpers, text extraction
```

The client and server are fully decoupled. In development, Vite's proxy forwards `/api` requests to `localhost:5000`. In production, `VITE_API_URL` points to the deployed API.

---

## API Reference

All routes are prefixed `/api`.

### Auth
```
POST   /api/auth/register       Create account, set JWT cookie
POST   /api/auth/login          Validate credentials, set JWT cookie
POST   /api/auth/logout         Clear JWT cookie
GET    /api/auth/me             Get current user (protected)
```

### Resume
```
GET    /api/resume              Get active resume metadata
POST   /api/resume/upload       Upload first resume
PUT    /api/resume/replace      Replace existing resume
DELETE /api/resume              Delete resume and Cloudinary asset
POST   /api/resume/analyze      Trigger Gemini analysis
GET    /api/resume/analysis     Get stored analysis (no re-run)
GET    /api/resume/history      Last 5 upload history entries
```

### Interviews
```
POST   /api/interviews                     Create session (draft status)
GET    /api/interviews                     List all sessions
GET    /api/interviews/:id                 Get session detail
PATCH  /api/interviews/:id                 Update status
DELETE /api/interviews/:id                 Delete session
POST   /api/interviews/:id/start           Generate AI questions → in_progress
POST   /api/interviews/:id/save-answer     Upsert answer, recalculate progress
PATCH  /api/interviews/:id/progress        Update question cursor (navigation)
GET    /api/interviews/:id/current         Session + currentQuestion convenience field
POST   /api/interviews/:id/complete        Explicitly finish (supports partial completion)
GET    /api/interviews/:id/summary         Completion stats + per-question breakdown
```

### Dashboard
```
GET    /api/dashboard/overview             Aggregate lifetime stats
GET    /api/dashboard/activity?range=7d    Per-day activity (7d / 30d / 90d)
GET    /api/dashboard/recent-interviews    Last 5 sessions
GET    /api/dashboard/progress             Streaks and progression
```

### Users
```
GET    /api/users/profile       Get user profile
PATCH  /api/users/profile       Update name / targetRole
```

---

## Data Models

### User
Stores name, email (unique, lowercased), password (`select: false` — excluded from queries by default, hashed by a pre-save hook at 12 bcrypt rounds), avatar, targetRole, and isVerified. A `toJSON` transform always strips the password hash and `__v` from any serialized document.

### Resume
One document per user. Beyond the file metadata (name, MIME type, size, Cloudinary `publicId`, `secureUrl`), it stores **`parsedText`** — the plain text extracted from the file at upload time. This is the key design decision: analysis and interview question generation both read from this field, so they never need to re-download the file from Cloudinary.

### ResumeAnalysis
One document per user (upserted on re-run). Contains: `overallScore`, `atsScore` (both 0–100), `strengths`, `weaknesses`, `missingKeywords`, `recommendedSkills`, `projectSuggestions`, `experienceSuggestions`, `educationSuggestions`, `grammarSuggestions`, `formattingSuggestions`, and an `actionPlan` array with `priority`, `action`, and `rationale` fields. Stores a `resumeRef` snapshot — used by the client to detect whether the analysis is stale relative to the current resume.

### InterviewSession
The most complex model. Embeds two sub-document arrays:

- **`questions[]`** — set once when the session starts. Each entry has `questionId`, `question`, `type`, `difficulty`, `topic`, `expectedSkills`, and `tips`.
- **`answers[]`** — sparse, written incrementally. Keyed by `questionId`.

The session follows a formal state machine: `draft → in_progress → completed | abandoned`. Progress (0–100%) is recalculated on every answer save. Completion stats (`answeredQuestions`, `skippedQuestions`, `totalDuration`) are computed at finish time.

Two composite indexes optimize the common access patterns: `(user, createdAt desc)` for the list view, and a partial index on `(user, status)` filtered to only `draft` and `in_progress` sessions for active-session lookups.

### ResumeHistory
Lightweight snapshots of each upload (filename, MIME, size, Cloudinary URL, timestamp). Many per user. Does not store `parsedText` — keeps the collection lean.

---

## Authentication Flow

The app uses stateless JWT authentication delivered via httpOnly cookies — no tokens in localStorage, which protects against XSS.

1. On register or login, the server creates a JWT containing only the user's MongoDB `_id`, signs it with `JWT_SECRET`, and sets it as an httpOnly, SameSite=lax cookie (Secure flag in production).
2. Every request from the browser automatically includes this cookie (Axios is configured with `withCredentials: true`).
3. The `protect` middleware reads the cookie first, then falls back to a `Bearer` token in the `Authorization` header (for API clients or mobile). It always re-fetches the user from MongoDB to catch deleted accounts.
4. On page load, the client calls `GET /api/auth/me`. A dedicated `authLoading` flag in Zustand holds the route guards at a spinner while this resolves — this prevents authenticated users from seeing a flash-redirect to `/login` on hard refresh.

---

## AI Integration — How Gemini Is Used

### The AI Service Layer

All Gemini communication goes through a single `generateContent(prompt, options)` function in `ai.service.js`. This wrapper handles:

- A configurable timeout (default 30s, 60s for larger requests) via `AbortController`
- Rate limit responses (HTTP 429 from Google) → 429 to the client
- Auth errors from Google → 503 to the client
- Timeouts → 504
- Generic network failures → 502

Every AI-powered feature in the app calls this one function. Adding a new AI feature means writing a prompt template and calling `generateContent` — the transport, timeout, and error normalization are inherited automatically.

### Prompt Architecture

Prompts live in `server/src/prompts/`. They are pure functions that take data and return a string. Business logic never needs to change when prompt wording is updated.

**Resume Analysis Prompt** asks Gemini to act as a senior technical recruiter reviewing a resume and return a single JSON object with scores, categorized suggestions, and a prioritized action plan. The response parser (`ai.validation.js`) strips any markdown code fences the model occasionally adds, JSON-parses the result, clamps scores to 0–100, and coerces all array fields to string arrays.

**Interview Questions Prompt** is highly contextual. It injects:
- The user's resume text (truncated to 3000 characters)
- The top 3 strengths and weaknesses from the resume analysis
- The top 5 recommended skills
- The target role, interview type, difficulty, and question count

Type-specific distribution rules are embedded in the prompt (e.g., a "mixed" interview is 40% technical, 30% behavioral, 20% project, 10% HR). Personalization rules instruct the model to reference specific projects, probe the weaknesses flagged by the analysis, and avoid yes/no questions. The response validator guarantees the output array contains exactly the requested number of well-formed question objects.

---

## Resume Upload & File Handling

The upload pipeline uses multer with `memoryStorage` — files land in `req.file.buffer` and never touch the server's filesystem. This is critical for containerized environments.

File validation runs at three layers (defence in depth, because MIME types can be spoofed):
1. **Multer fileFilter** — rejects non-PDF/DOCX at stream time
2. **Multer size limit** — rejects files over 5 MB before they're fully buffered
3. **Service-level validation** — re-checks MIME type, extension, and size before proceeding

Text is extracted from the buffer using `pdf-parse` (PDF) or `mammoth` (DOCX). If fewer than 50 characters are extracted — indicating a scanned image or blank file — the upload is rejected with a clear error message.

Cloudinary uploads use a deterministic `publicId` equal to the user's MongoDB `_id`. This means each user occupies exactly one Cloudinary slot. Replacements use `overwrite: true` — no orphaned assets accumulate. A legacy guard detects and cleans up any stored documents where the `publicId` differs (possible with older data).

---

## Frontend State Management

The client uses Zustand v5 with seven domain stores, each owning a slice of application state:

| Store | Responsibility |
|---|---|
| `useAuthStore` | User identity, login/logout, initial session check |
| `useResumeStore` | Resume upload (with progress %), replacement, deletion, history |
| `useAnalysisStore` | Resume analysis fetch, re-run trigger, staleness detection |
| `useInterviewStore` | Full interview session lifecycle — create, start, answer, complete |
| `useDashboardStore` | Four independent data slices, each with its own loading/error state |
| `useProfileStore` | Profile edit form state |
| `useThemeStore` | Light/dark/system theme, persisted to localStorage, real-time MQL listener |

**Staleness detection**: The `useAnalysisStore` compares `resume.uploadedAt` with `analysis.analysedAt`. If the resume was uploaded after the last analysis was run, the UI shows an "analysis is out of date" warning.

**Dashboard resilience**: `fetchAll()` uses `Promise.allSettled` instead of `Promise.all`, so a failing API endpoint degrades only its own section — the rest of the dashboard renders normally.

**Theme system**: `useThemeStore` registers a `MediaQueryList` listener once at store creation. When the user selects "system", the app follows the OS preference in real time. An inline script in `index.html` applies the theme class before first render to eliminate any flash of wrong theme.

---

## Interview Session Page — Technical Details

`InterviewSessionPage` is the most technically involved component. It implements:

- **Elapsed timer** — a custom `useElapsedTimer` hook that pauses when the tab is hidden (Page Visibility API)
- **Autosave** — `setInterval` every 10 seconds, fires only if the current answer has changed since the last save
- **`beforeunload` beacon** — `navigator.sendBeacon` sends the current answer as a last-chance save when the tab is closed (bypasses the async Axios instance, which is cancelled on unload)
- **Navigation cursor** — `PATCH /progress` is fire-and-forget; a failed navigation update never blocks the user
- **Keyboard shortcuts** — Alt+→ (next question), Alt+← (previous question), Ctrl+S (manual save)
- **Visual nav grid** — dots showing answered / unanswered / current status for every question
- **Confirmation modals** — both "exit" and "finish early" actions require confirmation
- **Session recovery** — on mount, if `status === "draft"` the user is redirected back to the lobby; if `"completed"`, to the summary page

---

## Security Practices

- `helmet()` sets the full suite of security-related HTTP headers
- CORS is restricted to `CLIENT_URL` — no wildcard origins
- JWT is stored in an httpOnly, SameSite=lax cookie — inaccessible to JavaScript
- Login errors are deliberately vague to prevent user enumeration
- `password` has `select: false` on the schema, and the `toJSON` transform adds a second layer of protection so the hash never appears in API responses even if the select guard is accidentally omitted
- Request bodies are capped at 10 KB to prevent payload-based attacks
- File validation runs at three independent layers
- Rate limiting: 100 requests per 15-minute window per IP across all `/api` routes
- Stack traces are only included in error responses in the development environment

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- A Cloudinary account (free tier works)
- A Google Gemini API key

### Server

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

### Client

```bash
cd client
npm install
cp .env.example .env
# VITE_API_URL can be left empty in development (Vite proxy handles /api)
npm run dev
```

### Environment Variables

**Server (`server/.env`)**

```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/interviewiq
CLIENT_URL=http://localhost:5173
JWT_SECRET=<long random string>
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=<your cloud name>
CLOUDINARY_API_KEY=<your api key>
CLOUDINARY_API_SECRET=<your api secret>
GEMINI_API_KEY=<your gemini api key>
GEMINI_MODEL=gemini-1.5-flash
```

**Client (`client/.env`)**

```
VITE_API_URL=          # leave empty in development
VITE_APP_NAME=InterviewIQ
```

---

## Project Highlights for Interviewers

A few design decisions worth calling out specifically:

**Parsed text is stored at upload time, not query time.** When a resume is uploaded, the server extracts the plain text from the PDF/DOCX buffer and persists it on the Resume document. Every downstream feature — analysis, question generation — reads from the database. No Cloudinary download, no file parsing at query time. One extraction, used everywhere.

**The AI service layer is a pure transport wrapper.** `ai.service.js` handles one thing: sending a prompt to Gemini and returning text. All error handling (timeouts, rate limits, auth failures) is normalized here. Adding a new AI feature means writing a prompt and calling `generateContent` — the transport never changes.

**Prompts are separated from business logic.** All Gemini prompts live in `src/prompts/`. They are plain functions that take data and return a string. Prompt wording can be iterated without touching any service or controller file.

**The interview session is a formal state machine.** A session moves through `draft → in_progress → completed | abandoned` with explicit, validated transitions. Invalid transitions (e.g., completing an already-completed session) are rejected with a clear error. This prevents data corruption from double-submissions or stale UI state.

**The `/start` endpoint is idempotent.** If a session is already `in_progress` and has questions, it returns immediately without calling Gemini. Page refreshes and double-clicks never result in duplicate billing.

**`authLoading` prevents flash-redirects.** There are two distinct loading states on the auth store: `authLoading` (true until the initial session check on app mount resolves) and `loading` (true during form submissions). Route guards hold at a spinner during `authLoading` — this is what prevents an authenticated user from briefly seeing the login page on a hard refresh before the cookie is validated.

---

## Roadmap

- **AI answer scoring** — Phase 9 placeholder is in place: the summary endpoint already returns a `questionBreakdown` array with an `answered` flag per question; `overallScore` and `evaluationReady` fields are stubbed for the feedback layer
- **Email verification** — `isVerified` field exists on the User schema, flow not yet wired
- **Avatar upload** — `avatar` field on User schema, Cloudinary integration ready, UI not yet built
- **ReportsPage** — route is registered, implementation pending
