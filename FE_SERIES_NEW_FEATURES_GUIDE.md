# Hướng Dẫn Frontend - Chức Năng Mới Chuỗi Sự Kiện

## Tổng Quan

Tài liệu này hướng dẫn cách tích hợp 2 chức năng mới cho chuỗi sự kiện:
1. **Xem tiến độ tham gia của tất cả sinh viên** - Cho phép Admin/Manager xem danh sách tiến độ của tất cả sinh viên đã đăng ký chuỗi
2. **Xem tổng quan thống kê chuỗi** - Hiển thị thống kê tổng quan về chuỗi sự kiện

---

## 1. Xem Tiến Độ Tham Gia Của Tất Cả Sinh Viên

### API Endpoint

```
GET /api/series/{seriesId}/progress
```

### Quyền Truy Cập
- **ADMIN**: Có thể xem tất cả
- **MANAGER**: Có thể xem tất cả
- **STUDENT**: Không có quyền truy cập

### Query Parameters

| Parameter | Type | Required | Default | Mô tả |
|-----------|------|----------|---------|-------|
| `page` | Integer | No | 0 | Số trang (bắt đầu từ 0) |
| `size` | Integer | No | 20 | Số lượng items mỗi trang |
| `keyword` | String | No | - | Từ khóa tìm kiếm (tên hoặc mã sinh viên) |

### Request Example

```javascript
// Lấy trang đầu tiên, 20 items
GET /api/series/1/progress

// Lấy trang 2, 10 items
GET /api/series/1/progress?page=1&size=10

// Tìm kiếm sinh viên
GET /api/series/1/progress?keyword=Nguyễn Văn A
```

### Response Structure

```typescript
{
  "status": true,
  "message": "Series progress retrieved successfully",
  "body": {
    "seriesId": 1,
    "seriesName": "Chuỗi sự kiện mùa hè 2024",
    "totalActivities": 5,
    "totalRegistered": 150,
    "progressList": [
      {
        "studentId": 1,
        "studentCode": "SV001",
        "studentName": "Nguyễn Văn A",
        "className": "CNTT2021",
        "departmentName": "Khoa Công nghệ thông tin",
        "completedCount": 3,
        "totalActivities": 5,
        "pointsEarned": 5.00,
        "currentMilestone": "3",
        "completedActivityIds": [1, 2, 3],
        "lastUpdated": "2024-01-15T10:30:00",
        "isRegistered": true
      }
      // ... more items
    ],
    "page": 0,
    "size": 20,
    "totalPages": 8,
    "totalElements": 150
  }
}
```

### Response Fields

#### SeriesProgressListResponse

| Field | Type | Mô tả |
|-------|------|-------|
| `seriesId` | Long | ID của chuỗi sự kiện |
| `seriesName` | String | Tên chuỗi sự kiện |
| `totalActivities` | Integer | Tổng số activities trong chuỗi |
| `totalRegistered` | Long | Tổng số sinh viên đã đăng ký |
| `progressList` | Array | Danh sách tiến độ của sinh viên |
| `page` | Integer | Trang hiện tại |
| `size` | Integer | Số items mỗi trang |
| `totalPages` | Integer | Tổng số trang |
| `totalElements` | Long | Tổng số items |

#### SeriesProgressItemResponse

| Field | Type | Mô tả |
|-------|------|-------|
| `studentId` | Long | ID sinh viên |
| `studentCode` | String | Mã sinh viên |
| `studentName` | String | Tên sinh viên |
| `className` | String? | Tên lớp (có thể null) |
| `departmentName` | String? | Tên khoa (có thể null) |
| `completedCount` | Integer | Số activities đã hoàn thành |
| `totalActivities` | Integer | Tổng số activities |
| `pointsEarned` | BigDecimal | Điểm milestone đã nhận |
| `currentMilestone` | String? | Key của milestone hiện tại (ví dụ: "3") |
| `completedActivityIds` | Array<Long> | Danh sách ID activities đã hoàn thành |
| `lastUpdated` | DateTime | Thời gian cập nhật lần cuối |
| `isRegistered` | Boolean | Đã đăng ký chuỗi chưa |

### Frontend Implementation Example

```javascript
// React example
import { useState, useEffect } from 'react';
import axios from 'axios';

const SeriesProgressList = ({ seriesId }) => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    fetchProgress();
  }, [seriesId, page, size, keyword]);

  const fetchProgress = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      });
      if (keyword) {
        params.append('keyword', keyword);
      }

      const response = await axios.get(
        `/api/series/${seriesId}/progress?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.status) {
        setProgress(response.data.body);
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Search bar */}
      <input
        type="text"
        placeholder="Tìm kiếm theo tên hoặc mã sinh viên..."
        value={keyword}
        onChange={(e) => {
          setKeyword(e.target.value);
          setPage(0); // Reset to first page when searching
        }}
      />

      {/* Progress table */}
      {loading ? (
        <div>Đang tải...</div>
      ) : progress ? (
        <>
          <div>
            <p>Tổng số sinh viên đã đăng ký: {progress.totalRegistered}</p>
            <p>Tổng số activities: {progress.totalActivities}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Mã SV</th>
                <th>Tên SV</th>
                <th>Lớp</th>
                <th>Khoa</th>
                <th>Đã hoàn thành</th>
                <th>Điểm milestone</th>
                <th>Milestone hiện tại</th>
                <th>Cập nhật lần cuối</th>
              </tr>
            </thead>
            <tbody>
              {progress.progressList.map((item) => (
                <tr key={item.studentId}>
                  <td>{item.studentCode}</td>
                  <td>{item.studentName}</td>
                  <td>{item.className || '-'}</td>
                  <td>{item.departmentName || '-'}</td>
                  <td>
                    {item.completedCount}/{item.totalActivities}
                  </td>
                  <td>{item.pointsEarned}</td>
                  <td>
                    {item.currentMilestone
                      ? `Mốc ${item.currentMilestone}`
                      : 'Chưa đạt mốc'}
                  </td>
                  <td>
                    {new Date(item.lastUpdated).toLocaleString('vi-VN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div>
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Trước
            </button>
            <span>
              Trang {page + 1} / {progress.totalPages}
            </span>
            <button
              disabled={page >= progress.totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              Sau
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
};
```

### UI/UX Suggestions

1. **Search Bar**: 
   - Place search bar at the top
   - Add debounce (300-500ms) to avoid too many API calls
   - Show loading indicator while searching

2. **Progress Table**:
   - Highlight students who completed all activities
   - Show progress bar for completedCount/totalActivities
   - Color code milestones (e.g., green for highest milestone)

3. **Pagination**:
   - Show total elements and current range
   - Allow user to jump to specific page
   - Show page size selector (10, 20, 50, 100)

4. **Export**:
   - Consider adding export to Excel/CSV functionality

---

## 2. Xem Tổng Quan Thống Kê Chuỗi

### API Endpoint

```
GET /api/series/{seriesId}/overview
```

### Quyền Truy Cập
- **ADMIN**: Có thể xem
- **MANAGER**: Có thể xem
- **STUDENT**: Không có quyền truy cập

### Request Example

```javascript
GET /api/series/1/overview
```

### Response Structure

```typescript
{
  "status": true,
  "message": "Series overview retrieved successfully",
  "body": {
    "seriesId": 1,
    "seriesName": "Chuỗi sự kiện mùa hè 2024",
    "description": "Mô tả chuỗi sự kiện...",
    "scoreType": "REN_LUYEN",
    "milestonePoints": "{\"3\":5,\"4\":7,\"5\":10}",
    "milestonePointsMap": {
      "3": 5,
      "4": 7,
      "5": 10
    },
    "registrationStartDate": "2024-01-01T00:00:00",
    "registrationDeadline": "2024-01-31T23:59:59",
    "requiresApproval": true,
    "ticketQuantity": 200,
    "createdAt": "2024-01-01T00:00:00",
    
    // Statistics
    "totalActivities": 5,
    "totalRegisteredStudents": 150,
    "totalCompletedStudents": 45,
    "completionRate": 0.3,
    "totalMilestonePointsAwarded": 750.00,
    
    // Milestone progress distribution
    "milestoneProgress": [
      {
        "milestoneKey": "3",
        "milestoneCount": 3,
        "milestonePoints": 5,
        "studentCount": 80,
        "percentage": 53.33
      },
      {
        "milestoneKey": "4",
        "milestoneCount": 4,
        "milestonePoints": 7,
        "studentCount": 50,
        "percentage": 33.33
      },
      {
        "milestoneKey": "5",
        "milestoneCount": 5,
        "milestonePoints": 10,
        "studentCount": 45,
        "percentage": 30.00
      }
    ],
    
    // Activity statistics
    "activityStats": [
      {
        "activityId": 1,
        "activityName": "Activity 1",
        "order": 1,
        "registrationCount": 150,
        "participationCount": 120,
        "participationRate": 0.8
      }
      // ... more activities
    ]
  }
}
```

### Response Fields

#### SeriesOverviewResponse

| Field | Type | Mô tả |
|-------|------|-------|
| `seriesId` | Long | ID chuỗi sự kiện |
| `seriesName` | String | Tên chuỗi |
| `description` | String? | Mô tả |
| `scoreType` | ScoreType | Loại điểm (REN_LUYEN, CONG_TAC_XA_HOI, etc.) |
| `milestonePoints` | String | JSON string của milestone points |
| `milestonePointsMap` | Map<String, Integer> | Parsed milestone points |
| `registrationStartDate` | DateTime? | Ngày mở đăng ký |
| `registrationDeadline` | DateTime? | Hạn chót đăng ký |
| `requiresApproval` | Boolean | Cần duyệt hay không |
| `ticketQuantity` | Integer? | Số lượng vé/slot |
| `createdAt` | DateTime | Ngày tạo |
| `totalActivities` | Integer | Tổng số activities |
| `totalRegisteredStudents` | Long | Tổng số SV đã đăng ký |
| `totalCompletedStudents` | Long | Số SV đã hoàn thành tất cả |
| `completionRate` | Double | Tỷ lệ hoàn thành (0.0 - 1.0) |
| `totalMilestonePointsAwarded` | BigDecimal | Tổng điểm milestone đã trao |
| `milestoneProgress` | Array | Phân bố tiến độ theo milestone |
| `activityStats` | Array | Thống kê từng activity |

#### MilestoneProgressItem

| Field | Type | Mô tả |
|-------|------|-------|
| `milestoneKey` | String | Key của milestone (ví dụ: "3") |
| `milestoneCount` | Integer | Số activity cần để đạt milestone |
| `milestonePoints` | Integer | Điểm thưởng |
| `studentCount` | Long | Số SV đã đạt milestone này |
| `percentage` | Double | % so với tổng số SV đã đăng ký |

#### ActivityStatItem

| Field | Type | Mô tả |
|-------|------|-------|
| `activityId` | Long | ID activity |
| `activityName` | String | Tên activity |
| `order` | Integer? | Thứ tự trong series |
| `registrationCount` | Long | Số đăng ký |
| `participationCount` | Long | Số tham gia (COMPLETED) |
| `participationRate` | Double | Tỷ lệ tham gia (0.0 - 1.0) |

### Frontend Implementation Example

```javascript
// React example
import { useState, useEffect } from 'react';
import axios from 'axios';

const SeriesOverview = ({ seriesId }) => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOverview();
  }, [seriesId]);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/series/${seriesId}/overview`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.status) {
        setOverview(response.data.body);
      }
    } catch (error) {
      console.error('Failed to fetch overview:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Đang tải...</div>;
  if (!overview) return null;

  return (
    <div>
      {/* Basic Info Card */}
      <div className="card">
        <h2>{overview.seriesName}</h2>
        <p>{overview.description}</p>
        <div>
          <span>Loại điểm: {overview.scoreType}</span>
          <span>Ngày tạo: {new Date(overview.createdAt).toLocaleDateString('vi-VN')}</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Tổng số Activities</h3>
          <p className="stat-number">{overview.totalActivities}</p>
        </div>
        <div className="stat-card">
          <h3>Sinh viên đã đăng ký</h3>
          <p className="stat-number">{overview.totalRegisteredStudents}</p>
        </div>
        <div className="stat-card">
          <h3>Sinh viên đã hoàn thành</h3>
          <p className="stat-number">{overview.totalCompletedStudents}</p>
          <p className="stat-percentage">
            {(overview.completionRate * 100).toFixed(1)}%
          </p>
        </div>
        <div className="stat-card">
          <h3>Tổng điểm đã trao</h3>
          <p className="stat-number">{overview.totalMilestonePointsAwarded}</p>
        </div>
      </div>

      {/* Milestone Progress Chart */}
      <div className="card">
        <h3>Phân bố tiến độ theo Milestone</h3>
        <div className="milestone-chart">
          {overview.milestoneProgress.map((milestone) => (
            <div key={milestone.milestoneKey} className="milestone-item">
              <div className="milestone-header">
                <span>Milestone {milestone.milestoneKey}</span>
                <span>{milestone.milestonePoints} điểm</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${milestone.percentage}%` }}
                />
              </div>
              <div className="milestone-stats">
                <span>{milestone.studentCount} sinh viên</span>
                <span>{milestone.percentage.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Statistics Table */}
      <div className="card">
        <h3>Thống kê từng Activity</h3>
        <table>
          <thead>
            <tr>
              <th>Thứ tự</th>
              <th>Tên Activity</th>
              <th>Số đăng ký</th>
              <th>Số tham gia</th>
              <th>Tỷ lệ tham gia</th>
            </tr>
          </thead>
          <tbody>
            {overview.activityStats.map((activity) => (
              <tr key={activity.activityId}>
                <td>{activity.order || '-'}</td>
                <td>{activity.activityName}</td>
                <td>{activity.registrationCount}</td>
                <td>{activity.participationCount}</td>
                <td>
                  <div className="participation-rate">
                    <span>{(activity.participationRate * 100).toFixed(1)}%</span>
                    <div className="rate-bar">
                      <div
                        className="rate-fill"
                        style={{ width: `${activity.participationRate * 100}%` }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

### UI/UX Suggestions

1. **Statistics Cards**:
   - Use cards with icons
   - Highlight completion rate with color (green if > 80%, yellow if 50-80%, red if < 50%)
   - Show trend indicators if comparing with previous periods

2. **Milestone Progress Chart**:
   - Use horizontal bar chart or vertical bar chart
   - Color code by milestone level
   - Show tooltip on hover with detailed info

3. **Activity Statistics**:
   - Sortable table
   - Filter by participation rate
   - Link to activity detail page

4. **Visualizations**:
   - Consider using chart libraries (Chart.js, Recharts, etc.) for better visualization
   - Add pie chart for milestone distribution
   - Add line chart for activity participation trends

---

## Error Handling

### Common Error Responses

```typescript
// Series not found
{
  "status": false,
  "message": "Series not found",
  "body": null
}

// Unauthorized
{
  "status": false,
  "message": "Unauthorized",
  "body": null
}

// Server error
{
  "status": false,
  "message": "Failed to get series progress: [error details]",
  "body": null
}
```

### Error Handling Example

```javascript
try {
  const response = await axios.get(`/api/series/${seriesId}/progress`);
  if (!response.data.status) {
    // Handle API error
    console.error('API Error:', response.data.message);
    // Show error message to user
  }
} catch (error) {
  if (error.response) {
    // Server responded with error status
    if (error.response.status === 401) {
      // Unauthorized - redirect to login
    } else if (error.response.status === 404) {
      // Series not found
    } else {
      // Other server errors
    }
  } else if (error.request) {
    // Request made but no response
    console.error('Network error');
  } else {
    // Something else happened
    console.error('Error:', error.message);
  }
}
```

---

## Notes

1. **Authentication**: Tất cả requests cần có JWT token trong header:
   ```
   Authorization: Bearer <token>
   ```

2. **Pagination**: 
   - Page bắt đầu từ 0
   - Size mặc định là 20
   - Nên giới hạn size tối đa (ví dụ: 100) để tránh load quá nhiều data

3. **Search**:
   - Search không phân biệt hoa thường
   - Search theo tên hoặc mã sinh viên
   - Nên debounce search input để tránh quá nhiều API calls

4. **Date Format**:
   - Backend trả về ISO 8601 format
   - Frontend nên format lại theo locale (vi-VN)

5. **BigDecimal**:
   - Điểm số được trả về dạng số (không phải string)
   - Nên format với 2 chữ số thập phân khi hiển thị

---

## API Summary

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/series/{seriesId}/progress` | GET | Admin/Manager | Xem tiến độ tham gia của tất cả SV |
| `/api/series/{seriesId}/overview` | GET | Admin/Manager | Xem tổng quan thống kê chuỗi |

---


