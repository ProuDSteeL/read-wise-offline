---
phase: 5
slug: quizzes-learning
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-19
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vite.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Test File | Status |
|---------|------|------|-------------|-----------|-------------------|-----------|--------|
| 05-01-02 | 01 | 1 | QUIZ-01, QUIZ-02 | unit | `npx vitest run src/test/quiz-logic.test.ts src/test/flashcard-logic.test.ts -x` | Created in 05-01 Task 2 | ⬜ pending |
| 05-03-01 | 03 | 2 | QUIZ-03 | unit | `npx vitest run src/test/admin-quiz-form.test.ts -x` | Created in 05-03 Task 1 | ⬜ pending |
| 05-03-02 | 03 | 2 | QUIZ-04 | unit | `npx vitest run src/test/profile-stats-quiz.test.ts -x` | Created in 05-03 Task 2 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Test files are created inline within their respective plan tasks (TDD approach):

- [x] `src/test/quiz-logic.test.ts` -- created in 05-01 Task 2 (covers QUIZ-01: score calculation, state transitions)
- [x] `src/test/flashcard-logic.test.ts` -- created in 05-01 Task 2 (covers QUIZ-02: flip state, mastery tracking)
- [x] `src/test/admin-quiz-form.test.ts` -- created in 05-03 Task 1 (covers QUIZ-03: form validation rules)
- [x] `src/test/profile-stats-quiz.test.ts` -- created in 05-03 Task 2 (covers QUIZ-04: aggregate stat queries)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 3D flip animation on flashcard tap | QUIZ-02 | CSS animation visual check | Tap flashcard, verify smooth 3D rotate-Y animation |
| Swipe navigation between flashcards | QUIZ-02 | Touch gesture interaction | Swipe left/right on flashcard carousel |
| Quiz progress indicator updates | QUIZ-01 | Visual progress check | Answer questions, verify "1/5" counter updates |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
