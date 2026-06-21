# FE Backend Handoff Spec: Usecase Coverage To Current

## 1. Mục đích

Tài liệu này là bản handoff bổ sung cho frontend, tập trung riêng vào các thay đổi backend được triển khai sau giai đoạn rà usecase coverage đến thời điểm hiện tại.

Tài liệu này không thay thế hoàn toàn `docs/refactor/FE_BACKEND_HANDOFF_SPEC.md`.

Mục tiêu:

- Giúp FE nắm nhanh các tính năng mới và các thay đổi contract mới nhất.
- Chỉ ra các thay đổi nghiệp vụ quan trọng ảnh hưởng trực tiếp đến UI/UX và integration flow.
- Mô tả API theo format API-first, bám đúng contract backend hiện tại.

Nguồn chuẩn:

- `docs/refactor/FE_BACKEND_HANDOFF_SPEC.md`
- controller/service/model hiện tại trong backend

---

## 2. Những thay đổi nghiệp vụ FE phải nắm

### 2.1 Series không còn là tập hợp event cộng điểm riêng lẻ

- Activity thuộc `series` chỉ đóng vai trò là một mốc hoàn thành.
- Khi sinh viên hoàn thành activity con trong series, backend chỉ cập nhật tiến độ mốc.
- Backend không cộng điểm activity riêng cho event con trong series.
- Điểm của series đến từ:
  - milestone đạt được
  - penalty minimum requirement nếu có bật

### 2.2 Task overdue không còn phụ thuộc cron

- Hệ thống production đã chuyển sang Quartz cho nhắc hạn và xử lý `TASK_OVERDUE`.
- FE không cần giả định có cron chạy theo ngày để đổi trạng thái.
- Endpoint test thủ công vẫn còn, nhưng chỉ dùng cho admin/test/debug.

### 2.3 Series có thể cấu hình ngưỡng tối thiểu để tránh bị trừ điểm

- Mỗi series có thể bật/tắt rule minimum requirement.
- Có thể cấu hình:
  - có bật rule hay không
  - cần hoàn thành ít nhất bao nhiêu activity
  - bị trừ bao nhiêu điểm nếu không đạt

### 2.4 Minigame có cờ `showAnswers`

- Backend cho phép bật/tắt việc lộ đáp án đúng sau khi nộp bài.
- FE phải dựa vào dữ liệu backend trả về, không tự suy diễn rằng sau submit luôn được xem đáp án.

---

## 3. Enum delta cho FE

```ts
export type ScoreRuleTrigger =
  | "PARTICIPATION_COMPLETED"
  | "NO_SHOW"
  | "SUBMISSION_GRADED"
  | "MINIGAME_PASSED"
  | "SERIES_MILESTONE_REACHED"
  | "TASK_OVERDUE";

export type ScoreEntrySourceType =
  | "ACTIVITY_PARTICIPATION"
  | "ACTIVITY_REGISTRATION"
  | "TASK_SUBMISSION"
  | "TASK_ASSIGNMENT"
  | "MINIGAME_ATTEMPT"
  | "SERIES_PROGRESS"
  | "SERIES_MINIMUM_REQUIREMENT"
  | "MANUAL_ADJUSTMENT"
  | "RECALCULATION";
```

Ghi chú:

- `NO_SHOW` được dùng cho event độc lập, không áp dụng cho activity con trong series.
- `TASK_OVERDUE` là penalty cho task chưa nộp quá hạn.
- `SERIES_MINIMUM_REQUIREMENT` là source type mới cho penalty của series khi không đạt số mốc tối thiểu.

---

## 4. TypeScript types mới hoặc thay đổi

### 4.1 Activity preset

```ts
export type ActivityPresetCode =
  | "EVENT_BASIC"
  | "EVENT_WITH_SUBMISSION"
  | "ENTERPRISE_SEMINAR_BASIC"
  | "ENTERPRISE_SEMINAR_WITH_BONUS"
  | "MINIGAME_PASS_ONLY"
  | "CUSTOM";

export interface ActivityPresetPreviewResponse {
  presetCode: ActivityPresetCode;
  activityType: ActivityType;
  requiresSubmission: boolean;
  scoreRules: ActivityScoreRuleRequest[];
  notes: string[];
}
```

### 4.2 Series cấu hình mới

```ts
export type SeriesPresetCode =
  | "SERIES_MILESTONE_BASIC"
  | "ENTERPRISE_SERIES"
  | "CUSTOM";

export interface SeriesPresetConfig {
  primaryScoreType?: ScoreType | null;
  milestonePoints?: Record<number, number>;
  minimumRequirementEnabled?: boolean | null;
  minimumRequiredEvents?: number | null;
  minimumPenaltyPoints?: number | null;
}

export interface CreateSeriesRequest {
  name: string;
  description?: string | null;
  milestonePoints?: Record<number, number>;
  scoreType?: ScoreType | null;
  mainActivityId?: number | null;
  registrationStartDate?: string | null;
  registrationDeadline?: string | null;
  requiresApproval?: boolean | null;
  ticketQuantity?: number | null;
  minimumRequirementEnabled?: boolean | null;
  minimumRequiredEvents?: number | null;
  minimumPenaltyPoints?: number | null;
  presetCode?: SeriesPresetCode | null;
  presetConfig?: SeriesPresetConfig | null;
}

export interface UpdateSeriesRequest extends CreateSeriesRequest {}

export interface SeriesResponse {
  id: number;
  name: string;
  description?: string | null;
  milestonePoints: Record<number, number>;
  scoreType: ScoreType;
  mainActivityId?: number | null;
  registrationStartDate?: string | null;
  registrationDeadline?: string | null;
  requiresApproval: boolean;
  ticketQuantity?: number | null;
  minimumRequirementEnabled: boolean;
  minimumRequiredEvents?: number | null;
  minimumPenaltyPoints?: number | null;
  createdAt?: string | null;
}

export interface SeriesPresetPreviewResponse {
  presetCode: SeriesPresetCode;
  scoreType: ScoreType;
  milestonePoints: Record<number, number>;
  minimumRequirementEnabled?: boolean | null;
  minimumRequiredEvents?: number | null;
  minimumPenaltyPoints?: number | null;
  notes: string[];
}
```

### 4.3 MiniGame thay đổi

```ts
export interface CreateMiniGameRequest {
  activityId: number;
  title: string;
  description?: string | null;
  questionCount: number;
  timeLimit: number;
  requiredCorrectAnswers: number;
  maxAttempts: number;
  showAnswers?: boolean | null;
  questions: CreateMiniGameQuestionRequest[];
}

export interface UpdateMiniGameRequest {
  title: string;
  description?: string | null;
  questionCount: number;
  timeLimit: number;
  requiredCorrectAnswers: number;
  maxAttempts: number;
  showAnswers?: boolean | null;
  questions: CreateMiniGameQuestionRequest[];
}

export interface MiniGameResponse {
  id: number;
  title: string;
  description?: string | null;
  questionCount: number;
  timeLimit: number;
  requiredCorrectAnswers: number;
  maxAttempts: number;
  isActive: boolean;
  showAnswers: boolean;
  type: MiniGameType;
  activityId?: number | null;
}

export interface AttemptDetailResponse {
  id: number;
  status: string;
  correctCount: number;
  totalQuestions: number;
  pointsEarned: string;
  startedAt: string;
  submittedAt?: string | null;
  requiredCorrectAnswers: number;
  showAnswers: boolean;
  questions: QuizQuestionDetailResponse[];
}
```

### 4.4 Series progress payload cần FE chú ý

`GET /api/series/{seriesId}/progress/my` và `GET /api/series/{seriesId}/students/{studentId}/progress` hiện trả object động trong `body`, không phải DTO typed chính thức.

Các field FE nên dùng:

```ts
export interface SeriesStudentProgressView {
  studentId: number;
  seriesId: number;
  seriesName: string;
  completedCount: number;
  totalActivities: number;
  completedActivityIds: number[];
  pointsEarned: string;
  lastUpdated?: string | null;
  currentMilestone?: string | null;
  nextMilestoneCount?: number | null;
  nextMilestonePoints?: number | null;
  milestonePoints?: Record<string, number> | null;
  scoreType: ScoreType;
  minimumRequirementEnabled: boolean;
  minimumRequiredEvents?: number | null;
  minimumPenaltyPoints?: number | null;
  minimumRequirementMet: boolean;
  remainingToAvoidPenalty: number;
}
```

---

## 5. Usecase coverage update

| Use case | Trạng thái backend hiện tại | FE cần lưu ý |
| --- | --- | --- |
| Event thường cộng điểm khi tham gia | Đã hỗ trợ qua `scoreRules` + `PARTICIPATION_COMPLETED` | FE không dùng field điểm tĩnh cũ |
| Event có bài nộp + pass/fail | Đã hỗ trợ | FE submit multipart với `content/files/images` |
| No-show event độc lập | Đã hỗ trợ bằng Quartz + `NO_SHOW` | Không áp dụng cho activity con trong series |
| Task overdue | Đã hỗ trợ bằng Quartz + `TASK_OVERDUE` | Không cần chờ cron |
| Series milestone | Đã hỗ trợ | Activity con trong series không cộng điểm riêng |
| Series minimum requirement penalty | Mới thêm | FE cần bật/tắt và cấu hình ngưỡng/phạt ở form series |
| Minigame ẩn/hiện đáp án | Mới thêm | FE dựa vào `showAnswers` từ response |
| Typed series create/update | Đã hỗ trợ | Không còn `Map<String, Object>` ở API tạo/sửa series |
| Activity/Series presets | Đã hỗ trợ | FE có thể preview preset trước khi submit form |

---

## 6. API spec mới và thay đổi

## 6.1 Activity presets

### 1. Mô tả nghiệp vụ

FE lấy danh sách preset activity và preview backend-generated score rules trước khi tạo activity.

### 2. API Endpoint

- **Method:** `GET`
- **Path:** `/api/activities/presets`
- **Authentication:** Required, thường dùng cho Admin/Manager

### 3. Request

- **Path Parameters:** không có
- **Query Parameters:** không có
- **Request Body:** không có

### 4. Response

- **Success (200):**

```json
{
  "status": true,
  "message": "Activity presets retrieved successfully",
  "body": [
    {
      "code": "EVENT_WITH_SUBMISSION",
      "displayName": "Su kien co bai nop",
      "description": "Su kien yeu cau nop bai...",
      "defaultRequiresSubmission": true,
      "recommendedActivityTypes": ["SUKIEN", "CONG_TAC_XA_HOI"],
      "notes": ["..."]
    }
  ]
}
```

- **Error Responses:** chủ yếu `500` với wrapper `Response`

### 5. Documentation Notes

- FE có thể dùng endpoint này để dựng dropdown preset.
- Đây là preset gợi ý từ backend, không phải static config của FE.

### 1. Mô tả nghiệp vụ

Preview preset activity để lấy `activityType`, `requiresSubmission` và `scoreRules` backend sẽ sinh.

### 2. API Endpoint

- **Method:** `POST`
- **Path:** `/api/activities/presets/preview`
- **Authentication:** Required, thường dùng cho Admin/Manager

### 3. Request

- **Path Parameters:** không có
- **Query Parameters:** không có
- **Request Body:**

```json
{
  "presetCode": "EVENT_WITH_SUBMISSION",
  "type": "SUKIEN",
  "requiresSubmission": true,
  "presetConfig": {
    "primaryScoreType": "REN_LUYEN",
    "submissionPassPoints": "5",
    "submissionFailPoints": "0",
    "taskOverduePenaltyPoints": "2"
  }
}
```

### 4. Response

- **Success (200):**

```json
{
  "status": true,
  "message": "Activity preset preview generated successfully",
  "body": {
    "presetCode": "EVENT_WITH_SUBMISSION",
    "activityType": "SUKIEN",
    "requiresSubmission": true,
    "scoreRules": [
      {
        "scoreType": "REN_LUYEN",
        "triggerType": "SUBMISSION_GRADED",
        "calculation": "PASS_FAIL_POINTS",
        "points": 5,
        "failPoints": 0
      },
      {
        "scoreType": "REN_LUYEN",
        "triggerType": "TASK_OVERDUE",
        "calculation": "PENALTY_POINTS",
        "points": 0,
        "failPoints": 2
      }
    ],
    "notes": ["..."]
  }
}
```

- **Error Responses:** chủ yếu `400/500` với wrapper `Response`

### 5. Documentation Notes

- FE nên gọi preview trước khi submit nếu UI cho phép cấu hình preset.
- `TASK_OVERDUE` và `NO_SHOW` là trigger hợp lệ mới.

---

## 6.2 Series presets

### 1. Mô tả nghiệp vụ

FE lấy danh sách preset series và preview milestone/penalty config trước khi tạo series.

### 2. API Endpoint

- **Method:** `GET`
- **Path:** `/api/series/presets`
- **Authentication:** Required, thường dùng cho Admin/Manager

### 3. Request

- **Path Parameters:** không có
- **Query Parameters:** không có
- **Request Body:** không có

### 4. Response

- **Success (200):**

```json
{
  "status": true,
  "message": "Series presets retrieved successfully",
  "body": [
    {
      "code": "SERIES_MILESTONE_BASIC",
      "displayName": "Series milestone co ban",
      "description": "Dinh nghia cac moc hoan thanh...",
      "notes": ["..."]
    }
  ]
}
```

- **Error Responses:** chủ yếu `500` với wrapper `Response`

### 5. Documentation Notes

- Dùng để dựng preset cho form series.

### 1. Mô tả nghiệp vụ

Preview cấu hình series sau khi backend resolve preset.

### 2. API Endpoint

- **Method:** `POST`
- **Path:** `/api/series/presets/preview`
- **Authentication:** Required, thường dùng cho Admin/Manager

### 3. Request

- **Path Parameters:** không có
- **Query Parameters:** không có
- **Request Body:**

```json
{
  "presetCode": "ENTERPRISE_SERIES",
  "presetConfig": {
    "primaryScoreType": "CHUYEN_DE",
    "milestonePoints": {
      "3": 3,
      "5": 5
    },
    "minimumRequirementEnabled": true,
    "minimumRequiredEvents": 3,
    "minimumPenaltyPoints": 2
  }
}
```

### 4. Response

- **Success (200):**

```json
{
  "status": true,
  "message": "Series preset preview generated successfully",
  "body": {
    "presetCode": "ENTERPRISE_SERIES",
    "scoreType": "CHUYEN_DE",
    "milestonePoints": {
      "3": 3,
      "5": 5
    },
    "minimumRequirementEnabled": true,
    "minimumRequiredEvents": 3,
    "minimumPenaltyPoints": 2,
    "notes": ["..."]
  }
}
```

- **Error Responses:** chủ yếu `400/500` với wrapper `Response`

### 5. Documentation Notes

- FE có thể dùng preview response để fill form trước khi submit chính thức.

---

## 6.3 Tạo series typed và penalty tối thiểu

### 1. Mô tả nghiệp vụ

Tạo một series với milestone points, registration config và optional rule phạt nếu sinh viên không đạt số event tối thiểu.

### 2. API Endpoint

- **Method:** `POST`
- **Path:** `/api/series`
- **Authentication:** Required, thường dùng cho Admin/Manager

### 3. Request

- **Path Parameters:** không có
- **Query Parameters:** không có
- **Request Body:**

```json
{
  "name": "Chuoi workshop doanh nghiep 2026",
  "description": "Chuoi 5 buoi workshop",
  "milestonePoints": {
    "3": 5,
    "5": 10
  },
  "scoreType": "CHUYEN_DE",
  "mainActivityId": 120,
  "registrationStartDate": "2026-06-20T08:00:00",
  "registrationDeadline": "2026-06-28T23:59:59",
  "requiresApproval": false,
  "ticketQuantity": 200,
  "minimumRequirementEnabled": true,
  "minimumRequiredEvents": 3,
  "minimumPenaltyPoints": 2,
  "presetCode": "ENTERPRISE_SERIES",
  "presetConfig": {
    "primaryScoreType": "CHUYEN_DE",
    "milestonePoints": {
      "3": 5,
      "5": 10
    },
    "minimumRequirementEnabled": true,
    "minimumRequiredEvents": 3,
    "minimumPenaltyPoints": 2
  }
}
```

### 4. Response

- **Success (200):**

```json
{
  "status": true,
  "message": "Activity series created successfully",
  "body": {
    "id": 10,
    "name": "Chuoi workshop doanh nghiep 2026",
    "description": "Chuoi 5 buoi workshop",
    "milestonePoints": {
      "3": 5,
      "5": 10
    },
    "scoreType": "CHUYEN_DE",
    "mainActivityId": 120,
    "registrationStartDate": "2026-06-20T08:00:00",
    "registrationDeadline": "2026-06-28T23:59:59",
    "requiresApproval": false,
    "ticketQuantity": 200,
    "minimumRequirementEnabled": true,
    "minimumRequiredEvents": 3,
    "minimumPenaltyPoints": 2,
    "createdAt": "2026-06-21T09:00:00"
  }
}
```

- **Error (400):**

```json
{
  "status": false,
  "message": "Invalid request: minimumRequiredEvents must be greater than 0 when minimum requirement is enabled",
  "body": null
}
```

- **Error Responses:** `400`, `500` với wrapper `Response`

### 5. Documentation Notes

- Nếu `minimumRequirementEnabled=true`, backend yêu cầu:
  - `minimumRequiredEvents > 0`
  - `minimumPenaltyPoints > 0`
- Nếu FE không bật rule này, có thể bỏ 3 field trên hoặc gửi `minimumRequirementEnabled=false`.

---

## 6.4 Cập nhật series typed

### 1. Mô tả nghiệp vụ

Cập nhật cấu hình series, bao gồm milestone và minimum requirement penalty.

### 2. API Endpoint

- **Method:** `PUT`
- **Path:** `/api/series/{seriesId}`
- **Authentication:** Required, thường dùng cho Admin/Manager

### 3. Request

- **Path Parameters:**
  - `seriesId`: `number` - ID series
- **Query Parameters:** không có
- **Request Body:**

```json
{
  "name": "Chuoi workshop doanh nghiep 2026 - updated",
  "milestonePoints": {
    "2": 3,
    "4": 8
  },
  "scoreType": "CHUYEN_DE",
  "minimumRequirementEnabled": true,
  "minimumRequiredEvents": 2,
  "minimumPenaltyPoints": 1
}
```

### 4. Response

- **Success (200):** cùng schema `SeriesResponse`
- **Error (400):**

```json
{
  "status": false,
  "message": "Series name cannot be empty",
  "body": null
}
```

- **Error Responses:** `400`, `500` với wrapper `Response`

### 5. Documentation Notes

- Sau khi update series hoặc đổi lịch activity trong series, backend sẽ tự resync Quartz reminder cho minimum requirement.

---

## 6.5 Đăng ký series

### 1. Mô tả nghiệp vụ

Sinh viên đăng ký series, backend sẽ tự tạo registration cho toàn bộ activities hiện có trong series.

### 2. API Endpoint

- **Method:** `POST`
- **Path:** `/api/series/{seriesId}/register`
- **Authentication:** Required, Student

### 3. Request

- **Path Parameters:**
  - `seriesId`: `number` - ID series
- **Query Parameters:** không có
- **Request Body:** không có

### 4. Response

- **Success (200):**

```json
{
  "status": true,
  "message": "Registered for series successfully. 5 activities registered.",
  "body": [
    {
      "id": 301,
      "activity": { "...": "entity payload hiện tại" }
    }
  ]
}
```

- **Error (400):**

```json
{
  "status": false,
  "message": "No activities found in series",
  "body": null
}
```

- **Error Responses:** `400`, `500` với wrapper `Response`

### 5. Documentation Notes

- `body` hiện tại trả danh sách entity registration, chưa phải DTO tinh gọn.
- FE nên chủ yếu dùng endpoint progress/registration-status riêng để hiển thị trạng thái đăng ký series.
- Nếu series có minimum requirement enabled, backend sẽ tự tạo Quartz reminder để kiểm tra điều kiện tối thiểu cho sinh viên đủ điều kiện.

---

## 6.6 Progress của series

### 1. Mô tả nghiệp vụ

FE đọc tiến độ sinh viên trong series, bao gồm milestone hiện tại và trạng thái đạt hay chưa đạt ngưỡng tối thiểu.

### 2. API Endpoint

- **Method:** `GET`
- **Path:** `/api/series/{seriesId}/progress/my`
- **Authentication:** Required, Student

### 3. Request

- **Path Parameters:**
  - `seriesId`: `number` - ID series
- **Query Parameters:** không có
- **Request Body:** không có

### 4. Response

- **Success (200):**

```json
{
  "status": true,
  "message": "Student progress retrieved successfully",
  "body": {
    "studentId": 15,
    "seriesId": 10,
    "seriesName": "Chuoi workshop doanh nghiep 2026",
    "completedCount": 2,
    "totalActivities": 5,
    "completedActivityIds": [101, 103],
    "pointsEarned": 3,
    "lastUpdated": "2026-06-21T10:00:00",
    "currentMilestone": "2",
    "nextMilestoneCount": 4,
    "nextMilestonePoints": 8,
    "milestonePoints": {
      "2": 3,
      "4": 8
    },
    "scoreType": "CHUYEN_DE",
    "minimumRequirementEnabled": true,
    "minimumRequiredEvents": 3,
    "minimumPenaltyPoints": 1,
    "minimumRequirementMet": false,
    "remainingToAvoidPenalty": 1
  }
}
```

- **Error Responses:** `400`, `500` với wrapper `Response`

### 5. Documentation Notes

- Đây là endpoint FE nên dùng để hiển thị “còn thiếu bao nhiêu mốc để không bị trừ”.
- `pointsEarned` là điểm milestone hiện có, không bao gồm frontend-calculated value.

---

## 6.7 Tính milestone thủ công

### 1. Mô tả nghiệp vụ

Admin/Manager có thể trigger tính milestone thủ công cho một sinh viên trong series.

### 2. API Endpoint

- **Method:** `POST`
- **Path:** `/api/series/{seriesId}/students/{studentId}/calculate-milestone`
- **Authentication:** Required, Admin/Manager

### 3. Request

- **Path Parameters:**
  - `seriesId`: `number`
  - `studentId`: `number`
- **Query Parameters:** không có
- **Request Body:** không có

### 4. Response

- **Success (200):**

```json
{
  "status": true,
  "message": "Milestone points calculated",
  "body": {
    "...": "StudentSeriesProgress entity payload"
  }
}
```

- **Error Responses:** `400`, `500` với wrapper `Response`

### 5. Documentation Notes

- Chủ yếu dùng cho admin operation hoặc debug.
- FE student flow thông thường không cần gọi endpoint này.

---

## 6.8 Tạo activity con trong series

### 1. Mô tả nghiệp vụ

Tạo activity con trực tiếp trong series. Backend sẽ auto-register sinh viên đã đăng ký series nếu phù hợp, và resync reminder minimum requirement.

### 2. API Endpoint

- **Method:** `POST`
- **Path:** `/api/series/{seriesId}/activities/create`
- **Authentication:** Required, Admin/Manager

### 3. Request

- **Path Parameters:**
  - `seriesId`: `number`
- **Query Parameters:** không có
- **Request Body:**

```json
{
  "name": "Buoi 4 - CV review",
  "description": "Workshop review CV",
  "startDate": "2026-06-25T08:00:00",
  "endDate": "2026-06-25T10:00:00",
  "location": "Hall A",
  "order": 4,
  "shareLink": "https://...",
  "bannerUrl": "https://...",
  "benefits": "...",
  "requirements": "...",
  "contactInfo": "...",
  "organizerIds": [1, 2],
  "type": "SUKIEN"
}
```

### 4. Response

- **Success (200):**

```json
{
  "status": true,
  "message": "Activity created in series successfully",
  "body": {
    "...": "Activity entity payload"
  }
}
```

- **Error Responses:** `400`, `500` với wrapper `Response`

### 5. Documentation Notes

- Activity con trong series chỉ là mốc.
- FE không nên hiểu rằng completion của activity con sẽ cộng điểm event riêng.

---

## 6.9 Minigame với `showAnswers`

### 1. Mô tả nghiệp vụ

Admin/Manager tạo hoặc cập nhật minigame và quyết định có cho xem đáp án sau khi submit hay không.

### 2. API Endpoint

- **Method:** `POST`
- **Path:** `/api/minigames`
- **Authentication:** Required, Admin/Manager

### 3. Request

- **Path Parameters:** không có
- **Query Parameters:** không có
- **Request Body:**

```json
{
  "activityId": 101,
  "title": "Quiz doanh nghiep",
  "description": "10 cau hoi",
  "questionCount": 10,
  "timeLimit": 600,
  "requiredCorrectAnswers": 7,
  "maxAttempts": 2,
  "showAnswers": false,
  "questions": [
    {
      "questionText": "Cau 1?",
      "imageUrl": null,
      "options": [
        { "text": "A", "isCorrect": true },
        { "text": "B", "isCorrect": false }
      ]
    }
  ]
}
```

### 4. Response

- **Success (200):**

```json
{
  "status": true,
  "message": "MiniGame created successfully",
  "body": {
    "...": "response tùy service hiện tại"
  }
}
```

- **Error Responses:** `400`, `500` với wrapper `Response`

### 5. Documentation Notes

- Sau create/update, FE nên re-fetch `GET /api/minigames/activity/{activityId}` để lấy `MiniGameResponse` chuẩn.

### 1. Mô tả nghiệp vụ

Lấy minigame chuẩn để dựng UI.

### 2. API Endpoint

- **Method:** `GET`
- **Path:** `/api/minigames/activity/{activityId}`
- **Authentication:** Required

### 3. Request

- **Path Parameters:**
  - `activityId`: `number`
- **Query Parameters:** không có
- **Request Body:** không có

### 4. Response

- **Success (200):**

```json
{
  "status": true,
  "message": "MiniGame retrieved successfully",
  "body": {
    "id": 1,
    "title": "Quiz doanh nghiep",
    "description": "10 cau hoi",
    "questionCount": 10,
    "timeLimit": 600,
    "requiredCorrectAnswers": 7,
    "maxAttempts": 2,
    "isActive": true,
    "showAnswers": false,
    "type": "QUIZ",
    "activityId": 101
  }
}
```

- **Error Responses:** `400`, `500` với wrapper `Response`

### 5. Documentation Notes

- FE phải lưu `showAnswers` để điều chỉnh UI xem kết quả.

### 1. Mô tả nghiệp vụ

Lấy chi tiết attempt sau khi làm quiz.

### 2. API Endpoint

- **Method:** `GET`
- **Path:** `/api/minigames/attempts/{attemptId}`
- **Authentication:** Required, Student sở hữu attempt

### 3. Request

- **Path Parameters:**
  - `attemptId`: `number`
- **Query Parameters:** không có
- **Request Body:** không có

### 4. Response

- **Success (200):**

```json
{
  "status": true,
  "message": "Attempt detail retrieved successfully",
  "body": {
    "id": 12,
    "status": "PASSED",
    "correctCount": 8,
    "totalQuestions": 10,
    "pointsEarned": 5,
    "startedAt": "2026-06-21T10:00:00",
    "submittedAt": "2026-06-21T10:05:00",
    "requiredCorrectAnswers": 7,
    "showAnswers": false,
    "questions": [
      {
        "...": "chi tiết câu hỏi"
      }
    ]
  }
}
```

- **Error Responses:** `400`, `500` với wrapper `Response`

### 5. Documentation Notes

- Nếu `showAnswers=false`, FE phải chấp nhận việc backend không trả thông tin đáp án đúng.
- Không tự render “đáp án đúng” nếu backend không cung cấp field đó.

---

## 6.10 Task overdue bằng Quartz

### 1. Mô tả nghiệp vụ

Task assignment khi quá hạn chưa nộp sẽ được backend xử lý bằng Quartz reminder thay vì cron scheduler cũ.

### 2. API Endpoint

- **Method:** `POST`
- **Path:** `/api/tasks/check-overdue`
- **Authentication:** Required, Admin/Manager

### 3. Request

- **Path Parameters:** không có
- **Query Parameters:** không có
- **Request Body:** không có

### 4. Response

- **Success (200):**

```json
{
  "status": true,
  "message": "Updated 3 assignments to OVERDUE status",
  "body": {
    "updatedCount": 3
  }
}
```

- **Error Responses:** `400`, `500` với wrapper `Response`

### 5. Documentation Notes

- Đây là endpoint trigger thủ công.
- Luồng production chuẩn hiện tại là Quartz tự xử lý `TASK_OVERDUE`.
- FE không cần tạo cron/polling để chờ đổi trạng thái.

---

## 6.11 Task submission giữ nguyên path nhưng semantics mới cho series

### 1. Mô tả nghiệp vụ

Sinh viên nộp bài cho task; nếu activity thuộc series thì việc pass submission chỉ ghi nhận hoàn thành mốc, không cộng điểm event riêng.

### 2. API Endpoint

- **Method:** `POST`
- **Path:** `/api/submissions/task/{taskId}`
- **Authentication:** Required, Student

### 3. Request

- **Path Parameters:**
  - `taskId`: `number`
- **Query Parameters:** không có
- **Request Body:** `multipart/form-data`

```json
{
  "content": "string - optional",
  "files": "multipart[] - optional",
  "images": "multipart[] - optional"
}
```

### 4. Response

- **Success (200):** wrapper `Response` với `body: TaskSubmissionResponse`
- **Error Responses:** `400`, `500` với wrapper `Response`

### 5. Documentation Notes

- Contract upload không đổi so với spec trước.
- Semantics đổi ở backend:
  - standalone activity: submission grading có thể cộng điểm
  - activity trong series: submission grading chỉ cập nhật milestone progress

---

## 7. Những thay đổi FE phải cập nhật so với handoff cũ

- Bổ sung enum `NO_SHOW`, `TASK_OVERDUE`, `ACTIVITY_REGISTRATION`, `TASK_ASSIGNMENT`, `SERIES_MINIMUM_REQUIREMENT`.
- Bổ sung `showAnswers` vào create/update/get minigame.
- Bổ sung 3 field minimum requirement vào create/update/get series:
  - `minimumRequirementEnabled`
  - `minimumRequiredEvents`
  - `minimumPenaltyPoints`
- Bổ sung activity/series preset preview contract.
- Hiểu lại semantics series:
  - activity con không cộng điểm event riêng
  - series mới là nơi cộng milestone và trừ penalty minimum requirement
- Không còn dựa vào cron path cho task overdue production flow.

---

## 8. Khuyến nghị FE implementation

- Tách thêm file types riêng:
  - `src/types/presets.ts`
  - `src/types/series.ts`
- Ở màn tạo/sửa series:
  - thêm UI toggle `minimumRequirementEnabled`
  - nếu bật thì bắt buộc nhập `minimumRequiredEvents` và `minimumPenaltyPoints`
- Ở màn progress series:
  - hiển thị `minimumRequirementMet`
  - hiển thị `remainingToAvoidPenalty`
  - không hiển thị “điểm event con” cho activity thuộc series
- Ở màn review kết quả minigame:
  - check `showAnswers` trước khi render đáp án đúng

---

## 9. Checklist FE

- [ ] Cập nhật enum trigger/source type mới.
- [ ] Cập nhật type `MiniGameResponse`, `CreateMiniGameRequest`, `UpdateMiniGameRequest` với `showAnswers`.
- [ ] Cập nhật type `SeriesResponse`, `CreateSeriesRequest`, `UpdateSeriesRequest` với minimum requirement config.
- [ ] Bổ sung UI form series cho penalty minimum requirement.
- [ ] Bổ sung preset preview flow cho activity/series nếu FE muốn dùng preset-driven form.
- [ ] Cập nhật UI progress series để đọc `minimumRequirementMet` và `remainingToAvoidPenalty`.
- [ ] Không còn giả định activity con trong series sẽ cộng điểm riêng.
