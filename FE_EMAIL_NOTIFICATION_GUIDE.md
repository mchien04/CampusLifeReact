# Hướng Dẫn Frontend - Hệ Thống Gửi Email và Thông Báo

## Tổng Quan

Hệ thống cho phép Admin/Manager gửi email và tạo thông báo hệ thống với nhiều tùy chọn người nhận:
- Gửi cá nhân hoặc bulk
- Gửi theo danh sách đăng ký activity/series
- Gửi theo class/department hoặc tất cả students
- Hỗ trợ HTML template với biến động
- Đính kèm file
- Tùy chọn tạo notification khi gửi email
- Chỉ tạo notification (không gửi email)

---

## 1. Models/DTOs

### 1.1. SendEmailRequest

```typescript
interface SendEmailRequest {
  recipientType: RecipientType; // Bắt buộc
  recipientIds?: number[]; // Cho INDIVIDUAL hoặc CUSTOM_LIST
  activityId?: number; // Cho ACTIVITY_REGISTRATIONS
  seriesId?: number; // Cho SERIES_REGISTRATIONS
  classId?: number; // Cho BY_CLASS
  departmentId?: number; // Cho BY_DEPARTMENT
  subject: string; // Bắt buộc
  content: string; // Bắt buộc - Text hoặc HTML
  isHtml?: boolean; // Mặc định: false
  templateVariables?: Record<string, string>; // Biến cho template
  createNotification?: boolean; // Mặc định: false
  notificationTitle?: string; // Title cho notification
  notificationType?: NotificationType; // Type cho notification
  notificationActionUrl?: string; // URL cho notification
}
```

### 1.2. SendNotificationOnlyRequest

```typescript
interface SendNotificationOnlyRequest {
  recipientType: RecipientType; // Bắt buộc
  recipientIds?: number[]; // Cho INDIVIDUAL hoặc CUSTOM_LIST
  activityId?: number; // Cho ACTIVITY_REGISTRATIONS
  seriesId?: number; // Cho SERIES_REGISTRATIONS
  classId?: number; // Cho BY_CLASS
  departmentId?: number; // Cho BY_DEPARTMENT
  title: string; // Bắt buộc
  content: string; // Bắt buộc
  type: NotificationType; // Bắt buộc
  actionUrl?: string; // Optional
}
```

### 1.3. RecipientType Enum

```typescript
enum RecipientType {
  INDIVIDUAL = "INDIVIDUAL",              // Gửi cá nhân
  BULK = "BULK",                          // Gửi bulk (nhiều người)
  ACTIVITY_REGISTRATIONS = "ACTIVITY_REGISTRATIONS",  // Danh sách đăng ký activity
  SERIES_REGISTRATIONS = "SERIES_REGISTRATIONS",    // Danh sách đăng ký series
  ALL_STUDENTS = "ALL_STUDENTS",          // Tất cả sinh viên
  BY_CLASS = "BY_CLASS",                  // Sinh viên theo lớp
  BY_DEPARTMENT = "BY_DEPARTMENT",        // Sinh viên theo khoa
  CUSTOM_LIST = "CUSTOM_LIST"             // Danh sách user IDs tùy chọn
}
```

### 1.4. EmailHistoryResponse

```typescript
interface EmailHistoryResponse {
  id: number;
  senderId: number;
  senderName: string;
  recipientId?: number; // nullable
  recipientEmail: string;
  subject: string;
  content: string;
  isHtml: boolean;
  recipientType: RecipientType;
  recipientCount: number; // Số lượng người nhận
  sentAt: string; // ISO datetime string
  status: EmailStatus;
  errorMessage?: string; // nullable
  notificationCreated: boolean;
  attachments: EmailAttachmentResponse[];
}
```

### 1.5. EmailAttachmentResponse

```typescript
interface EmailAttachmentResponse {
  id: number;
  fileName: string;
  fileUrl: string; // URL để download
  fileSize: number;
  contentType: string;
}
```

### 1.6. EmailStatus Enum

```typescript
enum EmailStatus {
  SUCCESS = "SUCCESS",   // Gửi thành công
  FAILED = "FAILED",     // Gửi thất bại
  PARTIAL = "PARTIAL"    // Gửi một phần (một số thành công, một số thất bại)
}
```

---

## 2. API Endpoints

### 2.1. Gửi Email

**Endpoint:** `POST /api/emails/send`

**Authentication:** Required (ADMIN, MANAGER only)

**Content-Type:** `multipart/form-data`

**Request:**
- `request` (JSON string): SendEmailRequest object
- `attachments` (File[]): Danh sách file đính kèm (optional, max 10MB per file)

**Response Success (200):**
```json
{
  "status": true,
  "message": "Email sent to 50 recipients (48 success, 2 failed)",
  "data": {
    "totalRecipients": 50,
    "successCount": 48,
    "failedCount": 2,
    "status": "PARTIAL",
    "emailHistories": [
      {
        "id": 1,
        "senderId": 1,
        "senderName": "admin",
        "recipientId": 123,
        "recipientEmail": "student@example.com",
        "subject": "Thông báo sự kiện",
        "content": "Nội dung email...",
        "isHtml": true,
        "recipientType": "ACTIVITY_REGISTRATIONS",
        "recipientCount": 1,
        "sentAt": "2025-12-05T10:30:00",
        "status": "SUCCESS",
        "notificationCreated": true,
        "attachments": []
      }
    ]
  }
}
```

**Response Error (400):**
```json
{
  "status": false,
  "message": "Subject is required",
  "data": null
}
```

**Các lỗi có thể xảy ra:**
- `"Subject is required"` - Thiếu subject
- `"Content is required"` - Thiếu content
- `"Recipient type is required"` - Thiếu recipientType
- `"No recipients found"` - Không tìm thấy người nhận
- `"User not found"` - Không tìm thấy user từ authentication

**Ví dụ sử dụng với FormData:**

```typescript
const sendEmail = async (request: SendEmailRequest, attachments?: File[]) => {
  const formData = new FormData();
  
  // Convert request to JSON string
  formData.append('request', JSON.stringify(request));
  
  // Add attachments if any
  if (attachments && attachments.length > 0) {
    attachments.forEach((file) => {
      formData.append('attachments', file);
    });
  }
  
  const response = await fetch('/api/emails/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    body: formData,
  });
  
  return response.json();
};
```

### 2.2. Chỉ Tạo Notification (Không Gửi Email)

**Endpoint:** `POST /api/emails/notifications/send`

**Authentication:** Required (ADMIN, MANAGER only)

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "recipientType": "ACTIVITY_REGISTRATIONS",
  "activityId": 1,
  "title": "Thông báo sự kiện",
  "content": "Nội dung thông báo",
  "type": "SYSTEM_ANNOUNCEMENT",
  "actionUrl": "/activities/1"
}
```

**Response Success (200):**
```json
{
  "status": true,
  "message": "Notification sent to 50 recipients (50 success, 0 failed)",
  "data": {
    "totalRecipients": 50,
    "successCount": 50,
    "failedCount": 0
  }
}
```

### 2.3. Lấy Lịch Sử Email

**Endpoint:** `GET /api/emails/history`

**Authentication:** Required (ADMIN, MANAGER only)

**Query Parameters:**
- `page` (optional, default: 0) - Số trang
- `size` (optional, default: 20) - Số lượng mỗi trang

**Response Success (200):**
```json
{
  "status": true,
  "message": "Email history retrieved successfully",
  "data": {
    "content": [
      {
        "id": 1,
        "senderId": 1,
        "senderName": "admin",
        "recipientId": 123,
        "recipientEmail": "student@example.com",
        "subject": "Thông báo sự kiện",
        "content": "Nội dung email...",
        "isHtml": true,
        "recipientType": "ACTIVITY_REGISTRATIONS",
        "recipientCount": 1,
        "sentAt": "2025-12-05T10:30:00",
        "status": "SUCCESS",
        "notificationCreated": true,
        "attachments": []
      }
    ],
    "totalElements": 100,
    "totalPages": 5,
    "size": 20,
    "number": 0
  }
}
```

### 2.4. Xem Chi Tiết Email

**Endpoint:** `GET /api/emails/history/{emailId}`

**Authentication:** Required (ADMIN, MANAGER only)

**Response Success (200):**
```json
{
  "status": true,
  "message": "Email history retrieved successfully",
  "data": {
    "id": 1,
    "senderId": 1,
    "senderName": "admin",
    "recipientId": 123,
    "recipientEmail": "student@example.com",
    "subject": "Thông báo sự kiện",
    "content": "Nội dung email...",
    "isHtml": true,
    "recipientType": "ACTIVITY_REGISTRATIONS",
    "recipientCount": 1,
    "sentAt": "2025-12-05T10:30:00",
    "status": "SUCCESS",
    "notificationCreated": true,
    "attachments": [
      {
        "id": 1,
        "fileName": "document.pdf",
        "fileUrl": "http://localhost:8080/api/emails/attachments/1/download",
        "fileSize": 1024000,
        "contentType": "application/pdf"
      }
    ]
  }
}
```

### 2.5. Gửi Lại Email

**Endpoint:** `POST /api/emails/history/{emailId}/resend`

**Authentication:** Required (ADMIN, MANAGER only)

**Response Success (200):**
```json
{
  "status": true,
  "message": "Email resent successfully",
  "data": {
    "id": 1,
    "senderId": 1,
    "senderName": "admin",
    "recipientId": 123,
    "recipientEmail": "student@example.com",
    "subject": "Thông báo sự kiện",
    "content": "Nội dung email...",
    "isHtml": true,
    "recipientType": "ACTIVITY_REGISTRATIONS",
    "recipientCount": 1,
    "sentAt": "2025-12-05T11:00:00",
    "status": "SUCCESS",
    "notificationCreated": true,
    "attachments": []
  }
}
```

### 2.6. Download File Đính Kèm

**Endpoint:** `GET /api/emails/attachments/{attachmentId}/download`

**Authentication:** Required (ADMIN, MANAGER only)

**Response:** File download (binary)

**Ví dụ sử dụng:**
```typescript
const downloadAttachment = async (attachmentId: number, fileName: string) => {
  const response = await fetch(`/api/emails/attachments/${attachmentId}/download`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
    },
  });
  
  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};
```

---

## 3. Template Variables

Hệ thống hỗ trợ các biến template trong email content và subject:

### 3.1. Biến Mặc Định

- `{{studentName}}` - Tên sinh viên
- `{{studentCode}}` - Mã sinh viên
- `{{activityName}}` - Tên sự kiện (nếu có activityId)
- `{{activityDate}}` - Ngày sự kiện (nếu có activityId)
- `{{seriesName}}` - Tên series (nếu có seriesId)
- `{{className}}` - Tên lớp (nếu student có class)
- `{{departmentName}}` - Tên khoa (nếu student có department)

### 3.2. Biến Tùy Chọn

Có thể thêm biến tùy chọn qua `templateVariables`:

```typescript
const request: SendEmailRequest = {
  recipientType: RecipientType.ACTIVITY_REGISTRATIONS,
  activityId: 1,
  subject: "Thông báo sự kiện {{activityName}}",
  content: "Xin chào {{studentName}}, bạn đã đăng ký sự kiện {{activityName}} vào ngày {{activityDate}}.",
  isHtml: true,
  templateVariables: {
    customVariable: "Giá trị tùy chọn"
  }
};
```

### 3.3. Ví Dụ Template HTML

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #007bff;">Xin chào {{studentName}}!</h2>
  <p>Bạn đã đăng ký thành công sự kiện <strong>{{activityName}}</strong>.</p>
  <p>Thời gian: {{activityDate}}</p>
  <p>Lớp: {{className}}</p>
  <p>Trân trọng,<br>CampusLife Team</p>
</div>
```

---

## 4. UI Components

### 4.1. Form Gửi Email

```typescript
import { useState } from 'react';

const SendEmailForm = () => {
  const [formData, setFormData] = useState<SendEmailRequest>({
    recipientType: RecipientType.INDIVIDUAL,
    subject: '',
    content: '',
    isHtml: false,
    createNotification: false,
  });
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await sendEmail(formData, attachments);
      if (response.status) {
        alert('Email sent successfully!');
        // Reset form
      } else {
        alert(`Error: ${response.message}`);
      }
    } catch (error) {
      alert('Failed to send email');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Recipient Type Selection */}
      <div>
        <label>Recipient Type:</label>
        <select
          value={formData.recipientType}
          onChange={(e) => setFormData({ ...formData, recipientType: e.target.value as RecipientType })}
        >
          <option value={RecipientType.INDIVIDUAL}>Individual</option>
          <option value={RecipientType.ACTIVITY_REGISTRATIONS}>Activity Registrations</option>
          <option value={RecipientType.SERIES_REGISTRATIONS}>Series Registrations</option>
          <option value={RecipientType.ALL_STUDENTS}>All Students</option>
          <option value={RecipientType.BY_CLASS}>By Class</option>
          <option value={RecipientType.BY_DEPARTMENT}>By Department</option>
          <option value={RecipientType.CUSTOM_LIST}>Custom List</option>
        </select>
      </div>

      {/* Conditional Fields based on recipientType */}
      {formData.recipientType === RecipientType.ACTIVITY_REGISTRATIONS && (
        <div>
          <label>Activity ID:</label>
          <input
            type="number"
            value={formData.activityId || ''}
            onChange={(e) => setFormData({ ...formData, activityId: parseInt(e.target.value) })}
          />
        </div>
      )}

      {formData.recipientType === RecipientType.SERIES_REGISTRATIONS && (
        <div>
          <label>Series ID:</label>
          <input
            type="number"
            value={formData.seriesId || ''}
            onChange={(e) => setFormData({ ...formData, seriesId: parseInt(e.target.value) })}
          />
        </div>
      )}

      {/* Subject */}
      <div>
        <label>Subject:</label>
        <input
          type="text"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          required
        />
      </div>

      {/* Content */}
      <div>
        <label>Content:</label>
        {formData.isHtml ? (
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={10}
            required
          />
        ) : (
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={10}
            required
          />
        )}
      </div>

      {/* HTML Toggle */}
      <div>
        <label>
          <input
            type="checkbox"
            checked={formData.isHtml}
            onChange={(e) => setFormData({ ...formData, isHtml: e.target.checked })}
          />
          HTML Content
        </label>
      </div>

      {/* Attachments */}
      <div>
        <label>Attachments (max 10MB per file):</label>
        <input
          type="file"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            setAttachments(files);
          }}
        />
      </div>

      {/* Notification Options */}
      <div>
        <label>
          <input
            type="checkbox"
            checked={formData.createNotification}
            onChange={(e) => setFormData({ ...formData, createNotification: e.target.checked })}
          />
          Create Notification
        </label>
      </div>

      {formData.createNotification && (
        <>
          <div>
            <label>Notification Title:</label>
            <input
              type="text"
              value={formData.notificationTitle || ''}
              onChange={(e) => setFormData({ ...formData, notificationTitle: e.target.value })}
            />
          </div>
          <div>
            <label>Notification Type:</label>
            <select
              value={formData.notificationType || 'SYSTEM_ANNOUNCEMENT'}
              onChange={(e) => setFormData({ ...formData, notificationType: e.target.value as NotificationType })}
            >
              <option value="SYSTEM_ANNOUNCEMENT">System Announcement</option>
              <option value="ACTIVITY_REGISTRATION">Activity Registration</option>
              <option value="GENERAL">General</option>
            </select>
          </div>
        </>
      )}

      <button type="submit">Send Email</button>
    </form>
  );
};
```

### 4.2. Form Tạo Notification (Không Gửi Email)

```typescript
const SendNotificationOnlyForm = () => {
  const [formData, setFormData] = useState<SendNotificationOnlyRequest>({
    recipientType: RecipientType.INDIVIDUAL,
    title: '',
    content: '',
    type: NotificationType.SYSTEM_ANNOUNCEMENT,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/emails/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      if (data.status) {
        alert('Notification sent successfully!');
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      alert('Failed to send notification');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Similar fields as SendEmailForm but without email-specific fields */}
      {/* ... */}
    </form>
  );
};
```

### 4.3. Email History List

```typescript
const EmailHistoryList = () => {
  const [history, setHistory] = useState<EmailHistoryResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`/api/emails/history?page=${page}&size=20`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      });
      
      const data = await response.json();
      if (data.status) {
        setHistory(data.data.content);
        setTotalPages(data.data.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch email history:', error);
    }
  };

  return (
    <div>
      <h2>Email History</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Recipient</th>
            <th>Subject</th>
            <th>Status</th>
            <th>Sent At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {history.map((email) => (
            <tr key={email.id}>
              <td>{email.id}</td>
              <td>{email.recipientEmail}</td>
              <td>{email.subject}</td>
              <td>{email.status}</td>
              <td>{new Date(email.sentAt).toLocaleString()}</td>
              <td>
                <button onClick={() => viewEmailDetail(email.id)}>View</button>
                {email.status === EmailStatus.FAILED && (
                  <button onClick={() => resendEmail(email.id)}>Resend</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Pagination */}
      <div>
        <button disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
        <span>Page {page + 1} of {totalPages}</span>
        <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
};
```

---

## 5. Service Functions

### 5.1. Send Email Service

```typescript
// services/emailService.ts

export const sendEmail = async (
  request: SendEmailRequest,
  attachments?: File[]
): Promise<Response<EmailSendResult>> => {
  const formData = new FormData();
  
  // Convert request to JSON string
  formData.append('request', JSON.stringify(request));
  
  // Add attachments if any
  if (attachments && attachments.length > 0) {
    attachments.forEach((file) => {
      formData.append('attachments', file);
    });
  }
  
  const response = await fetch('/api/emails/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    body: formData,
  });
  
  return response.json();
};
```

### 5.2. Send Notification Only Service

```typescript
export const sendNotificationOnly = async (
  request: SendNotificationOnlyRequest
): Promise<Response<NotificationSendResult>> => {
  const response = await fetch('/api/emails/notifications/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(request),
  });
  
  return response.json();
};
```

### 5.3. Get Email History Service

```typescript
export const getEmailHistory = async (
  page: number = 0,
  size: number = 20
): Promise<Response<EmailHistoryPage>> => {
  const response = await fetch(`/api/emails/history?page=${page}&size=${size}`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
    },
  });
  
  return response.json();
};
```

---

## 6. Use Cases

### 6.1. Gửi Email Cho Tất Cả Sinh Viên Đã Đăng Ký Activity

```typescript
const sendEmailToActivityRegistrations = async (activityId: number) => {
  const request: SendEmailRequest = {
    recipientType: RecipientType.ACTIVITY_REGISTRATIONS,
    activityId: activityId,
    subject: "Thông báo sự kiện {{activityName}}",
    content: `
      <div>
        <h2>Xin chào {{studentName}}!</h2>
        <p>Bạn đã đăng ký thành công sự kiện <strong>{{activityName}}</strong>.</p>
        <p>Thời gian: {{activityDate}}</p>
        <p>Vui lòng có mặt đúng giờ!</p>
      </div>
    `,
    isHtml: true,
    createNotification: true,
    notificationTitle: "Thông báo sự kiện {{activityName}}",
    notificationType: NotificationType.ACTIVITY_REGISTRATION,
    notificationActionUrl: `/activities/${activityId}`,
  };
  
  const response = await sendEmail(request);
  return response;
};
```

### 6.2. Gửi Email Cho Sinh Viên Theo Lớp

```typescript
const sendEmailToClass = async (classId: number) => {
  const request: SendEmailRequest = {
    recipientType: RecipientType.BY_CLASS,
    classId: classId,
    subject: "Thông báo quan trọng cho lớp {{className}}",
    content: "Nội dung thông báo...",
    isHtml: false,
    createNotification: true,
    notificationType: NotificationType.SYSTEM_ANNOUNCEMENT,
  };
  
  const response = await sendEmail(request);
  return response;
};
```

### 6.3. Chỉ Tạo Notification (Không Gửi Email)

```typescript
const createNotificationOnly = async () => {
  const request: SendNotificationOnlyRequest = {
    recipientType: RecipientType.ALL_STUDENTS,
    title: "Thông báo hệ thống",
    content: "Hệ thống sẽ bảo trì vào ngày mai.",
    type: NotificationType.SYSTEM_ANNOUNCEMENT,
    actionUrl: "/announcements",
  };
  
  const response = await sendNotificationOnly(request);
  return response;
};
```

---

## 7. Error Handling

### 7.1. Validation Errors

```typescript
try {
  const response = await sendEmail(request, attachments);
  if (!response.status) {
    // Handle validation errors
    switch (response.message) {
      case "Subject is required":
        alert("Vui lòng nhập tiêu đề email");
        break;
      case "Content is required":
        alert("Vui lòng nhập nội dung email");
        break;
      case "No recipients found":
        alert("Không tìm thấy người nhận. Vui lòng kiểm tra lại filter.");
        break;
      default:
        alert(`Lỗi: ${response.message}`);
    }
  }
} catch (error) {
  console.error("Failed to send email:", error);
  alert("Đã xảy ra lỗi khi gửi email. Vui lòng thử lại.");
}
```

### 7.2. File Size Validation

```typescript
const validateAttachments = (files: File[]): string | null => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  for (const file of files) {
    if (file.size > maxSize) {
      return `File ${file.name} vượt quá 10MB. Vui lòng chọn file nhỏ hơn.`;
    }
  }
  
  return null;
};

// Usage
const files = Array.from(e.target.files || []);
const error = validateAttachments(files);
if (error) {
  alert(error);
  return;
}
setAttachments(files);
```

---

## 8. Best Practices

1. **Validate Input:** Luôn validate recipientType và các filter tương ứng trước khi gửi
2. **Show Loading State:** Hiển thị loading khi đang gửi email (có thể mất thời gian với nhiều recipients)
3. **Preview Template:** Cho phép preview email với sample data trước khi gửi
4. **File Size Warning:** Cảnh báo user nếu file đính kèm quá lớn
5. **Template Editor:** Sử dụng rich text editor cho HTML content
6. **Recipient Count:** Hiển thị số lượng recipients sẽ nhận email trước khi gửi
7. **Error Recovery:** Cho phép resend email nếu gửi thất bại
8. **History Tracking:** Lưu draft email để có thể chỉnh sửa và gửi lại sau

---

## 9. Testing

### 9.1. Test với cURL

**Gửi email:**
```bash
curl --location 'http://localhost:8080/api/emails/send' \
--header 'Authorization: Bearer {ADMIN_TOKEN}' \
--form 'request="{\"recipientType\":\"INDIVIDUAL\",\"recipientIds\":[1,2,3],\"subject\":\"Test Email\",\"content\":\"This is a test email\",\"isHtml\":false}"' \
--form 'attachments=@"/path/to/file.pdf"'
```

**Chỉ tạo notification:**
```bash
curl --location 'http://localhost:8080/api/emails/notifications/send' \
--header 'Authorization: Bearer {ADMIN_TOKEN}' \
--header 'Content-Type: application/json' \
--data '{
  "recipientType": "ALL_STUDENTS",
  "title": "Test Notification",
  "content": "This is a test notification",
  "type": "SYSTEM_ANNOUNCEMENT"
}'
```

---

## Tóm Tắt

- ✅ Hỗ trợ nhiều loại recipients (individual, activity registrations, series registrations, all students, by class, by department, custom list)
- ✅ Gửi email với HTML template và biến động
- ✅ Đính kèm file (max 10MB per file)
- ✅ Tùy chọn tạo notification khi gửi email
- ✅ Chỉ tạo notification (không gửi email)
- ✅ Lưu lịch sử email và cho phép resend
- ✅ Download attachments
- ✅ Phân trang lịch sử email

