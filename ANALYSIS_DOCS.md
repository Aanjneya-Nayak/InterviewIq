# Resume Analysis — Testing Checklist, Developer Notes, Interview Questions & Improvements

---

## Testing Checklist

### Happy Path
- [ ] Upload a valid PDF resume → navigate to `/analysis` → click "Analyse Resume" → results render within 30 s
- [ ] Score rings animate to the correct values on load
- [ ] Score bars display the correct colour (green ≥75, amber ≥50, red <50)
- [ ] All 11 accordion sections render with correct item counts in their badges
- [ ] Strengths and Weaknesses accordions open by default; others are collapsed
- [ ] Action Plan items are sorted high → medium → low and display priority badges
- [ ] "Last analysed on" date matches the server `analysedAt` field
- [ ] Click "Re-analyse" → skeleton with "Analysing…" banner appears → results update
- [ ] Success toast fires after analysis completes
- [ ] Analysis link appears in the desktop and mobile navbar

### Error States
- [ ] No resume uploaded → `NoResumeState` renders with a "Go to Resume" link
- [ ] Network failure during `runAnalysis` → error banner with Retry button appears
- [ ] "Dismiss" on the error banner clears it without re-fetching
- [ ] "Retry" on the error banner triggers `runAnalysis` again
- [ ] Gemini timeout (504) → error banner shows the correct server message
- [ ] Gemini rate limit (429) → error banner shows the correct server message
- [ ] Server unreachable → error banner appears (no crash)

### Loading States
- [ ] Navigating to `/analysis` shows the full-page pulse skeleton while `fetchAnalysis` is pending
- [ ] Clicking "Analyse Resume" shows the `AnalysisSkeleton` with the `AnalyzingBanner`
- [ ] "Analyse Resume" / "Re-analyse" button is disabled while `analyzing` is true
- [ ] Spinner replaces button text during analysis

### Empty States
- [ ] No prior analysis → `EmptyAnalysisState` renders with "How it works" hint
- [ ] Empty arrays (e.g. `grammarSuggestions: []`) render the italic "None identified" fallback
- [ ] `actionPlan: []` renders "No action plan generated" rather than crashing

### Responsive / Accessibility
- [ ] Page layout switches from 3-column to 1-column on mobile correctly
- [ ] All accordion buttons have `aria-expanded` toggling correctly
- [ ] Score rings have `aria-label` with score values for screen readers
- [ ] Progress bars have `role="progressbar"` with `aria-valuenow`
- [ ] Error banner has `role="alert"` so screen readers announce it immediately
- [ ] "Analysing…" banner has `role="status"` and `aria-live="polite"`
- [ ] Focus order is logical on keyboard navigation
- [ ] Tips sidebar is sticky on large screens; stacks below results on mobile

---

## Developer Notes

### Architecture

```
AnalysisPage
├── useAnalysisStore          (Zustand — state + API calls)
│   ├── fetchAnalysis()       GET /api/resume/analysis  (on mount, no AI)
│   └── runAnalysis()         POST /api/resume/analyze  (triggers Gemini)
├── AnalysisSkeleton          pulse placeholder (fetching + analyzing states)
├── AnalysisResult            renders all 11 sections from the analysis doc
│   ├── ScoreRing             SVG circular progress, colour-coded
│   ├── ScoreBar              horizontal bar with label, colour-coded
│   ├── AccordionSection      collapsible panel used for every section
│   ├── BulletList            generic bullet list with empty fallback
│   └── TagList               pill/tag display for keywords and skills
└── TipsSidebar               static tips, sticky on lg+
```

### State Flow

```
mount → fetchAnalysis() → analysis | null
                         ↓
                   show EmptyAnalysisState or AnalysisResult

button → runAnalysis() → analyzing=true → AnalyzingBanner + AnalysisSkeleton
                      → analyzing=false → update analysis → AnalysisResult
```

### Key Files

| File | Purpose |
|------|---------|
| `src/store/useAnalysisStore.js` | All state and API calls |
| `src/pages/AnalysisPage.jsx` | Top-level page, state wiring, conditional rendering |
| `src/components/analysis/AnalysisResult.jsx` | Full results layout |
| `src/components/analysis/AccordionSection.jsx` | Reusable collapsible section |
| `src/components/analysis/ScoreRing.jsx` | SVG circular score display |
| `src/components/analysis/ScoreBar.jsx` | Horizontal progress bar |
| `src/components/analysis/AnalysisSkeleton.jsx` | Loading placeholder |

### API Contract

```
GET  /api/resume/analysis   → { success, analysis: AnalysisDoc | null }
POST /api/resume/analyze    → { success, message, analysis: AnalysisDoc }
```

`AnalysisDoc` shape:
```js
{
  overallScore: number,          // 0-100
  atsScore: number,              // 0-100
  strengths: string[],
  weaknesses: string[],
  missingKeywords: string[],
  recommendedSkills: string[],
  projectSuggestions: string[],
  experienceSuggestions: string[],
  educationSuggestions: string[],
  grammarSuggestions: string[],
  formattingSuggestions: string[],
  actionPlan: { priority: "high"|"medium"|"low", action: string, rationale: string }[],
  analysedAt: string,            // ISO date
  resumeRef: string,             // Resume._id at analysis time
}
```

### Colour Coding Convention

| Score Range | Colour | Tailwind |
|------------|--------|----------|
| 75 – 100 | Green | `bg-green-500` / `#22c55e` |
| 50 – 74 | Amber | `bg-amber-500` / `#f59e0b` |
| 0 – 49 | Red | `bg-red-500` / `#ef4444` |

Applied consistently in both `ScoreRing` (SVG stroke) and `ScoreBar` (bg).

### Error Detection for "No Resume"

The page checks the error string for "no resume" / "upload a resume" to decide
whether to show `NoResumeState` (link to upload) vs the generic `ErrorBanner`
(retry). This matches the 404 error message from `resumeAnalysis.service.js`.

---

## Interview Questions

**Architecture & Design**

1. Why is `fetchAnalysis` (GET) separate from `runAnalysis` (POST)? What problem does that solve?
   > Avoids re-running an expensive Gemini call on every page visit. Users see their last result instantly and choose when to re-analyse.

2. Why is the analysis state in Zustand rather than local component state?
   > Other parts of the app (Dashboard, future notifications) may need to read the analysis result. Zustand makes it available without prop drilling or context boilerplate.

3. The `AnalysisSkeleton` accepts an `analyzing` prop that changes its appearance. Why not have two separate skeleton components?
   > One component with a boolean prop keeps the rendering logic co-located. The visual difference (the Analysing banner) is minor — a second component would duplicate the pulse grid for no gain.

4. How does the page decide whether to show `NoResumeState` vs `ErrorBanner`?
   > It pattern-matches the error string returned by the server. This is intentionally simple — the 404 message from the service is consistent and human-readable.

5. Why do the `ScoreRing` and `ScoreBar` each apply their own colour logic rather than receiving a colour prop?
   > The colour threshold (red/amber/green at 50/75) is a product rule that belongs with the score display, not the caller. Centrally applying it prevents callers from passing inconsistent colours.

**React & State**

6. Why does `AnalysisResult` receive the full `analysis` object rather than individual fields?
   > It renders the complete document — spreading 12 props would be noisy. Receiving the object as a single prop also means the component signature stays stable when new fields are added to the API.

7. The accordion uses `max-h` transition for open/close. What's the tradeoff vs animating `height`?
   > `max-h` on a CSS class avoids needing JS to measure actual content height. The tradeoff is the transition speed feels inconsistent across items of very different heights. For this use case the difference is imperceptible.

8. Why does `useAnalysisStore` expose a `clearError` action instead of auto-clearing on retry?
   > Users may dismiss the error without retrying (e.g. they want to go upload a resume first). Auto-clearing on retry would hide the new error if the retry also fails. Manual control is more transparent.

**Performance & UX**

9. The "Re-analyse" button stays mounted even while analysing. Why not unmount it?
   > Unmounting causes layout shift. Disabling it and showing a spinner preserves the button's space in the layout.

10. How would you prevent a user from running 10 concurrent analyses?
    > The `analyzing` flag disables the button immediately on click. Server-side, the rate limiter (100 req/15 min) is a backstop. A dedicated per-user lock in Redis would be the production solution.

---

## Possible Improvements

### UX / Features
- **Score history chart** — plot `overallScore` and `atsScore` over time using a line chart (recharts or Chart.js). Requires storing analysis history instead of a single upserted document.
- **Section-level score badges** — add a score to each accordion header (e.g. "Grammar: 8 issues found") so users can prioritise without opening every panel.
- **Share / export PDF** — allow users to download their analysis as a formatted PDF report using `react-pdf` or `jsPDF`.
- **Job description input** — let users paste a job description before analysis so Gemini can tailor keyword and skills recommendations to that specific role.
- **Diff view on re-analyse** — highlight what changed between the previous and current analysis (score delta, new/resolved issues).
- **Stale analysis indicator** — detect when `resume.uploadedAt > analysis.analysedAt` and show a warning badge: "Resume updated — re-analyse recommended."

### Performance
- **Optimistic UI for re-analyse** — keep showing the old results while the new analysis is running instead of switching to the skeleton, improving perceived performance.
- **Polling / Server-Sent Events** — for very long analyses, replace the blocking POST with a job queue and poll `GET /resume/analysis` every 3 s until `analysedAt` is newer than the request time.
- **Persist analysis in Zustand middleware** — use `zustand/middleware/persist` with `sessionStorage` so a page refresh within the same session doesn't re-fetch from the server.

### Code Quality
- **Extract colour logic to a utility** — `getScoreColor(score)` used in both `ScoreRing` and `ScoreBar` should live in `lib/format.js` rather than being duplicated.
- **Prop type validation** — add PropTypes or migrate to TypeScript interfaces for `AnalysisResult`, `AccordionSection`, and store shape.
- **Unit test the store** — test `fetchAnalysis` and `runAnalysis` with `vi.fn()` mocking `api.get`/`api.post` to cover success, error, and network-failure branches.
- **Accessibility audit** — run axe-core against the rendered page to catch any ARIA misuse, especially around the live regions and the accordion.
