# InterviewIQ — Developer Notes

> Internal reference for engineers working on this codebase.
> Covers architecture decisions, common pitfalls, interview prep, and phase connections.

---

## 1. Why this architecture was chosen

**`app.js` vs `server.js` split**
Express app config lives in `app.js`, port binding in `server.js`. This lets you `import app` in test suites without starting a real server. It's the pattern used by most production Node teams.

**ESM (`"type": "module"`)**
Both packages use native ES modules. It removes the CommonJS/ESM interop headaches that come up when integrating OpenAI or other modern SDKs in later phases.

**Zustand over Redux**
Zustand has no boilerplate, is tree-shakable, and scales well to complex state. The `useAuthStore` is already wired in so Phase 2 just fills in the real setters.

**React Router v7 Data Router API**
`createBrowserRouter` enables loader/action patterns for data fetching at the route level. Switching from the old `<BrowserRouter>` to this later would be a painful refactor; starting here is free.

**Tailwind v4 via Vite plugin**
No `tailwind.config.js` needed. The `@import "tailwindcss"` directive in `index.css` is the v4 way. It scans your JSX automatically.

---

## 2. Important design decisions

| Decision | Reason |
|---|---|
| Body size limit `10kb` | Mitigates payload-based DoS attacks |
| `CORS origin` from env var | Forces correct per-environment config; prevents wildcard in production |
| Rate limiter on `/api` prefix only | Doesn't affect static file serving or health checks from internal load balancers |
| `standardHeaders: true` in rate limiter | Uses the standardized `RateLimit-*` headers instead of deprecated `X-RateLimit-*` |
| `morgan('combined')` in production | Apache-style log format is compatible with log aggregators like Datadog and CloudWatch |
| Error handler gates stack trace on `NODE_ENV` | Prevents leaking implementation details to clients in production |
| `connectDB()` called in `server.js`, not `app.js` | Keeps transport and data layers decoupled; `app.js` stays importable in tests |
| `withCredentials: true` in Axios | Required for httpOnly cookie transmission cross-origin (needed for Phase 2 JWT auth) |

---

## 3. Common beginner mistakes in this phase

**1. Forgetting `"type": "module"`**
Without it, `import` syntax throws a `SyntaxError` in Node. Don't mix `require()` and `import` — pick one and stay consistent.

**2. Putting DB connection in `app.js`**
It couples application startup to the transport layer. Always initiate the DB connection from `server.js` after environment variables are loaded.

**3. Using `express.json()` without a size limit**
Without `{ limit: "10kb" }`, clients can send arbitrarily large payloads. This is a trivial DoS vector.

**4. CORS wildcard in production**
`origin: "*"` disables cookie-based auth entirely. Using `process.env.CLIENT_URL` forces the correct value to be set per environment.

**5. Registering error middleware in the wrong order**
Express identifies 4-parameter functions `(err, req, res, next)` as error handlers. If you register it before your routes, it never fires for route errors. It must be last.

**6. Committing `.env` files**
`.env` is in `.gitignore`. Never commit real credentials. Use `.env.example` as the contract.

**7. Hardcoding API URLs in the frontend**
The Vite proxy (`/api` → `localhost:5000`) handles dev routing. In production, `VITE_API_URL` takes over. Never hardcode `localhost` in component files.

---

## 4. Possible improvements

- **Add a root `package.json`** with `concurrently` to start both client and server with a single `npm run dev` from the project root.
- **Add a `.nvmrc` or `engines` field** to pin the Node version and avoid environment drift across machines.
- **Switch to `pino` for logging** instead of Morgan in production — structured JSON logs are far easier to query in log aggregators.
- **Add a `nodemon.json`** to the server to configure watch paths and ignore patterns explicitly.
- **Add `helmet` CSP configuration** — the default Helmet setup is good, but a custom Content-Security-Policy tightens it further.
- **Add a `/api/v1` prefix** to routes now, before Phase 2 adds more routes. Versioning after the fact requires coordination with all consumers.

---

## 5. Interview questions about this implementation

**Architecture**
- Why separate `app.js` from `server.js`?
  *(Testability — you can import the app without binding a port.)*
- Why is the error handler registered last?
  *(Express identifies 4-param middleware as error handlers; anything before it calls `next(err)` to reach it.)*
- What problem does `connectDB()` exiting with `process.exit(1)` on failure solve?
  *(Prevents the server from running in a broken state with no database — a silent failure would be worse.)*

**Security**
- What does Helmet actually do?
  *(Sets ~14 security-related HTTP headers including `X-Frame-Options`, `X-Content-Type-Options`, and HSTS.)*
- Why do we limit request body size in `express.json()`?
  *(Prevents payload-based DoS — an attacker could send a 500MB body and exhaust memory.)*
- What's `standardHeaders: true` in the rate limiter?
  *(Returns rate limit info in the standardized `RateLimit-*` headers instead of the legacy `X-RateLimit-*`.)*

**Frontend**
- Why use `createBrowserRouter` instead of `<BrowserRouter>`?
  *(Enables the Data Router API — loaders, actions, and deferred data — without a future refactor.)*
- Why is `withCredentials: true` set in Axios even though there's no auth yet?
  *(Sets the foundation so Phase 2 JWT httpOnly cookies work without changing every request.)*
- How does Tailwind v4 differ from v3 configuration-wise?
  *(No `tailwind.config.js` needed — it uses a Vite plugin and the `@import "tailwindcss"` CSS directive.)*

---

## 6. Files to study first

| Order | File | Why |
|---|---|---|
| 1 | `server/server.js` | Understand the startup sequence: env → DB → HTTP |
| 2 | `server/src/app.js` | All middleware in one place; order matters |
| 3 | `server/src/middleware/errorHandler.js` | The pattern every Express error flows through |
| 4 | `server/src/config/db.js` | MongoDB connection — only 20 lines but critical |
| 5 | `client/src/router/index.jsx` | All routes in one file; where protected routes will go |
| 6 | `client/src/store/useAuthStore.js` | The global state shape for Phase 2 auth |
| 7 | `client/src/App.jsx` | Provider composition pattern — this grows in future phases |
| 8 | `client/src/lib/axios.js` | Shared HTTP client — interceptors will be added in Phase 2 |

---

## 7. How Phase 1 connects to Phase 2

Phase 2 is authentication (JWT + httpOnly cookies). Here's exactly where it plugs in, with zero structural changes needed:

| What to add | Where it goes |
|---|---|
| `authRoutes.js` (register, login, logout, me) | `server/src/routes/` |
| `authController.js` | `server/src/controllers/` |
| `protect.js` (JWT verification middleware) | `server/src/middleware/` |
| `User` model | `server/src/models/` *(new folder)* |
| Register/Login forms using React Hook Form | `client/src/pages/LoginPage.jsx`, `RegisterPage.jsx` |
| Real `setUser` / `clearUser` implementations | `client/src/store/useAuthStore.js` |
| `ProtectedRoute` wrapper component | `client/src/router/index.jsx` |
| Axios response interceptor for 401 handling | `client/src/lib/axios.js` |

Nothing in Phase 1 needs to be moved or renamed to accommodate Phase 2.
