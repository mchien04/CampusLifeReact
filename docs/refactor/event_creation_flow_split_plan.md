# Plan Tách Luồng Tạo Event, Minigame Và Series

Tài liệu này tách riêng bài toán kiến trúc và UX cho các luồng tạo mới trong Frontend, nhằm tránh tình trạng một form activity chung phải gánh quá nhiều semantics khác nhau giữa:

- activity thường
- minigame
- series
- activity con bên trong series

Tài liệu này bám theo:

- [implementation_plan.md](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/docs/refactor/implementation_plan.md)
- [FE_BACKEND_HANDOFF_SPEC_USECASE_TO_CURRENT.md](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/docs/refactor/FE_BACKEND_HANDOFF_SPEC_USECASE_TO_CURRENT.md)
- code hiện tại trong:
  - [EventForm.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/events/EventForm.tsx)
  - [MinigameActivityForm.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/events/MinigameActivityForm.tsx)
  - [SeriesForm.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/series/SeriesForm.tsx)
  - `SeriesActivityForm.tsx`

---

## Mục Tiêu

1. Tách rõ 3 luồng tạo mới ở FE:
   - tạo sự kiện thường
   - tạo minigame
   - tạo series
2. Không cho form tạo sự kiện thường tạo nhầm minigame.
3. Giữ khả năng tạo activity con trong series, nhưng với bộ field rút gọn và semantics riêng của series.
4. Giảm phụ thuộc vào các field legacy và các giả định cũ như một activity form dùng chung cho mọi trường hợp.

---

## Vấn Đề Hiện Tại

### 1. EventForm đang ôm quá nhiều trách nhiệm

Hiện tại [EventForm.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/events/EventForm.tsx) vẫn cho chọn `ActivityType.MINIGAME` trong dropdown loại sự kiện.

Hệ quả:

- user có thể đi vào flow tạo sự kiện thường nhưng lại submit activity kiểu minigame
- trách nhiệm giữa `EventForm.tsx` và [MinigameActivityForm.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/events/MinigameActivityForm.tsx) bị chồng chéo
- route tạo event và route tạo minigame khó phân định

### 2. Minigame có semantics riêng

Minigame không chỉ là một activity type khác về mặt label, mà còn kéo theo:

- quiz flow riêng
- create/edit quiz riêng
- kết quả dựa vào `status`, `pointsEarned`, `showAnswers`
- cách diễn giải điểm khác activity thường

Vì vậy, minigame không nên được sinh ra từ cùng trải nghiệm UI với event thường.

### 3. Activity con trong series là một trường hợp riêng

Activity con của series:

- có thể là activity thường hoặc minigame
- nhưng không nên dùng full form như activity độc lập
- có nhiều field phải kế thừa, ẩn đi, hoặc bị ràng buộc bởi series cha

Nếu dùng nguyên form độc lập, user rất dễ hiểu nhầm activity con trong series là một event đầy đủ cấu hình, trong khi semantics backend không phải vậy.

---

## Quyết Định Kiến Trúc

### Flow 1: Tạo Sự Kiện Thường

Sử dụng:

- [EventForm.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/events/EventForm.tsx)
- [CreateEvent.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/CreateEvent.tsx)
- [EditEvent.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/EditEvent.tsx)

Quy tắc:

- `EventForm.tsx` chỉ dành cho activity thường.
- Không cho chọn `ActivityType.MINIGAME` trong dropdown loại sự kiện.
- Chỉ cho phép các loại:
  - `SUKIEN`
  - `CONG_TAC_XA_HOI`
  - `CHUYEN_DE_DOANH_NGHIEP`

Nguyên tắc UX:

- Nếu user muốn tạo minigame, UI phải dẫn sang flow minigame riêng.
- Không dùng một màn “tạo event” để âm thầm chuyển thành minigame.

### Flow 2: Tạo Minigame

Sử dụng:

- [MinigameActivityForm.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/events/MinigameActivityForm.tsx)
- các page create/edit quiz riêng

Quy tắc:

- `type` được cố định là `MINIGAME`.
- Không hiển thị dropdown đổi loại activity.
- Form này chỉ render các field phù hợp với minigame activity.

Nguyên tắc UX:

- tạo activity minigame trước
- sau đó cấu hình quiz theo flow riêng
- không trộn toàn bộ quiz configuration vào event form thường

### Flow 3: Tạo Series

Sử dụng:

- [SeriesForm.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/series/SeriesForm.tsx)

Quy tắc:

- `SeriesForm.tsx` chỉ dành cho cấu hình series cấp cha.
- Không dùng form activity để tạo series.

### Flow 4: Tạo Activity Con Trong Series

Sử dụng:

- `SeriesActivityForm.tsx` hoặc flow series-specific tương đương

Quy tắc:

- activity con trong series vẫn có thể là:
  - activity thường
  - minigame
- nhưng phải dùng **form rút gọn**
- không được dùng nguyên full form của event độc lập nếu chưa lọc bớt field

---

## Ma Trận Field

### 1. Event Thường Độc Lập

Được phép hiển thị:

- `name`
- `description`
- `type` nhưng không có `MINIGAME`
- `startDate`
- `endDate`
- `location`
- `bannerUrl`
- `requiresSubmission`
- `registrationStartDate`
- `registrationDeadline`
- `ticketQuantity`
- `requiresApproval`
- `organizerIds`
- `scoreRules`

Không hiển thị:

- field quiz
- các field cũ chỉ dành cho static score

### 2. Minigame Độc Lập

Được phép hiển thị:

- `name`
- `description`
- `type = MINIGAME`
- `startDate`
- `endDate`
- `location`
- `bannerUrl`
- `registrationStartDate`
- `registrationDeadline`
- `ticketQuantity`
- `requiresApproval`
- `organizerIds`
- `scoreRules`

Đi tiếp qua flow quiz:

- title quiz
- questions
- options
- `showAnswers`
- `requiredCorrectAnswers`
- `maxAttempts`
- `timeLimit`

Không hiển thị:

- dropdown đổi loại activity
- các field static score cũ

### 3. Series Cấp Cha

Được phép hiển thị:

- `name`
- `description`
- `scoreType` hoặc cấu hình series-level nếu contract còn dùng
- `milestonePoints`
- minimum requirement fields
- `registrationStartDate`
- `registrationDeadline`
- `requiresApproval`
- `ticketQuantity`
- preset / presetConfig nếu flow preset được bật

Không hiển thị:

- field của activity con
- field quiz

### 4. Activity Con Trong Series

Giữ lại các field tối thiểu:

- `name`
- `description`
- `type`
- `startDate`
- `endDate`
- `location`
- `bannerUrl`
- `requiresSubmission` nếu backend cần ở activity con
- các field tối thiểu để gắn organizer/approval nếu thực sự cần

Ẩn hoặc kế thừa từ series:

- `scoreType` nếu do series quyết định
- field registration/policy nếu do series quản lý
- mọi field điểm tĩnh cũ
- các field duplicate với cấu hình series cha

Riêng activity con kiểu minigame:

- `type = MINIGAME`
- chỉ bật các field tối thiểu của activity con
- quiz detail vẫn đi qua flow riêng, không nhồi toàn bộ vào form activity con

---

## Thay Đổi Cần Làm Theo File

### [EventForm.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/events/EventForm.tsx)

- Bỏ option `ActivityType.MINIGAME` khỏi dropdown loại sự kiện.
- Thêm guard để form này không submit `type = MINIGAME`.
- Đổi wording UI để nhấn mạnh đây là form tạo event thường.

### [MinigameActivityForm.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/events/MinigameActivityForm.tsx)

- Cố định `type = MINIGAME`.
- Không hiển thị dropdown chọn loại.
- Giữ bộ field phù hợp cho minigame activity.
- Đồng bộ với flow create/edit quiz riêng.

### [CreateEvent.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/CreateEvent.tsx)

- Chỉ dùng cho event thường.
- Nếu hiện vẫn có nhánh tạo minigame từ đây, bỏ khỏi navigation và UI.

### `SeriesActivityForm.tsx`

- Chuyển thành form tạo activity con trong series chuyên biệt.
- Cho chọn:
  - activity thường
  - minigame
- Áp dụng bộ field rút gọn thay vì full event form.

### [SeriesForm.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/series/SeriesForm.tsx)

- Chỉ giữ trách nhiệm cấu hình series cha.
- Không kéo logic field của activity con vào form này.

### Route và Navigation

- Rà lại route create/edit để không còn 2 flow chồng chéo:
  - create event thường
  - create minigame
  - create series
- Điều chỉnh CTA/nút điều hướng trong dashboard/sidebar nếu cần.

---

## Thứ Tự Triển Khai Đề Xuất

1. **Tách route và trách nhiệm màn hình**
   - chốt page nào dành cho event thường
   - page nào dành cho minigame
   - page nào dành cho series

2. **Khóa lại EventForm**
   - bỏ `MINIGAME`
   - thêm guard submit

3. **Chuẩn hóa MinigameActivityForm**
   - cố định `type`
   - đồng bộ create/edit flow

4. **Làm gọn SeriesActivityForm**
   - thêm lựa chọn loại activity con
   - cắt field thừa
   - kế thừa field từ series

5. **Rà lại UI detail/list nếu cần**
   - tránh wording khiến user hiểu nhầm activity con trong series là event độc lập đầy đủ

---

## Verification Plan

### Manual Verification

1. **Tạo event thường**
   - vào màn create event
   - xác nhận không có option `MINIGAME`
   - submit thành công với activity thường

2. **Tạo minigame**
   - vào đúng flow minigame
   - xác nhận `type` không đổi được
   - tạo activity minigame và đi tiếp sang quiz flow

3. **Tạo series**
   - vào màn create series
   - xác nhận chỉ cấu hình series cha, không lẫn field activity con

4. **Tạo activity con trong series**
   - thử tạo activity thường trong series
   - thử tạo minigame trong series
   - xác nhận chỉ hiện bộ field rút gọn
   - xác nhận các field do series quản lý không cho chỉnh hoặc không xuất hiện

5. **Kiểm tra navigation**
   - từ dashboard/sidebar và các CTA liên quan
   - bảo đảm user không còn đi nhầm từ “tạo event” sang tạo minigame

---

## Kết Luận

Quyết định quan trọng của plan này là:

- **event thường**, **minigame**, và **series** là 3 flow tạo mới khác nhau
- **activity thường không được chọn `MINIGAME`**
- **activity con trong series là flow riêng và phải dùng form rút gọn**

Sau khi áp dụng plan này, FE sẽ rõ trách nhiệm hơn ở cả tầng:

- route
- form
- payload
- UX
- semantics theo backend
