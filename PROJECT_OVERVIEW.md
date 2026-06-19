# CampusLife React - Tổng Quan Dự Án

File này dùng làm tài liệu đọc nhanh cho agent/dev mới khi bắt đầu một conversation hoặc một phiên làm việc mới.

## Tổng Quan

CampusLife React là frontend cho hệ thống quản lý đời sống sinh viên. Ứng dụng được xây dựng bằng React, TypeScript, Create React App, Tailwind CSS, React Router, React Query và Axios.

Frontend chủ yếu đóng vai trò giao diện và điều phối workflow. Phần nghiệp vụ và dữ liệu nằm ở backend REST API, được gọi qua các service trong `src/services`.

Ứng dụng có 3 nhóm vai trò chính:

- `ADMIN`: quản trị hệ thống, tài khoản, phòng ban, năm học, học kỳ, lớp, thống kê và các module quản lý.
- `MANAGER`: quản lý sự kiện, bài viết, đăng ký, điểm, chuỗi sự kiện, minigame, công tác chuẩn bị, email và thông báo.
- `STUDENT`: xem và tham gia sự kiện, đọc bài viết, lưu wishlist, làm nhiệm vụ, xem điểm, quét QR check-in, chơi minigame, cập nhật hồ sơ và tham gia công tác chuẩn bị.

## Cấu Trúc Dự Án

```text
campuslifereact/
├── public/
│   ├── index.html
│   └── images/
├── src/
│   ├── App.tsx
│   ├── index.js
│   ├── components/
│   ├── contexts/
│   ├── constants/
│   ├── pages/
│   ├── services/
│   ├── styles/
│   ├── types/
│   └── utils/
├── .github/workflows/
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vercel.json
```

### Các thư mục quan trọng

- `src/App.tsx`: khai báo route chính, provider và phân quyền route.
- `src/components`: component UI dùng chung và component theo module.
- `src/pages`: các màn hình nghiệp vụ, chia theo student, manager và admin.
- `src/services`: API layer gọi backend REST API qua Axios.
- `src/types`: TypeScript interface/DTO cho request, response và domain model.
- `src/contexts`: state dùng chung, hiện có `AuthContext` và `WishlistContext`.
- `src/styles/theme.css`: biến màu, style dùng chung và một số style riêng cho preparation/article.
- `.github/workflows/ci.yml`: CI chạy install, typecheck, lint và build.

## Mục Đích Chính

Hệ thống hỗ trợ nhà trường/tổ chức quản lý các hoạt động sinh viên theo một luồng khép kín:

1. Tạo và quản lý sự kiện.
2. Công bố sự kiện và bài viết liên quan.
3. Sinh viên đăng ký tham gia.
4. Check-in bằng QR hoặc ticket code.
5. Ghi nhận tham gia và điểm rèn luyện.
6. Giao nhiệm vụ, nộp minh chứng và chấm hoàn thành.
7. Tổ chức chuỗi sự kiện và minigame.
8. Quản lý công tác chuẩn bị sự kiện, ngân sách, tạm ứng, chi phí và báo cáo.
9. Gửi email/thông báo tới sinh viên theo đối tượng.
10. Quản trị tài khoản, lớp, phòng ban, năm học/học kỳ và thống kê.

## Luồng Hoạt Động Chính

### Authentication và phân quyền

- Đăng nhập qua `/login`.
- Backend trả về JWT token.
- Token được lưu trong `localStorage`.
- `AuthContext` decode token để lấy `username`, `role`, `exp`.
- `ProtectedRoute` chặn route khi chưa đăng nhập hoặc sai role.
- Axios interceptor trong `src/services/api.ts` tự động gắn `Authorization: Bearer <token>`.
- Nếu API trả `401`, token bị xóa và user bị redirect về `/login`.

### Dashboard

- `/dashboard` render nội dung theo role:
  - `ADMIN`: `AdminDashboard` trong `ManagerLayout`.
  - `MANAGER`: `ManagerDashboard` trong `ManagerLayout`.
  - `STUDENT`: `StudentDashboard`.

### Event

- Manager/Admin tạo, sửa, xóa, publish/unpublish sự kiện.
- Sự kiện có thể có banner, ảnh thư viện, task, minigame, bài viết và check-in code.
- Student xem danh sách sự kiện, xem chi tiết, đăng ký/hủy đăng ký và check-in.

### Article

- Public routes cho danh sách bài viết, featured, category, search và chi tiết theo slug.
- Manager/Admin quản lý bài viết, category, tag, analytics và editor.
- TipTap/Rich text editor được dùng cho nội dung bài viết.
- Student có thể lưu bài viết vào wishlist.

### Registration và Check-in

- Student đăng ký activity qua registration API.
- Manager/Admin xem và cập nhật trạng thái đăng ký.
- Check-in hỗ trợ ticket code và QR code.
- Participation/report được dùng cho lịch sử tham gia và điểm.

### Task và Submission

- Manager/Admin tạo task theo activity, assign cho sinh viên.
- Student xem task được giao, cập nhật trạng thái và nộp minh chứng/file.
- Manager/Admin xem submission, chấm hoàn thành và feedback.

### Preparation

- Manager/Admin bật preparation cho activity.
- Quản lý organizer, task, task member, ngân sách, allocation, tạm ứng, chi phí và minh chứng.
- Có luồng leader/admin decision cho expense, fund advance và allocation adjustment.
- Hỗ trợ báo cáo tài chính/vận hành/audit và export.

### Series và Minigame

- Series gồm nhiều activity, có đăng ký và theo dõi progress/milestone.
- Minigame chủ yếu là quiz gắn với activity.
- Student chơi quiz, submit attempt và xem lịch sử/kết quả.

### Email và Notification

- Manager/Admin gửi email/thông báo tới nhóm đối tượng.
- Có lịch sử email, chi tiết email và chức năng resend.
- Notification dropdown hiển thị thông báo và unread count.

## API và Data Flow

- API base URL nằm trong `src/services/api.ts`.
- Mặc định: `process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080'`.
- Backend response có thể dùng `body` hoặc `data`; service nên normalize trước khi trả về cho component.
- Không nên gọi Axios trực tiếp trong page/component nếu có thể thêm method vào `src/services`.
- Các type request/response nên đặt trong `src/types`.

## Rule Cho Agent Khi Làm Việc

- Đọc `PROJECT_OVERVIEW.md` trước khi sửa code.
- Kiểm tra `src/App.tsx` khi thêm route mới.
- Kiểm tra `src/services` và `src/types` trước khi thêm API mới.
- Giữ đúng phân quyền `ADMIN`, `MANAGER`, `STUDENT`.
- Route cần bảo vệ phải đi qua `ProtectedRoute`.
- Module mới nên theo thứ tự: type -> service -> component/page -> route -> test/build.
- Không hard-code backend URL ngoài `src/services/api.ts`.
- Không để token, password hoặc thông tin nhạy cảm trong log.
- Không revert thay đổi đang có sẵn nếu không được yêu cầu.
- Sau thay đổi quan trọng nên chạy:

```bash
npm run typecheck
npm run lint
npm run build
```

## Lưu Ý Chất Lượng Hiện Có

- README hiện vẫn là template Create React App, chưa phản ánh đúng nghiệp vụ thật.
- Một số chuỗi tiếng Việt trong source đang bị lỗi encoding/mojibake, ví dụ `Quáº£n lÃ½`. Khi sửa UI, nên chuyển về UTF-8 đúng.
- Trong worktree có thể có thay đổi chưa commit; luôn kiểm tra `git status --short` trước khi sửa nhiều file.
