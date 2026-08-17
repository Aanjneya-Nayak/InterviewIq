# Phase 6 — Interview Engine Foundation

## 1. Folder Structure

```
server/src/
├── models/
│   └── InterviewSession.js          ← New: session data model
├── validators/
│   └── interview.validation.js      ← New: express-validator chains
├── services/
│   └── interview.service.js         ← New: all business logic
├── controllers/
│   └── interview.controller.js      ← New: thin HTTP orchestration
├── routes/
│   └── interview.routes.js          ← New: route definitions
└── app.js                           ← Modified: +interviewRoutes

client/src/
├── store/
│   └── useInterviewStore.js         ← New: Zustand state + API calls
├── pages/
│   ├── InterviewSetupPage.jsx       ← New: setup/config form
│   └── InterviewPage.jsx            ← Modified: session detail view
└── router/
    └── index.jsx                    ← Modified: +/interview/setup, +/interview/:id
```

---

## 2. API Documentation

All routes are protected by the `protect` middleware (JWT cookie or Bearer token required).

### POST `/api/interviews`
Create a new interview session.

**Request body**
```json
{
  "interviewType": "technical",
  "difficulty": "medium",
  "targetRole": "Frontend Developer",
  "questionCount": 10
}
```

**Response 201**
```json
{
  "success": true,
  "message": "Interview session created successfully.",
  "session": { ...InterviewSession }
}
```

**Errors**
| Code | Reason |
|------|--------|
| 400  | Resume not uploaded, resume not parsed, or analysis not run |
| 422  | Validation failed (invalid enum, missing fields) |

---

### GET `/api/interviews`
Return all sessions for the authenticated user, newest first.

**Response 200**
```json
{
  "success": true,
  "sessions": [ ...InterviewSession[] ]
}
```

---

### GET `/api/interviews/:id`
Return a single session with populated `resume` and `resumeAnalysis` refs.

**Response 200**
```json
{
  "success": true,
  "session": { ...InterviewSession }
}
```

**Errors**
| Code | Reason |
|------|--------|
| 404  | Not found or belongs to another user |
| 422  | Invalid MongoDB ObjectId |

---

### PATCH `/api/interviews/:id`
Update session status.

**Request body**
```json
{ "status": "in_progress" }
```

**Valid transitions**
```
draft       → in_progress | abandoned
in_progress → completed   | abandoned
completed   → (terminal — no transitions allowed)
abandoned   → (terminal — no transitions allowed)
```

**Side effects**
- `draft → in_progress`: records `startedAt`
- `in_progress → completed`: records `completedAt`, computes `totalDuration` in seconds

**Errors**
| Code | Reason |
|------|--------|
| 400  | Invalid status transition |
| 404  | Not found or belongs to another user |
| 422  | Invalid status value or ObjectId |

---

### DELETE `/api/interviews/:id`
Delete a session.

**Response 200**
```json
{ "success": true, "message": "Interview session deleted successfully." }
```

---

## 3. Validation Rules

### Create Session
| Field           | Rules |
|-----------------|-------|
| `interviewType` | Required, enum: `technical \| behavioral \| hr \| mixed` |
| `difficulty`    | Required, enum: `easy \| medium \| hard` |
| `targetRole`    | Required, string, 2–100 characters |
| `questionCount` | Required, integer, enum: `5 \| 10 \| 15 \| 20` |

### Update Session
| Field    | Rules |
|----------|-------|
| `status` | Required, enum: `draft \| in_progress \| completed \| abandoned` |

### URL Parameter
| Param | Rules |
|-------|-------|
| `:id` | Must be a valid MongoDB ObjectId |

All validation errors return **HTTP 422**:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "interviewType", "message": "Interview type is required" }]
}
```

---

## 4. Developer Notes

### Business Rule Enforcement
Prerequisites are checked in `interview.service.js → assertPrerequisites()`:
1. User must have a `Resume` document
2. `resume.parsedText` must be non-empty (upload + parse completed)
3. User must have a `ResumeAnalysis` document

All three return descriptive **HTTP 400** errors, not generic 500s.

### Status State Machine
Implemented in `interview.service.js → updateSessionStatus()`.
The `VALID_TRANSITIONS` map is the single source of truth — add future transitions there.

### Model Constants Export
`InterviewSession.js` exports `INTERVIEW_TYPES`, `DIFFICULTIES`, `QUESTION_COUNTS`, `STATUSES` as named exports so both the validator and service import from one place — no duplication.

### Frontend Routing
```
/interview          → InterviewSetupPage (same as /interview/setup)
/interview/setup    → InterviewSetupPage
/interview/:id      → InterviewPage (session detail)
```

### Zustand Store Pattern
`useInterviewStore` follows the same split-loading-state pattern as `useResumeStore`:
- `creating`, `fetching`, `updating`, `deleting` are independent flags
- All async actions return `{ success, message? }`
- Errors are surfaced via the `error` field and consumed by `useEffect → toast`

---

## 5. Manual Testing Steps

### Prerequisites
1. Register/login as a test user
2. Upload a PDF/DOCX resume
3. Run resume analysis from `/analysis`

### Create a Session
```
POST /api/interviews
Content-Type: application/json

{
  "interviewType": "technical",
  "difficulty": "medium",
  "targetRole": "Frontend Developer",
  "questionCount": 10
}
```
Expected: 201, session with `status: "draft"`

### Validation — Missing Field
```
POST /api/interviews
{ "difficulty": "medium", "targetRole": "Dev", "questionCount": 10 }
```
Expected: 422, `errors[0].field === "interviewType"`

### Validation — Invalid Enum
```
POST /api/interviews
{ "interviewType": "unknown", ... }
```
Expected: 422, message includes allowed values

### Prerequisite Gate — No Resume
Delete your resume, then:
```
POST /api/interviews { valid body }
```
Expected: 400, `"You must upload a resume before starting an interview."`

### Status Transition
```
PATCH /api/interviews/:id  { "status": "in_progress" }
```
Expected: 200, `startedAt` is set

### Invalid Transition
```
PATCH /api/interviews/:id  { "status": "draft" }   (session is in_progress)
```
Expected: 400, `"Cannot transition session from "in_progress" to "draft"."`

### Ownership Guard
Log in as User B and attempt:
```
GET /api/interviews/<User A's session ID>
```
Expected: 404 (not 403 — ownership is not revealed)

### UI Flow
1. Go to `/interview/setup`
2. Select all options and click "Start Interview"
3. Verify redirect to `/interview/:id`
4. Click "Start Session" — verify `status` changes to `in_progress`
5. Click "Abandon Session" — verify redirect to dashboard

---

## 6. Future Improvements

- **Question Generation** (Phase 7): POST `/api/interviews/:id/questions` triggers Gemini to generate questions based on `targetRole`, `interviewType`, `difficulty`, and `resume.parsedText`
- **Answer Storage**: Add `answers` array sub-document to `InterviewSession` or a separate `InterviewAnswer` collection
- **Session Timer**: Store `timePerQuestion` and enforce limits with a server-side TTL or client-side countdown
- **Evaluation Engine**: Score each answer using Gemini, store `score` + `feedback` per answer
- **Resume Staleness Guard**: Warn if the user's resume was replaced after the session was created (`resume._id !== session.resume`)
- **Session Listing Page**: `/reports` page showing all past sessions with scores and completion stats
- **Pagination**: `GET /api/interviews?page=1&limit=10` for users with many sessions
- **Draft Auto-cleanup**: TTL index on `InterviewSession` to auto-abandon `draft` sessions older than 7 days
