# Phase 8 — Interview Experience & Completion Workflow

---

## Production Checklist

### Backend
- [x] `InterviewSession` model has `answeredQuestions`, `skippedQuestions` fields persisted at completion
- [x] `POST /api/interviews/:id/complete` — explicit completion with partial-answer support
- [x] `GET  /api/interviews/:id/summary` — summary stats + per-question breakdown
- [x] `completeSession` service sets `completedAt`, `totalDuration`, `answeredQuestions`, `skippedQuestions`
- [x] `getSessionSummary` returns `overallScore: null` + `evaluationReady: false` placeholders for Phase 9
- [x] Ownership enforced on every new endpoint via `getSessionById` (returns 404 not 403)
- [x] All routes protected by `protect` middleware at router level
- [x] All new endpoints validated with `validateSessionId`
- [x] Server syntax checks: zero errors on all 6 files

### Frontend
- [x] `InterviewSessionPage` — elapsed timer, keyboard shortcuts, exit modal, finish-early modal, autosave, session recovery banner, nav dot grid, progress ring + bar
- [x] `InterviewCompletePage` — stats grid, progress bar, question breakdown table, "Analyze My Interview" placeholder, next-step actions
- [x] `useInterviewStore` — `completing` flag, `completeSession`, `fetchSummary`, `clearSummary`
- [x] `format.js` — `formatDuration` helper
- [x] Router — `/interview/:id/complete` wired to `InterviewCompletePage`
- [x] `InterviewPage` completed-state links to `/interview/:id/complete`
- [x] Vite build: ✓ 1881 modules, zero errors

---

## Developer Notes

### Completion flow — two paths

**Path 1: Auto-complete** (all questions answered)  
`saveAnswer` in `interview.service.js` counts non-empty answers after every save. When `answeredCount >= questionCount`, it immediately sets `status = "completed"`, records `completedAt`, computes `totalDuration`, stores `answeredQuestions`/`skippedQuestions`, and returns `isCompleted: true`. The frontend catches this flag in `persistAnswer` and navigates to `/interview/:id/complete`.

**Path 2: Explicit finish** (partial or full)  
The user clicks **Finish** (visible from any question) or **Complete** (last question). A `ConfirmModal` warns about skipped questions. On confirm, `completeSession` is called via `POST /:id/complete`. The service performs the same field writes as Path 1 and returns the updated session. The frontend navigates to `/interview/:id/complete`.

### Session recovery

On mount, `InterviewSessionPage` calls `fetchSession(id)` which hits `GET /api/interviews/:id/current`. This returns the session with `currentQuestionIndex`, `currentAnswer`, and `questions` already populated. The textarea is synced from `currentSession.currentAnswer`. A recovery banner is shown when `progress > 0 && answeredCount > 0 && idx > 0`.

Status redirect guards prevent accessing the wrong page:
- `draft` → redirects to lobby `/interview/:id`
- `completed` → redirects to `/interview/:id/complete`  
- `abandoned` → redirects to lobby `/interview/:id`

### Elapsed timer

`useElapsedTimer(startedAt)` is a custom hook that:
1. Initialises elapsed seconds from `(now - startedAt)` on mount — survives page refresh correctly
2. Ticks every 1 second with `setInterval`
3. Skips ticks when `document.hidden` is true (tab not active) to avoid drift on wake
4. Returns `{ elapsed, formatted }` — formatted as `MM:SS` or `H:MM:SS`

### Autosave architecture

```
textarea onChange → setLocalAnswer (local state, instant)
                          ↓
setInterval (10s)  → persistAnswer(localAnswer)
                          ↓
                    change guard: if answer === lastSavedAnswerRef → skip
                          ↓
                    POST /api/interviews/:id/save-answer
                          ↓
                    lastSavedAnswerRef = answer; setLastSaved(now)
```

`beforeunload` uses `navigator.sendBeacon` as best-effort (can't await `fetch` during unload).

Manual save (`Ctrl+S` or "Save" button) calls the same `persistAnswer`.

Navigation (`Next`/`Prev`/dot click) calls `persistAnswer` first, then `updateProgress`, then re-fetches with `fetchSession`.

### Keyboard shortcuts

| Shortcut | Action | Scope |
|----------|--------|-------|
| `Alt + →` | Next question | Global (not in textarea) |
| `Alt + ←` | Previous question | Global (not in textarea) |
| `Ctrl/Cmd + S` | Save current answer | Global |

The handler checks `e.target === textareaRef.current` and bails if the event originates in the textarea, so typing freely is unaffected.

### Summary page data flow

```
/interview/:id/complete mounts
  → useInterviewStore.fetchSummary(id)
  → GET /api/interviews/:id/summary
  → interviewService.getSessionSummary()
    → getSessionById() (ownership check)
    → builds questionBreakdown[] from questions[] + answers[]
    → adds durationFormatted, evaluationReady: false (Phase 9 placeholder)
  → set({ summary })
  → InterviewCompletePage renders
```

The summary is cleared on unmount via `clearSummary()` to prevent stale data when navigating between sessions.

---

## Manual Testing Guide

### Prerequisites
1. Register + login
2. Upload resume → run analysis
3. Create an interview session (`/interview/setup`)
4. Navigate to the session detail page `/interview/:id`
5. Click **Generate & Start** — wait for Gemini to return questions

### Test: Normal completion flow
1. In `/interview/:id/session`, answer questions 1–N
2. On the last question, click **Complete** / **Save & Finish**
3. **Expected**: toast "🎉 All questions answered!", redirect to `/interview/:id/complete`
4. **Expected**: Summary page shows correct answered count, 0 skipped, duration, question breakdown

### Test: Partial completion (Finish early)
1. Answer only 2 of 10 questions
2. Click **Finish** button (top-right of action row)
3. Confirm in the modal
4. **Expected**: redirect to `/interview/:id/complete`
5. **Expected**: `skippedQuestions = 8`, `answeredQuestions = 2`, progress bar reflects this

### Test: Exit without abandoning
1. In the session page, click **Exit**
2. Confirm exit in the modal
3. **Expected**: redirected to `/interview/:id` lobby, session still `in_progress`
4. Click **Resume Interview**
5. **Expected**: back in `/interview/:id/session` at the same question index, previous answers intact

### Test: Session recovery after hard refresh
1. Answer question 3, let autosave fire (wait 10s or press Save)
2. Hard-refresh the browser (`F5`)
3. **Expected**: page loads at question 3, recovery banner visible, previous answer restored in textarea

### Test: Autosave
1. Type in the textarea
2. Wait 10 seconds without clicking Save
3. **Expected**: "Saving…" indicator appears, then "Saved" with green tick

### Test: Keyboard shortcuts
1. Click anywhere outside the textarea
2. Press `Alt+→` → should advance to next question
3. Press `Alt+←` → should go back
4. Press `Ctrl+S` → should save, show "Answer saved." toast

### Test: Navigation dots
1. Click any numbered dot in the bottom strip
2. **Expected**: saves current answer, navigates to that question, dot turns indigo
3. Answered questions should show green dots

### Test: Ownership security
1. Copy a session ID from User A
2. Log in as User B
3. `GET /api/interviews/<User A's ID>/summary`
4. **Expected**: 404 (not 401, not 403)

### Test: Summary page
1. Complete an interview
2. Visit `/interview/:id/complete`
3. **Expected**: stats grid shows type/difficulty/duration/answered count
4. **Expected**: question breakdown lists each question with Answered/Skipped badge
5. **Expected**: "Analyze My Interview" button is disabled with tooltip "AI evaluation coming soon"
6. **Expected**: "New Interview" button navigates to `/interview/setup`

---

## Performance Improvements

**Immediate wins (no architectural change)**
- The `updateProgress` (cursor) call is fire-and-forget with no loading state — navigation feels instant even on slow connections.
- `persistAnswer` has a change guard (`answer === lastSavedRef`) that skips the network call entirely when the user hasn't typed since the last save.
- `beforeunload` uses `sendBeacon` (non-blocking) instead of a synchronous XHR.
- Summary page runs a single `GET /summary` instead of re-loading the full session with all embedded answer text.

**Future improvements**
- Debounce `persistAnswer` on keystroke (e.g. 2s after last keystroke) in addition to the 10s interval — reduces API calls for fast typists.
- Cache the question list in component state after first load so `fetchSession` on navigation only needs to return the cursor + current answer (smaller payload).
- Use `React.memo` on `QuestionRow`, `NavDots`, and `ProgressBar` — these re-render on every keystroke currently because they're in the same component tree as `localAnswer`.
- Move the `questions` array out of the session response for the progress/cursor endpoint — only send `currentQuestionIndex` back from `PATCH /:id/progress`.

---

## Accessibility Improvements

**Already implemented**
- `role="progressbar"` with `aria-valuenow/min/max` on all progress bars
- `aria-label` on progress ring ("X% complete")
- `aria-live="polite"` on autosave indicator and character count
- `aria-current="step"` on the active navigation dot
- `aria-label` on every icon-only button
- `aria-describedby` links textarea to the keyboard shortcut hint paragraph
- `role="listitem"` on nav dots with descriptive `aria-label` including answered state
- `ConfirmModal` uses `role="dialog"` + `aria-modal` + `aria-labelledby` + focus trap + Escape key dismiss
- Keyboard shortcuts documented inline in the UI (`kbd` elements)
- `aria-disabled="true"` + `disabled` on the "Analyze My Interview" placeholder button
- `role="list"` + `aria-label` on the question breakdown `<ul>`

**Recommended additions**
- Add `aria-busy="true"` to the main content area while `fetching` is true
- Announce question navigation via an `aria-live` region: "Moved to question 3 of 10"
- Add `role="status"` to the elapsed timer so screen readers can optionally read it
- Ensure focus moves to the question heading (`h2`) after navigation (use `useRef` + `.focus()`)
- Test with NVDA/JAWS on the nav dot grid — ensure all 20 dots are reachable by Tab

---

## Future Enhancements

### Phase 9 (next)
- AI answer evaluation — Gemini scores each answer, populates `overallScore`, sets `evaluationReady: true`
- The "Analyze My Interview" button on the summary page connects to `POST /api/interviews/:id/evaluate`
- `InterviewCompletePage` polls or re-fetches after evaluation completes

### Later phases
- **Question timer** — optional countdown per question (configurable at setup). Store `timeSpentPerQuestion[]` on the session for analytics.
- **Hints on demand** — "Show hint" button reveals `question.tips` progressively (currently always shown).
- **Answer word count** — display estimated spoken minutes to help users calibrate response length.
- **Session history list** — `/reports` page showing all past sessions with status, score, date, and duration.
- **Re-attempt** — clone a completed session's configuration to start a fresh session with the same settings.
- **Offline support** — cache unanswered questions in `localStorage`; sync answers when reconnected.
- **Interview templates** — save a setup configuration (type/difficulty/role/count) as a named template for quick re-use.
