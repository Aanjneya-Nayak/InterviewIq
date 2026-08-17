# Phase 7 — AI Question Generation & Interview Session

## Developer Notes

### Architecture

```
POST /api/interviews/:id/start
  └─ interview.service.startSession()
       ├─ getSessionById()            — ownership check
       ├─ Resume.findById()           — load parsedText
       ├─ ResumeAnalysis.findById()   — load strengths/weaknesses/skills
       ├─ buildInterviewQuestionsPrompt()  — assemble personalised prompt
       ├─ generateContent()           — call Gemini (60s timeout)
       ├─ parseQuestionsResponse()    — validate + normalise JSON
       └─ session.save()              — persist questions, set in_progress
```

**Idempotency**: If `startSession` is called on a session that is already `in_progress` with questions, it returns the existing session immediately. No duplicate Gemini calls.

**Answer upsert**: `saveAnswer` uses array find-and-replace rather than `$set` with dotpath notation, ensuring Mongoose validators run and `savedAt` updates correctly on every save.

**Progress calculation**: `progress = Math.round((nonEmptyAnswers / questionCount) * 100)`. Auto-completes the session when `answeredCount >= questionCount`.

**Autosave (frontend)**: `setInterval` at 10 000 ms in `InterviewSessionPage`. Skips the API call when `localAnswer === lastSavedAnswerRef.current` (no-change guard). `beforeunload` uses `navigator.sendBeacon` as a best-effort fire-and-forget.

---

## Prompt Explanation

File: `server/src/prompts/interviewQuestions.prompt.js`

The prompt passes four categories of information to Gemini:

| Section | Content | Purpose |
|---------|---------|---------|
| Role context | `targetRole`, `interviewType`, `difficulty` | Sets interviewer persona |
| Resume analysis | Top 3 strengths, weaknesses, 5 recommended skills | Drives personalisation |
| Resume text | First 3 000 chars of `parsedText` | Enables project/tech-specific questions |
| Rules | Type distribution, difficulty guide, uniqueness, open-ended | Controls output quality |

**Type distribution rules** (built dynamically per `interviewType`):
- `technical` → 100% technical questions
- `behavioral` → 100% behavioral (STAR format)
- `hr` → 100% HR questions
- `mixed` → ~40% technical / ~30% behavioral / ~20% project / ~10% hr

**Output contract** (validated by `interview.ai.validation.js`):
```json
{
  "questions": [
    {
      "questionId": "q1",
      "question": "...",
      "type": "technical|behavioral|hr|project|mixed",
      "difficulty": "easy|medium|hard",
      "topic": "React hooks",
      "expectedSkills": ["React", "useState"],
      "tips": "A strong answer explains the Rules of Hooks..." 
    }
  ]
}
```

Invalid enum values are coerced (not rejected) — e.g. `"Tech"` → `"mixed"`. Questions with text shorter than 10 characters are filtered. If fewer valid questions remain than requested, a 502 error is thrown.

---

## API Documentation

All routes require authentication (JWT cookie or Bearer token).

### POST `/api/interviews/:id/start`
Generate AI questions and transition the session to `in_progress`.

| Code | Reason |
|------|--------|
| 200 | Session with `questions[]` populated |
| 400 | Session not in `draft`/`in_progress`, or resume/analysis unavailable |
| 502 | Gemini returned invalid JSON or question count mismatch |
| 503 | `GEMINI_API_KEY` missing |
| 504 | Gemini request timed out (> 60 s) |

**Idempotent**: Safe to call again if already `in_progress` with questions.

---

### POST `/api/interviews/:id/save-answer`
Save or update the answer to one question.

**Request body**
```json
{ "questionId": "q3", "answer": "I would use React.memo because…" }
```

| Field | Validation |
|-------|-----------|
| `questionId` | Required, non-empty string matching a question in the session |
| `answer` | Required, string, max 5 000 chars (empty string is valid) |

**Response 200**
```json
{
  "success": true,
  "message": "Answer saved.",
  "progress": 40,
  "isCompleted": false,
  "session": { ...InterviewSession }
}
```

| Code | Reason |
|------|--------|
| 400 | Session not `in_progress` |
| 404 | `questionId` not found in this session |
| 422 | Validation failed |

---

### PATCH `/api/interviews/:id/progress`
Update the `currentQuestionIndex` cursor (navigation only, no answer saved).

**Request body**
```json
{ "currentQuestionIndex": 2 }
```

| Code | Reason |
|------|--------|
| 200 | Index updated |
| 400 | Index out of bounds or session not `in_progress` |
| 422 | Validation failed |

---

### GET `/api/interviews/:id/current`
Return the session with two convenience fields injected:
- `currentQuestion` — the question at `questions[currentQuestionIndex]`
- `currentAnswer` — the stored answer for that question (empty string if none)

| Code | Reason |
|------|--------|
| 200 | Session + convenience fields |
| 404 | Not found or not owned |

---

## Testing Checklist

### Backend

- [ ] `POST /api/interviews/:id/start` — draft session → questions generated, status = `in_progress`
- [ ] `POST /api/interviews/:id/start` — already `in_progress` with questions → returns existing session (no new Gemini call)
- [ ] `POST /api/interviews/:id/start` — `completed` session → 400
- [ ] `POST /api/interviews/:id/start` — no Gemini key → 503
- [ ] `POST /api/interviews/:id/save-answer` — valid → answer upserted, progress updated
- [ ] `POST /api/interviews/:id/save-answer` — answer all questions → `isCompleted: true`, status = `completed`
- [ ] `POST /api/interviews/:id/save-answer` — invalid questionId → 404
- [ ] `POST /api/interviews/:id/save-answer` — answer > 5000 chars → 422
- [ ] `POST /api/interviews/:id/save-answer` — session `completed` → 400
- [ ] `PATCH /api/interviews/:id/progress` — valid index → updated
- [ ] `PATCH /api/interviews/:id/progress` — index >= questionCount → 400
- [ ] `GET /api/interviews/:id/current` — returns `currentQuestion` + `currentAnswer`
- [ ] All routes → 404 for another user's session
- [ ] All routes → 401 without auth cookie

### Frontend

- [ ] `/interview/:id` — "Generate & Start" button calls `/start`, shows spinner during generation
- [ ] On success → navigates to `/interview/:id/session`
- [ ] `/interview/:id/session` — renders question text, topic badge, difficulty badge, tips
- [ ] Typing in textarea → autosaves after 10 s (check network tab)
- [ ] "Save Progress" button → immediate save, toast confirmation
- [ ] "Next" button → saves current answer, navigates to next question
- [ ] "Previous" button → saves current answer, navigates back
- [ ] "Skip" button → navigates without saving (answer remains blank)
- [ ] Question nav dots — green = answered, indigo = current, gray = unanswered
- [ ] Clicking a nav dot → navigates directly to that question
- [ ] Progress bar and ring update as answers are saved
- [ ] All answers saved → redirect to completed screen
- [ ] "Abandon session" → session marked abandoned, redirected to dashboard
- [ ] Hard refresh → answer and cursor position restored from server
- [ ] `/interview/:id` with `in_progress` session → shows "Resume Interview" button

---

## Interview Questions for Developers

Questions a developer should be able to answer about this implementation:

**Architecture**
1. Why are questions embedded in `InterviewSession` rather than stored in a separate collection?
2. How does the service layer prevent duplicate Gemini calls if the user refreshes during generation?
3. Why does `saveAnswer` recalculate `progress` in-memory before saving instead of using a MongoDB aggregation?

**AI / Prompt Engineering**
4. Why is the resume text truncated to 3 000 chars in the prompt?
5. What happens if Gemini returns fewer questions than requested? How does the validator handle it?
6. Why are invalid enum values coerced rather than causing a hard 502 error?
7. How would you modify the prompt to add a "project" question type for `technical` sessions?

**Frontend / Autosave**
8. Why does `persistAnswer` compare `answer` against `lastSavedAnswerRef.current` before calling the API?
9. `beforeunload` uses `navigator.sendBeacon` instead of `fetch`. Why?
10. Why is `currentQuestionIndex` synced via a separate `PATCH /progress` endpoint instead of being sent with each answer?

**Security**
11. How does ownership enforcement work for `/:id/save-answer`? Where is it checked?
12. Why does the ownership violation return 404 instead of 403?
