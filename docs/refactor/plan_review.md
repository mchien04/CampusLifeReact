# Đánh Giá Implementation Plan — Score Engine Refactor

Đánh giá dựa trên [implementation_plan.md](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/docs/refactor/implementation_plan.md) và cross-reference trực tiếp với codebase hiện tại.

---

## 1. Đánh Giá Tổng Quan

### Điểm mạnh

| # | Nhận xét |
|---|----------|
| ✅ | **Đánh giá hiện trạng rõ ràng.** Phần "Đã làm một phần" vs "Còn lệch lớn" phản ánh đúng thực tế — `scoresAPI`, `submissionAPI`, `StudentMinigamePlay` đã bám sát contract mới, trong khi activity form/detail vẫn hoàn toàn dùng model cũ. |
| ✅ | **Nguyên tắc "sửa contract trước UI" là đúng.** Phase 1 (types + adapters) trước Phase 2 (UI) — tránh refactor UI trên nền dữ liệu sai shape. |
| ✅ | **Phân loại mức độ rõ ràng.** Gắn nhãn `PENDING`, `MOSTLY DONE`, `PARTIAL` giúp team biết nơi cần effort lớn. |
| ✅ | **Scope mở rộng so với plan cũ.** Đã bổ sung đúng `EventList.tsx`, `StudentEvents.tsx`, series forms, `ManagerScores.tsx`. |
| ✅ | **Thứ tự ưu tiên hợp lý.** Phase 4 trước Phase 5, Phase 3 cuối cùng vì đã gần xong. |

### Điểm yếu phát hiện

| # | Vấn đề | Mức độ |
|---|--------|--------|
| ⚠️ | Plan ghi "đã có một phần" nhưng activity types **chưa có `scoreRules` gì cả** | 🔴 Cao |
| ⚠️ | Thiếu scope nhiều file admin dùng `maxPoints`/`rewardPoints` | 🟡 Trung bình |
| ⚠️ | Thiếu các event form components quan trọng: `BaseEventForm.tsx`, `MinigameActivityForm.tsx` | 🟡 Trung bình |
| ⚠️ | Thiếu chi tiết migration path cho legacy fields | 🟡 Trung bình |
| ⚠️ | Phase 2 quá lớn, cần chia nhỏ | 🟠 Nhẹ |

---

## 2. Phân Tích Chi Tiết Theo Phase

### Phase 1: Contract Types & API Adapters

#### ✅ Đã đúng

- `score.ts` cần update enum `ScoreEntrySourceType` — **đúng**, hiện tại [score.ts](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/types/score.ts#L1) vẫn dùng enum cũ:
  ```diff
  - 'MANUAL' | 'ACTIVITY_CHECKIN' | 'ACTIVITY_SUBMISSION' | 'SERIES_MILESTONE' | 'MINIGAME' | 'CHUYEN_DE_COUNT'
  - 'ACTIVITY' | 'MINIGAME' | 'MILESTONE' | 'RECALCULATED'
  + 'ACTIVITY_PARTICIPATION' | 'TASK_SUBMISSION' | 'MINIGAME_ATTEMPT' | 'SERIES_PROGRESS' | 'MANUAL_ADJUSTMENT' | 'RECALCULATION'
  ```

- `submission.ts` cần thêm `SubmissionAttachment` và `attachments` — **đúng**, hiện [submission.ts](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/types/submission.ts) hoàn toàn không có.

- `submissionAPI.ts` cần hỗ trợ `files` + `images` — **đúng**, hiện chỉ append `files`, không có `images`.

- `imageUtils.ts` cần audit — **đúng**, file tồn tại tại [imageUtils.ts](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/utils/imageUtils.ts) và có `getImageUrl()` prepend `BACKEND_URL` cho relative paths. Được **30 files** import sử dụng.

#### 🔴 Đánh giá sai hiện trạng

> **Plan ghi (phần "Đã làm một phần"):** Ngụ ý rằng activity types đã có `scoreRules` trong types.
>
> **Plan ghi (Phase 1):** *"Bổ sung các enum/type mới: `ScoreRuleTrigger`, `ScoreRuleCalculation`..."* và *"Thêm `ActivityScoreRuleRequest`, `ActivityScoreRuleResponse`"*

Thực tế kiểm tra [activity.ts](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/types/activity.ts):
- `CreateActivityRequest` **KHÔNG có** `scoreRules` — chỉ có flat fields: `maxPoints`, `penaltyPointsIncomplete`, `scoreType`
- `ActivityResponse` **KHÔNG có** `scoreRules` — cùng flat model cũ
- **Không tồn tại** bất kỳ enum/interface nào liên quan score rules: không có `ScoreRuleTrigger`, `ScoreRuleCalculation`, `ScoreRuleAudience`, `ScoreSemesterPolicy`, `ActivityScoreRuleRequest`, `ActivityScoreRuleResponse`

→ **Kết luận:** Plan Phase 1 cho activity types nói đúng việc cần làm ("bổ sung") nhưng phần "Đánh giá hiện trạng" ở đầu plan tạo ấn tượng sai rằng types đã có một phần. Thực tế đây là **thay đổi hoàn toàn từ đầu** cho activity types. Effort Phase 1 lớn hơn plan ghi.

#### 🟡 Thiếu chi tiết

- `uploadAPI.ts` — plan ghi đúng cần sửa adapter, nhưng nên ghi rõ hơn: hàm `uploadImage` **đã đọc đúng** `response.data.data`, vấn đề chỉ ở hàm `uploadBanner` wrap thêm layer `{ bannerUrl }`.

---

### Phase 2: Activity Score Rules Migration

#### ✅ Đây đúng là phase lớn nhất

Cross-reference xác nhận `maxPoints` xuất hiện ở **14 files** (51 matches), `penaltyPointsIncomplete` ở **6 files** (17 matches):

| File | Phụ thuộc | Có trong plan? |
|------|-----------|----------------|
| [EventForm.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/events/EventForm.tsx) | 🔴 Form state, validation, inputs | ✅ Có |
| [BaseEventForm.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/events/BaseEventForm.tsx) | 🔴 Init + validate maxPoints | ❌ **THIẾU** |
| [MinigameActivityForm.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/events/MinigameActivityForm.tsx) | 🟡 Set maxPoints = undefined | ❌ **THIẾU** |
| [SeriesActivityForm.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/events/SeriesActivityForm.tsx) | 🟡 Set maxPoints = undefined | ✅ Có (mục REVIEW) |
| [CreateEvent.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/CreateEvent.tsx) | 🟡 Map payload | ✅ Có |
| [EditEvent.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/EditEvent.tsx) | 🟡 Populate + submit | ✅ Có |
| [EventDetail.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/EventDetail.tsx) | 🔴 Display "Điểm tối đa" | ✅ Có |
| [StudentEventDetail.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/StudentEventDetail.tsx) | 🔴 Display maxPoints | ✅ Có |
| [EventList.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/EventList.tsx) | 🟡 Badge hiển thị | ✅ Có |
| [StudentEvents.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/StudentEvents.tsx) | 🟡 Badge hiển thị | ✅ Có |
| [SeriesDetail.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/admin/SeriesDetail.tsx) | 🟡 Hiển thị/edit | ✅ Có (mục REVIEW) |
| [Statistics.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/admin/Statistics.tsx) | 🟠 Tính toán thống kê | ❌ **THIẾU** |
| [PreparationDetail.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/admin/PreparationDetail.tsx) | 🟠 Tham chiếu | ❌ **THIẾU** |
| [admin/TaskManagement.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/admin/TaskManagement.tsx) | 🟠 Display task maxPoints | ❌ **THIẾU** |
| [TaskForm.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/task/TaskForm.tsx) | 🟡 Form field + validation | ❌ **THIẾU** |

> [!WARNING]
> **6 files bị thiếu scope ở Phase 2:** `BaseEventForm.tsx`, `MinigameActivityForm.tsx`, `Statistics.tsx`, `PreparationDetail.tsx`, `TaskManagement.tsx`, `TaskForm.tsx`. Trong đó `BaseEventForm.tsx` là **critical** — nó init và validate `maxPoints` trước khi `EventForm.tsx` render, bỏ sót file này sẽ gây lỗi runtime.

---

### Phase 3: Score Ledger Cleanup

#### ✅ Đánh giá đúng mức độ "MOSTLY DONE"

Code hiện tại đã dùng `scoreHistories[]`. Chỉ cần cleanup enum mapping.

#### 🟠 Nhận xét

Plan nhắc cần xác định vai trò `TrainingScore.tsx` nhưng ghi "cân nhắc giảm scope" quá mơ hồ. Nên đưa quyết định dứt khoát:
- **Nếu giữ:** ghi rõ "trang tính điểm rèn luyện theo tiêu chí — khác chức năng với ViewScores"
- **Nếu merge:** chuyển thành `[DEPRECATE]`

---

### Phase 4: Submission Attachments & Upload URLs

#### ✅ Scope chính đúng

Plan đã bổ sung đúng `StudentEventDetail.tsx` (entry point nộp bài mà plan cũ thiếu). Và [SubmissionDetailsModal.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/task/SubmissionDetailsModal.tsx) tồn tại tại `src/components/task/` — plan đúng.

#### 🟡 Lưu ý về `imageUtils.ts`

Plan ghi audit `imageUtils.ts` ở Phase 1 là đúng, nhưng impact thực tế lan rộng: `getImageUrl()` được **30 files** sử dụng. Cần xác định rõ chiến lược:
- Nếu backend đã trả absolute URL → `getImageUrl()` sẽ short-circuit ở điều kiện `startsWith('http')` → an toàn, không cần sửa caller.
- Nếu backend vẫn có trường hợp trả relative path → cần giữ `getImageUrl()` nhưng review `BACKEND_URL` env var.

---

### Phase 5: Minigame Cleanup & Admin Alignment

#### ✅ Student flow đã gần xong — đúng

#### 🟡 Thiếu scope admin

`rewardPoints` xuất hiện ở **9 files** (25 matches). Plan nhắc `MinigameManagement.tsx`, `QuizForm.tsx`, `QuizCard.tsx` nhưng thiếu:

| File thiếu | Vai trò |
|-----------|---------|
| [CreateMinigame.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/admin/CreateMinigame.tsx) | Dùng `rewardPoints` trong create flow |
| [CreateMinigameWizard.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/admin/CreateMinigameWizard.tsx) | Dùng `rewardPoints` trong wizard |
| [EditQuiz.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/admin/EditQuiz.tsx) | Dùng `rewardPoints` trong edit flow |
| [StudentMinigame.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/StudentMinigame.tsx) | Hiển thị `rewardPoints` trong danh sách |

---

## 3. Tổng Hợp Đề Xuất

### 🔴 Phải sửa (ảnh hưởng tính chính xác plan)

| # | Vấn đề | Đề xuất |
|---|--------|---------|
| 1 | Plan ghi `activity.ts` đã có score rule types/interfaces → **sai**, hoàn toàn chưa có | Sửa phần "Đánh giá hiện trạng": activity types là **PENDING hoàn toàn**, không phải "đã làm một phần". Tăng estimate effort Phase 1. |
| 2 | Phase 2 thiếu [BaseEventForm.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/events/BaseEventForm.tsx) — file init + validate `maxPoints` | Thêm vào Phase 2 scope, **cùng priority với EventForm.tsx** vì 2 file có dependency trực tiếp. |
| 3 | Phase 2 thiếu [MinigameActivityForm.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/events/MinigameActivityForm.tsx) | Thêm vào Phase 2 scope (hiện set `maxPoints: undefined` cho minigame activities). |

### 🟡 Nên bổ sung (thiếu scope)

| # | File thiếu | Phase | Lý do |
|---|-----------|-------|-------|
| 4 | [Statistics.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/admin/Statistics.tsx) | Phase 2 | Dùng `maxPoints` tính thống kê — sai logic nếu không sửa |
| 5 | [PreparationDetail.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/admin/PreparationDetail.tsx) | Phase 2 | Tham chiếu `maxPoints` |
| 6 | [TaskManagement.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/admin/TaskManagement.tsx) | Phase 2 | Display task maxPoints |
| 7 | [TaskForm.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/task/TaskForm.tsx) | Phase 2 | Form field + validation cho maxPoints |
| 8 | [CreateMinigame.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/admin/CreateMinigame.tsx) | Phase 5 | Dùng `rewardPoints` |
| 9 | [CreateMinigameWizard.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/admin/CreateMinigameWizard.tsx) | Phase 5 | Dùng `rewardPoints` |
| 10 | [EditQuiz.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/admin/EditQuiz.tsx) | Phase 5 | Dùng `rewardPoints` |
| 11 | [StudentMinigame.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/StudentMinigame.tsx) | Phase 5 | Hiển thị `rewardPoints` |

### 🟠 Nên cải thiện (chất lượng plan)

| # | Đề xuất |
|---|---------|
| 12 | **Tách Phase 2 thành sub-phases.** Phase 2 ảnh hưởng 15+ files là quá lớn cho một iteration. Đề xuất: (2a) Types + EventForm + BaseEventForm + Create/Edit, (2b) EventDetail + StudentEventDetail + List pages, (2c) Series + Admin audit (Statistics, Preparation, TaskManagement). |
| 13 | **Ghi rõ migration path cho legacy fields.** Với `maxPoints`/`penaltyPointsIncomplete` trong `ActivityResponse`, plan nên chốt: (a) xóa khỏi type ngay, (b) mark `@deprecated` + optional trong 1 sprint, hay (c) giữ nhưng UI không render. Ảnh hưởng effort thực tế. |
| 14 | **Quyết định dứt khoát `TrainingScore.tsx`.** Thay vì "cân nhắc giảm scope", ghi rõ kết luận. |

---

## 4. Kết Luận

> [!TIP]
> **Plan tổng thể là tốt** — đúng hướng, phân loại mức độ hợp lý, thứ tự ưu tiên đúng. Vấn đề chính là **1 đánh giá sai hiện trạng types** (activity.ts chưa có scoreRules, không phải "đã có một phần"), **8 files thiếu scope** (đặc biệt `BaseEventForm.tsx` là critical), và Phase 2 cần chia nhỏ. Sau khi sửa, plan đủ tin cậy để triển khai.

### Mức độ tin cậy theo phase

| Phase | Tin cậy | Hành động cần thiết |
|-------|---------|---------------------|
| Phase 1 | 🟡 75% | Sửa mô tả activity types ("bổ sung hoàn toàn" thay vì "cleanup"), upsize effort |
| Phase 2 | 🟡 70% | Bổ sung 6 files thiếu + tách sub-phases |
| Phase 3 | ✅ 95% | Chỉ cần quyết định `TrainingScore.tsx` |
| Phase 4 | ✅ 90% | Scope chính đúng, chỉ cần ghi rõ `imageUtils.ts` strategy |
| Phase 5 | 🟡 75% | Bổ sung 4 files admin minigame |

### Effort ước tính (sau khi sửa plan)

| Phase | T-shirt Size | Ghi chú |
|-------|-------------|---------|
| Phase 1 | **L** | Activity types phải viết từ đầu, không phải cleanup |
| Phase 2 | **XL** | 15+ files, nên tách 3 sub-phases |
| Phase 3 | **S** | Enum mapping + quyết định TrainingScore |
| Phase 4 | **L** | Multipart submit + attachment render + upload URL |
| Phase 5 | **M** | Student done, admin cần cleanup 4+ files |
