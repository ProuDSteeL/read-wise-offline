---
phase: 1
slug: security-hardening
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^3.2.4 |
| **Config file** | vitest.config.ts (exists in project root) |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run` + manual Edge Function smoke tests
- **Before `/gsd:verify-work`:** Full suite must be green + manual security verification
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | SEC-01 | integration (SQL) | Manual: SQL statements against local Supabase | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | SEC-02 | unit | `npx vitest run src/test/truncation.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | SEC-02 | unit | `npx vitest run src/test/access-control.test.ts` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 1 | SEC-03 | integration | Manual: curl against local Supabase | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/test/access-control.test.ts` — unit tests for updated useAccessControl (FREE_READS_LIMIT=10, no highlight limit)
- [ ] `src/test/truncation.test.ts` — unit tests for summary truncation algorithm
- [ ] SQL test script for trigger verification (run against local Supabase)
- [ ] Verify vitest config works: `npx vitest run`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Trigger resets subscription fields | SEC-01 | Requires local Supabase DB with RLS context | 1. Connect to local Supabase. 2. Run UPDATE as authenticated user. 3. Verify subscription_type unchanged. |
| Edge Function returns signed URL | SEC-03 | Requires running Edge Function with Supabase auth | 1. Call get-audio-url with Pro user JWT. 2. Verify signed URL returned. 3. Call with Free user JWT. 4. Verify 403 response. |
| Audio bucket is private | SEC-03 | Infrastructure verification | 1. Attempt direct URL access to audio file. 2. Verify 403 returned. |
| DevTools self-promotion blocked | SEC-01 | E2E security verification | 1. Open DevTools console. 2. Attempt supabase.from('profiles').update({subscription_type: 'pro_monthly'}). 3. Verify field unchanged after refresh. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
