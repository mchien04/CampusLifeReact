# FE v6 Integration Plan — Preset (P6) + Registration (P7)

> **Mục đích:** Phân tích hiện trạng FE, mapping BE contract v6, gap analysis và implementation plan chi tiết (Preset P6 + Registration P7).
> **Source of truth:** `FE_SPEC_v6_PRESET_AND_REGISTRATION.md` + `FE_BACKEND_HANDOFF_SPEC.md` (§2.1 mục P6/P7, §5.7).
> **Trạng thái:** Plan only — **chưa code**. Các câu hỏi mở Q1–Q7 đã được BE **confirm** (xem §8).
> **Ngày phân tích:** 2026-06-29

---

## 1. Current FE Architecture Analysis

### 1.1 Tech stack
- React 19 + TypeScript, React Router v7, React Query v5.
- Axios (`src/services/api.ts`) với proxy → `http://localhost:8080`.
- Tailwind + Radix UI; `react-toastify` cho toast.
- Custom API layer trả về shape `{ status, message, data }` (map từ `ApiResponse.body`).

### 1.2 Kiến trúc Preset hiện tại (P6 — trước khi tích hợp)

| Mối quan tâm | Vị trí hiện tại | Ghi chú |
|---|---|---|
| Types preset | `src/types/presets.ts` | `PresetRuleDescriptor`, `FieldDefinition`, `ActivityPresetDefinition`, `SeriesPresetDefinition`, preview request/response. |
| Types activity config | `src/types/activity.ts` (`ActivityPresetConfig` L47–100) | Đã có per-rule audience fields (P5.1). **Chưa có `submissionEnabled`**. |
| Hook fetch preset | `src/hooks/useActivityPresets.ts` | Gọi `eventAPI.getActivityPresets()`, build `enabledRules` + initial config. **Chưa dùng ở BaseEventForm** (form tự fetch lại). |
| Component dynamic renderer | `src/components/presets/PresetRuleCard.tsx` | Render field theo `FieldDefinition.inputType` + `visibility`. Có hardcode ẩn `submissionFailPoints` ngoài `EVENT_WITH_SUBMISSION/CUSTOM` (L248–259) — **sẽ xung đột P6**. |
| Component panel | `src/components/presets/PresetConfigPanel.tsx` | Render selector + rule cards + preview table. `handleRuleToggle` (L84) **chỉ toggle 1 rule**, không xử lý conflict. |
| Component selector | `src/components/presets/PresetSelector.tsx` | Có sẵn prop `disabled` nhưng **BaseEventForm không truyền** → dropdown **không lock khi edit**. |
| Validation engine | `src/utils/presetValidation.ts` | `validateActivityPresetConfig` / `validateSeriesPresetConfig` dựa trên `FieldDefinition.required` + cross-field (audience/semester). |
| Integration form (activity) | `src/components/events/BaseEventForm.tsx` | Nơi duy nhất render `PresetConfigPanel` cho Standard/Minigame (L736). Chứa `handleRuleToggle` (L413), reconstruct config từ scoreRules khi edit (L139–186), `handleSubmit` (L644). |
| Integration form (series) | `src/components/series/SeriesForm.tsx` (L474) | Render `PresetConfigPanel` cho series preset. |
| Mapper reconstruct | `src/utils/scoreRuleMapper.ts` | `reconstructActivityPresetConfig` — dựng lại config từ `scoreRules` khi `presetConfig` null. **Chưa set `submissionEnabled`**. |
| Service | `src/services/eventAPI.ts` | `getActivityPresets`, `previewActivityPreset`. |
| Edit form wrapper | `src/pages/EditEvent.tsx` | Lấy `event.presetCode ?? 'CUSTOM'` (L81) truyền vào `initialData`. **Không truyền flag `isEditing` xuống panel** → preset dropdown mở. |

**State quản lý enabled rule:** nằm ở `enabledRules: Record<string, boolean>` trong `BaseEventForm` (state cục bộ component), set qua `handleRuleToggle`. Không có reducer/store → cần mở rộng logic toggle tại đây để xử lý `conflictsWith`.

### 1.3 Kiến trúc Registration hiện tại (P7 — trước khi tích hợp)

| Mối quan tâm | Vị trí hiện tại | Ghi chú |
|---|---|---|
| Types registration | `src/types/registration.ts` | `RegistrationStatus` enum, `ActivityRegistrationResponse`, `TicketCodeValidateResponse`. **Không có `canCancel`** ở đâu cả. |
| Service registration | `src/services/registrationAPI.ts` | `registerForActivity` (POST `/api/registrations`), `cancelRegistration` (DELETE `/api/registrations/activity/{id}`), `checkRegistrationStatus` (GET `/api/registrations/check/{activityId}`). |
| Service series | `src/services/seriesAPI.ts` | `registerForSeries` (POST `/register`). **Chưa có** cancel series, waitlist series. |
| Activity detail (student) | `src/pages/StudentEventDetail.tsx` | `canCancel()` (L373) **tự tính** `eventStatus === UPCOMING && status === PENDING`. `canRegister()` (L322) tự tính, **không xử lý re-register block**. Nút huỷ (L715). |
| Activity list (student) | `src/pages/StudentEvents.tsx` | `canCancel` (L236) **tự tính** `isRegistered && UPCOMING && status !== APPROVED`. Nút huỷ (L385). |
| Participation history | `src/pages/StudentParticipationHistory.tsx` | `canCancel(status)` (L110) = `status === 'PENDING'`. Nút huỷ (L322). |
| Manager detail | `src/pages/EventDetail.tsx` | `checkRegistrationStatus` (L162, L573). |
| Dashboard widget | `src/components/dashboard/StudentDashboard.tsx` (L102) | Gọi checkRegistrationStatus. |
| Series detail (student) | `src/pages/StudentSeriesDetail.tsx` | `handleRegister`, `canRegister()` (L107). **Không có** nút huỷ series, **không có** waitlist, **không hiển thị** slot còn lại. |
| Series registration status | `SeriesRegistrationStatus` (`types/series.ts` L135) | Chỉ `{ isRegistered: boolean }` — **không phân biệt WAITLIST**. |

**Endpoint mismatch nghiêm trọng:** FE gọi `GET /api/registrations/check/{activityId}` (trả về `ActivityRegistrationResponse`), nhưng spec P7 chỉ định `GET /api/registrations/activity/{activityId}/status` trả về `{ registrationId, status, registeredDate, canCancel }`. **Cần verify** (xem §6 — Open Questions).

---

## 2. BE → FE Gap Analysis

Bảng mapping đầy đủ theo spec. **GAP = phải làm mới; EDIT = sửa file có sẵn.**

| # | BE change (spec §) | FE affected area | File/component dự kiến | Action | Loại |
|---|---|---|---|---|---|
| P6-1 | `PresetRuleDescriptor.conflictsWith?: string[]` (FE_SPEC §1) | Type descriptor | `src/types/presets.ts` L29 | Thêm field `conflictsWith?: string[]` | EDIT |
| P6-2 | Toggle rule ON → auto-disable `conflictsWith` (FE_SPEC §1) | Rule toggle logic | `src/components/events/BaseEventForm.tsx` `handleRuleToggle` L413 | Khi `enabled=true`, tìm rule trong preset, set `enabledRules[conflict]=false` cho mọi key trong `conflictsWith`. Đồng bộ `presetConfig` field enabled cho rule bị tắt. | EDIT |
| P6-3 | `conflictsWith` mirror vào panel | Panel toggle | `src/components/presets/PresetConfigPanel.tsx` `handleRuleToggle` L84 + prop `presets` | Truyền logic conflict xuống (hoặc giữ logic ở parent BaseEventForm, panel chỉ delegate). | EDIT |
| P6-4 | `ActivityPresetConfig.submissionEnabled?: boolean` (FE_SPEC §2) | Type config | `src/types/activity.ts` L47 | Thêm `submissionEnabled?: boolean \| null` | EDIT |
| P6-5 | Sync `submissionEnabled` với toggle SUBMISSION_GRADED | Rule toggle / field change | `BaseEventForm.handleRuleToggle` + reconstruct | Khi `SUBMISSION_GRADED` ON → `presetConfig.submissionEnabled=true`; khi OFF (hoặc PARTICIPATION_COMPLETED ON) → `submissionEnabled=false`. **Tránh duplicate state**: derive `submissionEnabled` từ `enabledRules.SUBMISSION_GRADED`, không tạo state riêng. | EDIT |
| P6-6 | Bỏ render `ACTIVITY_AUDIENCE` (FE_SPEC §3) | Dynamic renderer | `src/components/presets/PresetRuleCard.tsx` | BE đã không trả ruleKey `ACTIVITY_AUDIENCE`; confirm không có render đặc thù cho key này (audit: **không thấy**). Nếu có filter/tag nào tham chiếu → gỡ. Verify-only. | AUDIT |
| P6-7 | `participationFailPoints` → `required:false` (FE_SPEC §4) | Dynamic form | `src/components/presets/PresetRuleCard.tsx`, `presetValidation.ts` | Đã render theo `FieldDefinition.required` → BE trả `required:false` thì tự bỏ `*`. **Verify** không có hardcode validation riêng cho field này. (Audit: validation engine dùng metadata, OK.) | VERIFY |
| P6-8 | `submissionFailPoints` required khi `SUBMISSION_GRADED` ON (FE_SPEC §5) | Dynamic renderer + validation | `PresetRuleCard.tsx` L248–259 | **Gỡ** hardcode ẩn `submissionFailPoints` ngoài `EVENT_WITH_SUBMISSION/CUSTOM` — phải cho phép render trên `ENTERPRISE_SEMINAR_*` khi rule SUBMISSION_GRADED bật. Validation đã dùng `FieldDefinition.required` (BE trả `required:true`) → tự enforce. | EDIT + VERIFY |
| P6-9 | Enterprise Seminar thêm SUBMISSION_GRADED + TASK_OVERDUE (FE_SPEC §7) | Dynamic form | `PresetConfigPanel` + `PresetRuleCard` | Render thêm 2 toggle (đã dynamic theo descriptor). Cần verify descriptor BE trả đủ + `PresetRuleCard` không ẩn sai. Kết hợp P6-8. | EDIT + VERIFY |
| P6-10 | Lock `presetCode` khi edit activity (FE_SPEC §6) | Edit form + selector | `BaseEventForm.tsx`, `PresetConfigPanel.tsx`, `PresetSelector.tsx` | Thêm prop `isEditing` / `lockPreset` xuống panel; truyền `disabled` vào `<PresetSelector>` khi edit + `formData.presetCode` non-null/non-CUSTOM. Giữ readonly value, vẫn cho edit `presetConfig`. `EditEvent.tsx` truyền flag. | EDIT |
| P6-11 | Reconstruct `submissionEnabled` khi edit | Mapper | `src/utils/scoreRuleMapper.ts` `reconstructActivityPresetConfig` L82 + `BaseEventForm` L166 | Khi reconstruct: nếu có rule `SUBMISSION_GRADED` trong `scoreRules` → set `submissionEnabled=true`; ngược lại `false`. Đồng thời `enabledRules.SUBMISSION_GRADED` = true khi reconstruct. | EDIT |
| P6-12 | `defaultRequiresSubmission` optional (handoff §2.1) | Type preset | `src/types/presets.ts` L44 | Đổi `defaultRequiresSubmission: boolean` → `defaultRequiresSubmission?: boolean \| null`. | EDIT (minor) |
| P7-1 | `canCancel` flag (FE_SPEC §8) | Type + service | `src/types/registration.ts`, `src/services/registrationAPI.ts` | Thêm type `ActivityRegistrationStatusResponse { isRegistered, status, canCancel }`. Service `getActivityRegistrationStatus(activityId)` → `GET /api/activities/{id}/registration-status` (đã confirm Q1). Endpoint trả **Map**, parse dùng optional/fallback. | EDIT |
| P7-2 | Nút huỷ theo `canCancel` (FE_SPEC §8) | StudentEventDetail | `src/pages/StudentEventDetail.tsx` L373, L715 | Thay `canCancel()` tự tính bằng `regStatus.canCancel === true`. Gọi `getActivityRegistrationStatus` (thay/song song `checkRegistrationStatus`). Giữ `/check/{id}` nếu cần `ticketCode`. | EDIT |
| P7-3 | Nút huỷ theo `canCancel` (list) | StudentEvents | `src/pages/StudentEvents.tsx` L236, L385 | `GET /api/registrations/my` **không** trả canCancel (Q2) → phải gọi `getActivityRegistrationStatus` per-card. Đề xuất chuyển `check/{id}` sang `/registration-status` cho đồng nhất + có canCancel. | EDIT |
| P7-4 | Nút huỷ theo `canCancel` (history) | StudentParticipationHistory | `src/pages/StudentParticipationHistory.tsx` L110, L322 | Thay `status === 'PENDING'` bằng `canCancel` từ BE (per-row gọi status endpoint, hoặc augment khi `/my` đã fetch). | EDIT |
| P7-5 | Chặn re-register sau khi huỷ (FE_SPEC §9) | StudentEventDetail + StudentEvents | `canRegister()` L322 / L220 + handler register | **Không có field** (Q3) → FE tự suy: cache `activityId → CANCELLED` từ `/my`, ẩn nút đăng ký + hiện text. Safety net: catch lỗi message re-register khi click. `existsByActivityIdAndStudentId` exclude CANCELLED → nút đăng ký sẽ hiện nhưng bị BE chặn. | EDIT |
| P7-6 | Huỷ series — `DELETE /api/series/{seriesId}/register` (FE_SPEC §10) | Service + UI | `src/services/seriesAPI.ts`, `src/pages/StudentSeriesDetail.tsx` | Thêm `cancelSeriesRegistration(seriesId)`. Nút "Huỷ đăng ký series" + confirm dialog. Refresh `loadRegistrationAndProgress`. Hiển thị message lỗi BE (isImportant/mandatory/ATTENDED). | GAP |
| P7-7 | Waitlist series — `POST /api/series/{seriesId}/waitlist` (FE_SPEC §11) | Service + UI | `src/services/seriesAPI.ts`, `src/pages/StudentSeriesDetail.tsx` | Thêm `waitlistSeries(seriesId)`. Show "Đăng ký chờ" khi full. **approvedCount compute client-side** (Q4): `ticketQuantity` từ SeriesResponse + đếm APPROVED từ `GET /api/registrations/series/{seriesId}` (thêm method `getSeriesRegistrations` ở registrationAPI). | GAP |
| P7-8 | Waitlist auto-promote (FE_SPEC §12) | Notification | — | Không code thêm. Student nhận notification khi BE promote. Verify notification render đã hoạt động. | NO-OP / VERIFY |
| P7-9 | Series quantity APPROVED-only (FE_SPEC §13) | Slot display | `src/pages/StudentSeriesDetail.tsx` | **Không có field** (Q4) → FE client-side compute approvedCount (theo P7-7). Verify không có logic đếm cũ cần gỡ. | EDIT |
| P7-10 | Series WAITLIST detection | Type + UI | `src/types/series.ts`, `src/pages/StudentSeriesDetail.tsx` | **Không có indicator** (Q5) → detect qua per-activity: `getActivityRegistrationStatus(firstChildActivityId).status === "WAITLIST"`. Badge "Đang chờ (danh sách chờ)" thay "Đã đăng ký". | EDIT |
| Misc | Re-register: `existsByActivityIdAndStudentId` exclude CANCELLED (handoff §9.26) | canRegister | `StudentEventDetail.canRegister` | SV đã huỷ sẽ thấy nút đăng ký (BE không chặn check), nhưng sẽ bị chặn ở bước register → phụ thuộc P7-5. | (theo P7-5) |

---

## 3. Type / API Contract Audit

### 3.1 Interfaces cần UPDATE

```ts
// src/types/presets.ts
export interface PresetRuleDescriptor {
  ruleKey: string;
  label: string;
  description: string;
  required: boolean;
  enabledByDefault: boolean;
  fieldDefinitions: FieldDefinition[];
  suggestedCombinations?: ScoreRuleTrigger[];
  conflictsWith?: string[];                        // P6-1 (MỚI)
}

export interface ActivityPresetDefinition {
  // ...
  defaultRequiresSubmission?: boolean | null;      // P6-12 (sửa từ required → optional)
}

// src/types/activity.ts
export interface ActivityPresetConfig {
  // ... existing ...
  submissionEnabled?: boolean | null;              // P6-4 (MỚI)
}

// src/types/registration.ts (MỚI)
/** Response từ GET /api/activities/{activityId}/registration-status (BE trả Map, không có DTO cố định). */
export interface ActivityRegistrationStatusResponse {
  isRegistered: boolean;
  status: RegistrationStatus | null;
  canCancel: boolean;
  // các key khác của Map (tuỳ chọn)
}

// src/types/series.ts — KHÔNG thêm field vào SeriesRegistrationStatus
// (Q5 confirm BE không phân biệt WAITLIST → FE detect qua per-activity status)
// Chỉ thêm helper types thuần FE:
export interface SeriesSlotInfo {
  ticketQuantity: number | null;
  approvedCount: number;
  remainingSlots: number | null;   // null = unlimited
  isFull: boolean;                 // false nếu unlimited
}
```

### 3.2 Services cần UPDATE / THÊM

```ts
// src/services/registrationAPI.ts
// P7-1: THÊM — endpoint đã confirm (Q1)
getActivityRegistrationStatus: async (activityId: number): Promise<ActivityRegistrationStatusResponse> => {
  const response = await api.get(`/api/activities/${activityId}/registration-status`);
  return response.data.body;  // Map → parse optional/fallback ở caller
},

// P7-7/P7-9: THÊM (FE đếm APPROVED client-side, Q4)
getSeriesRegistrations: async (seriesId: number): Promise<ActivityRegistrationResponse[]> => {
  const response = await api.get(`/api/registrations/series/${seriesId}`);
  return response.data.body;
},

// src/services/seriesAPI.ts
// P7-6: THÊM
cancelSeriesRegistration: async (seriesId: number): Promise<Response<null>> => {
  const response = await api.delete(`/api/series/${seriesId}/register`);
  return { status: response.data.status, message: response.data.message, data: null };
},

// P7-7: THÊM
waitlistSeries: async (seriesId: number): Promise<Response<any[]>> => {
  const response = await api.post(`/api/series/${seriesId}/waitlist`);
  return { status: response.data.status, message: response.data.message, data: response.data.body || [] };
},
```

### 3.3 Components cần sửa (tóm tắt)
- `src/components/presets/PresetConfigPanel.tsx` — prop `lockPreset?`, xử lý conflict delegation.
- `src/components/presets/PresetSelector.tsx` — đã có `disabled`, chỉ cần truyền từ parent.
- `src/components/presets/PresetRuleCard.tsx` — gỡ hardcode ẩn `submissionFailPoints` (P6-8).
- `src/components/events/BaseEventForm.tsx` — `handleRuleToggle` conflict logic, `submissionEnabled` sync, prop `lockPreset`, reconstruct.
- `src/utils/scoreRuleMapper.ts` — reconstruct `submissionEnabled` + `enabledRules.SUBMISSION_GRADED`.
- `src/pages/StudentEventDetail.tsx`, `StudentEvents.tsx`, `StudentParticipationHistory.tsx` — `canCancel` từ `/registration-status`, re-register block (cache từ `/my`).
- `src/pages/StudentSeriesDetail.tsx` — nút huỷ series, waitlist, slot compute, WAITLIST detection.
- `src/pages/EditEvent.tsx` — truyền flag edit/lock preset xuống form.
- **MỚI helper modules (pure functions, testable):**
  - `src/utils/registrationRules.ts` — `findCancelledActivityIds(regs)`, detect re-register (Q3).
  - `src/utils/seriesSlots.ts` — `computeSeriesSlots(ticketQuantity, regs)` (Q4).

---

## 4. Implementation Phases

Thứ tự đề xuất theo dependency (loose coupling — các phase độc lập có thể merge riêng):

### Phase A — Types & Services (foundation, không UI)
**Dependency:** nền tảng cho mọi phase sau.
1. `src/types/presets.ts`: thêm `conflictsWith`, `defaultRequiresSubmission?`.
2. `src/types/activity.ts`: thêm `submissionEnabled`.
3. `src/types/registration.ts`: thêm `RegistrationStatusResponse`.
4. `src/types/series.ts`: mở rộng `SeriesRegistrationStatus` (sau khi verify §6).
5. `src/services/registrationAPI.ts`: thêm `getRegistrationStatus`.
6. `src/services/seriesAPI.ts`: thêm `cancelSeriesRegistration`, `waitlistSeries`.
7. Chạy `npm run typecheck`.

### Phase B — Preset P6 (form logic)
**Dependency:** Phase A (types).
1. `PresetRuleCard.tsx`: gỡ hardcode ẩn `submissionFailPoints` (P6-8) — render theo descriptor.
2. `BaseEventForm.handleRuleToggle`: thêm logic conflictsWith (P6-2).
3. `BaseEventForm`: sync `submissionEnabled` với toggle SUBMISSION_GRADED (P6-5) — derive, không duplicate state.
4. `BaseEventForm` + `PresetConfigPanel` + `PresetSelector`: prop `lockPreset`, disable dropdown khi edit (P6-10).
5. `scoreRuleMapper.reconstructActivityPresetConfig`: set `submissionEnabled` + `enabledRules.SUBMISSION_GRADED` (P6-11).
6. `EditEvent.tsx`: truyền flag `isEditing`/`lockPreset` xuống.

### Phase C — Registration P7 (UI)
**Dependency:** Phase A (types + services). Có thể làm song song với Phase B.
1. `StudentEventDetail`: dùng `canCancel` từ BE; re-register block (P7-2, P7-5).
2. `StudentEvents`: đồng nhất `canCancel` (P7-3).
3. `StudentParticipationHistory`: dùng `canCancel` (P7-4).
4. `StudentSeriesDetail`: nút huỷ series + confirm dialog (P7-6).
5. `StudentSeriesDetail`: nút "Đăng ký chờ" khi full (P7-7).
6. Verify slot display dùng BE value (P7-9).

### Phase D — Tests
1. Unit test `presetValidation` cho enterprise SUBMISSION_GRADED required.
2. Unit test logic conflictsWith (pure function tách ra testable).
3. Integration/component test cho cancel button theo `canCancel`.
4. Component test series cancel confirm dialog + waitlist.

> **Lý do thứ tự:** Types/Services trước (không phụ thuộc UI). Preset (B) và Registration (C) độc lập với nhau → có thể chia 2 PR song song. Tests (D) theo sau từng phase hoặc cuối.

---

## 5. Detailed Task Breakdown

### 5.1 Preset (P6)
- **[P6-1]** Thêm `conflictsWith?: string[]` vào `PresetRuleDescriptor`.
- **[P6-2]** Mở rộng `handleRuleToggle(ruleKey, enabled)`:
  ```ts
  const handleRuleToggle = (ruleKey: string, enabled: boolean) => {
    setEnabledRules(prev => {
      const next = { ...prev, [ruleKey]: enabled };
      if (enabled) {
        const rule = selectedPreset?.supportedRules.find(r => r.ruleKey === ruleKey);
        for (const conflictKey of rule?.conflictsWith ?? []) {
          next[conflictKey] = false;
        }
      }
      return next;
    });
    // sync presetConfig enabled fields cho mọi rule bị đổi (toggles có suffix 'Enabled')
  };
  ```
- **[P6-3]** Mirror logic ở `PresetConfigPanel` (nếu giữ delegation pattern) hoặc đảm bảo panel chỉ gọi `onRuleToggle` và parent xử lý conflict.
- **[P6-4]** Thêm `submissionEnabled` vào `ActivityPresetConfig`.
- **[P6-5]** Khi toggle SUBMISSION_GRADED: set `presetConfig.submissionEnabled = enabled`. Khi toggle PARTICIPATION_COMPLETED ON: đảm bảo `submissionEnabled=false` (đã do conflict). Derive, không state riêng.
- **[P6-6]** Audit: xác nhận không có render đặc thù `ACTIVITY_AUDIENCE`. (Kết quả: không thấy — no-op.)
- **[P6-7]** Verify: validation đã dùng metadata → participationFailPoints `required:false` tự động bỏ `*`.
- **[P6-8]** Sửa `PresetRuleCard.tsx` L248–259: gỡ filter ẩn `submissionFailPoints` ngoài `EVENT_WITH_SUBMISSION/CUSTOM` → render cho enterprise khi SUBMISSION_GRADED bật.
- **[P6-9]** Verify descriptor enterprise trả đủ 4–5 rule; render động.
- **[P6-10]** Prop `lockPreset?: boolean` xuống `PresetConfigPanel` → `PresetSelector.disabled`. Trong `BaseEventForm`: `lockPreset={isEditing && formData.presetCode && formData.presetCode !== 'CUSTOM'}`.
- **[P6-11]** `reconstructActivityPresetConfig`: `config.submissionEnabled = !!submissionRule` + `enabledRules.SUBMISSION_GRADED = !!submissionRule`.
- **[P6-12]** `defaultRequiresSubmission?` optional.

### 5.2 Registration (P7)
- **[P7-1]** Type `ActivityRegistrationStatusResponse` + service `getActivityRegistrationStatus` → `GET /api/activities/{id}/registration-status` (Map, parse optional/fallback).
- **[P7-2]** `StudentEventDetail`:
  - Thêm state `regStatus: ActivityRegistrationStatusResponse | null`.
  - Trong `checkRegistrationStatus`: gọi thêm `getActivityRegistrationStatus(eventId)` (song song).
  - `canCancel()` → `regStatus?.canCancel === true`.
  - Render message block khi `canCancel=false` + `status=APPROVED` (tuỳ chọn, BE message).
- **[P7-3]** `StudentEvents`: `/my` **không** trả canCancel (Q2) → gọi `getActivityRegistrationStatus` per-card (hoặc migrate `check/{id}` sang `/registration-status`). Cân nhắc debounce/batch vì N card.
- **[P7-4]** `StudentParticipationHistory`: `canCancel` từ BE per-row.
- **[P7-5]** Re-register block (Q3 — không có field):
  - Helper `findCancelledActivityIds(registrations): Set<number>` ở `utils/registrationRules.ts`.
  - Tái dùng `GET /api/registrations/my` (đã fetch nhiều nơi) → build cancelled set.
  - `canRegister()` trả `false` khi activityId ∈ cancelled set; render text "Bạn đã huỷ đăng ký sự kiện này".
  - Safety net: `handleRegister` catch message `"Bạn đã huỷ đăng ký trước đó..."` → toast + ẩn nút.
- **[P7-6]** Series cancel:
  - `cancelSeriesRegistration(seriesId)` ở `seriesAPI`.
  - Nút "Huỷ đăng ký series" (chỉ khi `isRegistered`).
  - `window.confirm("Bạn có chắc muốn huỷ? Tất cả đăng ký sự kiện con cũng sẽ bị huỷ.")`.
  - On success → `loadRegistrationAndProgress`.
  - On error → toast message BE (isImportant/mandatory/ATTENDED).
- **[P7-7]** Waitlist (Q4 — client-side compute approvedCount):
  - `waitlistSeries(seriesId)` ở `seriesAPI`.
  - Helper `computeSeriesSlots(ticketQuantity, seriesRegistrations)` ở `utils/seriesSlots.ts` → đếm distinct APPROVED student.
  - Service `getSeriesRegistrations(seriesId)` ở `registrationAPI` (thêm method, chưa có).
  - Show "Đăng ký chờ" khi `isFull` (approvedCount >= ticketQuantity, ticketQuantity != null).
  - Ẩn khi `!ticketQuantity` (unlimited).
- **[P7-8]** No-op. Verify notification render.
- **[P7-9]** Slot display: client-side compute (theo P7-7). Verify không có logic đếm cũ cần gỡ.
- **[P7-10]** WAITLIST detection (Q5 — không có indicator):
  - Sau khi biết `isRegistered`, lấy `firstChildActivityId` (activities[0].id) → `getActivityRegistrationStatus(firstChildActivityId)`.
  - `isWaitlist = res.status === "WAITLIST"`.
  - Badge "Đang chờ (danh sách chờ)" thay "Đã đăng ký".
  - **Edge case:** nếu series chưa có activity con (`activities` rỗng) → không detect được → fallback badge "Đã đăng ký" + ghi chú.

---

## 6. Test Plan (FE)

### 6.1 Preset
| Case | Mong đợi |
|---|---|
| Enterprise default (tạo mới) | PARTICIPATION_COMPLETED ON (required), SUBMISSION_GRADED OFF, TASK_OVERDUE OFF, NO_SHOW OFF. |
| Bật SUBMISSION_GRADED | `conflictsWith` → PARTICIPATION_COMPLETED tự OFF. `presetConfig.submissionEnabled=true`. |
| Tắt SUBMISSION_GRADED | PARTICIPATION_COMPLETED không tự bật lại (phải manual). |
| Bật PARTICIPATION_COMPLETED khi SUBMISSION_GRADED đang ON | SUBMISSION_GRADED tự OFF. `submissionEnabled=false`. |
| `submissionFailPoints` required | Khi SUBMISSION_GRADED ON → field có `*`, validate chặn submit nếu để trống. |
| `participationFailPoints` optional | Không có `*`, submit OK nếu để trống. |
| Edit activity | Preset dropdown disabled, giữ value; vẫn edit được presetConfig. |
| Edit reconstruct | Activity có rule SUBMISSION_GRADED → `submissionEnabled=true`, toggle đúng trạng thái. |
| CUSTOM mode | Không có conflictsWith enforcement (descriptor CUSTOM có thể không set); vẫn render gợi ý `suggestedCombinations`. |

### 6.2 Registration
| Case | Mong đợi |
|---|---|
| PENDING + auto-approve activity | Nút huỷ hiện (`canCancel=true`). |
| APPROVED + requiresApproval=true | Nút huỷ ẩn (`canCancel=false`). |
| APPROVED + auto-approve + trước deadline-1day | Nút huỷ hiện. |
| APPROVED + auto-approve + đã huỷ 1 lần | Nút huỷ ẩn. |
| APPROVED + auto-approve + sau deadline-1day | Nút huỷ ẩn. |
| CANCELLED (đã huỷ) | Nút huỷ ẩn + nút đăng ký ẩn + text "Bạn đã huỷ đăng ký sự kiện này". |
| WAITLIST / PENDING | Nút huỷ hiện. |
| Series full + trước deadline | Nút đổi thành "Đăng ký chờ". |
| Series unlimited ticket | Chỉ nút "Đăng ký" (không waitlist). |
| Series cancel khi `isImportant` | Toast lỗi "Không thể huỷ đăng ký chuỗi sự kiện quan trọng." |
| Series cancel khi đã ATTENDED 1 activity | Toast lỗi kèm tên activity. |
| Series cancel OK | Confirm dialog → huỷ → badge "Đã đăng ký" biến mất + refresh progress. |
| Series WAITLIST detection | `isRegistered=true` + `/registration-status` của 1 child trả `status=WAITLIST` → badge "Đang chờ (danh sách chờ)". |
| Series không có child activity | Không detect WAITLIST → fallback badge "Đã đăng ký" + ghi chú. |
| Re-register với `/my` stale | Vừa huỷ xong, `/my` chưa refetch → nút đăng ký hiện → click → BE trả lỗi "Bạn đã huỷ..." → toast + ẩn nút (safety net). |
| Series slot compute | `ticketQuantity=50`, registrations có 30 APPROVED distinct + 5 PENDING → `remainingSlots=20`, nút "Đăng ký" (chưa full). |
| Series slot unlimited | `ticketQuantity=null` → `isFull=false`, chỉ nút "Đăng ký" (không waitlist). |

---

## 7. Risk / Backward Compatibility Notes

### 7.1 Rủi ro kỹ thuật
- **R7.1 — Hai endpoint song song (`/check/{id}` + `/registration-status`)**: FE sẽ phải giữ cả 2 (`/check/{id}` cho chi tiết registration/ticketCode, `/registration-status` cho canCancel). Nguy cơ inconsistent nếu quên gọi cả 2. **Mitigation**: đóng gói vào 1 hook `useActivityRegistration(activityId)` trả cả 2 thông tin, dùng ở mọi nơi.
- **R7.2 — `submissionEnabled` duplicate state**: Nếu tạo state riêng thay vì derive từ `enabledRules.SUBMISSION_GRADED` → dễ lệch. **Quyết định**: derive, không state riêng.
- **R7.3 — `submissionFailPoints` hardcode filter**: Sửa sai có thể khiến field xuất hiện ở preset không mong muốn (vd EVENT_BASIC nếu BE trả descriptor sai). Cần test kỹ enterprise vs event. Mitigation: chỉ ẩn khi `rule.ruleKey !== 'SUBMISSION_GRADED'`, không filter theo presetCode nữa.
- **R7.4 — Lock preset khi edit**: Admin đang edit sẽ không đổi được preset → phải đảm bảo preset cũ vẫn load đủ descriptor để edit config. Verify descriptor cho preset cũ vẫn trả từ `/presets`.
- **R7.5 — List view cancel cost**: `/my` không trả canCancel (Q2) → `StudentEvents` phải gọi `/registration-status` per-card. Với N sự kiện → N request. **Mitigation**: lazy-load (chỉ khi card visible), hoặc React Query batch. Cân nhắc performance cho list lớn.
- **R7.6 — Series slot compute client-side (Q4)**: `GET /api/registrations/series/{seriesId}` có thể trả nhiều record (tất cả activity con × SV). Đếm distinct APPROVED student client-side → O(n) nhưng n có thể lớn. Mitigation: deduplicate theo `studentId`. Cân nhắc nếu BE có overview endpoint rẻ hơn.
- **R7.7 — Series WAITLIST detection (Q5)**: Phụ thuộc có activity con tồn tại. Series mới tạo (chưa có child) → không detect được → fallback badge. Nếu activity con bị xoá sau khi đăng ký → edge case.
- **R7.8 — Re-register inference (Q3)**: Dựa cache `/my` → nếu `/my` stale (vừa huỷ, chưa refetch) → nút đăng ký có thể hiện sai rồi BE chặn. Safety net catch error đã có, nhưng UX không tối ưu. Mitigation: refetch `/my` sau khi huỷ.

### 7.2 Backward compatibility
- Types mới đều **optional** → không phá code cũ.
- `conflictsWith` optional → preset cũ không có sẽ không break.
- Toggle conflict chỉ chạy khi `enabled=true` → tắt rule không触发.
- Việc gỡ hardcode `submissionFailPoints` filter: an toàn vì BE giờ kiểm soát descriptor + P6-9 yêu cầu enterprise hiển thị.
- Service mới thêm method, không sửa method cũ → API cũ (register/cancel) giữ nguyên. `/check/{id}` giữ nguyên để không phá `ticketCode` lookup.

### 7.3 Out of scope (P7 không cần FE)
- Waitlist auto-promote (FE chỉ render notification — §P7-8).
- Quartz overdue scanning (FE hiển thị status từ BE).

---

## 8. Open Questions — ĐÃ CONFIRM VỚI BE

> Tất cả câu hỏi đã được BE confirm. Quyết định implementation dưới đây.

### Q1 — canCancel endpoint ✅ CONFIRMED
**Endpoint duy nhất trả `canCancel`:** `GET /api/activities/{activityId}/registration-status` → `Map { isRegistered, status, canCancel, ... }`.

| Endpoint | Trả `canCancel`? |
|---|---|
| `GET /api/activities/{activityId}/registration-status` | **YES** — `{ isRegistered, status, canCancel, ... }` |
| `GET /api/registrations/check/{activityId}` (FE đang dùng) | **NO** — trả `ActivityRegistrationResponse` DTO, không có `canCancel` |

→ **Quyết định:** FE dùng `/api/activities/{activityId}/registration-status` cho quyết định `canCancel`. Giữ `/check/{id}` cho chi tiết registration (ticketCode,...) nếu cần.

### Q2 — List view có canCancel không? ✅ CONFIRMED
**Không.** `GET /api/registrations/my` chỉ trả `status` (PENDING/APPROVED/WAITLIST/CANCELLED) — không có `canCancel`.

→ **Quyết định:** List view (`StudentEvents`) phải gọi `GET /api/activities/{id}/registration-status` per-card để lấy `canCancel`. Đề xuất chuyển luôn `check/{id}` sang `/registration-status` cho đồng nhất + có canCancel.

### Q3 — Flag "đã huỷ, không đăng ký lại" ✅ CONFIRMED
**Không có field `hasCancelledBefore`.** BE chỉ chặn ở `POST /api/registrations/activity` với message `"Bạn đã huỷ đăng ký trước đó, không thể đăng ký lại."`. Quan trọng: `existsByActivityIdAndStudentId` **exclude CANCELLED** → SV đã huỷ sẽ **không** thấy `isRegistered: true` ở `/registration-status` nếu không còn non-CANCELLED record.

→ **Quyết định:** FE tự suy từ 2 signal:
1. `GET /api/registrations/my` → tìm item có `activityId` match + `status === "CANCELLED"` → **ẩn nút đăng ký**, hiện text "Bạn đã huỷ đăng ký sự kiện này".
2. Khi click đăng ký, bắt lỗi message re-register → toast (safety net cho trường hợp `/my` chưa load).

> **Cần cache map `activityId → CANCELLED`** từ `/my` (FE đã fetch `/my` ở nhiều nơi — tái dùng, không thêm request).

### Q4 — approvedCount / slot còn lại của series ✅ CONFIRMED
**Không có trực tiếp.** `SeriesResponse` chỉ có `ticketQuantity` (capacity). `SeriesOverviewResponse` có `totalRegisteredStudents` (tất cả statuses, không phải APPROVED-only).

→ **Quyết định:** FE **client-side compute**:
1. Lấy `ticketQuantity` từ `SeriesResponse`.
2. Gọi `GET /api/registrations/series/{seriesId}` → đếm distinct student có `status === "APPROVED"`.
3. `remainingSlots = ticketQuantity - approvedCount`.
4. Show "Đăng ký chờ" khi `ticketQuantity != null && approvedCount >= ticketQuantity && remainingSlots <= 0`.

### Q5 — Series WAITLIST status ✅ CONFIRMED
**Không có indicator riêng** trong `GET /api/series/{seriesId}/registration/my` (`isRegistered: true` cho cả APPROVED lẫn WAITLIST).

→ **Quyết định:** FE detect WAITLIST qua **per-activity check**: gọi `GET /api/activities/{childActivityId}/registration-status` cho **1 activity** trong series → check `status === "WAITLIST"`. (Tất cả activity con có cùng status — BE tạo WAITLIST đồng loạt.)

### Q6 — Enterprise preset descriptors ✅ CONFIRMED
Sample payload `GET /api/activities/presets` cho `ENTERPRISE_SEMINAR_BASIC`:
```json
{
  "supportedRules": [
    { "ruleKey": "PARTICIPATION_COMPLETED", "enabledByDefault": true,  "conflictsWith": ["SUBMISSION_GRADED"] },
    { "ruleKey": "SUBMISSION_GRADED",       "enabledByDefault": false, "conflictsWith": ["PARTICIPATION_COMPLETED"], "required": false },
    { "ruleKey": "TASK_OVERDUE",            "enabledByDefault": false, "required": false },
    { "ruleKey": "NO_SHOW",                 "enabledByDefault": false }
  ]
}
```
`WITH_BONUS` thêm `BONUS_POINTS`. `conflictsWith` set đúng 2 chiều. `submissionEnabled` có tại `ActivityPresetConfig.java:66`.

→ **Quyết định:** Implement logic `conflictsWith` + `submissionEnabled` như plan. FE không cần patch descriptor.

### Q7 — ACTIVITY_AUDIENCE đã xoá hoàn toàn ✅ CONFIRMED
Zero reference trong production Java source (chỉ còn test assert + docs lịch sử). CUSTOM preset trả 7 rule: PARTICIPATION_COMPLETED, SUBMISSION_GRADED, TASK_OVERDUE, NO_SHOW, MINIGAME_PASSED, MINIGAME_EXHAUSTED_ATTEMPTS, BONUS_POINTS. Audience chuyển thành per-rule fields trong từng descriptor.

→ **Quyết định:** No-op. Không code gì thêm cho P6-6/P6-7 ngoài verify FE không render `ACTIVITY_AUDIENCE` (audit: không thấy).

---

## 9. Resolutions ảnh hưởng Implementation

Tổng hợp thay đổi quyết định từ §8 (cập nhật §2/§3/§5):

### 9.1 Endpoint & Type mới (thay P7-1)
```ts
// src/types/registration.ts (MỚI)
/** Response từ GET /api/activities/{activityId}/registration-status (Map, không có DTO cố định). */
export interface ActivityRegistrationStatusResponse {
  isRegistered: boolean;
  status: RegistrationStatus | null;
  canCancel: boolean;
  // ...các key khác của Map (tuỳ chọn, không bắt buộc)
}
```
```ts
// src/services/registrationAPI.ts (MỚI)
getActivityRegistrationStatus: async (activityId: number): Promise<ActivityRegistrationStatusResponse> => {
  const response = await api.get(`/api/activities/${activityId}/registration-status`);
  return response.data.body;
},
```
> Ghi chú: `/registration-status` trả Map, nên interface là best-effort. Code parse nên dùng optional chaining + fallback (`res.isRegistered ?? false`, `res.canCancel ?? false`).

### 9.2 Re-register strategy (thay P7-5)
- Không thêm request mới. Tái dùng `GET /api/registrations/my` (FE đã fetch ở nhiều nơi).
- Tạo helper `findCancelledActivityIds(registrations: ActivityRegistrationResponse[]): Set<number>` → map `activityId` có status CANCELLED.
- `canRegister()` trả `false` nếu activityId ∈ cancelled set; render text thay nút.

### 9.3 Series slot computation (thay P7-7/P7-9)
- Helper `computeSeriesSlots(ticketQuantity, seriesRegistrations): { approvedCount, remainingSlots, isFull }`.
- Trong `StudentSeriesDetail`: fetch `GET /api/registrations/series/{seriesId}` (đã có `seriesAPI`? → **chưa**, phải thêm wrapper hoặc dùng registrationAPI). **Audit note:** `registrationAPI` chưa có method cho `/api/registrations/series/{seriesId}` — thêm `getSeriesRegistrations(seriesId)`.

### 9.4 Series WAITLIST detection (thay P7-10)
- Trong `StudentSeriesDetail`: sau khi biết `isRegistered`, lấy 1 `childActivityId` (đầu tiên trong `activities`) → gọi `getActivityRegistrationStatus(childActivityId)` → `isWaitlist = status === "WAITLIST"`.
- Badge "Đang chờ duyệt (danh sách chờ)" thay cho "Đã đăng ký" khi waitlist.

---

*Tài liệu này là plan phân tích — chưa có code được viết. Khi bắt đầu implement, đi theo Phase A → B/C → D (đã update ở §4).*
