# Frontend Refactor Implementation Plan

## Current State

**Branch:** `refactor`  
**Latest Commit:** `75dfc10` — All P0 fixes implemented  
**TypeScript Status:** `tsc --noEmit` passes with 0 errors  
**Push Status:** ✅ All P0 changes pushed to `origin/refactor`

### P0 Fixes Completed (Commit `75dfc10`)
- ✅ P0-1: `PUT` → `PATCH` in `minigameActivityAPI.updateMinigameActivity`
- ✅ P0-2: Strip `type` from `seriesUpdateData` in `EditEvent.tsx`
- ✅ P0-3: Strip `scoreRules` from standard/minigame update payloads in `EditEvent.tsx`
- ✅ P0-4: Redefine `*UpdateRequest` types as standalone interfaces (no `extends`)
- ✅ Added `getUpcomingActivities` to `eventAPI.ts` (backend confirmed endpoint)
- ✅ Updated `REFACTOR_FRONTEND_AUDIT.md` marking all P0 items as fixed

---

## Remaining Work: P1 — High Risk (Fix Before Production)

### P1-1: Change `BigDecimal` fields from `string` → `number`
**Files:** `src/types/activity.ts`, `src/types/presets.ts`  
**Lines:** `activity.ts:50-51` (`points`, `failPoints` in `ActivityScoreRuleRequest`), `activity.ts:65-66` (`points`, `failPoints` in `ActivityScoreRuleResponse`), `presets.ts:46-56` (all `*Points` fields in `ActivityPresetConfig`)  
**Backend Contract:** `java.math.BigDecimal` serializes as JSON number (`5.0` not `"5.0"`).  
**Risk:** Frontend sends `"5.0"` (string) → backend may reject or silently parse. Backend sends `5.0` (number) → frontend types say `string`, causing runtime `.toFixed()` crashes.  
**Implementation:**
1. Change `ActivityScoreRuleRequest.points` from `string` to `number`
2. Change `ActivityScoreRuleRequest.failPoints` from `string | null` to `number | null`
3. Change `ActivityScoreRuleResponse.points` from `string` to `number`
4. Change `ActivityScoreRuleResponse.failPoints` from `string | null` to `number | null`
5. Change all `ActivityPresetConfig.*Points` from `string | null` to `number | null`
6. Update `ScoreItem.score` and `ScoreTypeSummary.total` in `src/types/score.ts` if they are also BigDecimal
7. Check `StudentRankingResponse.score` and `StudentRankResponse.score` in `src/types/score.ts`
**Estimated Effort:** 20 min  
**Verification:** `tsc --noEmit` passes; `ScoreRulesForm` no longer shows type errors on number inputs.

### P1-2: Add Runtime Guarding in `SeriesProgressBanner`
**File:** `src/components/series/SeriesProgressBanner.tsx`  
**Backend Contract:** `GET /api/series/{id}/progress/my` returns `Map<String, Object>` with **no fixed DTO**.  
**Current Frontend:** Assumes typed `StudentSeriesProgress` interface with fields `minimumRequirementEnabled`, `minimumRequiredEvents`, `minimumRequirementMet`, `remainingToAvoidPenalty`, `minimumPenaltyPoints`.  
**Risk:** If backend Map keys change or are missing, frontend crashes with `undefined` access.  
**Implementation:**
1. Add optional chaining (`?.`) to all field accesses
2. Add default values for missing fields
3. Consider adding a runtime validation/guarding function before rendering
**Estimated Effort:** 15 min  
**Verification:** Test with malformed backend response (simulate missing keys).

### P1-4: Remove `targetSemesterId` from `SeriesPresetPreviewResponse`
**File:** `src/types/presets.ts` line 31  
**Backend Contract:** `SeriesPresetPreviewResponse` does **not** include `targetSemesterId`.  
**Current Frontend:** `SeriesPresetPreviewResponse.targetSemesterId?: number | null`  
**Risk:** `SeriesForm.tsx` (line 95) accesses `presetData.targetSemesterId`. If backend doesn't return it, preset loading silently fails to populate semester dropdown.  
**Implementation:**
1. Remove `targetSemesterId` from `SeriesPresetPreviewResponse` interface
2. Check `SeriesForm.tsx` for usage and adjust logic (if preset doesn't suggest semester, use default from form state or leave empty)
**Estimated Effort:** 10 min  
**Verification:** `tsc --noEmit` passes; series preset loading works without `targetSemesterId`.

### P1-5: Verify `showAnswers` Field Validity in `CreateMiniGameRequest`
**File:** `src/components/minigame/QuizForm.tsx` (lines 34, 560)  
**Backend Contract:** Not explicitly documented in `CreateMiniGameRequest`/`UpdateMiniGameRequest`.  
**Current Frontend:** `MinigameActivityResponse.quiz?.showAnswers` exists, suggesting backend stores it.  
**Risk:** If backend doesn't accept `showAnswers`, it will be silently ignored or cause 400.  
**Implementation:** Requires backend coordination. If backend confirms it doesn't accept `showAnswers`, remove it from QuizForm payload. If confirmed, add it to backend docs.  
**Estimated Effort:** N/A (coordination)  
**Verification:** Backend confirmation.

### P1-6: Parse `points`/`failPoints` as Numbers in `ScoreRulesForm`
**File:** `src/components/events/ScoreRulesForm.tsx` lines 193, 211  
**Current Issue:** `type="number"` inputs bound to `rule.points` (typed `string`) store string values, serialized as JSON string.  
**Backend Contract:** `BigDecimal` expects JSON number.  
**Implementation:**
1. After P1-1 (type change to `number`), update input handlers to use `parseFloat(e.target.value)` or `Number(e.target.value)`
2. Handle empty string → `null` for `failPoints`
3. Handle NaN → fallback to 0
**Estimated Effort:** 15 min  
**Verification:** Test score rule submission payload in DevTools — verify `points` is JSON number, not string.

### P1-7: Add `id` Exclusion to `*UpdateRequest` Types
**File:** `src/types/activity.ts`  
**Backend Contract:** UpdateRequest DTOs should **not** include `id` in the body — the `id` is in the path parameter.  
**Current Frontend:** `StandardActivityUpdateRequest`, `MinigameActivityUpdateRequest`, `SeriesChildActivityUpdateRequest` do not include `id`, but this is implicit. We should make it explicit via documentation or type assertion.  
**Implementation:**
1. Add JSDoc comments to all `*UpdateRequest` types clarifying that `id` must NOT be included in the payload body
2. Optionally add `Omit<..., 'id'>` if any type currently includes it
**Estimated Effort:** 5 min  
**Verification:** Review all update payloads in DevTools to confirm no `id` field is sent.

---

## Remaining Work: P2 — Medium Risk (Next Sprint)

### P2-2: Delete Dead `eventAPI.createEvent` and `eventAPI.updateEvent`
**File:** `src/services/eventAPI.ts` lines 95-139  
**Issue:** `createEvent` (`POST /api/activities`) and `updateEvent` (`PUT /api/activities/{id}`) are no longer called by any consumer. Frontend has migrated to `standardActivityAPI.createStandardActivity` and `standardActivityAPI.updateStandardActivity`.  
**Risk:** Old unified endpoint might not exist anymore. Accidental re-introduction possible.  
**Implementation:**
1. Global search for references to `eventAPI.createEvent` and `eventAPI.updateEvent`
2. Delete both methods if no references found
3. Verify `tsc --noEmit` passes
**Estimated Effort:** 10 min  
**Verification:** Compile passes; no runtime references.

### P2-3: Remove `type` from `SeriesChildActivityCreateRequest` if Backend Doesn't Require It
**File:** `src/types/activity.ts` line 229  
**Issue:** `SeriesChildActivityCreateRequest` includes `type: ActivityType`. Backend docs don't explicitly list this DTO's fields, but `SeriesChildActivityUpdateRequest` (standalone) does **not** have `type`.  
**Implementation:** Verify with backend if `type` is required for child creation. If not, remove it.  
**Estimated Effort:** 5 min + backend coordination  
**Verification:** Backend confirmation + compile passes.

### P2-4: Add TODO Comment for Legacy `ScoreHistorySourceType` Values
**File:** `src/types/score.ts` line 86  
**Issue:** `ScoreHistorySourceType` includes legacy values `'ACTIVITY'`, `'MINIGAME'`, `'MILESTONE'`, `'RECALCULATED'`. New values are `ACTIVITY_PARTICIPATION`, `MINIGAME_ATTEMPT`, etc.  
**Current Frontend:** `getSourceTypeLabel` and `getSourceTypeColor` handle both old and new values defensively.  
**Implementation:** Add a TODO comment to remove legacy values after data migration is confirmed complete.  
**Estimated Effort:** 2 min  
**Verification:** N/A.

### P2-5: Verify `publishActivity`, `unpublishActivity`, `copyActivity`, `deleteEvent` Endpoints Still Exist
**File:** `src/services/eventAPI.ts`  
**Issue:** These endpoints (`PUT /api/activities/{id}/publish`, `PUT /api/activities/{id}/unpublish`, `POST /api/activities/{id}/copy`, `DELETE /api/activities/{id}`) are not explicitly audited in the new backend contract docs.  
**Implementation:** Ask backend team to confirm these endpoints are still active and their behavior is unchanged.  
**Estimated Effort:** N/A (coordination)  
**Verification:** Backend confirmation.

---

## Remaining Work: P3 — Cleanup (Backlog)

### P3-1: Refactor `StandardActivityForm` to Use `BaseEventForm` Directly
**File:** `src/components/events/StandardActivityForm.tsx`  
**Issue:** `StandardActivityForm` is a thin wrapper around `EventForm` (legacy unified form). `EventForm` references `CreateActivityRequest` (legacy type).  
**Implementation:**
1. Inline `StandardActivityForm` logic into `BaseEventForm` or refactor `BaseEventForm` to accept a generic type parameter
2. Update all consumers to use `BaseEventForm` directly
3. Remove `EventForm` wrapper if no longer needed
**Estimated Effort:** 30 min  
**Verification:** Regression test standard activity create/edit flows.

### P3-2: Remove `CreateActivityRequest` Legacy Type and Migrate `BaseEventForm`
**File:** `src/types/activity.ts`, `src/components/events/BaseEventForm.tsx`  
**Issue:** `CreateActivityRequest` is the old unified request type. Still used by `BaseEventForm`/`EventForm` as generic form state type.  
**Implementation:**
1. Migrate `BaseEventForm` to use `StandardActivityCreateRequest` or a generic type parameter `<T extends StandardActivityCreateRequest | MinigameActivityCreateRequest | ...>`
2. Remove `CreateActivityRequest` from `src/types/activity.ts`
3. Update all imports
**Estimated Effort:** 45 min  
**Verification:** Compile passes; all forms work.

### P3-3: Delete `Activity` Legacy Interface and `ActivitySummaryResponse` if Unused
**File:** `src/types/activity.ts`  
**Issue:** `Activity` (old interface with `maxParticipants`, `currentParticipants`, `department` full object, `createdBy` full object) and `ActivitySummaryResponse` are potentially unused.  
**Implementation:**
1. Global search for references to `Activity` and `ActivitySummaryResponse`
2. Delete if unused across the entire codebase
3. Verify `tsc --noEmit` passes
**Estimated Effort:** 15 min  
**Verification:** Global search confirms no references; compile passes.

---

## Execution Strategy

### Phase 1: P1 Fixes (High Risk — Do First)
**Goal:** Fix all production-blocking issues before deployment.  
**Order:**
1. **P1-1** (BigDecimal type change) — Must be done before P1-6 because P1-6 depends on the types being `number`
2. **P1-6** (ScoreRulesForm number parsing) — Depends on P1-1
3. **P1-7** (id exclusion documentation) — Independent, can be done anytime
4. **P1-2** (SeriesProgressBanner runtime guarding) — Independent
5. **P1-4** (Remove targetSemesterId from SeriesPresetPreviewResponse) — Independent
6. **P1-5** (Verify showAnswers with backend) — Requires backend coordination, can be done in parallel

**Commit Strategy:** One commit per P1 item, or group related items (P1-1 + P1-6 together, P1-2 + P1-4 together).

### Phase 2: P2 Fixes (Medium Risk — Next Sprint)
**Goal:** Clean up dead code and verify legacy endpoints.  
**Order:**
1. **P2-2** (Delete dead code) — Quick win, no risk
2. **P2-4** (Add TODO comment) — Quick win
3. **P2-3** + **P2-5** — Requires backend coordination, can be done in parallel

**Commit Strategy:** One commit per P2 item.

### Phase 3: P3 Cleanup (Backlog)
**Goal:** Remove legacy abstractions and simplify the codebase.  
**Order:**
1. **P3-3** (Delete unused types) — Quick win, do first
2. **P3-1** + **P3-2** (Refactor StandardActivityForm + remove CreateActivityRequest) — Related, do together

**Commit Strategy:** One commit for P3-3, one commit for P3-1+P3-2.

### Phase 4: Final Verification
- Run `tsc --noEmit` after each commit
- Run integration tests if available
- Verify all audit report items are marked ✅
- Push to `origin/refactor`

---

## Dependencies & Conflicts

| Task | Depends On | Conflicts With |
|------|-----------|----------------|
| P1-1 | — | None |
| P1-6 | P1-1 | None |
| P1-7 | — | None |
| P1-2 | — | None |
| P1-4 | — | None |
| P1-5 | — | None (backend coordination) |
| P2-2 | — | None (dead code removal) |
| P2-3 | — | None (backend coordination) |
| P2-4 | — | None |
| P2-5 | — | None (backend coordination) |
| P3-1 | P3-2 (recommended) | None |
| P3-2 | — | None |
| P3-3 | — | None |

**Key Insight:** Most P1 tasks are independent and can be done in any order. P1-6 must follow P1-1. P3 tasks are independent of P1/P2 and can be deferred indefinitely.

---

## Verification Checklist (Per Phase)

- [ ] `tsc --noEmit` passes with 0 errors
- [ ] No new warnings introduced
- [ ] All affected files compile correctly
- [ ] Runtime behavior verified (if applicable)
- [ ] Audit report updated with ✅ status
- [ ] Changes committed with descriptive messages
- [ ] Pushed to `origin/refactor`

---

## Risk Assessment

| Phase | Risk Level | Mitigation |
|-------|-----------|------------|
| P1 (BigDecimal types) | **Medium** | Changing `string` → `number` may break existing data fixtures or mock data. Search for all assignments. |
| P1 (SeriesProgressBanner) | **Low** | Adding optional chaining is defensive, no breaking changes. |
| P1 (SeriesPresetPreviewResponse) | **Low** | Removing a field that backend doesn't return anyway. |
| P2 (Delete dead code) | **Low** | Global search confirms no references before deletion. |
| P3 (Refactor forms) | **Medium** | `CreateActivityRequest` is widely used. Must update all imports carefully. |

---

## Estimated Timeline

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| P1 | 6 items | ~1.5 hours |
| P2 | 4 items | ~30 min (excluding backend coordination) |
| P3 | 3 items | ~1.5 hours |
| **Total** | **13 items** | **~3.5 hours** |

---

## Notes

- **Single-Agent Mode Recommended:** All P1 tasks are small (< 30 min each). The overhead of worktree setup and multi-agent coordination exceeds the benefit of parallelization for these small, focused changes.
- **Backend Coordination Required For:** P1-5, P2-3, P2-5. These can be done in parallel with coding tasks.
- **No Greenfield Work:** All changes are refactor/fixes within existing files. No new components, routes, or pages needed.
- **Test Coverage:** No unit tests were found in the audit. Manual verification via `tsc --noEmit` and runtime testing is the primary validation method.
