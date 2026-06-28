# Frontend Handoff: CampusLifeReact Refactor

> **Scope:** Frontend-only changes from commit `0c6b38e` to current HEAD on the `refactor` branch.  
> **Audience:** Frontend developers joining the CampusLifeReact project.  
> **Organized by:** User-facing features and frontend architecture, not by commit.  
> **Last synced with code:** 2026-06-28 (includes preset score-rule config, `activeScoreEntryCount` locking, `MultiSelectField`, `externalOptions`, cross-field validation, `reconstructPresetConfig`).

---

## Executive Summary

This handoff documents the major frontend refactor that transitions CampusLife from a single unified activity model to a **specialized activity architecture** (Standard, Minigame, Series Child). The frontend now supports:

- **Split activity creation flows** with distinct forms and API endpoints for each activity variant.
- **Dynamic score rules engine** with preset-based configuration, live preview, and trigger-aware validation.
- **Series-first UX** where series child activities hide per-activity scoring and delegate to series milestone/penalty logic.
- **Backend-contract-driven TypeScript types** matching the new API surface (BigDecimal as `number`, `ApiResponse` wrapper normalization, explicit DTOs).

Key architectural changes include 54+ modified files (+1,927 / −739+ lines), zero remaining legacy write calls (`eventAPI.createEvent` / `updateEvent` are fully retired), and full TypeScript compilation (`tsc --noEmit`) with zero errors.

**Later additions (post-handoff baseline):**
- **Preset score-rule configuration engine** — `MultiSelectField`, `externalOptions` mechanism, `reconstructActivityPresetConfig` fallback, inline preset config fields (audience, semesterPolicy, departmentIds, explicitSemesterId) inside `ScoreRulesForm`.
- **Score-locking guard** — `activeScoreEntryCount` propagated from BE responses through `EditEvent` → forms → `BaseEventForm` to disable type/preset/score-rules editing when score entries exist.
- **Cross-field validation** — `validateCrossFields` in `presetValidation.ts` for conditional required fields (departmentIds when audience scoped, explicitSemesterId when policy explicit).
- **Series audience/departmentIds** — `SeriesForm` and `EditSeries` fully support audience targeting with department multi-select.

---

## Admin / Manager Features

### 1. Activity Management — Standard, Minigame, Series Child

#### 1.1 Create Flows

| Variant | Page / Component | API Endpoint | DTO |
|---------|------------------|-------------|-----|
| **Standard Activity** | `pages/CreateEvent.tsx` → `StandardActivityForm` | `POST /api/activities/standard` | `StandardActivityCreateRequest` |
| **Minigame Activity** | `pages/CreateMinigameWizard.tsx` → `MinigameActivityForm` | `POST /api/activities/minigames` | `MinigameActivityCreateRequest` |
| **Series Child** | `components/series/SeriesDetail.tsx` → `SeriesActivityForm` | `POST /api/series/{seriesId}/activities` | `SeriesChildActivityCreateRequest` |

- **CreateEvent** (`StandardActivityForm`) renders a `renderStandardFields` callback into `BaseEventForm<StandardActivityCreateRequest>`. It has a preset selector dropdown that auto-fills `type`, `requiresSubmission`, and `scoreRules` from the selected preset. It is explicitly labeled for **standard events only** (no Mini Game creation from this form).
- **MinigameActivityForm** (`BaseEventForm<MinigameActivityCreateRequest>` with `mode='minigame'`) auto-selects the `MINIGAME_PASS_ONLY` preset on initial load if available.
- **SeriesActivityForm** (`BaseEventForm<BaseEventFormData>` with `mode='series'`) omits the score rules section entirely because series children do not have per-activity scoring. The form shows a read-only `type` field (SUKIEN or MINIGAME) set from the wizard step.

#### 1.2 Edit Flows

`EditEvent.tsx` now routes to the correct form based on the loaded activity:

```tsx
if (event.seriesId)       → <SeriesActivityForm />
else if (event.type === MINIGAME) → <MinigameActivityForm />
else                              → <StandardActivityForm />
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

- **Activity presets**: `GET /api/activities/presets` → dropdown in `StandardActivityForm` / `BaseEventForm`. Selecting a preset calls `POST /api/activities/presets/preview` to fetch the implied rules and auto-fill the form.
- **Series presets**: `GET /api/series/presets` → dropdown in `SeriesForm`. Selecting a preset calls `POST /api/series/presets/preview` to auto-fill `milestonePoints`, `scoreType`, and minimum requirement fields.
- **Preview component**: `ActivityScoreRulePreview.tsx` renders a table of the preset’s implied score rules before the manager commits.

#### 2.3 Preset Score-Rule Configuration (Preset Config Panel)

Rules defined in a preset's `ActivityPresetConfig` are rendered dynamically via `PresetConfigPanel` → `PresetRuleCard`:

- **Input types**: `NUMBER`, `BOOLEAN`, `SELECT`, `MAP`, `MULTI_SELECT`. The `MULTI_SELECT` type renders a native checkbox list (`MultiSelectField.tsx`).
- **externalOptions**: When a `SELECT`/`MULTI_SELECT` field's `options` is `null`, the panel looks up options at runtime from `externalOptions[field.fieldName]` (passed down from `BaseEventForm`/`SeriesForm`, which build it from `departments` and `semesters`).
- **Cross-field validation**: `validateCrossFields(config, configValues)` in `presetValidation.ts` enforces:
  - `departmentIds` required when `audience` is `DEPARTMENT_ONLY` or `DEPARTMENT_AND_ALL`.
  - `explicitSemesterId` required when `semesterPolicy` is `EXPLICIT_SEMESTER`.

#### 2.4 Inline Preset Config in ScoreRulesForm (CUSTOM mode)

Each `ScoreRulesForm` row now includes 4 inline controls for preset configuration when mode is CUSTOM:

| Control | Source | Visibility |
|---------|--------|------------|
| `audience` (`<select>`) | `ScoreRuleAudience` enum | Always visible |
| `semesterPolicy` (`<select>`) | `ScoreSemesterPolicy` enum | Always visible |
| `departmentIds` (checkbox list) | `departments` prop | Shown when audience is department-scoped |
| `explicitSemesterId` (`<select>`) | Semesters API fetch | Shown when policy is `EXPLICIT_SEMESTER` |

#### 2.5 Score-Locking Guard (`activeScoreEntryCount`)

When a backend `ActivityResponse` or `StandardActivityResponse` has `activeScoreEntryCount > 0`, the frontend locks editing:

- **`isScoreLocked`** computed in `BaseEventForm` as `(activeScoreEntryCount ?? 0) > 0`.
- **Effects**: Type dropdown disabled (with "Đã có lượt tính điểm" tooltip), preset selector hidden, score rules section hidden, banner displayed at top of score rules area.
- **Edit flow**: `EditEvent` passes `activeScoreEntryCount` to `StandardActivityForm` and `MinigameActivityForm`, which forward it to `BaseEventForm`.
- **Submit**: When locked, `scoreRules` and `presetConfig` are stripped from the submit payload so BE rules remain untouched.

#### 2.6 Reconstruct Preset Config on Edit

`reconstructActivityPresetConfig(activity, presetDefinition)` in `scoreRuleMapper.ts` rebuilds `ActivityPresetConfig` from `scoreRules[0]` when the BE returns a null/empty `presetConfig`. It picks `audience`, `semesterPolicy`, `explicitSemesterId`, and `departmentIds` from the first score rule, then maps per-trigger points from all score rules.

Called in `BaseEventForm`'s preset-sync `useEffect` during edit load.

#### 2.7 Validation Rules (Enforced in `BaseEventForm`)

| Rule | Error Message |
|------|--------------|
| `requiresSubmission = true` but no `PASS_FAIL_POINTS` rule with `failPoints` | "Sự kiện yêu cầu nộp bài thu hoạch phải có ít nhất một luật tính điểm Đạt/Trượt và có cấu hình điểm trượt hợp lệ." |
| `CHUYEN_DE_DOANH_NGHIEP` type with `NO_SHOW` + `CHUYEN_DE` scoreType | "Sự kiện Chuyên đề doanh nghiệp không được cấu hình luật phạt vắng mặt (No-show) bằng điểm Chuyên đề. Vui lòng chọn loại điểm phạt khác." |

#### 2.8 Score Rules Display (`ScoreRulesDisplay.tsx`)

- Updated to handle penalty-only triggers: displays `-{failPoints}` in red instead of `+{points}` in green.
- Pass/fail rules now show both `+points` and `Trượt: -failPoints` stacked.
- Fixed `targetDepartmentIds` vs `departmentIds` mismatch (display now accepts both keys for compatibility).
- Added new trigger labels: `NO_SHOW`, `TASK_OVERDUE`, `MINIGAME_EXHAUSTED_ATTEMPTS`.

---

### 3. Edit Page Improvements (`EditEvent.tsx`)

- **Score rule mapping**: When loading an activity for edit, `scoreRules` from the response are mapped through `mapScoreRuleResponseToRequest` to convert `targetDepartmentIds` (response) → `departmentIds` (request) so the form can pre-populate correctly.
- **Preset override**: `presetCode: 'CUSTOM'` is injected into edit payloads to tell the backend **not** to regenerate rules from the original preset.
- **Split form rendering**: As described in §1.2, the edit page now renders the correct specialized form instead of a generic one-size-fits-all form.

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
- **Ranking format fix**: `StudentRankingResponse.score` is now `number` (Jackson serializes BigDecimal as JSON number). Use `formatScore()` utility for display only.

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
- Uses `BaseEventForm<BaseEventFormData>` internally; the `onSubmit` callback converts the generic form data to `SeriesChildActivityCreateRequest`, which omits registration/ticket fields (inherited from the series).

---

## Frontend Architecture Changes

### 1. New Components

| Component | Path | Purpose |
|-----------|------|---------|
| `StandardActivityForm` | `components/events/StandardActivityForm.tsx` | Renders `renderStandardFields` callback into `BaseEventForm<StandardActivityCreateRequest>`. Contains all standard-event-specific UI (type selector, ticket quantity, checkboxes, etc.). |
| `ActivityScoreRulePreview` | `components/events/ActivityScoreRulePreview.tsx` | Table-based preview of a preset’s implied score rules. |
| `SeriesProgressBanner` | `components/series/SeriesProgressBanner.tsx` | Student-facing banner for series minimum requirement status. |
| `AdminTools` | `pages/admin/AdminTools.tsx` | Admin system maintenance page (overdue trigger, cleanup). |
| `MultiSelectField` | `components/presets/MultiSelectField.tsx` | Native checkbox-list multi-select for preset fields with `MULTI_SELECT` input type. |
| `PresetConfigPanel` | `components/presets/PresetConfigPanel.tsx` | Renders dynamic form from `ActivityPresetConfig` / `SeriesPresetConfig` definition fields. Supports `externalOptions` prop for runtime option lookup. |

### 2. Refactored Components

| Component | Key Changes |
|-----------|-------------|
| `EventForm` | **DELETED** (replaced by `StandardActivityForm` using `BaseEventForm`). All logic (preset selector, validation, score rules) now lives in `BaseEventForm` or `StandardActivityForm`. |
| `BaseEventForm` | Added preset loading + auto-fill for minigame mode, removed `scoreType` from default data, added `ScoreRulesForm` with `departments` prop, removed `scoreRules` section when `mode === 'series'`. **Later:** semesters fetch, `externalOptions` build, `isScoreLocked` guard (banner + disable type/preset/scoreRules), `reconstructActivityPresetConfig` from `scoreRules` on edit load, `validateActivityPresetConfig` util for preset validation. |
| `StandardActivityForm` | Receives `activeScoreEntryCount` prop; disables type `<select>` when locked (shows lock explanatory message). |
| `MinigameActivityForm` | Removed `scoreType` field, expanded `location` to `md:col-span-2`. **Later:** threads `activeScoreEntryCount` prop to `BaseEventForm`. |
| `SeriesActivityForm` | Added read-only type field, fixed `type` to respect `isMinigame` prop, removed `scoreType` from default data. |
| `ScoreRulesForm` | Added `handleTriggerChange` with auto-calculation, dynamic field visibility, live preview card, semester dropdown, department targeting. **Later:** each row now has inline `audience`, `semesterPolicy`, `departmentIds` (conditional), `explicitSemesterId` (conditional) controls for CUSTOM preset config. |
| `PresetRuleCard` | Added `externalOptions` prop for runtime option lookup when `field.options` is null; handles `MULTI_SELECT` input type via `MultiSelectField`. |
| `PresetConfigPanel` | Added `externalOptions` prop, threaded to `PresetRuleCard`. |
| `ScoreRulesDisplay` | Added penalty-only display logic, pass/fail stacked display, new trigger labels. |
| `QuizForm` | Added `showAnswers` toggle. |
| `SeriesForm` | Added preset selector, changed `milestonePoints` from `string` (JSON) to `Record<number, number>`, added `minimumRequirementEnabled` / `minimumRequiredEvents` / `minimumPenaltyPoints` fields, added validation for minimum requirements. **Later:** `audience` state (select), `departmentIds` state (MultiSelectField), `externalOptions` from departments, `validateSeriesPresetConfig` util. |
| `SeriesDetail` | Added `targetSemesterId` read-only display, added minimum requirement config display. |
| `TaskList` | Removed local `isOverdue()` function; overdue status is now driven entirely by `TaskStatus.OVERDUE` from the backend. |
| `ManagerScores` | Added recalculate buttons, confirmation dialog, full-screen loading overlay, `useQueryClient` invalidation. |
| `StudentTasks` | Added `OVERDUE` filter/tab, added `OVERDUE` colors, added `Tùy chọn` badge for optional tasks, removed client-side deadline comparison for overdue status. |
| `CreateEvent` | Updated title to "Tạo sự kiện thường mới". |
| `EditEvent` | Added branch-based form routing, `mapScoreRuleResponseToRequest`, `presetCode: 'CUSTOM'`. **Later:** passes `activeScoreEntryCount` to `StandardActivityForm` and `MinigameActivityForm`. |
| `StudentEventDetail` | Added series progress banner loading, `WAITLIST` status, score type from `scoreRules`, optional task badge, series score hiding. |
| `StudentEvents` | Score type from `scoreRules`, `WAITLIST` status, series badge. |
| `EventList` | Score type from `scoreRules`. |
| `EventDetail` | Score type from `scoreRules`, series score hiding. |
| `ManagerRegistrations` | Updated `checkIn` payload to include `studentId` and `participationType` (null for BE auto-transition). |
| `EditSeries` | `initialData` includes `audience`, `departmentIds` (mapped from `targetDepartmentIds`), `presetCode`, `presetConfig`. `updateData` includes all four fields mapped back to the request DTO. |

### 3. Shared Components

- `ScoreRulesForm` and `ScoreRulesDisplay` are now shared across `BaseEventForm`, `StandardActivityForm`, and `MinigameActivityForm`.
- `OrganizerSelector` is unchanged but continues to be used by all form variants.
- `LoadingSpinner` is reused in `AdminTools`.

### 4. Form Architecture

```
BaseEventForm<T extends BaseEventFormData>
├── renderFields(formData, errors, handleChange, ...) callback → ReactNode
├── Preset selector (mode !== 'series' && mode !== 'minigame')
├── ActivityScoreRulePreview (when preset selected)
├── ScoreRulesForm (mode !== 'series')
│   ├── Live preview (ScoreRulesDisplay)
│   ├── Dynamic trigger/calculation mapping
│   └── Department + semester targeting
└── Standard validation (dates, tickets, organizers)

StandardActivityForm
└── BaseEventForm<StandardActivityCreateRequest> + renderStandardFields

MinigameActivityForm
└── BaseEventForm<MinigameActivityCreateRequest> + renderMinigameFields

SeriesActivityForm
└── BaseEventForm<BaseEventFormData> + renderSeriesActivityFields
   → onSubmit converts BaseEventFormData → SeriesChildActivityCreateRequest
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
| `presets.ts` | `ActivityPresetCode`, `SeriesPresetCode`, `ActivityPresetPreviewResponse`, `SeriesPresetPreviewResponse`, `ActivityPresetDefinition`, `ActivityPresetConfig`. **Later:** `InputType` gains `MULTI_SELECT`; `FieldDefinition.options` made nullable (`string[] \| null`) for `externalOptions` fallback ; `SeriesPresetConfig` adds `audience` and `departmentIds`. |
| `activity.ts` | `BaseEventFormData`, `StandardActivityCreateRequest`, `StandardActivityUpdateRequest`, `StandardActivityResponse`, `MinigameActivityCreateRequest`, `MinigameActivityUpdateRequest`, `MinigameActivityResponse`, `SeriesChildActivityCreateRequest`, `SeriesChildActivityUpdateRequest`, `SeriesChildActivityResponse`. **Later:** `ActivityPresetConfig` adds `audience`, `semesterPolicy`, `explicitSemesterId`, `departmentIds`; `StandardActivityUpdateRequest` expands to include `presetCode`, `presetConfig`, `scoreRules`; `StandardActivityResponse` and `ActivityResponse` add `activeScoreEntryCount`. |
| `score.ts` | `StudentRankResponse` (added), `score` is `number` in `StudentRankingResponse` (Jackson serializes BigDecimal as JSON number) |
| `registration.ts` | `WAITLIST` added to `RegistrationStatus` enum, `ActivityParticipationRequest` updated (`participationType?: ParticipationType \| null`, `pointsEarned?: number \| null`) |
| `task.ts` | `OVERDUE` added to `TaskStatus` enum and helpers |
| `series.ts` | `milestonePoints` changed from `string` → `Record<number, number>`, added `minimumRequirementEnabled`, `minimumRequiredEvents`, `minimumPenaltyPoints`, `targetSemesterId`, `presetCode`, `presetConfig`, `StudentSeriesProgress` fields for minimum requirements. Removed `parseMilestonePoints` / `formatMilestonePoints` helpers. **Later:** `CreateSeriesRequest`/`UpdateSeriesRequest` add `audience` and `departmentIds`; `SeriesResponse` adds `audience`, `targetDepartmentIds`, `presetCode`, `presetConfig`. |

#### 6.2 Enum & Type Additions

| Enum / Type | New Values |
|-------------|------------|
| `ScoreRuleTrigger` | `NO_SHOW`, `TASK_OVERDUE`, `MINIGAME_EXHAUSTED_ATTEMPTS` |
| `ScoreSemesterPolicy` | Removed `CURRENT_OPEN_SEMESTER` |
| `ScoreEntrySourceType` | `SERIES_MINIMUM_REQUIREMENT` |
| `RegistrationStatus` | `WAITLIST` |
| `TaskStatus` | `OVERDUE` |
| `InputType` (presets.ts) | `MULTI_SELECT` |
| `FieldDefinition.options` | Made nullable (`string[] \| null`) — when `null`, options come from `externalOptions` at runtime |

### 7. Validation

Validation rules are split between forms and two utility modules:

#### 7.1 `scoreRuleHelpers.ts`

| Helper | Purpose |
|--------|---------|
| `PENALTY_ONLY_TRIGGERS` | Triggers that only deduct points (no positive `points` field). |
| `PASS_FAIL_TRIGGERS` | Triggers that support both pass and fail points. |
| `POSITIVE_ONLY_TRIGGERS` | Triggers that only award points. |
| `REQUIRES_FAIL_POINTS` | Triggers where `failPoints` is mandatory. |
| `getDefaultCalculationForTrigger(trigger)` | Returns the correct `ScoreRuleCalculation` for a trigger. |
| `getValidCalculationsForTrigger(trigger)` | Returns the allowed calculations for a trigger (used to filter the `<select>`). |
| `mapScoreRuleResponseToRequest(rule)` | Converts a response rule to a request rule (e.g., `targetDepartmentIds` → `departmentIds`). |

#### 7.2 `presetValidation.ts`

| Helper | Purpose |
|--------|---------|
| `validateField(field, value, configValues)` | Validates a single preset config field. Accepts `configValues` param for cross-field context. Handles all input types including `MULTI_SELECT` (requires non-empty array). |
| `validatePresetConfig(fields, values)` | Validates a full preset config against its field definitions. |
| `validateActivityPresetConfig(config, configValues)` | Validates activity preset config values against the config structure. Called from `BaseEventForm`/`SeriesForm`. |
| `validateSeriesPresetConfig(config, configValues)` | Validates series preset config values. Called from `SeriesForm`. |
| `validateCrossFields(config, configValues)` | Cross-field validation: enforces `departmentIds` required when `audience` is department-scoped; `explicitSemesterId` required when `semesterPolicy` is `EXPLICIT_SEMESTER`. |

---

## API Integration Changes

### 1. New Endpoints (Integrated)

| Method | Endpoint | Used In |
|--------|----------|---------|
| `GET` | `/api/activities/presets` | `StandardActivityForm`, `BaseEventForm` |
| `POST` | `/api/activities/presets/preview` | `StandardActivityForm`, `BaseEventForm` |
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
| `POST /api/series` | Request now accepts `Record<number, number>` for `milestonePoints`, plus `minimumRequirementEnabled`, `minimumRequiredEvents`, `minimumPenaltyPoints`, `targetSemesterId`, `presetCode`, `presetConfig`. **Later:** Request adds `audience` and `departmentIds` for audience targeting. |
| `PUT /api/series/{id}` | Same as POST changes. |
| `GET /api/series/{id}` (implied) | **Later:** `SeriesResponse` adds `audience`, `targetDepartmentIds`, `presetCode`, `presetConfig`. |
| `POST /api/minigames` | Request now includes `showAnswers`. |
| `PUT /api/minigames/{id}` | Same as above. |
| `POST /api/registrations/checkin` | Request now sends `studentId` and `participationType` (can be `null` for backend auto-transition). |
| `GET /api/scores/ranking` | `score` field is `number` (Jackson serializes BigDecimal as JSON number). |
| `GET /api/activities/{id}` | **Later:** `ActivityResponse` adds `activeScoreEntryCount: number` (0 when draft, >0 when scores recorded). |
| `GET /api/activities/standard/{id}` | **Later:** `StandardActivityResponse` adds `activeScoreEntryCount: number`. |

### 3. Pending / Not Yet Adopted

| Endpoint / Type | Status | Notes |
|-----------------|--------|-------|
| `GET /api/activities/standard/{id}` | Partially used | `EditEvent` still loads via `eventAPI.getEventById` (returns `ActivityResponse`), but `activeScoreEntryCount` field is read from `ActivityResponse`. Should migrate to dedicated read endpoints once backend provides them. |
| `GET /api/activities/minigame/{id}` | Not used yet | Same as above. `MinigameActivityResponse` still missing `activeScoreEntryCount` field — needs backend update. |
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
| **BigDecimal precision loss** | `StudentRankingResponse.score` and all score fields are now typed as `number` (Jackson serializes BigDecimal as JSON number). Use `parseFloat` only for arithmetic, never for display. |
| **Milestone points JSON parsing** | Removed manual `JSON.parse`/`JSON.stringify` for `milestonePoints`. It is now a native `Record<number, number>` throughout the frontend. |

---

## Remaining Work

| Task | Priority | Notes |
|------|----------|-------|
| **Split read endpoints** | Medium | Migrate `EditEvent` detail load from `eventAPI.getEventById` to `GET /api/activities/standard/{id}` / `GET /api/activities/minigame/{id}` / `GET /api/series/{id}/activities/{id}` once backend provides them. |
| **MinigameActivityResponse.activeScoreEntryCount** | Medium | Field is missing from the type definition — needs backend to add it to the response DTO. |
| **HIDDEN_ON_REGISTRATION / HIDDEN_PRE_REGISTRATION visibility** | Low | `VisibilityType` in `presets.ts` only has 4 values (`ALWAYS`, `rule_enabled`, `audience_department_scoped`, `semester_policy_explicit`). Two new visibility values were planned but not yet implemented in types, `PresetRuleCard.shouldShowField`, or `presetValidation.ts`. |
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
- **Remember `BigDecimal` → `number`**: All score fields (`points`, `failPoints`, `pointsEarned`, `score`, etc.) are `number` in TypeScript. Use `parseFloat` only for arithmetic, never for display.
- **`activeScoreEntryCount` locking**: Always propagate this prop from the page level (e.g., `EditEvent`) down to the form — `BaseEventForm` handles the guard logic (`isScoreLocked`). When `> 0`, strip `scoreRules` and `presetConfig` from the submit payload.
- **`reconstructPresetConfig`**: When editing, `BaseEventForm` calls `reconstructActivityPresetConfig` in a `useEffect` to rebuild the preset config from `scoreRules[0]` if the BE returns null. No manual wiring needed in page components.

### 2. Form Mode Pattern

When adding a new activity variant, use `BaseEventForm<T>` with the appropriate type parameter and `mode`:
- `BaseEventForm<StandardActivityCreateRequest>` + `mode='normal'` — standard event with full score rules.
- `BaseEventForm<MinigameActivityCreateRequest>` + `mode='minigame'` — event + quiz, auto-loads minigame preset.
- `BaseEventForm<BaseEventFormData>` + `mode='series'` — child activity, hides score rules and registration fields.

Provide a `renderFields` callback that returns the variant-specific JSX (inputs, selectors, etc.). `BaseEventForm` handles the shared shell (preset selector, score rules, validation, banner upload, submit/cancel buttons).

In `mode='series'`, the score rules section is hidden and the form operates at the `BaseEventFormData` level; the parent component (e.g., `SeriesActivityForm`) converts data to the specialized DTO at submit time.

### 3. Preset Integration

- Presets are loaded once per form mount via `eventAPI.getActivityPresets()` or `seriesAPI.getSeriesPresets()`.
- Preview calls are async and may fail gracefully (form falls back to manual configuration).
- When editing, always inject `presetCode: 'CUSTOM'` to prevent backend from overwriting the user’s custom rules with the original preset defaults.
- **externalOptions**: When a preset field has `options: null`, `PresetConfigPanel` looks up options from `externalOptions[field.fieldName]`. `BaseEventForm`/`SeriesForm` build this object from `departments` and `semesters`. When adding a new field type that needs runtime options, register it in the `externalOptions` builder.
- **reconstructPresetConfig**: When editing an activity with a preset, `BaseEventForm` attempts to reconstruct the preset config from `scoreRules` in a `useEffect`. The `reconstructActivityPresetConfig` util picks the first rule's `audience`, `semesterPolicy`, `explicitSemesterId`, `departmentIds`, and maps per-trigger points from all rules.
- **CUSTOM mode**: When `presetCode` is `'CUSTOM'` (or no preset is selected), `ScoreRulesForm` shows the 4 inline preset controls (`audience`, `semesterPolicy`, `departmentIds`, `explicitSemesterId`) on each row for manual configuration.

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
- **activeScoreEntryCount** is typed on both `ActivityResponse` and `StandardActivityResponse`. `MinigameActivityResponse` is missing it — check backend support before adding.
- **SeriesResponse.departmentIds**: BE response uses `targetDepartmentIds` (not `departmentIds`). The frontend maps this in `EditSeries` (`series.targetDepartmentIds ?? []` → `departmentIds` in initialData).

### 7. Preset Validation (`presetValidation.ts`)

- Use `validateActivityPresetConfig(config, configValues)` for activity preset configs (called from `BaseEventForm`).
- Use `validateSeriesPresetConfig(config, configValues)` for series preset configs (called from `SeriesForm`).
- Use `validateCrossFields(config, configValues)` for cross-field rules (required `departmentIds` when audience scoped, required `explicitSemesterId` when policy explicit).
- The `configValues` parameter carries the full form data so validators can reference sibling fields.

### 8. Common Pitfalls

- **Do not** compare `new Date() > new Date(deadline)` to determine overdue status. Trust `TaskStatus.OVERDUE` from the backend.
- **Do not** render `isCorrect` for quiz questions unless the attempt detail response explicitly includes it (which only happens when `showAnswers` is `true`).
- **Do not** pass `pointsEarned` as a number to the backend. Jackson serializes BigDecimal as JSON number, so the frontend sends/receives `number`.
- **Do not** use `eventAPI.createEvent` or `eventAPI.updateEvent` for new code. They are retired. Use the variant-specific APIs instead.

---

*End of handoff document.*
