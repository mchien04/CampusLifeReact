# Hướng Dẫn Frontend - Hệ Thống Thông Báo

## Tổng Quan

Hệ thống thông báo đã được tối ưu với các tính năng mới:
- **Tự động tạo URL**: Khi gửi email/thông báo từ danh sách đăng ký sự kiện/chuỗi sự kiện, URL sẽ được tự động tạo
- **Metadata**: Lưu trữ thông tin `activityId` và `seriesId` trong metadata
- **API xem chi tiết**: Endpoint mới để xem chi tiết thông báo với metadata đã được parse

---

## API Endpoints

### 1. Lấy Danh Sách Thông Báo

**Endpoint:** `GET /api/notifications`

**Query Parameters:**
- `page` (optional): Số trang (default: 0)
- `size` (optional): Số lượng mỗi trang (default: 20)
- `sort` (optional): Sắp xếp (ví dụ: `createdAt,desc`)

**Response:**
```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": {
    "content": [
      {
        "id": 1,
        "title": "Thông báo sự kiện",
        "content": "Sự kiện ABC sẽ diễn ra vào...",
        "type": "ACTIVITY_REGISTRATION",
        "status": "UNREAD",
        "actionUrl": "https://campus-life-react.vercel.app/activities/123",
        "metadata": "{\"activityId\":123}",
        "createdAt": "2025-12-24T10:00:00",
        "updatedAt": "2025-12-24T10:00:00"
      }
    ],
    "totalElements": 50,
    "totalPages": 3,
    "size": 20,
    "number": 0
  }
}
```

---

### 2. Xem Chi Tiết Thông Báo (MỚI)

**Endpoint:** `GET /api/notifications/{notificationId}`

**Path Parameters:**
- `notificationId`: ID của thông báo

**Response:**
```json
{
  "success": true,
  "message": "Notification detail retrieved successfully",
  "data": {
    "id": 1,
    "title": "Thông báo sự kiện",
    "content": "Sự kiện ABC sẽ diễn ra vào...",
    "type": "ACTIVITY_REGISTRATION",
    "status": "READ",
    "actionUrl": "https://campus-life-react.vercel.app/activities/123",
    "metadata": {
      "activityId": 123
    },
    "activityId": 123,
    "seriesId": null,
    "createdAt": "2025-12-24T10:00:00",
    "updatedAt": "2025-12-24T10:30:00",
    "readAt": "2025-12-24T10:30:00"
  }
}
```

**Lưu ý:**
- `metadata` đã được parse từ JSON string thành object
- `activityId` và `seriesId` được extract từ metadata để dễ sử dụng
- `readAt` chỉ có giá trị khi `status = "READ"`

---

### 3. Lấy Thông Báo Chưa Đọc

**Endpoint:** `GET /api/notifications/unread`

**Response:**
```json
{
  "success": true,
  "message": "Unread notifications retrieved successfully",
  "data": [
    {
      "id": 1,
      "title": "Thông báo sự kiện",
      "content": "...",
      "type": "ACTIVITY_REGISTRATION",
      "status": "UNREAD",
      "actionUrl": "...",
      "createdAt": "..."
    }
  ]
}
```

---

### 4. Đánh Dấu Đã Đọc

**Endpoint:** `PUT /api/notifications/{notificationId}/read`

**Path Parameters:**
- `notificationId`: ID của thông báo

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "id": 1,
    "status": "READ",
    ...
  }
}
```

---

### 5. Đánh Dấu Tất Cả Đã Đọc

**Endpoint:** `PUT /api/notifications/read-all`

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "data": null
}
```

---

### 6. Lấy Số Lượng Thông Báo Chưa Đọc

**Endpoint:** `GET /api/notifications/unread-count`

**Response:**
```json
{
  "success": true,
  "message": "Unread count retrieved successfully",
  "data": 5
}
```

---

### 7. Xóa Thông Báo

**Endpoint:** `DELETE /api/notifications/{notificationId}`

**Path Parameters:**
- `notificationId`: ID của thông báo

**Response:**
```json
{
  "success": true,
  "message": "Notification deleted successfully",
  "data": null
}
```

---

### 8. Lưu Trữ Thông Báo

**Endpoint:** `PUT /api/notifications/{notificationId}/archive`

**Path Parameters:**
- `notificationId`: ID của thông báo

**Response:**
```json
{
  "success": true,
  "message": "Notification archived successfully",
  "data": {
    "id": 1,
    "status": "ARCHIVED",
    ...
  }
}
```

---

## Tự Động Tạo URL

### Khi Gửi Email với Tạo Thông Báo

Khi gửi email với `createNotification: true` và có `activityId` hoặc `seriesId`, hệ thống sẽ tự động tạo `actionUrl`:

**Request:**
```json
{
  "recipientType": "ACTIVITY_REGISTRATIONS",
  "activityId": 123,
  "subject": "Thông báo sự kiện",
  "content": "Nội dung email...",
  "createNotification": true,
  "notificationTitle": "Thông báo sự kiện",
  "notificationType": "ACTIVITY_REGISTRATION"
  // notificationActionUrl không cần cung cấp - sẽ được tự động tạo
}
```

**Kết quả:**
- `actionUrl` tự động: `https://campus-life-react.vercel.app/activities/123`
- `metadata`: `{"activityId": 123}`

### Khi Tạo Thông Báo Trực Tiếp

**Request:**
```json
{
  "recipientType": "SERIES_REGISTRATIONS",
  "seriesId": 456,
  "title": "Thông báo chuỗi sự kiện",
  "content": "Nội dung thông báo...",
  "type": "SYSTEM_ANNOUNCEMENT"
  // actionUrl không cần cung cấp - sẽ được tự động tạo
}
```

**Kết quả:**
- `actionUrl` tự động: `https://campus-life-react.vercel.app/series/456`
- `metadata`: `{"seriesId": 456}`

### Lưu Ý

- Nếu bạn đã cung cấp `actionUrl` hoặc `notificationActionUrl`, hệ thống sẽ **sử dụng URL đó** thay vì tự động tạo
- URL tự động được tạo dựa trên `app.frontend-url` trong backend config

---

## Notification Types

```typescript
enum NotificationType {
  ACTIVITY_REGISTRATION = "ACTIVITY_REGISTRATION",
  TASK_ASSIGNMENT = "TASK_ASSIGNMENT",
  TASK_SUBMISSION = "TASK_SUBMISSION",
  TASK_GRADING = "TASK_GRADING",
  ACTIVITY_REMINDER = "ACTIVITY_REMINDER",
  REMINDER_1_DAY = "REMINDER_1_DAY",
  REMINDER_1_HOUR = "REMINDER_1_HOUR",
  SYSTEM_ANNOUNCEMENT = "SYSTEM_ANNOUNCEMENT",
  PROFILE_UPDATE = "PROFILE_UPDATE",
  SCORE_UPDATE = "SCORE_UPDATE",
  GENERAL = "GENERAL"
}
```

---

## Notification Status

```typescript
enum NotificationStatus {
  UNREAD = "UNREAD",
  READ = "READ",
  ARCHIVED = "ARCHIVED"
}
```

---

## Ví Dụ Sử Dụng React

### 1. Lấy Danh Sách Thông Báo

```typescript
import axios from 'axios';

const getNotifications = async (page = 0, size = 20) => {
  try {
    const response = await axios.get('/api/notifications', {
      params: { page, size, sort: 'createdAt,desc' },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};
```

### 2. Xem Chi Tiết Thông Báo

```typescript
const getNotificationDetail = async (notificationId: number) => {
  try {
    const response = await axios.get(`/api/notifications/${notificationId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const notification = response.data.data;
    
    // Sử dụng actionUrl để điều hướng
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    
    // Hoặc sử dụng activityId/seriesId để điều hướng
    if (notification.activityId) {
      router.push(`/activities/${notification.activityId}`);
    } else if (notification.seriesId) {
      router.push(`/series/${notification.seriesId}`);
    }
    
    return notification;
  } catch (error) {
    console.error('Error fetching notification detail:', error);
    throw error;
  }
};
```

### 3. Đánh Dấu Đã Đọc và Điều Hướng

```typescript
const markAsReadAndNavigate = async (notificationId: number) => {
  try {
    // Đánh dấu đã đọc
    await axios.put(`/api/notifications/${notificationId}/read`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    // Lấy chi tiết để có actionUrl
    const detailResponse = await axios.get(`/api/notifications/${notificationId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const notification = detailResponse.data.data;
    
    // Điều hướng nếu có actionUrl
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### 4. Component Hiển Thị Thông Báo

```typescript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Notification {
  id: number;
  title: string;
  content: string;
  type: string;
  status: 'UNREAD' | 'READ' | 'ARCHIVED';
  actionUrl?: string;
  activityId?: number;
  seriesId?: number;
  createdAt: string;
}

const NotificationList: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications', {
        params: { page: 0, size: 20 },
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data.data.content);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get('/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(response.data.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Đánh dấu đã đọc
    if (notification.status === 'UNREAD') {
      await axios.put(`/api/notifications/${notification.id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }

    // Điều hướng
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    } else if (notification.activityId) {
      router.push(`/activities/${notification.activityId}`);
    } else if (notification.seriesId) {
      router.push(`/series/${notification.seriesId}`);
    }
  };

  return (
    <div>
      <h2>Thông Báo ({unreadCount} chưa đọc)</h2>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          onClick={() => handleNotificationClick(notification)}
          style={{
            padding: '10px',
            margin: '5px',
            backgroundColor: notification.status === 'UNREAD' ? '#e3f2fd' : '#fff',
            cursor: 'pointer',
            border: notification.status === 'UNREAD' ? '2px solid #2196f3' : '1px solid #ddd'
          }}
        >
          <h3>{notification.title}</h3>
          <p>{notification.content}</p>
          <small>{new Date(notification.createdAt).toLocaleString()}</small>
          {notification.activityId && (
            <span> [Sự kiện #{notification.activityId}]</span>
          )}
          {notification.seriesId && (
            <span> [Chuỗi sự kiện #{notification.seriesId}]</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default NotificationList;
```

### 5. Component Xem Chi Tiết Thông Báo

```typescript
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface NotificationDetail {
  id: number;
  title: string;
  content: string;
  type: string;
  status: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  activityId?: number;
  seriesId?: number;
  createdAt: string;
  updatedAt: string;
  readAt?: string;
}

const NotificationDetailPage: React.FC = () => {
  const { notificationId } = useParams<{ notificationId: string }>();
  const navigate = useNavigate();
  const [notification, setNotification] = useState<NotificationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotificationDetail();
  }, [notificationId]);

  const fetchNotificationDetail = async () => {
    try {
      const response = await axios.get(`/api/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotification(response.data.data);
      
      // Tự động đánh dấu đã đọc nếu chưa đọc
      if (response.data.data.status === 'UNREAD') {
        await axios.put(`/api/notifications/${notificationId}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = () => {
    if (notification?.actionUrl) {
      window.location.href = notification.actionUrl;
    } else if (notification?.activityId) {
      navigate(`/activities/${notification.activityId}`);
    } else if (notification?.seriesId) {
      navigate(`/series/${notification.seriesId}`);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!notification) return <div>Notification not found</div>;

  return (
    <div>
      <h1>{notification.title}</h1>
      <div>
        <p>Loại: {notification.type}</p>
        <p>Trạng thái: {notification.status}</p>
        <p>Ngày tạo: {new Date(notification.createdAt).toLocaleString()}</p>
        {notification.readAt && (
          <p>Đã đọc: {new Date(notification.readAt).toLocaleString()}</p>
        )}
      </div>
      <div>
        <h2>Nội dung:</h2>
        <p>{notification.content}</p>
      </div>
      {notification.actionUrl && (
        <button onClick={handleNavigate}>
          Xem chi tiết {notification.activityId ? 'sự kiện' : 'chuỗi sự kiện'}
        </button>
      )}
      {notification.metadata && (
        <div>
          <h3>Metadata:</h3>
          <pre>{JSON.stringify(notification.metadata, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default NotificationDetailPage;
```

---

## Best Practices

1. **Luôn kiểm tra `actionUrl` trước khi điều hướng**: Sử dụng `actionUrl` nếu có, nếu không thì fallback về `activityId` hoặc `seriesId`

2. **Đánh dấu đã đọc khi user click vào thông báo**: Cải thiện UX và giữ sync với backend

3. **Sử dụng `unreadCount` để hiển thị badge**: Cập nhật real-time khi có thông báo mới

4. **Parse metadata nếu cần thông tin bổ sung**: Metadata có thể chứa thông tin khác ngoài `activityId` và `seriesId`

5. **Xử lý lỗi khi notification không tồn tại**: Hiển thị thông báo phù hợp cho user

---

## Lưu Ý Quan Trọng

- Tất cả endpoints yêu cầu authentication (Bearer token)
- User chỉ có thể xem/thao tác với thông báo của chính mình
- `actionUrl` có thể là full URL (với domain) hoặc relative path
- Metadata được lưu dưới dạng JSON string trong database, nhưng được parse thành object trong API response
- `readAt` chỉ có giá trị khi notification đã được đánh dấu là READ

---

## Migration Notes

Nếu bạn đang sử dụng API cũ:
- API cũ vẫn hoạt động bình thường
- Metadata trong response list vẫn là JSON string (chưa parse)
- Chỉ có API detail mới parse metadata thành object
- Khuyến nghị sử dụng API detail để có metadata đã parse sẵn

