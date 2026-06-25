# Frontend Refactor Contract Audit Report

**Audit Date:** 2025-01-21  
**Branch:** `refactor`  
**Commit:** `f9f985b`  
**Auditor:** Agent (Kimi Work)  
**Source Documents:**
- `docs/refactor/BACKEND_CONTRACT_AUDIT_REPORT.md` (Backend DTO & endpoint audit)
- `docs/refactor/DELTA_ACTIVITY_API_UPDATE.md` (API delta & migration guide)

**Scope:** Audit the CURRENT frontend implementation against the backend contract documents. Do NOT re-audit backend code. Identify mismatches, produce concrete remediation plan grouped by P0-P3 priorities.

---

## Executive Summary

| Severity | Count | Description |
|----------|-------|-------------|
| **P0 — Breaking** | 4 | HTTP method mismatch, extra field in payload, DTO inheritance mismatch sending rejected fields, missing field type stripping |
| **P1 — High Risk** | 6 | `BigDecimal` string serialization, standalone DTO inheritance pattern, untyped Map consumption, preset field mismatch |
| **P2 — Medium Risk** | 4 | Dead legacy code, `showAnswers` field ambiguity, `EventForm` abstraction leakage, `ActivityPresetConfig` type mismatch |
| **P3 — Cleanup** | 3 | Type re-export confusion, `SeriesChildActivityCreateRequest` type field, `CreateActivityRequest` legacy usage |

**Total Files with Issues:** 12  
**Primary Affected Areas:** `src/services/`, `src/types/`, `src/components/events/`, `src/pages/EditEvent.tsx`, `src/components/minigame/QuizForm.tsx`

---

## Part 1: Endpoint Usage Audit

### 1.1 HTTP Method Mismatch — ✅ Fixed
**File:** `src/services/minigameActivityAPI.ts` (line 26)  
**Issue:** `updateMinigameActivity` uses `api.put(...)` for `PUT /api/activities/minigames/{id}`.  
**Backend Contract:** `BACKEND_CONTRACT_AUDIT_REPORT.md` Section 1.1 states **Frontend must use `PATCH` for full replacement** on `MinigameActivityUpdateRequest`.  
**Impact:** Backend will reject the request with `405 Method Not Allowed` or route to a non-existent handler.  
**Remediation:** ✅ Changed `api.put` → `api.patch` in `minigameActivityAPI.ts` line 26.

### 1.2 Legacy Filter Endpoints — ✅ Confirmed by Backend
**File:** `src/services/eventAPI.ts` (lines 219-300)  
**Issue:** Four endpoints were not explicitly documented in the new `ActivityReadController` section of the contract docs.  
**Backend Confirmation:** Backend team confirmed **all legacy filter endpoints are still preserved** with their original purposes:
- `GET /api/activities/department/{deptId}` — Lấy danh sách sự kiện do một Khoa/Phòng ban tổ chức.
- `GET /api/activities/score-type/{scoreType}` — Lấy danh sách hoạt động dựa theo Loại Điểm (e.g., `REN_LUYEN`).
- `GET /api/activities/month?year=&month=` — Lấy sự kiện trong tháng/năm cụ thể (Calendar View).
- `GET /api/activities/my` — Lấy hoạt động mà sinh viên đã đăng ký/tham gia.
- *(Backend also confirmed `GET /api/activities/upcoming?keyword=` — lấy sự kiện sắp diễn ra; **not yet implemented in frontend**).*
**Impact:** ✅ No risk. All endpoints are active and match the frontend service implementations.  
**Remediation:** None required. Mark as verified. Consider adding `GET /api/activities/upcoming?keyword=` to `eventAPI.ts` if a homepage carousel / search feature is needed.

### 1.3 Standard Read Endpoints — Correct
**File:** `src/services/eventAPI.ts`  
- `getEvent` → `GET /api/activities/{id}` ✅ (matches `ActivityReadController.getById`)
- `getEvents` → `GET /api/activities` ✅ (matches `ActivityReadController.getAll`)
- `publishActivity` / `unpublishActivity` / `copyActivity` / `deleteEvent` → Endpoints not explicitly audited in contract docs, but appear to be preserved. Flag as P2 for verification.

### 1.4 Series Endpoints — Correct
**File:** `src/services/seriesAPI.ts`  
All series endpoints match the documented backend paths:
- `POST /api/series` ✅
- `PUT /api/series/{id}` ✅
- `GET /api/series/{id}` ✅
- `GET /api/series/{id}/activities` ✅
- `POST /api/series/{seriesId}/activities` ✅
- `PUT /api/series/{seriesId}/activities/{activityId}` ✅ (method not explicitly restricted in docs)
- `GET /api/series/{seriesId}/overview` ✅
- `GET /api/series/{seriesId}/progress` ✅
- `GET /api/series/{seriesId}/progress/my` ✅
- `POST /api/series/{seriesId}/register` ✅
- `POST /api/series/{seriesId}/students/{studentId}/calculate-milestone` ✅

### 1.5 Score Endpoints — Correct
**File:** `src/services/scoresAPI.ts`  
- `recalculateAllScores` correctly passes `semesterId` as query parameter (`/api/scores/recalculate/all?semesterId=...`) ✅
- `recalculateStudentScore` correctly passes `semesterId` as query parameter ✅
- `getStudentRanking` correctly builds query parameters ✅
- `getScoreHistory` correctly builds query parameters ✅

### 1.6 Standard & Series Activity Create/Update Endpoints — Correct
**File:** `src/services/standardActivityAPI.ts`  
- `POST /api/activities/standard` ✅
- `PUT /api/activities/standard/{id}` ✅ (backend docs allow `PUT` for standard update)

**File:** `src/services/seriesAPI.ts`  
- `POST /api/series/{seriesId}/activities` ✅
- `PUT /api/series/{seriesId}/activities/{activityId}` ✅

---

## Part 2: DTO Audit

### 2.1 UpdateRequest DTOs Use `extends` Instead of Standalone — ✅ Fixed
**Files:** `src/types/activity.ts` (lines ~128, ~129, ~205)  
**Backend Contract:** `BACKEND_CONTRACT_AUDIT_REPORT.md` explicitly states:
> "ALL `*UpdateRequest` classes are **standalone** (no `extends`)"

**Original Frontend Types:**
```typescript
export interface StandardActivityUpdateRequest extends Omit<StandardActivityCreateRequest, 'type'> {}
export interface MinigameActivityUpdateRequest extends MinigameActivityCreateRequest {}
export interface SeriesChildActivityUpdateRequest extends SeriesChildActivityCreateRequest {}
```

**Updated Frontend Types:**
```typescript
export interface StandardActivityUpdateRequest {
    name: string;
    description?: string | null;
    startDate: string;
    endDate: string;
    location?: string | null;
    bannerUrl?: string | null;
    shareLink?: string | null;
    benefits?: string | null;
    requirements?: string | null;
    contactInfo?: string | null;
    organizerIds?: number[];
}
export interface MinigameActivityUpdateRequest {
    name: string;
    description?: string | null;
    startDate: string;
    endDate: string;
    location?: string | null;
    bannerUrl?: string | null;
    shareLink?: string | null;
    benefits?: string | null;
    requirements?: string | null;
    contactInfo?: string | null;
    organizerIds?: number[];
}
export interface SeriesChildActivityUpdateRequest {
    name: string;
    description?: string | null;
    startDate: string;
    endDate: string;
    location?: string | null;
    order?: number | null;
    bannerUrl?: string | null;
    shareLink?: string | null;
    benefits?: string | null;
    requirements?: string | null;
    contactInfo?: string | null;
    organizerIds?: number[];
}
```

**Impact:** At runtime, TypeScript interfaces are erased. The original frontend sent JSON payloads that included **all fields from the Create request** (minus `type` for standard). The backend `*UpdateRequest` DTOs have **fewer fields** (14 standalone fields) and do **not** include fields like:
- `scoreRules`
- `requiresSubmission`
- `registrationStartDate`
- `registrationDeadline`
- `isImportant`
- `mandatoryForFacultyStudents`
- `ticketQuantity`
- `presetCode`
- `presetConfig`
- `bannerFile` (frontend-only anyway)

If the backend Jackson mapper is configured with `DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES = true`, these extra fields will cause **400 Bad Request** errors. If set to `false`, the backend will silently ignore them, which is also a bug because the frontend expects these fields to update the activity (e.g., `scoreRules` changes would be lost).

**Remediation (P0):** ✅ All three `*UpdateRequest` types redefined as standalone interfaces. `scoreRules` and other create-only fields are no longer included in the type contract.

### 2.2 `SeriesChildActivityUpdateRequest` Includes `type` — P0
**File:** `src/pages/EditEvent.tsx` (line 72)  
**Backend Contract:** `SeriesChildActivityUpdateRequest` standalone class has 13 fields: `id`, `name`, `description`, `startDate`, `endDate`, `location`, `order`, `shareLink`, `bannerUrl`, `benefits`, `requirements`, `contactInfo`, `organizerIds`. **No `type` field.**  
**Frontend:** `EditEvent.tsx` constructs `seriesUpdateData` with `type: event.type ?? ActivityType.SUKIEN`.  
**Impact:** Backend will receive an unknown field `type`. Depending on Jackson config, this may cause 400.  
**Remediation:** ✅ Removed `type` from the payload in `EditEvent.tsx` by destructuring `const { type: _, ...restData } = data` before constructing `seriesUpdateData`.

### 2.3 `BigDecimal` Fields Typed as `string` — P1
**Files:** `src/types/activity.ts` (lines 50, 51, 65, 66), `src/types/presets.ts` (lines 46, 48, 49, 51, 52, 53, 54, 56)  
**Backend Contract:** Backend uses `java.math.BigDecimal`. Jackson typically serializes `BigDecimal` as **JSON number** (e.g., `5.0`) not string.  
**Frontend Types:**
```typescript
points: string;
failPoints?: string | null;
participationPoints?: string | null;
```
**Impact:**
1. **Serialization direction (frontend → backend):** `ScoreRulesForm` binds `<input type="number">` values to `string` type. When JSON is serialized, `"5.0"` (string) is sent instead of `5.0` (number). Backend `BigDecimal` may parse strings, but this is fragile and depends on Jackson configuration.
2. **Deserialization direction (backend → frontend):** Backend sends `5.0` (number). Frontend type says `string`. TypeScript compiles anyway, but runtime type is wrong. If any frontend code does `rule.points.toFixed(2)`, it will fail because `5.0` is a number, not a string.
**Remediation:** Change all `BigDecimal` fields from `string` to `number` (or `number | string` for safety). Update `ScoreRulesForm` to bind to `number` values. Verify `formatScore` helper in `src/types/score.ts` already handles both.

### 2.4 `SeriesResponse` `targetSemesterId` — ✅ Fixed by Backend
**File:** `src/types/series.ts`  
**Backend Update:** Backend team fixed `toSeriesResponse()` to include `response.setTargetSemesterId(...)`. Now `GET /api/series/{id}`, `POST /api/series`, and `PUT /api/series/{id}` all return `targetSemesterId` in the `SeriesResponse` DTO.  
**Frontend:** `SeriesResponse` type includes `targetSemesterId?: number | null`. `EditSeries.tsx` (line 125) uses `series.targetSemesterId`.  
**Impact:** ✅ No longer an issue. The field is now reliably returned on all series read/write operations.  
**Remediation:** None required. Remove P2-1 workaround from action plan if it was added.

### 2.5 `SeriesPresetPreviewResponse` Includes Nonexistent `targetSemesterId` — P1
**File:** `src/types/presets.ts` (line 31)  
**Backend Contract:** Docs explicitly state `targetSemesterId` **does NOT exist** in `SeriesPresetPreviewResponse`.  
**Frontend:**
```typescript
export interface SeriesPresetPreviewResponse {
    ...
    targetSemesterId?: number | null; // ❌ Does not exist in backend
}
```
**Impact:** `SeriesForm.tsx` (line 95) accesses `presetData.targetSemesterId`. If the backend returns it anyway, it works. If not, preset loading silently fails to populate the semester dropdown.  
**Remediation:** Remove `targetSemesterId` from `SeriesPresetPreviewResponse` type. If preset needs to suggest a semester, backend must add it to the contract.

### 2.6 `StudentSeriesProgress` Assumes Fixed DTO — P1
**File:** `src/types/series.ts`  
**Backend Contract:** `GET /api/series/{id}/progress/my` returns `Map<String, Object>` with **no fixed DTO**.  
**Frontend:** Defines a rich typed interface `StudentSeriesProgress` with fields like `minimumRequirementEnabled`, `minimumRequiredEvents`, `minimumRequirementMet`, `remainingToAvoidPenalty`, etc. `SeriesProgressBanner.tsx` consumes this interface.  
**Impact:** If the backend Map keys change or are missing, the frontend will crash or show incorrect data. The `Map` contract is unstable by design.  
**Remediation:** Treat the response as `Record<string, any>` and add runtime validation/guarding before accessing fields. Or ask backend to formalize a `StudentSeriesProgress` DTO.

### 2.7 `ActivityPresetConfig` Point Fields as `string` — P2
**File:** `src/types/presets.ts` (lines 46-56)  
**Backend Contract:** Uses `BigDecimal` for all point fields.  
**Frontend:** All point fields typed as `string | null` (e.g., `participationPoints?: string | null`).  
**Impact:** Same `BigDecimal` string/number mismatch as 2.3. These fields are less actively used than score rules, but will cause the same serialization ambiguity.  
**Remediation:** Change to `number | null`.

### 2.8 `QuizForm` Sends `showAnswers` — P2 (Ambiguity)
**File:** `src/components/minigame/QuizForm.tsx` (line 34, 560)  
**Backend Contract:** The backend docs do not explicitly list `showAnswers` in `CreateMiniGameRequest` or `UpdateMiniGameRequest`. However, `MinigameActivityResponse` (frontend type) includes `quiz?.showAnswers`, suggesting the backend does store it.  
**Impact:** If the backend does not accept `showAnswers`, it will be silently ignored or cause a 400.  
**Remediation:** Verify with backend team whether `showAnswers` is a valid field on `CreateMiniGameRequest`/`UpdateMiniGameRequest`. If not, remove it from the payload.

---

## Part 3: Form Payload Audit

### 3.1 `EditEvent` Sends `scoreRules` in Standard Update — P0
**File:** `src/pages/EditEvent.tsx` (line 88)  
**Issue:** `handleSubmit` calls `standardActivityAPI.updateStandardActivity(eventId, data)` where `data` is `CreateActivityRequest` from `StandardActivityForm`. `data` includes `scoreRules` array.  
**Backend Contract:** `StandardActivityUpdateRequest` is standalone with **no `scoreRules` field**.  
**Impact:** If the backend strictly validates, 400 Bad Request. If it ignores unknown fields, score rule edits are silently lost.  
**Remediation:** ✅ Stripped `scoreRules` from the payload via `const { scoreRules: _, ...updateData } = data` before calling `updateStandardActivity`.

### 3.2 `EditEvent` Sends `scoreRules` in Minigame Update — P0
**File:** `src/pages/EditEvent.tsx` (line 86)  
**Issue:** Same as 3.1 but for minigame. `data` includes `scoreRules`.  
**Backend Contract:** `MinigameActivityUpdateRequest` has no `scoreRules`.  
**Remediation:** ✅ Stripped `scoreRules` from the payload via `const { scoreRules: _, ...updateData } = data` before calling `updateMinigameActivity`.

### 3.3 `EditEvent` Sends `type` in Series Child Update — ✅ Fixed
**File:** `src/pages/EditEvent.tsx` (lines 70-83)  
**Issue:** `seriesUpdateData` includes `type: event.type ?? ActivityType.SUKIEN`.  
**Backend Contract:** `SeriesChildActivityUpdateRequest` has no `type` field.  
**Remediation:** ✅ Removed `type` from the payload via `const { type: _, ...restData } = data` before constructing `seriesUpdateData`.

### 3.4 `BaseEventForm` / `EventForm` Include `scoreRules` in All Payloads — P1
**File:** `src/components/events/BaseEventForm.tsx`, `src/components/events/EventForm.tsx`  
**Issue:** Both forms manage `scoreRules` in form state and pass them through `onSubmit`. This is correct for **create** operations but problematic for **update** operations that use standalone `*UpdateRequest` DTOs without `scoreRules`.  
**Remediation:**
1. In `EditEvent.tsx`, explicitly destruct and omit `scoreRules` from the payload before calling update APIs.
2. Alternatively, update `BaseEventForm` to accept an `omitFields` prop for edit mode, but prefer explicit stripping at the call site.

### 3.5 `SeriesForm` Sends `milestonePoints` as `Record<number, number>` — Correct
**File:** `src/components/series/SeriesForm.tsx`  
**Backend Contract:** Backend expects `Map<Integer, BigDecimal>`. JSON `{"3": 10, "5": 20}` correctly deserializes to `Map<Integer, BigDecimal>`.  
**Status:** ✅ Correct.

### 3.6 `QuizForm` Payload Structure — Needs Verification
**File:** `src/components/minigame/QuizForm.tsx`  
**Payload fields:** `activityId`, `title`, `description`, `questionCount`, `timeLimit`, `requiredCorrectAnswers`, `showAnswers`, `maxAttempts`, `questions`.  
**Backend Contract:** The backend docs do not provide the detailed field list for `CreateMiniGameRequest`/`UpdateMiniGameRequest`. The payload shape looks reasonable, but `showAnswers` is flagged in 2.8.  
**Remediation:** Verify `CreateMiniGameRequest` field list with backend team.

### 3.7 `ScoreRulesForm` Sends `points`/`failPoints` as Strings — P1
**File:** `src/components/events/ScoreRulesForm.tsx` (lines 193, 211)  
**Issue:** `type="number"` inputs are bound to `rule.points` and `rule.failPoints` which are typed as `string`. The HTML input returns a string, which is stored as a string, and serialized as a JSON string.  
**Backend Contract:** `BigDecimal` expects JSON number.  
**Remediation:** Change `points`/`failPoints` to `number` type. Parse inputs with `parseFloat(e.target.value)` before updating state.

---

## Part 4: Response Consumption Audit

### 4.1 `ActivityResponse` Still Used for Read Endpoints — Correct
**File:** `src/types/activity.ts` (lines 282-318)  
**Backend Contract:** `ActivityReadController` returns `ActivityResponse` (legacy read model). The docs confirm this is still the read model.  
**Status:** ✅ Correct. `eventAPI.getEvent` and `eventAPI.getEvents` consume `ActivityResponse` correctly.

### 4.2 `eventAPI.getEventsByDepartment` / `getEventsByScoreType` / `getEventsByMonth` / `getMyEvents` — ✅ Confirmed
**File:** `src/services/eventAPI.ts`  
**Issue:** These endpoints were not explicitly documented in the new `ActivityReadController` section.  
**Backend Confirmation:** All four endpoints are **confirmed preserved** by the backend team with their original filter purposes (see Section 1.2 for full descriptions).  
**Consumers:** These endpoints serve specific frontend features (department profile events, score-type filtering, calendar view, my-activities page).  
**Remediation:** None required. All endpoints verified active.

### 4.3 `SeriesOverviewResponse` Handles Both `milestonePoints` and `milestonePointsMap` — Correct
**File:** `src/types/series.ts`  
**Backend Contract:** Overview response returns `milestonePoints` as JSON string and `milestonePointsMap` as parsed `Map`.  
**Frontend:** `SeriesOverviewResponse` includes both fields. `SeriesForm` and `SeriesDetail` consume `milestonePointsMap` (or the parsed equivalent).  
**Status:** ✅ Correct.

### 4.4 `StudentSeriesProgress` Untyped Map Consumption — P1
**File:** `src/components/series/SeriesProgressBanner.tsx`  
**Issue:** Component assumes a typed interface, but backend returns `Map<String, Object>`.  
**Remediation:** Add runtime null-checking for all fields (`progress?.minimumRequirementEnabled`, `progress?.minimumRequiredEvents`, etc.).

### 4.5 `mapScoreRuleResponseToRequest` Mapping — Correct
**File:** `src/utils/scoreRuleMapper.ts`  
**Mapping:** `targetDepartmentIds` (Response) → `departmentIds` (Request).  
**Backend Contract:** Confirmed correct in docs.  
**Status:** ✅ Correct.

### 4.6 `registrationAPI.checkIn` with `participationType: null` — Correct
**File:** `src/pages/ManagerRegistrations.tsx` (line 93)  
**Backend Contract:** Backend docs confirm `participationType: null` triggers auto-transition `REGISTERED → CHECKED_IN → ATTENDED`.  
**Status:** ✅ Correct.

---

## Part 5: Activity Architecture Audit

### 5.1 `ActivityType` and `ScoreType` Enums — Correct
**File:** `src/types/activity.ts` (lines 4-15)  
**Backend Contract:** Enums match: `SUKIEN`, `CONG_TAC_XA_HOI`, `CHUYEN_DE_DOANH_NGHIEP`, `MINIGAME` for `ActivityType`; `REN_LUYEN`, `CONG_TAC_XA_HOI`, `CHUYEN_DE` for `ScoreType`.  
**Status:** ✅ Correct.

### 5.2 `ScoreRuleTrigger` and `ScoreRuleCalculation` Enums — Correct
**File:** `src/types/activity.ts` (lines 17-33)  
**Backend Contract:** All trigger types (`PARTICIPATION_COMPLETED`, `NO_SHOW`, `SUBMISSION_GRADED`, `MINIGAME_PASSED`, `SERIES_MILESTONE_REACHED`, `TASK_OVERDUE`, `MINIGAME_EXHAUSTED_ATTEMPTS`) and calculations (`FIXED_POINTS`, `COUNT_COMPLETION`, `PASS_FAIL_POINTS`, `PENALTY_POINTS`, `SERIES_MILESTONE`) are present.  
**Status:** ✅ Correct.

### 5.3 `StandardActivityForm` Wraps Legacy `EventForm` — P2
**File:** `src/components/events/StandardActivityForm.tsx`  
**Issue:** `StandardActivityForm` is a thin wrapper around `EventForm`, which was designed for the old unified `CreateActivityRequest` type. While structurally identical today, this is technical debt.  
**Remediation:** Inline `StandardActivityForm` or refactor `EventForm` to accept a generic type parameter. P3 cleanup.

### 5.4 `EventForm` Still Exists as Legacy Component — P2
**File:** `src/components/events/EventForm.tsx`  
**Issue:** `EventForm` is the old unified form. It is still used via `StandardActivityForm`. It references `CreateActivityRequest` (legacy unified type).  
**Remediation:** Deprecate `EventForm` and migrate `StandardActivityForm` to use `BaseEventForm` directly, or refactor `BaseEventForm` to be the single source of truth. P3 cleanup.

### 5.5 `ActivitySummaryResponse` Defined but Unused — P3
**File:** `src/types/activity.ts` (lines 241-253)  
**Issue:** `ActivitySummaryResponse` is typed but has no frontend consumers and no backend endpoint documented in the audit files.  
**Remediation:** Remove if unused, or verify with backend if a summary endpoint is planned. P3.

---

## Part 6: Series Feature Audit

### 6.1 `SeriesChildActivityCreateRequest` Includes `type` — P2
**File:** `src/types/activity.ts` (line 202)  
**Issue:** `SeriesChildActivityCreateRequest` has `type: ActivityType`. Backend docs do not explicitly list this DTO's fields, but the `SeriesChildActivityUpdateRequest` does not have `type`. It's ambiguous whether `type` should be in the create request.  
**Remediation:** Verify with backend if `type` is required for child creation. If not, remove it.

### 6.2 `SeriesChildActivityUpdateRequest` Extends Create Request — P0
**File:** `src/types/activity.ts` (line 205)  
**Issue:** Already covered in 2.1 and 2.2. The `extends` pattern is the root cause of the `type` field being sent in updates.

### 6.3 `SeriesForm` Milestone Points Handling — Correct
**File:** `src/components/series/SeriesForm.tsx`  
- Uses `Record<number, number>` for `milestonePoints` ✅
- Correctly serializes to JSON object with integer keys ✅
- Handles `minimumRequirementEnabled`, `minimumRequiredEvents`, `minimumPenaltyPoints` ✅
- Includes `targetSemesterId` which matches `CreateSeriesRequest`/`UpdateSeriesRequest` ✅

### 6.4 `SeriesProgressBanner` Assumes Typed Progress — P1
**File:** `src/components/series/SeriesProgressBanner.tsx`  
**Issue:** Already covered in 2.6 and 4.4. Consumes `StudentSeriesProgress` typed interface, but backend returns `Map<String, Object>`.

### 6.5 `AddActivityToSeriesRequest` — Correct
**File:** `src/services/seriesAPI.ts` (line 205)  
- Endpoint: `POST /api/series/{seriesId}/activities/attach` ✅
- Payload: `{ activityId, order }` ✅

---

## Part 7: Legacy Dependency Audit

### 7.1 `eventAPI.createEvent` and `eventAPI.updateEvent` — Dead Code — P2
**File:** `src/services/eventAPI.ts` (lines 95-139)  
**Issue:** `createEvent` (`POST /api/activities`) and `updateEvent` (`PUT /api/activities/{id}`) are no longer called by any consumer. The frontend has migrated to `standardActivityAPI.createStandardActivity` and `standardActivityAPI.updateStandardActivity`.  
**Impact:** Risk of accidental re-introduction. The old unified endpoint `POST /api/activities` might not exist anymore (replaced by `POST /api/activities/standard`).  
**Remediation:** Delete `createEvent` and `updateEvent` methods from `eventAPI.ts`. If the legacy endpoint is still needed for some edge case, document it explicitly.

### 7.2 `CreateActivityRequest` Legacy Type Still Used — P3
**File:** `src/types/activity.ts` (lines 255-280)  
**Issue:** `CreateActivityRequest` is the old unified request type. It is still used by `EventForm` and `BaseEventForm` as the generic form type.  
**Remediation:** Migrate `BaseEventForm` to use `StandardActivityCreateRequest` or a generic type parameter. P3 cleanup.

### 7.3 `Activity` Legacy Interface — P3
**File:** `src/types/activity.ts` (lines 321-340)  
**Issue:** Old `Activity` interface with fields like `maxParticipants`, `currentParticipants`, `department` (full object), `createdBy` (full object). Not used in any new code.  
**Remediation:** Delete if unused across the codebase. P3 cleanup.

### 7.4 `ScoreHistorySourceType` Legacy Enum Values — P2
**File:** `src/types/score.ts` (line 86)  
**Issue:** `ScoreHistorySourceType` includes legacy values `'ACTIVITY'`, `'MINIGAME'`, `'MILESTONE'`, `'RECALCULATED'`. New values are `ACTIVITY_PARTICIPATION`, `MINIGAME_ATTEMPT`, etc. The `getSourceTypeLabel` and `getSourceTypeColor` helpers handle both old and new values, which is defensive but indicates lingering legacy data.  
**Remediation:** Keep the dual mapping for backward compatibility, but add a TODO comment to remove legacy values after data migration is confirmed complete.

---

## Part 8: Corrective Action Plan

### P0 — Breaking (Fix Before Next Deploy)

| # | Action | File(s) | Est. Effort | Verification |
|---|--------|---------|-------------|--------------|
| P0-1 | ✅ **DONE** — Changed `PUT` → `PATCH` in `minigameActivityAPI.updateMinigameActivity` | `src/services/minigameActivityAPI.ts:26` | 5 min | `tsc --noEmit` passes |
| P0-2 | ✅ **DONE** — Stripped `type` from `seriesUpdateData` in `EditEvent.tsx` | `src/pages/EditEvent.tsx:72` | 5 min | `tsc --noEmit` passes; series child edit works |
| P0-3 | ✅ **DONE** — Stripped `scoreRules` from standard/minigame update payloads in `EditEvent.tsx` | `src/pages/EditEvent.tsx:86,88` | 10 min | `tsc --noEmit` passes; score rules no longer sent in update |
| P0-4 | ✅ **DONE** — Redefined `*UpdateRequest` types as standalone interfaces matching backend fields | `src/types/activity.ts:128,129,205` | 30 min | `tsc --noEmit` passes; all consumers compile

### P1 — High Risk (Fix Before Production)

| # | Action | File(s) | Est. Effort | Verification |
|---|--------|---------|-------------|--------------|
| P1-1 | Change `BigDecimal` fields from `string` → `number` in `ActivityScoreRuleRequest`, `ActivityScoreRuleResponse`, `ActivityPresetConfig` | `src/types/activity.ts`, `src/types/presets.ts` | 20 min | Test score rule CRUD; verify `ScoreRulesForm` binds correctly |
| P1-2 | Add runtime guarding in `SeriesProgressBanner` for `Map<String, Object>` response | `src/components/series/SeriesProgressBanner.tsx` | 15 min | Test with malformed backend response |
| P1-3 | ~~Verify status of legacy filter endpoints~~ — **RESOLVED** ✅ Backend confirmed all endpoints (`getEventsByDepartment`, `getEventsByScoreType`, `getEventsByMonth`, `getMyEvents`) are still active. | `src/services/eventAPI.ts` | N/A | Backend confirmation received |
| P1-4 | Remove `targetSemesterId` from `SeriesPresetPreviewResponse` | `src/types/presets.ts:31` | 5 min | Test series preset loading |
| P1-5 | Verify `showAnswers` field validity in `CreateMiniGameRequest` with backend | `src/components/minigame/QuizForm.tsx` | N/A (coordination) | Backend confirmation |
| P1-6 | Parse `points`/`failPoints` as numbers in `ScoreRulesForm` | `src/components/events/ScoreRulesForm.tsx:193,211` | 10 min | Test score rule submission payload in DevTools |
| P1-7 | Add `id` exclusion to `*UpdateRequest` types (ensure `id` is not in body) | `src/types/activity.ts` | 10 min | Verify update payloads in DevTools |

### P2 — Medium Risk (Fix in Next Sprint)

| # | Action | File(s) | Est. Effort | Verification |
|---|--------|---------|-------------|--------------|
| P2-1 | ~~Work around `SeriesResponse.targetSemesterId` backend bug~~ — **RESOLVED** ✅ Backend fixed `toSeriesResponse()` to include `targetSemesterId`. No frontend workaround needed. | `src/pages/admin/EditSeries.tsx` | N/A | N/A |
| P2-2 | Delete dead `eventAPI.createEvent` and `eventAPI.updateEvent` | `src/services/eventAPI.ts:95-139` | 10 min | Global search for references; compile passes |
| P2-3 | Remove `type` from `SeriesChildActivityCreateRequest` if backend doesn't require it | `src/types/activity.ts:202` | 5 min | Backend confirmation |
| P2-4 | Add TODO comment for legacy `ScoreHistorySourceType` values | `src/types/score.ts:86` | 5 min | N/A |
| P2-5 | Verify `publishActivity`, `unpublishActivity`, `copyActivity`, `deleteEvent` endpoints still exist | `src/services/eventAPI.ts` | N/A (coordination) | Backend confirmation |

### P3 — Cleanup (Backlog)

| # | Action | File(s) | Est. Effort | Verification |
|---|--------|---------|-------------|--------------|
| P3-1 | Refactor `StandardActivityForm` to use `BaseEventForm` directly instead of `EventForm` | `src/components/events/StandardActivityForm.tsx` | 30 min | Regression test standard activity create/edit |
| P3-2 | Remove `CreateActivityRequest` legacy type and migrate `BaseEventForm` to generic param | `src/types/activity.ts`, `src/components/events/BaseEventForm.tsx` | 45 min | Compile passes; all forms work |
| P3-3 | Delete `Activity` legacy interface and `ActivitySummaryResponse` if unused | `src/types/activity.ts` | 15 min | Global search for references; compile passes |

---

## Appendix: Quick Reference — Frontend ↔ Backend Field Mapping

| Frontend Type | Backend DTO | Mismatch | Severity |
|---------------|-------------|----------|----------|
| `StandardActivityUpdateRequest` | `StandardActivityUpdateRequest` | Frontend `extends Create`; backend standalone. Sends extra `scoreRules`, `requiresSubmission`, etc. | P0 |
| `MinigameActivityUpdateRequest` | `MinigameActivityUpdateRequest` | Same `extends` pattern. Sends extra fields. | P0 |
| `SeriesChildActivityUpdateRequest` | `SeriesChildActivityUpdateRequest` | Same `extends` pattern. Sends `type` which backend doesn't have. | P0 |
| `points` / `failPoints` | `BigDecimal` | Frontend `string`, backend number. | P1 |
| `SeriesResponse.targetSemesterId` | `SeriesResponse` | ✅ Backend fixed `toSeriesResponse()` to include `targetSemesterId`. | — |
| `SeriesPresetPreviewResponse.targetSemesterId` | `SeriesPresetPreviewResponse` | Backend docs say field does NOT exist. | P1 |
| `StudentSeriesProgress` | `Map<String, Object>` | Frontend assumes fixed DTO; backend returns untyped Map. | P1 |
| `ActivityPresetConfig.*Points` | `BigDecimal` | Frontend `string`, backend number. | P2 |
| `showAnswers` (QuizForm) | `CreateMiniGameRequest`? | Not confirmed in backend docs. | P2 |

---

## Appendix: Endpoint Mapping Matrix

| Frontend Service Method | HTTP | Path | Backend Controller | Backend Method | Status |
|------------------------|------|------|-------------------|----------------|--------|
| `eventAPI.getEvents` | GET | `/api/activities` | `ActivityReadController` | `getAll` | ✅ |
| `eventAPI.getEvent` | GET | `/api/activities/{id}` | `ActivityReadController` | `getById` | ✅ |
| `eventAPI.getEventsByDepartment` | GET | `/api/activities/department/{id}` | `Legacy Filter` | `getByDepartment` | ✅ Confirmed |
| `eventAPI.getEventsByScoreType` | GET | `/api/activities/score-type/{type}` | `Legacy Filter` | `getByScoreType` | ✅ Confirmed |
| `eventAPI.getEventsByMonth` | GET | `/api/activities/month` | `Legacy Filter` | `getByMonth` | ✅ Confirmed |
| `eventAPI.getMyEvents` | GET | `/api/activities/my` | `Legacy Filter` | `getMyEvents` | ✅ Confirmed |
| `standardActivityAPI.createStandardActivity` | POST | `/api/activities/standard` | `StandardActivityController` | `createStandardActivity` | ✅ |
| `standardActivityAPI.updateStandardActivity` | PUT | `/api/activities/standard/{id}` | `StandardActivityController` | `updateStandardActivity` | ✅ |
| `minigameActivityAPI.createMinigameActivity` | POST | `/api/activities/minigames` | `MinigameActivityController` | `createMinigameActivity` | ✅ |
| `minigameActivityAPI.updateMinigameActivity` | **PUT** | `/api/activities/minigames/{id}` | `MinigameActivityController` | `updateMinigameActivity` | **❌ P0** Must be PATCH |
| `seriesAPI.createSeries` | POST | `/api/series` | `SeriesController` | `createSeries` | ✅ |
| `seriesAPI.updateSeries` | PUT | `/api/series/{id}` | `SeriesController` | `updateSeries` | ✅ |
| `seriesAPI.createActivityInSeries` | POST | `/api/series/{id}/activities` | `SeriesController` | `createChildActivityInSeries` | ✅ |
| `seriesAPI.updateActivityInSeries` | PUT | `/api/series/{id}/activities/{aid}` | `SeriesController` | `updateChildActivityInSeries` | ✅ |
| `seriesAPI.getSeriesOverview` | GET | `/api/series/{id}/overview` | `SeriesController` | `getSeriesOverview` | ✅ |
| `seriesAPI.getSeriesProgress` | GET | `/api/series/{id}/progress` | `SeriesController` | `getSeriesProgress` | ✅ |
| `scoresAPI.recalculateAllScores` | POST | `/api/scores/recalculate/all?semesterId=...` | `ScoreController` | `recalculateAllScores` | ✅ |
| `scoresAPI.recalculateStudentScore` | POST | `/api/scores/recalculate/student/{id}?semesterId=...` | `ScoreController` | `recalculateStudentScore` | ✅ |

---

*End of Report*
