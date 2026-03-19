---
phase: 4
slug: content-collections
status: draft
nyquist_compliant: false
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
| 04-01-01 | 01 | 1 | CONT-01 | visual/integration | Manual: verify carousel renders on BookPage | N/A | ⬜ pending |
| 04-01-02 | 01 | 1 | CONT-02 | functional | Manual: verify admin reorder buttons work | N/A | ⬜ pending |
| 04-02-01 | 02 | 1 | CONT-03 | visual | Manual: verify continue reading section on homepage | N/A | ⬜ pending |
| 04-02-02 | 02 | 1 | CONT-04 | visual | Manual: verify 3-stat cards on ProfilePage | N/A | ⬜ pending |
| 04-02-03 | 02 | 1 | COLL-01 | functional | Manual: verify admin collections CRUD | N/A | ⬜ pending |
| 04-02-04 | 02 | 1 | COLL-02 | visual/integration | Manual: verify collection sections on homepage | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

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

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
