# Báo Cáo Tổng Quan Tiến Trình Tái Cấu Trúc Frontend (Từ 0c6b38e Đến Hiện Tại)

Báo cáo này tóm tắt ngắn gọn và trực quan sự tiến hóa của mã nguồn Frontend (`campuslifereact`) qua 3 mốc thay đổi lớn kể từ nhánh gốc `main` (Commit `df42cb6`).

---

## 1. Commit `0c6b38e` ("refactor dto contract") so với Code trước đó (Gốc)
*Mốc chuyển đổi kiến trúc sang cơ chế luật điểm động.*

- **Types & Contracts**:
  - Tích hợp mảng luật điểm động `scoreRules` (`ActivityScoreRuleRequest`/`Response`) vào hoạt động.
  - Phân định file đính kèm bài tập thành `attachments` (loại `file` hoặc `image`) và dùng cờ trạng thái `isCompleted` thay cho `isApproved`.
  - Thay đổi payload nộp minigame sang dạng Map câu trả lời `answers: Record<string, number>`.
- **UI & Components**:
  - Thêm Form cấu hình mảng luật điểm động (`ScoreRulesForm.tsx`) và Component hiển thị các luật điểm (`ScoreRulesDisplay.tsx`).
  - Nâng cấp modal xem bài nộp hỗ trợ lightbox xem ảnh minh chứng và tải file tài liệu.
- **Loại bỏ điểm tĩnh**:
  - Gỡ bỏ hoàn toàn các trường nhập điểm tĩnh cũ như `maxPoints`, `penaltyPointsIncomplete` trong Form Bài tập và `rewardPoints` trong Form Quiz.
- **Services**:
  - Sửa `uploadAPI.ts` để đọc URL ảnh trực tiếp từ trường `data` của API phản hồi.

---

## 2. Commit `672ccf6` ("updt fe for new engine") so với Commit `0c6b38e`
*Mốc tối ưu luồng nghiệp vụ và bổ sung công cụ quản trị.*

- **Tách luồng tạo hoạt động**:
  - Tách nút tạo hoạt động ở Dashboard thành 2 nút: "Tạo sự kiện thường" (dẫn đến `/manager/events/create`) và "Tạo Mini Game mới" (dẫn đến `/manager/minigames/create`).
  - Khóa cứng loại hoạt động của Minigame Form thành `MINIGAME` và ẩn dropdown chọn loại. Chặn tạo minigame trong form sự kiện thường.
- **Tích hợp Presets & Tự động cấu hình**:
  - Tích hợp nạp presets trong form tạo hoạt động. Với luồng tạo minigame, hệ thống tự động chọn preset `MINIGAME_PASS_ONLY` để điền trước luật điểm động và ẩn card chọn preset khỏi UI.
  - Tinh giản tối đa biểu mẫu tạo hoạt động con trong chuỗi sự kiện (`SeriesActivityForm.tsx`).
- **Trang Admin Tools**:
  - Thêm màn hình `AdminTools.tsx` dành riêng cho vai trò `ADMIN` để kích hoạt các tác vụ kiểm tra quá hạn nộp bài tập (`TASK_OVERDUE`) và dọn dẹp dữ liệu mồ côi trong database.

---

## 3. Code Hiện Tại so với Commit `672ccf6`
*Mốc hoàn thiện tối đa trải nghiệm người dùng, tải động và dọn dẹp hoàn toàn legacy.*

- **Tải khoa/ban dạng checkboxes động**:
  - Form luật điểm động tự gọi API lấy danh sách khoa/ban hệ thống và hiển thị dạng checklists, cho phép tích chọn nhanh thay vì nhập tay bằng chuỗi text như trước.
- **Ẩn hoàn toàn bộ chọn Preset của Minigame**:
  - Giao diện tạo minigame ẩn hoàn toàn card chọn preset (do đã được chọn sẵn và điền cấu hình `MINIGAME_PASS_ONLY` ngầm).
- **Xóa bỏ triệt để `scoreType` legacy ở root level**:
  - Xóa thuộc tính `scoreType` ở root level của hoạt động trong `CreateActivityRequest` và `ActivityResponse` (tại `activity.ts`).
  - Gỡ bỏ dropdown chọn `"Kiểu tính điểm"` (scoreType) khỏi giao diện tạo sự kiện thường (`EventForm.tsx`) và tạo minigame (`MinigameActivityForm.tsx`), cũng như các logic mapping mặc định ở form cha, sửa đổi event hay chuỗi hoạt động.
- **Hiển thị và Lọc loại điểm động**:
  - Toàn bộ các trang chi tiết và danh sách sự kiện hiển thị loại điểm được trích xuất động từ danh sách `scoreRules` thực tế của sự kiện đó (ví dụ: hiển thị *"Điểm rèn luyện, Điểm CTXH"* nếu có nhiều luật áp dụng).
  - Logic bộ lọc sự kiện theo kiểu điểm được chuyển đổi để quét trong mảng `scoreRules.some(...)` thay vì so khớp trường root cũ.

---

## Tóm Tắt Tác Động Tổng Thể
Từ **0c6b38e** đến **Hiện tại**, mã nguồn Frontend đã chuyển đổi hoàn chỉnh từ mô hình lai (nửa tĩnh nửa động) sang **mô hình động hoàn toàn**:
1. Đơn giản hóa biểu mẫu nhập liệu cho quản trị viên (ẩn preset tự động, chọn khoa dạng checkbox).
2. UI hiển thị kiểu điểm linh hoạt và chính xác theo dữ liệu luật điểm thực tế.
3. Code sạch sẽ, an toàn kiểu dữ liệu (biên dịch `npx tsc --noEmit` đạt 100% thành công không có lỗi TypeScript).
