# Frontend Handoff: CampusLifeReact Refactor

> **Scope:** Frontend-only changes from commit `0c6b38e` to current HEAD on the `refactor` branch.  
> **Audience:** Frontend developers joining the CampusLifeReact project.  
> **Organized by:** User-facing features and frontend architecture, not by commit.

---

## Executive Summary

This handoff documents the major frontend refactor that transitions CampusLife from a single unified activity model to a **specialized activity architecture** (Standard, Minigame, Series Child). The frontend now supports:

- **Split activity creation flows** with distinct forms and API endpoints for each activity variant.
- **Dynamic score rules engine** with preset-based configuration, live preview, and trigger-aware validation.
- **Series-first UX** where series child activities hide per-activity scoring and delegate to series milestone/penalty logic.
- **Backend-contract-driven TypeScript types** matching the new API surface (BigDecimal as `string`, `ApiResponse` wrapper normalization, explicit DTOs).

Key architectural changes include 54 modified files (+1,927 / −739 lines), zero remaining legacy write calls (`eventAPI.createEvent` / `updateEvent` are fully retired), and full TypeScript compilation (`tsc --noEmit`) with zero errors.

---

## Admin / Manager Features

### 1. Activity Management — Standard, Minigame, Series Child

#### 1.1 Create Flows

| Variant | Page / Component | API Endpoint | DTO |
|---------|------------------|-------------|-----|
| **Standard Activity** | `pages/CreateEvent.tsx` → `EventForm` | `POST /api/activities/standard` | `StandardActivityCreateRequest` |
| **Minigame Activity** | `pages/CreateMinigameWizard.tsx` → `MinigameActivityForm` | `POST /api/activities/minigames` | `MinigameActivityCreateRequest` |
| **Series Child** | `components/series/SeriesDetail.tsx` → `SeriesActivityForm` | `POST /api/series/{seriesId}/activities` | `SeriesChildActivityCreateRequest` |

- **CreateEvent** (`EventForm`) now has a preset selector dropdown that auto-fills `type`, `requiresSubmission`, and `scoreRules` from the selected preset. It is explicitly labeled for **standard events only** (no Mini Game creation from this form).
- **MinigameActivityForm** (`BaseEventForm` with `mode='minigame'`) auto-selects the `MINIGAME_PASS_ONLY` preset on initial load if available.
- **SeriesActivityForm** (`BaseEventForm` with `mode='series'`) omits the score rules section entirely because series children do not have per-activity scoring. The form shows a read-only `type` field (SUKIEN or MINIGAME) set from the wizard step.

#### 1.2 Edit Flows

`EditEvent.tsx` now routes to the correct form based on the loaded activity:

```tsx
if (event.seriesId)       → <SeriesActivityForm />
else if (event.type === MINIGAME) → <MinigameActivityForm />
else                              → <EventForm />
```

- **Series children** are edited via `seriesAPI.updateActivityInSeries(seriesId, activityId, data)` (new endpoint).
- **Minigames** use `minigameActivityAPI.updateMinigameActivity`.
- **Standard activities** use `standardActivityAPI.updateStandardActivity`.

> **Legacy `eventAPI.updateEvent` is no longer called anywhere.** The legacy `ActivityResponse` read model is still used for reads until the backend provides split read endpoints.

---

### 2. Score Rules Refactor

#### 2.1 Score Rules Form (`ScoreRulesForm.tsx`)

- **Dynamic trigger→calculation mapping**: When a trigger changes, the form auto-selects the only valid calculation (e.g., `NO_SHOW` → `PENALTY_POINTS`, `SUBMISSION_GRADED` → `PASS_FAIL_POINTS`). The calculation dropdown is filtered to show only valid options per trigger.
- **Smart field visibility**:
  - Penalty-only triggers (`NO_SHOW`, `TASK_OVERDUE`, `MINIGAME_EXHAUSTED_ATTEMPTS`) hide the `points` field and show `failPoints` (with a red label indicating backend will record a deduction).
  - `SUBMISSION_GRADED` shows both pass and fail points.
  - Positive triggers show only `points`.
- **Live preview card**: A new blue banner at the top of the rules section renders a `ScoreRulesDisplay` preview of the current rules so managers can see the final configuration before saving.
- **Semester selector**: `EXPLICIT_SEMESTER` now uses a real `<select>` populated from `GET /api/academic/semesters` instead of a raw number input. The `CURRENT_OPEN_SEMESTER` option has been removed from the enum.
- **Department targeting**: The `departmentIds` multi-select is now populated from `departmentAPI.getDepartments()`.

#### 2.2 Preset Integration

- **Activity presets**: `GET /api/activities/presets` → dropdown in `EventForm` and `BaseEventForm`. Selecting a preset calls `POST /api/activities/presets/preview` to fetch the implied rules and auto-fill the form.
- **Series presets**: `GET /api/series/presets` → dropdown in `SeriesForm`. Selecting a preset calls `POST /api/series/presets/preview` to auto-fill `milestonePoints`, `scoreType`, and minimum requirement fields.
- **Preview component**: `ActivityScoreRulePreview.tsx` renders a table of the preset’s implied score rules before the manager commits.

#### 2.3 Validation Rules (Enforced in `BaseEventForm` / `EventForm`)

| Rule | Error Message |
|------|--------------|
| `requiresSubmission = true` but no `PASS_FAIL_POINTS` rule with `failPoints` | "Sự kiện yêu cầu nộp bài thu hoạch phải có ít nhất một luật tính điểm Đạt/Trượt và có cấu hình điểm trượt hợp lệ." |
| `CHUYEN_DE_DOANH_NGHIEP` type with `NO_SHOW` + `CHUYEN_DE` scoreType | "Sự kiện Chuyên đề doanh nghiệp không được cấu hình luật phạt vắng mặt (No-show) bằng điểm Chuyên đề. Vui lòng chọn loại điểm phạt khác." |
| `MINIGAME` type in standard `EventForm` | "Không thể tạo hoặc lưu Mini Game từ form sự kiện thường này." |

#### 2.4 Score Rules Display (`ScoreRulesDisplay.tsx`)

- Updated to handle penalty-only triggers: displays `-{failPoints}` in red instead of `+{points}` in green.
- Pass/fail rules now show both `+points` and `Trượt: -failPoints` stacked.
- Fixed `targetDepartmentIds` vs `departmentIds` mismatch (display now accepts both keys for compatibility).
- Added new trigger labels: `NO_SHOW`, `TASK_OVERDUE`, `MINIGAME_EXHAUSTED_ATTEMPTS`.

---

### 3. Edit Page Improvements (`EditEvent.tsx`)

- **Score rule mapping**: When loading an activity for edit, `scoreRules` from the response are mapped through `mapScoreRuleResponseToRequest` to convert `targetDepartmentIds` (response) → `departmentIds` (request) so the form can pre-populate correctly.
- **Preset override**: `presetCode: 'CUSTOM'` is injected into edit payloads to tell the backend **not** to regenerate rules from the original preset.
- **Split form rendering**: As described in §1.2, the edit page now renders the correct specialized form instead of a one-size-fits-all `EventForm`.

---

### 4. Dashboard & Management

#### 4.1 Admin Tools (`pages/admin/AdminTools.tsx`) — NEW

A new admin-only page with two system maintenance cards:

1. **Trigger Check Overdue** (`POST /api/admin/system/trigger-check-overdue`) — Manually runs the Quartz overdue scan on all student tasks.
2. **Cleanup Orphan Data** (`POST /api/admin/system/cleanup-orphan-data`) — Removes orphaned files and invalid drafts.

Both actions show loading spinners and toast notifications.

#### 4.2 Score Recalculation (`pages/ManagerScores.tsx`)

- **Recalculate all students**: New button opens a confirmation dialog, then calls `POST /api/scores/recalculate/all`. A full-screen overlay blocks the UI while the backend processes (can take minutes). Requires a semester to be selected.
- **Recalculate single student**: Inside the score history modal, a per-student button calls `POST /api/scores/recalculate/student/{studentId}?semesterId={id}` and invalidates the React Query cache for that student’s history.
- **Ranking format fix**: `StudentRankingResponse.score` changed from `number` to `string` (BigDecimal compatibility). The `formatScore()` utility is used for display.

---

## Student Features

### 1. Activity Experience

#### 1.1 Score Type Display

All activity list/detail pages (`EventList`, `StudentEvents`, `StudentEventDetail`, `EventDetail`) now derive the displayed score type from `scoreRules` instead of the legacy `scoreType` field:

```tsx
{event.scoreRules && event.scoreRules.length > 0
    ? Array.from(new Set(event.scoreRules.map(r => r.scoreType)))
        .map(type => getScoreTypeLabel(type))
        .join(', ')
    : 'Không cộng điểm'}
```

This supports activities that grant multiple score types simultaneously (e.g., both `REN_LUYEN` and `CONG_TAC_XA_HOI`).

#### 1.2 Series Score Hiding

In `StudentEventDetail` and `EventDetail`, if `event.seriesId` is set, the score rules section is replaced with an info banner:

> ℹ️ Hoạt động thuộc chuỗi sự kiện. Điểm số sẽ tính theo tiến độ của chuỗi sự kiện.

The individual activity’s score rules are **not** displayed because the backend calculates points at the series milestone level, not per child activity.

#### 1.3 Optional Tasks Badge

Tasks with `requiresSubmission === false` now show a gray **"Tùy chọn"** badge in the student task list. Deadlines are hidden for optional tasks.

#### 1.4 Registration Status: `WAITLIST`

Added to `RegistrationStatus` enum and UI color/label maps in `StudentEventDetail` and `StudentEvents`:
- Label: `Danh sách chờ`
- Color: `bg-purple-100 text-purple-800`

---

### 2. Minigame Experience

#### 2.1 Quiz Creation

`QuizForm.tsx` now includes a toggle for **`showAnswers`** ("Hiển thị đáp án đúng sau khi nộp bài"). This is sent to the backend in `CreateMiniGameRequest` / `UpdateMiniGameRequest`.

> **Student impact:** If `showAnswers` is `false`, the backend will **not** return `isCorrect` flags in the attempt detail response. The frontend must **not** render correct answers unless the flag is `true`.

#### 2.2 Score Rule Triggers

New minigame-specific triggers are available in the score rules form:
- `MINIGAME_PASSED` — positive points when student passes the quiz.
- `MINIGAME_EXHAUSTED_ATTEMPTS` — penalty points when student runs out of attempts without passing.

---

### 3. Series Experience

#### 3.1 Series Progress Banner (`SeriesProgressBanner.tsx`) — NEW

Rendered in `StudentEventDetail` when `seriesId` is present. It loads `GET /api/series/{seriesId}/progress/my` and shows:

- **Met**: Green banner congratulating the student.
- **Not Met**: Yellow warning banner showing how many more events are needed (`remainingToAvoidPenalty`) and the penalty amount.

The banner only renders if `minimumRequirementEnabled` is `true`.

#### 3.2 Series Child Form (`SeriesActivityForm`)

When creating a series child activity, the form:
- Shows a read-only activity type field (set from the wizard step).
- Disables `scoreRules` section entirely (mode === `'series'`).
- Uses `SeriesChildActivityCreateRequest` type, which omits registration/ticket fields (inherited from the series).

---

## Frontend Architecture Changes

### 1. New Components

| Component | Path | Purpose |
|-----------|------|---------|
| `StandardActivityForm` | `components/events/StandardActivityForm.tsx` | Thin wrapper over `EventForm` for standard activity creation (dedicated route/semantics). |
| `ActivityScoreRulePreview` | `components/events/ActivityScoreRulePreview.tsx` | Table-based preview of a preset’s implied score rules. |
| `SeriesProgressBanner` | `components/series/SeriesProgressBanner.tsx` | Student-facing banner for series minimum requirement status. |
| `AdminTools` | `pages/admin/AdminTools.tsx` | Admin system maintenance page (overdue trigger, cleanup). |

### 2. Refactored Components

| Component | Key Changes |
|-----------|-------------|
| `EventForm` | Added preset selector, removed `scoreType` field, removed `MINIGAME` from `<select>`, added `failPoints` validation for submission events, added `CHUYEN_DE` no-show validation. |
| `BaseEventForm` | Added preset loading + auto-fill for minigame mode, removed `scoreType` from default data, added `ScoreRulesForm` with `departments` prop, removed `scoreRules` section when `mode === 'series'`. |
| `MinigameActivityForm` | Removed `scoreType` field, expanded `location` to `md:col-span-2`. |
| `SeriesActivityForm` | Added read-only type field, fixed `type` to respect `isMinigame` prop, removed `scoreType` from default data. |
| `ScoreRulesForm` | Added `handleTriggerChange` with auto-calculation, dynamic field visibility, live preview card, semester dropdown, department targeting. |
| `ScoreRulesDisplay` | Added penalty-only display logic, pass/fail stacked display, new trigger labels. |
| `QuizForm` | Added `showAnswers` toggle. |
| `SeriesForm` | Added preset selector, changed `milestonePoints` from `string` (JSON) to `Record<number, number>`, added `minimumRequirementEnabled` / `minimumRequiredEvents` / `minimumPenaltyPoints` fields, added validation for minimum requirements. |
| `SeriesDetail` | Added `targetSemesterId` read-only display, added minimum requirement config display. |
| `TaskList` | Removed local `isOverdue()` function; overdue status is now driven entirely by `TaskStatus.OVERDUE` from the backend. |
| `ManagerScores` | Added recalculate buttons, confirmation dialog, full-screen loading overlay, `useQueryClient` invalidation. |
| `StudentTasks` | Added `OVERDUE` filter/tab, added `OVERDUE` colors, added `Tùy chọn` badge for optional tasks, removed client-side deadline comparison for overdue status. |
| `CreateEvent` | Updated title to "Tạo sự kiện thường mới". |
| `EditEvent` | Added branch-based form routing, `mapScoreRuleResponseToRequest`, `presetCode: 'CUSTOM'`. |
| `StudentEventDetail` | Added series progress banner loading, `WAITLIST` status, score type from `scoreRules`, optional task badge, series score hiding. |
| `StudentEvents` | Score type from `scoreRules`, `WAITLIST` status, series badge. |
| `EventList` | Score type from `scoreRules`. |
| `EventDetail` | Score type from `scoreRules`, series score hiding. |
| `ManagerRegistrations` | Updated `checkIn` payload to include `studentId` and `participationType` (null for BE auto-transition). |

### 3. Shared Components

- `ScoreRulesForm` and `ScoreRulesDisplay` are now shared across `EventForm`, `BaseEventForm`, and `MinigameActivityForm`.
- `OrganizerSelector` is unchanged but continues to be used by all form variants.
- `LoadingSpinner` is reused in `AdminTools`.

### 4. Form Architecture

```
BaseEventForm (mode: 'normal' | 'minigame' | 'series')
├── renderFields() callback
├── Preset selector (mode !== 'series' && mode !== 'minigame' in edit)
├── ScoreRulesForm (mode !== 'series')
│   ├── Live preview (ScoreRulesDisplay)
│   ├── Dynamic trigger/calculation mapping
│   └── Department + semester targeting
└── Standard validation (dates, tickets, organizers)

EventForm extends BaseEventForm (mode='normal')
MinigameActivityForm extends BaseEventForm (mode='minigame')
SeriesActivityForm extends BaseEventForm (mode='series')
```

### 5. API Service Layer

#### 5.1 New Services

| Service | Path | Endpoints |
|---------|------|-----------|
| `standardActivityAPI` | `services/standardActivityAPI.ts` | `POST /api/activities/standard`, `PUT /api/activities/standard/{id}` |
| `minigameActivityAPI` | `services/minigameActivityAPI.ts` | `POST /api/activities/minigames`, `PUT /api/activities/minigames/{id}` |

#### 5.2 Updated Services

| Service | Changes |
|---------|---------|
| `eventAPI` | Added `getActivityPresets` (`GET /api/activities/presets`), `previewActivityPreset` (`POST /api/activities/presets/preview`). Fixed raw-list endpoints (`getEventsByDepartment`, `getEventsByScoreType`, `getEventsByMonth`, `getMyEvents`) to normalize array responses. |
| `seriesAPI` | Added `getSeriesPresets`, `previewSeriesPreset`, `updateActivityInSeries`, `getActivityInSeries`. |
| `scoresAPI` | Added `recalculateStudentScore` (`POST /api/scores/recalculate/student/{id}`), `recalculateAllScores` (`POST /api/scores/recalculate/all`). Removed `mockSemesterScores` mock data. |
| `registrationAPI` | `checkIn` now accepts `ActivityParticipationRequest` (includes `studentId`, `participationType`). |
| `adminAPI` (`systemAPI`) | Added `triggerCheckOverdue`, `cleanupOrphanData`. |

#### 5.3 Legacy API Retirement

- `eventAPI.createEvent` and `eventAPI.updateEvent` are **no longer called** anywhere in the frontend.
- `eventAPI` still handles **reads** (`getEvents`, `getEventById`, etc.) because the backend read endpoints still return `ActivityResponse`.

### 6. TypeScript Model Changes

#### 6.1 New Types (`src/types/`)

| File | New Types |
|------|-----------|
| `presets.ts` | `ActivityPresetCode`, `SeriesPresetCode`, `ActivityPresetPreviewResponse`, `SeriesPresetPreviewResponse`, `ActivityPresetDefinition`, `ActivityPresetConfig` |
| `activity.ts` | `StandardActivityCreateRequest`, `StandardActivityUpdateRequest`, `StandardActivityResponse`, `MinigameActivityCreateRequest`, `MinigameActivityUpdateRequest`, `MinigameActivityResponse`, `SeriesChildActivityCreateRequest`, `SeriesChildActivityUpdateRequest`, `SeriesChildActivityResponse`, `ActivitySummaryResponse` |
| `score.ts` | `StudentRankResponse` (added), `score` changed to `string` in `StudentRankingResponse` |
| `registration.ts` | `WAITLIST` added to `RegistrationStatus` enum, `ActivityParticipationRequest` updated (`participationType?: ParticipationType \| null`, `pointsEarned?: string \| null`) |
| `task.ts` | `OVERDUE` added to `TaskStatus` enum and helpers |
| `series.ts` | `milestonePoints` changed from `string` → `Record<number, number>`, added `minimumRequirementEnabled`, `minimumRequiredEvents`, `minimumPenaltyPoints`, `targetSemesterId`, `presetCode`, `presetConfig`, `StudentSeriesProgress` fields for minimum requirements. Removed `parseMilestonePoints` / `formatMilestonePoints` helpers. |

#### 6.2 Enum Additions

| Enum | New Values |
|------|------------|
| `ScoreRuleTrigger` | `NO_SHOW`, `TASK_OVERDUE`, `MINIGAME_EXHAUSTED_ATTEMPTS` |
| `ScoreSemesterPolicy` | Removed `CURRENT_OPEN_SEMESTER` |
| `ScoreEntrySourceType` | `SERIES_MINIMUM_REQUIREMENT` |
| `RegistrationStatus` | `WAITLIST` |
| `TaskStatus` | `OVERDUE` |

### 7. Validation

Validation rules are split between forms and the new `scoreRuleHelpers.ts` utility module:

| Helper | Purpose |
|--------|---------|
| `PENALTY_ONLY_TRIGGERS` | Triggers that only deduct points (no positive `points` field). |
| `PASS_FAIL_TRIGGERS` | Triggers that support both pass and fail points. |
| `POSITIVE_ONLY_TRIGGERS` | Triggers that only award points. |
| `REQUIRES_FAIL_POINTS` | Triggers where `failPoints` is mandatory. |
| `getDefaultCalculationForTrigger(trigger)` | Returns the correct `ScoreRuleCalculation` for a trigger. |
| `getValidCalculationsForTrigger(trigger)` | Returns the allowed calculations for a trigger (used to filter the `<select>`). |
| `mapScoreRuleResponseToRequest(rule)` | Converts a response rule to a request rule (e.g., `targetDepartmentIds` → `departmentIds`). |

---

## API Integration Changes

### 1. New Endpoints (Integrated)

| Method | Endpoint | Used In |
|--------|----------|---------|
| `GET` | `/api/activities/presets` | `EventForm`, `BaseEventForm` |
| `POST` | `/api/activities/presets/preview` | `EventForm`, `BaseEventForm` |
| `POST` | `/api/activities/standard` | `CreateEvent` (via `standardActivityAPI`) |
| `PUT` | `/api/activities/standard/{id}` | `EditEvent` (via `standardActivityAPI`) |
| `POST` | `/api/activities/minigames` | `CreateMinigameWizard` (via `minigameActivityAPI`) |
| `PUT` | `/api/activities/minigames/{id}` | `EditEvent` (via `minigameActivityAPI`) |
| `GET` | `/api/series/presets` | `SeriesForm` |
| `POST` | `/api/series/presets/preview` | `SeriesForm` |
| `PUT` | `/api/series/{id}/activities/{activityId}` | `EditEvent` (series child edit) |
| `GET` | `/api/series/{id}/activities/{activityId}` | `EditEvent` (series child detail load) |
| `GET` | `/api/series/{id}/progress/my` | `StudentEventDetail` (series banner) |
| `POST` | `/api/scores/recalculate/student/{id}` | `ManagerScores` |
| `POST` | `/api/scores/recalculate/all` | `ManagerScores` |
| `POST` | `/api/admin/system/trigger-check-overdue` | `AdminTools` |
| `POST` | `/api/admin/system/cleanup-orphan-data` | `AdminTools` |
| `GET` | `/api/academic/semesters` | `ScoreRulesForm` (explicit semester dropdown) |

### 2. Modified Endpoints (Contract Changes)

| Endpoint | Change |
|----------|--------|
| `POST /api/series` | Request now accepts `Record<number, number>` for `milestonePoints`, plus `minimumRequirementEnabled`, `minimumRequiredEvents`, `minimumPenaltyPoints`, `targetSemesterId`, `presetCode`, `presetConfig`. |
| `PUT /api/series/{id}` | Same as above. |
| `POST /api/minigames` | Request now includes `showAnswers`. |
| `PUT /api/minigames/{id}` | Same as above. |
| `POST /api/registrations/checkin` | Request now sends `studentId` and `participationType` (can be `null` for backend auto-transition). |
| `GET /api/scores/ranking` | `score` field is now `string` (BigDecimal). |

### 3. Pending / Not Yet Adopted

| Endpoint / Type | Status | Notes |
|-----------------|--------|-------|
| `ActivitySummaryResponse` | Type added, no consumers yet | Waiting for backend to provide summary-specific list endpoints (e.g., `GET /api/activities/summary`). Currently all list endpoints still return `ActivityResponse[]`. |
| `GET /api/activities/standard/{id}` | Not used yet | `EditEvent` still loads via `eventAPI.getEventById` (returns `ActivityResponse`). Should migrate once backend provides dedicated read endpoints. |
| `GET /api/activities/minigame/{id}` | Not used yet | Same as above. |
| `POST /api/series/{id}/activities/attach` | Available in `seriesAPI` | Not yet used in UI (no “attach existing activity” flow yet). |
| `GET /api/series/{id}/overview` | Available in backend spec | Not yet used in frontend (organizer dashboard statistics). |

---

## Bug Fixes

| Issue | Fix |
|-------|-----|
| **Score type display inconsistency** | All activity cards/details now derive score type from `scoreRules` array, not the deprecated `scoreType` field. |
| **Series child showing per-activity points** | `ScoreRulesDisplay` is replaced with an info banner when `seriesId` is present. |
| **Client-side overdue calculation drift** | Removed `isOverdue()` from `TaskList` and `StudentTasks`. Overdue is now entirely determined by `TaskStatus.OVERDUE` from the backend Quartz job. |
| **Raw list endpoint normalization** | `eventAPI.getEventsByDepartment`, `getEventsByScoreType`, `getEventsByMonth`, `getMyEvents` now correctly handle both raw array responses and wrapped `ApiResponse` shapes. |
| **Department targeting field mismatch** | `mapScoreRuleResponseToRequest` bridges `targetDepartmentIds` (response) ↔ `departmentIds` (request). |
| **Ticket QR dual-scan confusion** | `ManagerRegistrations` now passes `participationType: null` so the backend auto-transitions `REGISTERED → CHECKED_IN → ATTENDED`. UI copy clarifies "Lần quét 1" (CHECKED_IN) vs "Lần quét 2" (ATTENDED). |
| **Mock data in production** | Removed `mockSemesterScores` from `scoresAPI`. Manager ranking now always hits the real backend. |
| **BigDecimal precision loss** | `StudentRankingResponse.score` and all score fields are now typed as `string` to avoid JavaScript floating-point rounding. |
| **Milestone points JSON parsing** | Removed manual `JSON.parse`/`JSON.stringify` for `milestonePoints`. It is now a native `Record<number, number>` throughout the frontend. |

---

## Remaining Work

| Task | Priority | Notes |
|------|----------|-------|
| **Adopt `ActivitySummaryResponse`** | Medium | Backend needs to expose summary endpoints; frontend type is ready. Update all list pages to use the lighter payload. |
| **Split read endpoints** | Medium | Migrate `EditEvent` detail load from `eventAPI.getEventById` to `GET /api/activities/standard/{id}` / `GET /api/activities/minigame/{id}` / `GET /api/series/{id}/activities/{id}` once backend provides them. |
| **Organizer dashboard for Series** | Low | Build a page using `GET /api/series/{id}/overview` to show `minimumRequirementMetCount`, milestone distribution charts, and per-activity participation rates. |
| **Attach existing activity to series** | Low | UI flow for `POST /api/series/{id}/activities/attach` does not exist yet. |
| **Student self QR scan** | Medium | The `POST /api/registrations/checkin/qr` endpoint exists in backend spec but no student-facing QR scanner page has been built yet. |
| **Series targetSemesterId dropdown** | Low | `SeriesForm` already has the field wired in backend types, but the frontend form may need to fetch and populate a semester dropdown if the backend spec stabilizes. |
| **Score rule live preview BE integration** | Low | Currently `ScoreRulesForm` renders a local preview via `ScoreRulesDisplay`. A future enhancement could call a backend preview endpoint to validate rule conflicts before save. |
| **AdminTools page routing** | Low | `AdminTools` component exists but may need to be wired into the admin router/sidebar if not already done. |

---

## Frontend Developer Notes

### 1. Working with Score Rules

- **Always use `scoreRuleHelpers.ts`** when adding new triggers or calculations. The helper functions centralize the business logic for which calculations are valid per trigger.
- **Never hardcode `points` or `failPoints` display logic** in new components; reuse `ScoreRulesDisplay` which already handles penalty-only, pass/fail, and positive-only rendering.
- **Remember `BigDecimal` → `string`**: All score fields (`points`, `failPoints`, `pointsEarned`, `score`, etc.) are `string` in TypeScript. Use `parseFloat` only for arithmetic, never for display.

### 2. Form Mode Pattern

When adding a new activity variant, use `BaseEventForm` with the appropriate `mode`:
- `mode='normal'` — standard event with full score rules.
- `mode='minigame'` — event + quiz, auto-loads minigame preset.
- `mode='series'` — child activity, hides score rules and registration fields.

### 3. Preset Integration

- Presets are loaded once per form mount via `eventAPI.getActivityPresets()` or `seriesAPI.getSeriesPresets()`.
- Preview calls are async and may fail gracefully (form falls back to manual configuration).
- When editing, always inject `presetCode: 'CUSTOM'` to prevent backend from overwriting the user’s custom rules with the original preset defaults.

### 4. API Response Normalization

- **Wrapped endpoints** (`/api/activities/standard`, `/api/series`, etc.) return `{ status, message, body }`. Services normalize with `response.data.body || response.data.data`.
- **Raw list endpoints** (`/api/activities/my`, `/upcoming`, `/month`, `/score-type/*`, `/department/*`) may return a plain array or a wrapped object. The `eventAPI` service now normalizes both shapes.

### 5. Series Context

- Any component rendering an `ActivityResponse` should check `seriesId`. If present:
  - Hide per-activity score rules.
  - Show the series info banner.
  - Optionally load `GET /api/series/{id}/progress/my` for student context.
- The `SeriesChildActivityResponse` type includes `seriesName` for convenient rendering without an extra lookup.

### 6. Type Safety

- `tsc --noEmit` passes with zero errors. Keep it that way.
- The `ActivityResponse` legacy type is still widely used for reads. Do not add new fields to it unless the backend also updates the legacy read endpoint.
- Prefer the new specialized types (`StandardActivityResponse`, `MinigameActivityResponse`, `SeriesChildActivityResponse`) when backend endpoints support them.

### 7. Common Pitfalls

- **Do not** compare `new Date() > new Date(deadline)` to determine overdue status. Trust `TaskStatus.OVERDUE` from the backend.
- **Do not** render `isCorrect` for quiz questions unless the attempt detail response explicitly includes it (which only happens when `showAnswers` is `true`).
- **Do not** pass `pointsEarned` as a number to the backend. Always send `string` (even if it looks like a number).
- **Do not** use `eventAPI.createEvent` or `eventAPI.updateEvent` for new code. They are retired. Use the variant-specific APIs instead.

---

*End of handoff document.*
