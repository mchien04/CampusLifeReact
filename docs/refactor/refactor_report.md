# Báo Cáo Kết Quả Tái Cấu Trúc Frontend (Score Engine & API Integration)

Báo cáo này tổng hợp chi tiết các công việc đã thực hiện trong chiến dịch refactor Frontend (React TypeScript) của dự án `campuslifereact`. Mục tiêu chính là chuyển đổi cơ chế điểm tĩnh cũ sang công cụ luật tính điểm động (`scoreRules`), đồng bộ hóa dữ liệu lịch sử điểm (ledger), nâng cấp tính năng nộp bài tập phân loại tài liệu/hình ảnh, xử lý các điểm lệch contract của API upload/minigame, và dọn dẹp triệt để các trường điểm legacy cũ. Trong các flow submission, Frontend hiện ưu tiên `attachments[]` làm nguồn hiển thị chính và chỉ giữ `fileUrls` như fallback tương thích dữ liệu cũ.

---

## Bảng Đối Chiếu Tiến Độ Theo Từng Phase

| Phase | Nội Dung Kế Hoạch | Trạng Thái | Công Việc Thực Tế Đã Hoàn Thành |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Đồng bộ hóa Types và Cập nhật API Services | ✅ Hoàn thành | - Định nghĩa các Enum và Interface cho Luật điểm động (`scoreRules`).<br>- Cập nhật API `eventAPI.ts` để parse đúng các endpoint activity trả raw array và chuẩn hóa lại về response nội bộ của FE.<br>- Sửa lỗi upload ảnh ở `uploadAPI.ts` lấy trực tiếp URL dạng string.<br>- Cập nhật model nộp bài tập với danh sách `attachments`. |
| **Phase 2** | Luật Tính Điểm Hoạt Động (Event Score Rules) & UI | ✅ Hoàn thành | - Phát triển component cấu hình luật điểm động `ScoreRulesForm.tsx`.<br>- Tích hợp form luật điểm vào giao diện Admin tạo/sửa hoạt động.<br>- Tạo component `ScoreRulesDisplay.tsx` hiển thị danh sách luật điểm dưới dạng badge trực quan.<br>- Loại bỏ các input điểm tĩnh cũ (`maxPoints`, `penaltyPointsIncomplete`) và dọn nốt residue trong `MinigameActivityForm.tsx`. |
| **Phase 3** | Xem Lịch Sử Điểm Theo Ledger (Score Ledger) | ✅ Hoàn thành | - Cập nhật `ViewScores.tsx` và `ManagerScores.tsx` để lấy lịch sử điểm chính xác từ bảng Ledger của sinh viên.<br>- Map chi tiết nguồn điểm (`ACTIVITY_PARTICIPATION`, `MINIGAME_ATTEMPT`,...) sang nhãn tiếng Việt trực quan kèm badge màu sắc.<br>- Đồng bộ cả phần tổng quan của `ViewScores.tsx` sang helper source-type mới. |
| **Phase 4** | Nộp Bài Tập Hỗ Trợ Attachment & Upload chuẩn | ✅ Hoàn thành | - Nâng cấp form nộp bài tập ở `StudentTasks.tsx` cho phép chọn riêng biệt `files` và `images` gửi qua `FormData`.<br>- Hoàn thiện luồng nộp bài trong `StudentEventDetail.tsx` với tách riêng file/tệp hình, render `attachments` và preview hình ảnh minh chứng.<br>- Cập nhật modal xem chi tiết bài nộp của Manager hỗ trợ preview hình ảnh (lightbox) và tải về tệp tin.<br>- Đồng bộ hóa trạng thái bài nộp qua trường `isCompleted`. |
| **Phase 5** | Cải Tiến Luồng Chơi & Nộp Bài Minigame | ✅ Hoàn thành | - Đổi cấu trúc nộp đáp án minigame sang dạng Map `Record<string, number>`.<br>- Nhận diện kết quả đỗ/trượt qua trạng thái `status === "PASSED"`.<br>- Hiển thị số điểm nhận được thực tế từ score engine (`pointsEarned`).<br>- Gỡ fallback `attemptId` legacy khỏi minigame response types và start flow. |
| **Cleanup** | Loại bỏ hoàn toàn Legacy Score Fields | ✅ Hoàn thành | - Rà soát toàn bộ dự án và xóa sạch mọi tham chiếu `maxPoints`, `penaltyPointsIncomplete`, `rewardPoints` trong `src` trên cả Models, UI, State, Props và comments kỹ thuật.<br>- Đảm bảo toàn bộ dự án biên dịch thành công 100% không còn lỗi TypeScript. |

---

## Chi Tiết Công Việc Hoàn Thành Trong Mỗi Phase

### Phase 1: Đồng bộ hóa Types và Cập nhật API Services
- **Đồng bộ hóa Types**:
  - Tại [activity.ts](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/types/activity.ts), bổ sung các enum nghiệp vụ mới (`ScoreType`, `ScoreRuleTrigger`, `ScoreRuleCalculation`, `ScoreRuleAudience`, `ScoreSemesterPolicy`, `ActivityType`) và định nghĩa cấu trúc cho `ActivityScoreRuleRequest`/`ActivityScoreRuleResponse` sử dụng kiểu dữ liệu điểm số là `string` để bảo toàn độ chính xác số thập phân của BigDecimal từ backend.
  - Tại [submission.ts](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/types/submission.ts), bổ sung type `SubmissionAttachment` để lưu danh sách file đính kèm đã phân loại cụ thể dạng `file` hoặc `image`, đồng thời giữ `fileUrls` như fallback tương thích dữ liệu cũ.
  - Tại [score.ts](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/types/score.ts), cập nhật enum nguồn điểm `ScoreEntrySourceType` và chỉnh sửa interface `ScoreHistoryViewResponse` khớp với cấu trúc ledger mới.
- **Sửa đổi API Client**:
  - Tại [eventAPI.ts](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/services/eventAPI.ts), cập nhật các hàm filter sự kiện (`getEventsByScoreType`, `getEventsByDepartment`, `getMyEvents`, `getEventsByMonth`) để parse trực tiếp raw array `ActivityResponse[]` từ backend, sau đó chuẩn hóa lại về kiểu response nội bộ của FE.
  - Tại [uploadAPI.ts](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/services/uploadAPI.ts), cập nhật kiểu trả về của `uploadImage` xử lý lấy trực tiếp chuỗi URL thô từ trường `data` trả về.
  - Tại [submissionAPI.ts](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/services/submissionAPI.ts), bổ sung tham số truyền hình ảnh và tệp riêng biệt dưới dạng `FormData` để gửi lên Backend.

### Phase 2: Luật Tính Điểm Hoạt Động (Event Score Rules) & UI
- **Tạo mới Component cấu hình**:
  - Phát triển [ScoreRulesForm.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/events/ScoreRulesForm.tsx) cho phép Quản trị viên quản lý danh sách luật điểm linh hoạt của mỗi hoạt động dưới dạng Form Array.
  - Phát triển [ScoreRulesDisplay.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/events/ScoreRulesDisplay.tsx) dùng để hiển thị các Badge/Card quy tắc tính điểm trực quan, thân thiện cho sinh viên.
- **Tích hợp giao diện Admin và Student**:
  - Thay đổi [BaseEventForm.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/events/BaseEventForm.tsx), [EventForm.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/events/EventForm.tsx) và [MinigameActivityForm.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/events/MinigameActivityForm.tsx) để thay thế input nhập điểm tĩnh cũ bằng `ScoreRulesForm`.
  - Cập nhật màn hình chi tiết hoạt động [EventDetail.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/EventDetail.tsx) và [StudentEventDetail.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/StudentEventDetail.tsx) để kết xuất danh sách luật tính điểm động thay thế cho nhãn hiển thị điểm tĩnh.
  - Dọn nốt phần residue của luồng minigame activity: bỏ các thiết lập `maxPoints`/`penaltyPointsIncomplete` trung gian và cập nhật thông báo hướng dẫn theo `scoreRules`.

### Phase 3: Xem Lịch Sử Điểm Theo Ledger (Score Ledger)
- **Tái cấu trúc bảng nhật ký điểm**:
  - Chuyển đổi dữ liệu hiển thị trong [ViewScores.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/ViewScores.tsx) và [ManagerScores.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/ManagerScores.tsx). Điểm số thay đổi được kết xuất từ Ledger `scoreHistories` và map chéo thông tin hoạt động trong `activityParticipations`.
  - Thêm các tiện ích map nguồn điểm sang tiếng Việt tương ứng:
    - `ACTIVITY_PARTICIPATION` ➔ **Tham gia hoạt động**
    - `TASK_SUBMISSION` ➔ **Nộp/Chấm bài tập**
    - `MINIGAME_ATTEMPT` ➔ **Làm Minigame Quiz**
    - `SERIES_PROGRESS` ➔ **Mốc chuỗi sự kiện**
    - `MANUAL_ADJUSTMENT` ➔ **Điều chỉnh thủ công**
    - `RECALCULATION` ➔ **Hệ thống tính toán lại**
  - Đồng bộ cả tab tổng quan ở [ViewScores.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/ViewScores.tsx) để không còn hard-code enum nguồn điểm cũ như `ACTIVITY_CHECKIN` hay `SERIES_MILESTONE`.
  - Hiển thị rõ số điểm biến động dưới dạng Badge (ví dụ: `+5` hoặc `-3`) kèm theo cột Điểm cũ và Điểm mới rõ ràng, tránh sai số do số thực JS.

### Phase 4: Nộp Bài Tập Hỗ Trợ Attachment & Upload chuẩn
- **Nâng cấp giao diện Nộp bài**:
  - Tại [StudentTasks.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/StudentTasks.tsx), tách biệt nút chọn tệp đính kèm thành **Hình ảnh minh chứng** và **Tài liệu đính kèm**.
  - Hiển thị danh sách file đã nộp phân loại theo định dạng thumbnail (đối với ảnh) hoặc file icon (đối với file PDF/tài liệu).
  - Tại [StudentEventDetail.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/StudentEventDetail.tsx), hoàn thiện modal nộp bài với 2 nhóm upload riêng (`files`, `images`), đọc dữ liệu từ `attachments[]` và hỗ trợ xem ảnh minh chứng dạng lightbox.
- **Giao diện Quản trị viên (Chấm điểm)**:
  - Cập nhật [TaskSubmissions.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/TaskSubmissions.tsx) và [SubmissionDetailsModal.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/task/SubmissionDetailsModal.tsx) để hiển thị đúng thông tin của bài nộp ưu tiên từ `attachments[]`, chỉ dùng `fileUrls` như fallback tương thích dữ liệu cũ, bao gồm preview hình ảnh minh chứng.
  - Sử dụng trường trạng thái `isCompleted` (boolean) để xác thực tiến trình hoàn thành bài tập của sinh viên.
- **Sửa đổi cơ chế lưu URL Ảnh**:
  - Dọn dẹp tất cả các chỗ hardcode ghép nối chuỗi đường dẫn ảnh (ví dụ: tự thêm tiền tố `/uploads` hoặc host URL ở phía client). Phía Frontend hiện tại sẽ lưu trữ và hiển thị chính xác đường dẫn tuyệt đối trả về trực tiếp từ Backend.

### Phase 5: Cải Tiến Luồng Chơi & Nộp Bài Minigame
- **Định dạng Payload nộp bài**:
  - Cập nhật [StudentMinigamePlay.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/StudentMinigamePlay.tsx). State câu trả lời được lưu trữ dưới dạng một object/map `Record<string, number>` thay vì một mảng. Khi sinh viên nộp bài, gửi payload chuẩn `{ answers }` lên endpoint `/api/minigames/attempts/{attemptId}/submit`.
  - Tinh gọn luồng start attempt để dùng trực tiếp `id` backend trả về, không còn fallback legacy `attemptId` trong response types.
- **Trang kết quả**:
  - Cập nhật [QuizResults.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/minigame/QuizResults.tsx) để xác định trạng thái làm bài đỗ hay trượt dựa trên trường `status === "PASSED"` của nỗ lực làm bài (attempt status) thay vì trường `passed` boolean cũ.
  - Lấy số điểm cộng thực nhận thông qua thuộc tính `pointsEarned` từ API phản hồi.

### Phase 6: Xoá Bỏ Hoàn Toàn Các Trường Điểm Legacy (Dọn Dẹp & Tối Ưu)
Theo yêu cầu loại bỏ hoàn toàn các trường điểm tĩnh cũ để tránh dư thừa dữ liệu và nhầm lẫn cấu hình điểm:
- **Dọn dẹp Models/Interfaces**: Loại bỏ hoàn toàn các thuộc tính `maxPoints`, `penaltyPointsIncomplete`, và `rewardPoints` khỏi tất cả các file TypeScript:
  - `src/types/activity.ts`
  - `src/types/task.ts`
  - `src/types/submission.ts`
  - `src/types/minigame.ts`
- **Dọn dẹp Giao diện & Component**: Loại bỏ hoàn toàn các trường nhập liệu điểm tĩnh cũ trong các form và card:
  - [TaskForm.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/task/TaskForm.tsx) (Xoá trường Max Points và Penalty Points).
  - [QuizForm.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/minigame/QuizForm.tsx) (Xoá trường Reward Points).
  - [QuizCard.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/minigame/QuizCard.tsx) (Xoá hiển thị Reward Points tĩnh).
  - [EventDetail.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/EventDetail.tsx) (Xoá hiển thị điểm cũ).
  - [EditQuiz.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/pages/admin/EditQuiz.tsx) (Loại bỏ các bind dữ liệu điểm cũ).
  - [MinigameActivityForm.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/events/MinigameActivityForm.tsx), [SeriesActivityForm.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/events/SeriesActivityForm.tsx) và các component series/admin liên quan (loại bỏ nốt residue còn sót trong state trung gian và comments kỹ thuật).
- **Sửa lỗi Incident**:
  - Tại [QuizForm.tsx](file:///d:/2025-2026%20HKI/TLCN/campuslifereact/src/components/minigame/QuizForm.tsx), điều chỉnh code xử lý khi upload banner quiz thành công, unwrap dữ liệu string URL trực tiếp tương tự như form sự kiện chính.
- **Kiểm tra Biên dịch (Build/Compile)**:
  - Chạy trình biên dịch TypeScript kiểm tra lỗi tĩnh: `npx tsc --noEmit`.
  - Kết quả: **Dự án hoàn toàn sạch lỗi biên dịch (0 TypeScript Errors)**, tất cả các component đều đảm bảo type-safe tuyệt đối với hợp đồng API mới tại thời điểm cập nhật báo cáo.

---

## Đánh Giá Tổng Quan Sau Refactor

1. **Về mặt Kiến trúc & Dữ liệu**:
   - Loại bỏ hoàn toàn sự không nhất quán giữa Backend và Frontend về mặt điểm số. Thay vì mỗi loại hoạt động tự quản lý các thuộc tính điểm tĩnh khác nhau, giờ đây toàn bộ hệ thống điểm hoạt động thông qua một cơ chế Luật điểm động (`scoreRules`) thống nhất.
   - Điểm số của sinh viên được quản lý tập trung qua một nguồn chân lý duy nhất (Single Source of Truth) là **Score Ledger (Sổ cái điểm)**, giúp hạn chế tối đa việc không đồng bộ dữ liệu hoặc làm tròn sai số.
2. **Về mặt Trải nghiệm người dùng (UX)**:
   - Các luật điểm động được trình bày trực quan dưới dạng các thẻ màu sắc (Badge) rõ ràng thay vì các dòng mô tả text thô.
   - Luồng nộp bài tập tiện lợi hơn khi phân tách rõ ràng tệp tài liệu và ảnh chụp minh chứng trực tiếp trên UI, kèm theo các thumbnail để dễ kiểm tra lại.
3. **Về mặt Kỹ thuật & Bảo trì**:
   - Mã nguồn Frontend sạch sẽ hơn khi loại bỏ hàng loạt các trường legacy dư thừa và các đoạn xử lý logic ghép nối URL thô ở client.
   - TypeScript kiểm soát kiểu dữ liệu cực kỳ nghiêm ngặt giúp phát hiện lỗi sớm khi có thay đổi API từ Backend sau này.
