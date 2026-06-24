 **Tạo sự kiện con mới:** `POST /api/series/{seriesId}/activities`
- **Cập nhật sự kiện con:** `PUT /api/series/{seriesId}/activities/{activityId}`
- **Lấy chi tiết sự kiện con:** `GET /api/series/{seriesId}/activities/{activityId}`
- **Gắn sự kiện đã có sẵn vào chuỗi:** `POST /api/series/{seriesId}/activities/attach`

---


### Các Interfaces Mới (Thay thế cho CreateActivityRequest và ActivityResponse)

> [!TIP]
> Các interface `CreateActivityRequest`, `UpdateActivityRequest`, và `ActivityResponse` hiện tại vẫn có thể sử dụng (Legacy) để tương thích ngược. Tuy nhiên, FE nên ưu tiên sử dụng các interface chuyên biệt dưới đây cho các endpoint mới.

#### 1. Standard Activity (Hoạt động truyền thống)

```typescript
export interface StandardActivityCreateRequest {
  name: string;
  type: ActivityType; // SUKIEN, CONG_TAC_XA_HOI, CHUYEN_DE_DOANH_NGHIEP
  description?: string | null;
  startDate: string;
  endDate: string;
  location?: string | null;
  organizerIds?: number[];
  registrationStartDate?: string | null;
  registrationDeadline?: string | null;
  requiresSubmission?: boolean | null;
  requiresApproval?: boolean | null;
  ticketQuantity?: number | null;
  isImportant?: boolean | null;
  mandatoryForFacultyStudents?: boolean | null;
  isDraft?: boolean | null;
  bannerUrl?: string | null;
  shareLink?: string | null;
  benefits?: string | null;
  requirements?: string | null;
  contactInfo?: string | null;
  scoreRules?: ActivityScoreRuleRequest[];
  presetCode?: ActivityPresetCode | null;
  presetConfig?: ActivityPresetConfig | null;
}

export interface StandardActivityUpdateRequest extends Omit<StandardActivityCreateRequest, 'type'> {
  // type is omitted because it cannot be changed after creation
}

export interface StandardActivityResponse {
  id: number;
  name: string;
  type: ActivityType;
  description?: string | null;
  startDate: string;
  endDate: string;
  location?: string | null;
  organizerIds: number[];
  registrationStartDate?: string | null;
  registrationDeadline?: string | null;
  hasPreparation: boolean;
  requiresSubmission: boolean;
  requiresApproval: boolean;
  ticketQuantity?: number | null;
  isImportant: boolean;
  mandatoryForFacultyStudents: boolean;
  isDraft: boolean;
  bannerUrl?: string | null;
  shareLink?: string | null;
  benefits?: string | null;
  requirements?: string | null;
  contactInfo?: string | null;
  checkInCode?: string | null;
  scoreRules: ActivityScoreRuleResponse[];
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: string | null;
  lastModifiedBy?: string | null;
}
```

#### 2. Minigame Activity (Hoạt động kèm Minigame / Quiz)

```typescript
export interface MinigameActivityCreateRequest {
  name: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  organizerIds?: number[];
  requiresApproval?: boolean | null;
  ticketQuantity?: number | null;
  isImportant?: boolean | null;
  mandatoryForFacultyStudents?: boolean | null;
  isDraft?: boolean | null;
  registrationStartDate?: string | null;
  registrationDeadline?: string | null;
  bannerUrl?: string | null;
  shareLink?: string | null;
  scoreRules?: ActivityScoreRuleRequest[];
  quiz?: {
    title: string;
    questionCount: number;
    timeLimit: number;
    requiredCorrectAnswers: number;
    maxAttempts: number;
    showAnswers: boolean;
    questions: QuestionRequest[]; // Reuses existing Quiz Question Request
  } | null;
}

export interface MinigameActivityUpdateRequest extends MinigameActivityCreateRequest {}

export interface MinigameActivityResponse {
  id: number;
  name: string;
  type: ActivityType; // Luôn là MINIGAME
  description?: string | null;
  startDate: string;
  endDate: string;
  isDraft: boolean;
  bannerUrl?: string | null;
  shareLink?: string | null;
  isImportant: boolean;
  checkInCode?: string | null;
  scoreRules: ActivityScoreRuleResponse[];
  quiz?: {
    id: number;
    title: string;
    questionCount: number;
    timeLimit: number;
    requiredCorrectAnswers: number;
    maxAttempts: number;
    showAnswers: boolean;
    isActive: boolean;
  } | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}
```

#### 3. Series Child Activity (Hoạt động con trong chuỗi)

```typescript
export interface SeriesChildActivityCreateRequest {
  name: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  location?: string | null;
  order?: number | null; // Thứ tự trong chuỗi (seriesOrder)
  bannerUrl?: string | null;
  shareLink?: string | null;
  benefits?: string | null;
  requirements?: string | null;
  contactInfo?: string | null;
  organizerIds?: number[];
  type: ActivityType;
}

export interface SeriesChildActivityUpdateRequest extends SeriesChildActivityCreateRequest {}

export interface SeriesChildActivityResponse {
  id: number;
  name: string;
  type: ActivityType;
  description?: string | null;
  startDate: string;
  endDate: string;
  hasPreparation: boolean;
  requiresSubmission: boolean; // Mặc định là false cho Series Child
  scoreRules: ActivityScoreRuleResponse[]; // Rỗng hoặc kế thừa
  registrationStartDate?: string | null;
  registrationDeadline?: string | null;
  shareLink?: string | null;
  isImportant: boolean;
  isDraft: boolean;
  bannerUrl?: string | null;
  location?: string | null;
  ticketQuantity?: number | null;
  benefits?: string | null;
  requirements?: string | null;
  contactInfo?: string | null;
  checkInCode?: string | null;
  requiresApproval: boolean;
  mandatoryForFacultyStudents: boolean;
  organizerIds: number[];
  seriesId?: number | null;
  seriesOrder?: number | null;
  seriesName?: string | null; // Thêm tên của series để dễ bề render
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: string | null;
  lastModifiedBy?: string | null;
}
```

#### 4. Activity Summary (Dùng cho API danh sách để tối ưu performance)

```typescript
export interface ActivitySummaryResponse {
  id: number;
  name: string;
  type: ActivityType;
  startDate: string;
  endDate: string;
  bannerUrl?: string | null;
  isDraft: boolean;
  isImportant: boolean;
  location?: string | null;
  variantTag: string; // "STANDARD", "MINIGAME", or "SERIES_CHILD"
  seriesId?: number | null;
}
```
