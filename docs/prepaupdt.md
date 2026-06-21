Dưới đây là tài liệu hướng dẫn Markdown dành cho phía Frontend (React/TypeScript) để tích hợp các thay đổi mới (Quyền `PrepSupervisor` và Tính năng `Minh chứng hoàn thành công việc`). Bạn có thể copy trực tiếp phần dưới đây vào tài liệu dự án của mình:

```markdown
## Tích hợp Frontend: Tính năng Quản lý Ban tổ chức & Minh chứng công việc (Preparation Module)

### A. Quản lý quyền Giám sát chuẩn bị (PrepSupervisor)

#### 1. Mô tả nghiệp vụ
Admin hoặc Manager có thể cấp hoặc thu hồi quyền "Giám sát chuẩn bị" (`PrepSupervisor`) cho một thành viên Ban tổ chức (Organizer) trong phạm vi một Sự kiện (Activity) cụ thể. 
Sinh viên được cấp quyền này sẽ có toàn quyền quản lý công tác chuẩn bị (Preparation) và Tài chính chuẩn bị (Preparation Finance) **chỉ trong phạm vi sự kiện đó**.

#### 2. API Endpoint
- **Method:** `PUT` (Cấp quyền) / `DELETE` (Thu hồi quyền)
- **Path:** `/api/preparation/activities/{activityId}/organizers/{studentId}/prep-supervisor`
- **Authentication:** Required (Chỉ Admin hoặc Manager mới có quyền thực hiện)

#### 3. Request
- **Path Parameters:**
  - `activityId` (number): ID của sự kiện (Activity).
  - `studentId` (number): ID của sinh viên/thành viên ban tổ chức cần cấp/thu hồi quyền.
- **Query Parameters:** Không có.
- **Request Body:** Không có.

---

### B. Upload ảnh minh chứng hoàn thành công việc (Task)

#### 1. Mô tả nghiệp vụ
Người được phân công (Assignee/Member) hoặc Trưởng nhóm (Leader) của một công việc (Task) cần tải lên (upload) các hình ảnh minh chứng trước khi yêu cầu hoàn thành công việc. Frontend có thể gọi API này nhiều lần (nếu upload từng ảnh) hoặc upload nhiều ảnh cùng lúc tùy thiết kế, API hiện tại hỗ trợ nhận `MultipartFile`.

#### 2. API Endpoint
- **Method:** `POST`
- **Path:** `/api/preparation/tasks/{taskId}/completion-proofs`
- **Authentication:** Required (Cần quyền `PrepSupervisor`, `Leader` hoặc `Member` của task đó)

#### 3. Request
- **Path Parameters:**
  - `taskId` (number): ID của công việc (Task).
- **Query Parameters:** Không có.
- **Request Body (FormData / Multipart):**
  - `file` (File/Blob): File ảnh minh chứng cần upload (Giới hạn tối đa 10 ảnh theo quy định nghiệp vụ ở Frontend).
  
> **Lưu ý cho FE:** API này trả về URL (chuỗi `string`) của ảnh sau khi upload thành công lên cloud (như Cloudinary/S3). Frontend cần lưu trữ lại các URL này vào một danh sách (mảng) trên state để gửi đi trong bước tiếp theo (Yêu cầu hoàn thành).

---

### C. Gửi yêu cầu hoàn thành công việc (Request Task Completion)

#### 1. Mô tả nghiệp vụ
Sau khi đã tải lên đủ ảnh minh chứng và có danh sách URL, người chịu trách nhiệm công việc (Leader/Assignee) sẽ gửi yêu cầu hoàn thành công việc (chuyển trạng thái task sang `PENDING_COMPLETION` hoặc `COMPLETED` tùy luồng). Yêu cầu này bắt buộc phải đính kèm danh sách các URL ảnh minh chứng.

#### 2. API Endpoint
- **Method:** `PUT`
- **Path:** `/api/preparation/tasks/{taskId}/request-complete`
- **Authentication:** Required (Cần quyền `PrepSupervisor` hoặc `Assignee` của task đó)

#### 3. Request
- **Path Parameters:**
  - `taskId` (number): ID của công việc (Task).
- **Query Parameters:** Không có.
- **Request Body:**
  ```json
  {
    "proofUrls": "string[] - Danh sách các URL ảnh minh chứng đã upload ở bước B (Mảng các chuỗi, tối đa 10 URL)"
  }
  ```

---

### D. Bổ sung TypeScript Interfaces (Gợi ý cho FE)

Frontend có thể tham khảo hoặc cập nhật các type sau để đồng bộ với Backend:

```typescript
// Payload cho API Yêu cầu hoàn thành task
export interface RequestTaskCompletionPayload {
  proofUrls: string[];
}

// Cập nhật Model Task hiện tại để chứa thêm danh sách ảnh minh chứng (để hiển thị khi xem chi tiết)
export interface TaskDto {
  id: number;
  activityId: number;
  name: string;
  // ... các field hiện có ...
  status: 'TODO' | 'IN_PROGRESS' | 'PENDING_APPROVAL' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
  completionProofUrls: string[]; // <-- THÊM MỚI: Danh sách URL ảnh minh chứng đã nộp
}

// Cập nhật Model Organizer hiện tại để phân biệt ai là Giám sát chuẩn bị
export interface OrganizerDto {
  studentId: number;
  activityId: number;
  // ... các field hiện có ...
  isPrepSupervisor: boolean; // <-- THÊM MỚI: Cờ xác định user này có quyền PrepSupervisor trong Activity hay không
}
```
```