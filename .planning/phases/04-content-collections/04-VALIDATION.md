---
phase: 4
slug: content-collections
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-19
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (already configured) |
| **Config file** | `vitest.config.ts` |
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

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-00 | 01 | 1 | CONT-01, CONT-02 | unit | `npx vitest run src/test/key-ideas-carousel.test.ts src/test/admin-key-ideas.test.ts -x` | No -- Wave 0 creates these | pending |
| 04-01-01 | 01 | 1 | CONT-01 | unit + tsc | `npx tsc --noEmit && npx vitest run src/test/key-ideas-carousel.test.ts -x` | Yes (after Task 0) | pending |
| 04-01-02 | 01 | 1 | CONT-02 | unit + grep | `grep -n "moveIdea\|ChevronUp\|ChevronDown" src/pages/AdminBookForm.tsx && npx vitest run src/test/admin-key-ideas.test.ts -x` | Yes (after Task 0) | pending |
| 04-02-00 | 02 | 1 | COLL-02 | unit | `npx vitest run src/test/collection-sections.test.ts -x` | No -- Wave 0 creates this | pending |
| 04-02-01 | 02 | 1 | COLL-02 | unit + tsc | `npx tsc --noEmit && npx vitest run src/test/collection-sections.test.ts -x` | Yes (after Task 0) | pending |
| 04-02-02 | 02 | 1 | CONT-03, CONT-04, COLL-01 | grep | `grep -c "useUserProgress\|ContinueCard" src/pages/Index.tsx && grep -c "useProfileStats\|readCount" src/pages/ProfilePage.tsx` | N/A (verification-only) | pending |

*Status: pending -- green -- red -- flaky*

---

## Wave 0 Requirements

Wave 0 creates test files that do not yet exist. These are created by Task 0 in each plan before implementation begins.

| Test File | Plan | Requirement | Created By |
|-----------|------|-------------|------------|
| `src/test/key-ideas-carousel.test.ts` | 04-01 | CONT-01 | Plan 01, Task 0 |
| `src/test/admin-key-ideas.test.ts` | 04-01 | CONT-02 | Plan 01, Task 0 |
| `src/test/collection-sections.test.ts` | 04-02 | COLL-02 | Plan 02, Task 0 |

CONT-03, CONT-04, and COLL-01 are verification-only tasks (confirming existing implementations). They use grep-based automated checks as their best proxy since they require authenticated Supabase sessions and real data for full testing.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Key ideas carousel swipe/snap | CONT-01 | Touch/swipe interaction requires browser | Open BookPage with key ideas, swipe left/right, verify snap and dot indicators |
| Admin reorder key ideas | CONT-02 | Requires form interaction | Open AdminBookForm, add 3+ key ideas, use up/down buttons, verify order persists on save |
| Continue reading section | CONT-03 | Requires user with in-progress books | Log in as user with partial progress, verify homepage shows continue reading cards with progress % |
| Reading stats display | CONT-04 | Requires user with reading history | Log in as user with completed books, verify ProfilePage shows 3 stat cards |
| Collection homepage sections | COLL-02 | Requires featured collections with books | Create collection, feature it, add books, verify horizontal scroll on homepage |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending execution of Wave 0 tasks
