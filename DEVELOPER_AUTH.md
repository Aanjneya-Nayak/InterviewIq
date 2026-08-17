# InterviewIQ — Phase 2 Developer Notes: Authentication

---

## 1. Authentication Architecture

The auth system follows a **stateless JWT + httpOnly Cookie** pattern:

```
Client                          Server
  │                               │
  │── POST /api/auth/register ──► │ validate → hash pw → save user → sign JWT
  │◄─ Set-Cookie: token=<JWT> ─── │ set httpOnly cookie → return user
  │                               │
  │── POST /api/auth/login ─────► │ validate → find user → compare hash → sign JWT
  │◄─ Set-Cookie: token=<JWT> ─── │ set httpOnly cookie → return user
  │                               │
  │── GET /api/auth/me ─────────► │ protect middleware reads cookie → verifyToken
  │◄─ { user } ─────────────────── │ attach req.user → controller returns user
  │                               │
  │── POST /api/auth/logout ────► │ clear cookie
  │◄─ { success: true } ───────── │
```

**Layers:**
- `validators/authValidator.js` — express-validator chains, runs before controllers
- `controllers/authController.js` — thin orchestration, delegates to model + utils
- `models/User.js` — bcrypt pre-save hook, comparePassword instance method
- `utils/jwt.js` — generateToken / verifyToken isolated from the rest
- `utils/cookie.js` — centralised cookie config (one place to change policy)
- `middleware/protect.js` — JWT verification route guard

---

## 2. Why httpOnly Cookies instead of localStorage

| | localStorage | httpOnly Cookie |
|---|---|---|
| XSS attack | ✗ Any JS can read it | ✓ Inaccessible to JavaScript |
| CSRF attack | ✓ Not sent automatically | ⚠ Mitigated by `sameSite: lax` |
| Server control | ✗ Client manages expiry | ✓ Server clears on logout |
| Persistence | Manual | Automatic via browser |

`sameSite: "lax"` means the cookie is sent on same-site requests and top-level navigations (GET), but **not** on cross-site POST — this blocks the most common CSRF vector.

`secure: true` in production ensures the cookie only travels over HTTPS, preventing interception on the wire.

---

## 3. Why bcrypt

- bcrypt is a **deliberately slow** adaptive hashing algorithm. "Slow" is the feature — it makes brute-force attacks economically infeasible.
- Salt rounds of **12** (vs the common default of 10) adds ~4x computation time per hash. Still instant for a single login, but 100× harder to crack a leaked database at scale.
- bcrypt embeds the salt in the hash output, so there's no separate salt column needed.
- `select: false` on the password field ensures it's never accidentally returned in a query. The `toJSON` transform provides a second layer of insurance.

---

## 4. Why JWT

- **Stateless** — no session store needed. Scales horizontally without sticky sessions or shared Redis.
- **Self-contained** — the token carries the user ID; the server can verify it without a DB round-trip on every request (except `/me` which intentionally re-fetches to detect deleted accounts).
- **Short-lived** — 7-day expiry limits the damage window if a token is ever compromised.
- Payload contains **only `id`** — no roles, email, or sensitive data in the token. Roles change; the token doesn't.

---

## 5. Why Middleware (`protect.js`)

Middleware separates the concern of "is this user allowed in?" from "what does this route do?". Without it, every protected controller would duplicate token-reading logic.

The middleware also:
- Checks if the user **still exists** in the database (handles account deletion mid-session)
- Maps JWT library errors (`TokenExpiredError`, `JsonWebTokenError`) to clean HTTP 401 responses
- Supports both **cookie** and **Bearer header** — cookie for web, header for API clients

---

## 6. Security Best Practices Implemented

| Practice | Where |
|---|---|
| Passwords hashed with bcrypt (12 rounds) | `models/User.js` pre-save hook |
| `password` field excluded from all queries | `select: false` + `toJSON` transform |
| JWT secret stored in environment variable | `utils/jwt.js` |
| httpOnly, secure, sameSite cookies | `utils/cookie.js` |
| Input validation before any DB operation | `validators/authValidator.js` |
| Generic "Invalid credentials" message | `authController.js` login — prevents user enumeration |
| Token verified + user re-fetched on every protected request | `middleware/protect.js` |
| Request body size limited to 10kb | `app.js` (Phase 1) |
| Helmet security headers | `app.js` (Phase 1) |
| Rate limiter on all `/api` routes | `app.js` (Phase 1) |
| CORS restricted to `CLIENT_URL` | `app.js` (Phase 1) |

---

## 7. Possible Improvements

- **Refresh tokens** — issue a short-lived access token (15 min) + long-lived refresh token (30 days) stored in a separate httpOnly cookie. More complex but standard in production systems.
- **Email verification** — set `isVerified: false` on register, send a verification link. Already modelled with the `isVerified` field.
- **Password reset flow** — time-limited token sent via email. A separate `passwordResetToken` + `passwordResetExpires` field on the User model.
- **Role-based access control (RBAC)** — add a `role` field (`user`, `admin`) and a `restrictTo(...roles)` middleware factory.
- **Stricter rate limiting on auth routes** — the global limiter applies, but `/api/auth/login` deserves its own stricter limiter (e.g., 5 attempts / 15 min per IP).
- **Account lockout** — after N failed login attempts, lock the account temporarily.
- **Audit logging** — log login attempts (success/fail), IP address, timestamp.

---

## 8. Common Interview Questions

**"Why not store JWT in localStorage?"**
localStorage is readable by any JavaScript on the page. A single XSS vulnerability hands the attacker a valid token. httpOnly cookies are immune to JS access.

**"Isn't sameSite=lax vulnerable to CSRF?"**
`lax` blocks cross-site POST requests. GET requests with `lax` could theoretically be exploited in edge cases, but the `/api/auth/me` endpoint is a GET that only reads data — there's nothing destructive to trigger. Sensitive mutations are always POSTs.

**"Why re-fetch the user on every protected request?"**
If an admin deletes a user's account mid-session, the JWT remains valid until expiry. Re-fetching ensures deleted/suspended accounts are kicked immediately.

**"Why only store `id` in the JWT payload?"**
User data changes (name, email, role). If you embed it in the token, the token becomes stale the moment the user updates their profile. The ID is immutable.

**"What's the difference between authentication and authorization?"**
Authentication = "Who are you?" (JWT/cookie validates identity).
Authorization = "Are you allowed to do this?" (role/permission checks on top of auth — Phase 3+).

**"How would you invalidate a JWT before it expires?"**
Pure JWTs can't be invalidated without a denylist (Redis-based). That's why refresh tokens with a server-side store are preferred in high-security systems — you can revoke refresh tokens.

---

## 9. Common Beginner Mistakes

1. **Storing JWT in localStorage** — see question above.
2. **Putting secrets in code** — JWT_SECRET must always come from environment variables, never hardcoded.
3. **Returning the password hash** — always use `select: false` and verify your `toJSON` transform.
4. **Trusting client-sent user IDs** — never do `User.findById(req.body.userId)`. Always use `req.user` set by the `protect` middleware.
5. **Same error message discrimination** — saying "email not found" vs "wrong password" lets attackers enumerate valid email addresses. Always say "Invalid credentials".
6. **Not salting passwords** — bcrypt handles this automatically, but never use plain SHA/MD5 which have no salt.
7. **Missing `credentials: true` in CORS** — cookies won't be sent cross-origin without it.
8. **Forgetting `withCredentials: true` in Axios** — same issue from the client side.
9. **Setting `secure: true` in development** — cookies won't be set over HTTP if `secure` is true. Always gate on `NODE_ENV === "production"`.
10. **Not handling `authLoading`** — without the initial session check, authenticated users get bounced to `/login` on every page refresh.

---

## 10. Files to Study First

| Order | File | Why |
|---|---|---|
| 1 | `server/src/models/User.js` | Password hashing, select:false, comparePassword |
| 2 | `server/src/utils/jwt.js` + `cookie.js` | Token generation and cookie policy |
| 3 | `server/src/controllers/authController.js` | The full auth flow in one file |
| 4 | `server/src/middleware/protect.js` | How every protected route is guarded |
| 5 | `server/src/validators/authValidator.js` | Input validation pattern |
| 6 | `client/src/store/useAuthStore.js` | All client auth state and actions |
| 7 | `client/src/components/guards/ProtectedRoute.jsx` | How route guarding works on the frontend |
| 8 | `client/src/App.jsx` | Where `fetchCurrentUser` is called on mount |

---

## New Files Added in Phase 2

```
server/src/
├── models/
│   └── User.js                     ← Mongoose schema with bcrypt hook
├── controllers/
│   └── authController.js           ← register, login, logout, getMe
├── middleware/
│   └── protect.js                  ← JWT verification route guard
├── routes/
│   └── authRoutes.js               ← /api/auth/* route definitions
├── validators/
│   └── authValidator.js            ← express-validator chains
└── utils/
    ├── jwt.js                      ← generateToken, verifyToken
    └── cookie.js                   ← setAuthCookie, clearAuthCookie

client/src/
├── components/
│   ├── guards/
│   │   ├── ProtectedRoute.jsx      ← Redirects to /login if not authenticated
│   │   └── PublicRoute.jsx         ← Redirects to /dashboard if authenticated
│   └── ui/
│       ├── FormInput.jsx           ← Reusable accessible form field
│       └── Button.jsx              ← Reusable button with loading state
├── pages/
│   ├── LoginPage.jsx               ← Full RHF login form
│   └── RegisterPage.jsx            ← Full RHF register form with pw validation
└── store/
    └── useAuthStore.js             ← Zustand: login, register, logout, fetchCurrentUser
```

**Modified files:**
- `server/src/app.js` — added `authRoutes`
- `server/.env` + `.env.example` — added `JWT_SECRET`, `JWT_EXPIRES_IN`
- `client/src/App.jsx` — added `fetchCurrentUser` on mount
- `client/src/router/index.jsx` — wrapped routes with `ProtectedRoute` / `PublicRoute`
- `client/src/components/layout/Navbar.jsx` — auth-aware nav (logout button, user name)
- `client/src/pages/DashboardPage.jsx` — shows user name, added Navbar
- `client/src/pages/ProfilePage.jsx` — shows user details, added Navbar
- `client/src/pages/ResumePage.jsx` / `InterviewPage.jsx` / `ReportsPage.jsx` — added Navbar

---

## Environment Variables Added

```env
JWT_SECRET=<long random string, min 32 chars>
JWT_EXPIRES_IN=7d
```

---

## Manual API Testing Steps

```bash
# 1. Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Smith","email":"jane@example.com","password":"Password1"}' \
  -c cookies.txt

# 2. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"Password1"}' \
  -c cookies.txt

# 3. Get current user (uses cookie)
curl http://localhost:5000/api/auth/me -b cookies.txt

# 4. Logout
curl -X POST http://localhost:5000/api/auth/logout -b cookies.txt

# 5. Try /me after logout (should return 401)
curl http://localhost:5000/api/auth/me -b cookies.txt

# 6. Validation error (weak password)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"weak"}'

# 7. Duplicate email
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Again","email":"jane@example.com","password":"Password1"}'
```

---

## Confirmation Checklist

| Item | Status |
|---|---|
| ✅ Registration works | POST /api/auth/register creates user, sets cookie |
| ✅ Login works | POST /api/auth/login validates credentials, sets cookie |
| ✅ Logout works | POST /api/auth/logout clears cookie |
| ✅ Protected Routes work | /dashboard redirects to /login when not authenticated |
| ✅ Cookies work | httpOnly, sameSite=lax, secure in production |
| ✅ Password hashing works | bcrypt pre-save hook, 12 rounds |
| ✅ Validation works | express-validator on server, RHF on client |
| ✅ Auth Store works | Zustand login/register/logout/fetchCurrentUser |
| ✅ Route Guards work | ProtectedRoute + PublicRoute with authLoading guard |
| ✅ Current User API works | GET /api/auth/me returns user, rehydrates state on refresh |
| ✅ Navbar is auth-aware | Shows logout + user name when logged in |
| ✅ No password ever returned | select:false + toJSON transform + explicit undefined |
| ✅ Build passes | `npm run build` — 0 errors |
| ✅ Lint passes | `npm run lint` — 0 errors on both client and server |

---

## How Phase 2 Connects to Phase 3

Phase 3 is **Resume Upload** (Multer + Cloudinary). It slots in cleanly:

- Every resume upload route will use the `protect` middleware already built
- `req.user._id` is available in all protected controllers to associate uploads with users
- The `User` model already has an `avatar` field ready for profile picture upload
- The `targetRole` field on the User model feeds into Phase 4 AI question generation
