# Plan — Preset ScoreRule Toggle Support Integration

## Context
Project: React TypeScript FE (campuslifereact). Need to integrate Preset ScoreRule Toggle Support per `docs/refactor/fe-preset-scorerule-integration-plan.md` and `docs/refactor/FE_BACKEND_HANDOFF_SPEC.md`.

## Current State Analysis
- Types: `src/types/presets.ts` has basic preset types but missing `ActivityPresetPreviewRequest`, `SeriesPresetPreviewRequest`, literal `InputType`/`VisibilityType`, and `presetConfig` is `any` in activity types.
- APIs: `eventAPI.ts` already has `getActivityPresets`, `previewActivityPreset`. `seriesAPI.ts` already has `getSeriesPresets`, `previewSeriesPreset`.
- Forms: `BaseEventForm.tsx` has `presetCode`/`presetConfig` in `BaseEventFormData` but no UI for preset selection/configuration. `StandardActivityForm.tsx` and `MinigameActivityForm.tsx` only render basic fields. `SeriesForm.tsx` has basic preset selector + milestone input but no dynamic rule rendering from `supportedRules`.
- QR: `QRCodeScanner.tsx` is just scanner; no success screen showing `scoreAwards`.

## Stages

### Stage 1 — Types & Interfaces (Priority: P0)
**Goal:** Ensure all types are type-safe and match backend contract exactly.
**Files:**
- `src/types/presets.ts` — add `InputType`, `VisibilityType`, `ActivityPresetPreviewRequest`, `SeriesPresetPreviewRequest`, tighten `FieldDefinition` types, add `SeriesPresetConfig`.
- `src/types/activity.ts` — change `presetConfig` from `any` to `ActivityPresetConfig` in `StandardActivityCreateRequest`, `MinigameActivityCreateRequest`. Add `ActivityPresetPreviewResponse` import if needed.
- `src/types/series.ts` — add `SeriesPresetConfig` interface, update `CreateSeriesRequest`/`UpdateSeriesRequest` to use it.

### Stage 2 — Reusable Components (Priority: P0)
**Goal:** Build dynamic preset UI components that render from `supportedRules` without hardcoding per preset.
**Files:**
- `src/components/presets/PresetSelector.tsx` — Dropdown to select preset, shows displayName/description.
- `src/components/presets/PresetRuleCard.tsx` — Card for one `PresetRuleDescriptor`: toggle (disabled if required), description, dynamic field inputs (NUMBER, BOOLEAN, SELECT, MAP). Field visibility `ALWAYS` vs `rule_enabled`.
- `src/components/presets/PresetConfigPanel.tsx` — Container for list of `PresetRuleCard` + Preview button + Preview result display.
- `src/components/presets/ScoreRuleBadge.tsx` — Badge "Preset" / "Tùy chỉnh".
- `src/components/presets/ScoreAwardList.tsx` — Render `AppliedScoreAward[]` after QR check-in, with color/icon per `scoreType`.
- `src/components/presets/MapInputField.tsx` — Reusable MAP input (key-value table, add/remove rows) for `milestonePoints`.

### Stage 3 — Hooks (Priority: P0)
**Files:**
- `src/hooks/useActivityPresets.ts` — Load `ActivityPresetDefinition[]`, cache, manage selected preset state.
- `src/hooks/usePresetPreview.ts` — Call preview API with debounce, manage loading/error states.
- `src/hooks/useSeriesPresets.ts` — Load `SeriesPresetDefinition[]`, manage selected preset state.

### Stage 4 — Update BaseEventForm (Standard & Minigame)
**Goal:** Integrate preset selection + dynamic config panel into `BaseEventForm`. Ensure:
- When preset != CUSTOM: hide manual `ScoreRulesForm`, show `PresetConfigPanel`.
- When preset == CUSTOM: show manual `ScoreRulesForm`.
- On submit: strip `scoreRules` if using preset; strip `presetConfig` if using CUSTOM.
- Validate `presetConfig` fields before submit.
**Files:**
- `src/components/events/BaseEventForm.tsx` — Add PresetSelector + PresetConfigPanel.
- `src/components/events/StandardActivityForm.tsx` — No major changes if BaseEventForm handles it; verify props pass-through.
- `src/components/events/MinigameActivityForm.tsx` — Same as above.

### Stage 5 — Update SeriesForm (Priority: P0)
**Goal:** Replace static preset selector with dynamic rule rendering from `supportedRules`.
- Use `PresetConfigPanel` adapted for Series (MAP input for `milestonePoints`, toggle for `MINIMUM_REQUIREMENT`).
- Validate MAP keys (ascending positive integers), values >= 0.
- Submit only `presetCode` + `presetConfig` when using preset.
**Files:**
- `src/components/series/SeriesForm.tsx` — Major refactor to use dynamic preset components.

### Stage 6 — QR Check-in Success Screen (Priority: P0)
**Goal:** Create/Update component that shows `scoreAwards` after successful QR scan.
- Never use `pointsEarned` as primary display.
- Handle empty awards, submission-required pending, series child, re-scan.
- Color/icon per `scoreType`.
**Files:**
- `src/components/qr/CheckInSuccessModal.tsx` (or update wherever QR result is displayed) — Use `ScoreAwardList`.
- Need to find where `POST /api/registrations/checkin/qr` is called and update the success handler.

### Stage 7 — Validation & Edge Cases (Priority: P1)
**Files:**
- `src/utils/presetValidation.ts` — Validate `presetConfig` fields (required, number >= 0, MAP key ascending).
- Handle `SeriesChildActivity` — no preset/scoreRules UI.
- Handle backward compatibility for `pointsEarned`.

### Stage 8 — Verification & Test (Priority: P1)
- Ensure no `any` types used in new code.
- Check all imports compile.
- Review checklist from integration plan.

## Output Artifacts
1. Updated type files (`*.ts`)
2. New component files (`src/components/presets/*.tsx`)
3. New hook files (`src/hooks/*.ts`)
4. Updated form files (`BaseEventForm.tsx`, `SeriesForm.tsx`)
5. Updated QR success display
6. Validation utilities

## Constraints
- NO hardcoding UI per preset. Must render dynamically from `supportedRules`.
- NO `scoreRules` sent when using preset (backend returns 400).
- NO `pointsEarned` used as primary display for QR (use `scoreAwards`).
- Series child activities must NOT show preset/scoreRules config.
- All new code must be type-safe (no `any`).
