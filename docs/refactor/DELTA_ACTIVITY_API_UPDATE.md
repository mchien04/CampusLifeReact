
# Cập nhật API Activity & Series (Delta)

Tài liệu này tóm tắt các thay đổi mới nhất về kiến trúc API Activity và cấu hình Series, giúp team Frontend dễ dàng nắm bắt và tích hợp mà không cần đọc lại toàn bộ spec.

---

## Phần 1: Tách Biệt API Activity (Architecture Refactoring)

Kiến trúc Activity đã được chia nhỏ thành 3 nhánh riêng biệt để tránh việc dùng chung Payload (DTO) cồng kềnh và gây lỗi ghi đè dữ liệu. Endpoint legacy `/api/activities` vẫn được giữ lại để tương thích ngược, nhưng FE nên dần chuyển sang các endpoint mới.

### 1. Standard Activity (Hoạt động thông thường)

- Dùng cho các sự kiện truyền thống không liên quan tới minigame hay chuỗi (series).
- **Create:** `POST /api/activities/standard`
- **Update:** `PUT /api/activities/standard/{id}`
- **Payload DTO:** `StandardActivityCreateRequest` / `StandardActivityUpdateRequest`

### 2. Minigame Activity (Hoạt động Minigame)

- Dùng riêng cho các sự kiện đi kèm Quiz/Minigame.
- **Create:** `POST /api/activities/minigames`
- **Update:** `PUT /api/activities/minigames/{id}`
- **Payload DTO:** `MinigameActivityCreateRequest` / `MinigameActivityUpdateRequest`

### 3. Series Child Activity (Hoạt động thuộc Chuỗi)

- Dùng riêng cho các sự kiện nằm trong một Chuỗi (Series).
- Hoạt động con **không tự cộng điểm riêng lẻ**, mà điểm được cộng qua tiến độ của Series. Việc gắn một hoạt động vào Series đã được chuyển thành endpoint riêng biệt.
- **Tạo sự kiện trong chuỗi:** `POST /api/series/{seriesId}/activities`
- **Gắn sự kiện có sẵn vào chuỗi:** `POST /api/series/{seriesId}/activities/attach`

---

## Phần 2: Cập nhật API Series (Cấu hình điểm Milestone & Target Semester)

### 1. Thay đổi về DTO

Trong `CreateSeriesRequest`, `UpdateSeriesRequest` và `SeriesResponse`, đã được bổ sung thêm một trường mới:
- `targetSemesterId?: number | null;`

**Mục đích:** Admin có thể cấu hình trước học kỳ nào sẽ được dùng để cộng điểm thưởng (milestone) cho chuỗi sự kiện. Nếu gửi lên `null`, backend sẽ tự động tính toán học kỳ dựa trên thời gian diễn ra sự kiện đầu tiên của chuỗi.

### 2. API Cấu hình Series (Không dùng ActivityScoreRuleRequest)

Điểm thưởng của Series (Milestone points) được cấu hình **trực tiếp** trên Entity Series thông qua trường `milestonePoints` dạng Map (JSON Object), thay vì dùng chung cơ chế của `ActivityScoreRuleRequest`.

#### API Endpoint
- **POST /api/series** (Tạo mới)
- **PUT /api/series/{seriesId}** (Cập nhật)

#### Request Body (Ví dụ tham khảo)
```json
{
  "name": "Workshop Doanh Nghiệp 2026",
  "description": "Chuỗi workshop",
  "scoreType": "CHUYEN_DE",
  "milestonePoints": {
    "1": 1,
    "3": 3,
    "5": 5
  },
  "minimumRequirementEnabled": true,
  "minimumRequiredEvents": 3,
  "minimumPenaltyPoints": 2,
  "targetSemesterId": 1,
  "registrationStartDate": "2026-06-01T00:00:00",
  "registrationDeadline": "2026-06-30T23:59:59",
  "requiresApproval": true,
  "ticketQuantity": 200,
  "presetCode": "ENTERPRISE_SERIES",
  "presetConfig": null
}
```

#### Điểm nhấn quan trọng cho Frontend:

1. **`milestonePoints`**: Key là số sự kiện tối thiểu cần hoàn thành, Value là số điểm được cộng (vd: Hoàn thành 3 sự kiện được 3 điểm chuyên đề).
2. **`minimumPenaltyPoints`**: Frontend truyền số **dương** (vd: `2`). Backend sẽ tự động xử lý chuyển thành điểm trừ (penalty) trong hệ thống tính điểm (`ScoreRuleEngineImpl`).
3. **`targetSemesterId`**: Dropdown chọn học kỳ. Tuân theo logic cấu hình Explicit Semester. Bỏ trống (null) nếu muốn hệ thống tự suy luận.

