# Hướng Dẫn API Thống Kê Cho Student - Frontend Guide

## Tổng Quan

Tài liệu này hướng dẫn frontend team tích hợp các API thống kê dành cho Student trong hệ thống CampusLife. Các API này cho phép student xem:
- Dashboard tổng quan cá nhân
- Thống kê điểm số
- Lịch sử điểm chi tiết
- Xem điểm theo học kỳ
- Bảng xếp hạng

---

## 1. Dashboard Tổng Quan (Student View)

### Endpoint
```
GET /api/statistics/dashboard
```

### Mô Tả
API này trả về dashboard tổng quan. Đối với Student, API sẽ tự động filter để chỉ hiển thị thống kê cá nhân.

### Authentication
- **Required**: Yes (Bearer Token)
- **Roles**: `STUDENT`, `ADMIN`, `MANAGER`
- **Student Behavior**: Tự động filter theo studentId của user đang đăng nhập

### Response Format

```typescript
interface DashboardOverviewResponse {
  totalActivities: number;           // Tổng số activities (toàn hệ thống)
  totalStudents: number;              // Tổng số students (toàn hệ thống)
  totalSeries: number;                // Tổng số series (toàn hệ thống)
  totalMiniGames: number;             // Tổng số minigames (toàn hệ thống)
  monthlyRegistrations: number;       // Số đăng ký trong tháng hiện tại
  monthlyParticipations: number;     // Số tham gia trong tháng hiện tại
  averageParticipationRate: number;  // Tỷ lệ tham gia trung bình (0-1)
  topActivities: TopActivityItem[];   // Top 5 activities theo số đăng ký
  topStudents: TopStudentItem[];      // Top 5 students theo số tham gia
}

interface TopActivityItem {
  activityId: number;
  activityName: string;
  registrationCount: number;
  participationCount: number;
}

interface TopStudentItem {
  studentId: number;
  studentName: string;
  studentCode: string;
  participationCount: number;
}
```

### Example Request (React/TypeScript)

```typescript
import axios from 'axios';

const API_BASE_URL = 'https://campuslife-v2iu.onrender.com';

async function getDashboardOverview(token: string) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/statistics/dashboard`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      const dashboard: DashboardOverviewResponse = response.data.data;
      return dashboard;
    } else {
      throw new Error(response.data.message || 'Failed to get dashboard');
    }
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    throw error;
  }
}
```

### Example Usage

```typescript
// React Component
import { useState, useEffect } from 'react';

function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const data = await getDashboardOverview(token!);
        setDashboard(data);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (token) {
      fetchDashboard();
    }
  }, [token]);

  if (loading) return <div>Loading...</div>;
  if (!dashboard) return <div>No data available</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      <div>
        <h2>Thống Kê Tháng Này</h2>
        <p>Đăng ký: {dashboard.monthlyRegistrations}</p>
        <p>Tham gia: {dashboard.monthlyParticipations}</p>
        <p>Tỷ lệ tham gia: {(dashboard.averageParticipationRate * 100).toFixed(1)}%</p>
      </div>
      
      <div>
        <h2>Top Activities</h2>
        {dashboard.topActivities.map(activity => (
          <div key={activity.activityId}>
            <h3>{activity.activityName}</h3>
            <p>Đăng ký: {activity.registrationCount}</p>
            <p>Tham gia: {activity.participationCount}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 2. Thống Kê Điểm Số

### Endpoint
```
GET /api/statistics/scores
```

### Mô Tả
API này trả về thống kê điểm số. Student chỉ xem được thống kê của chính mình.

### Query Parameters
- `scoreType` (optional): Loại điểm - `REN_LUYEN`, `CONG_TAC_XA_HOI`, `CHUYEN_DE`, `KHAC`
- `semesterId` (optional): ID học kỳ (nếu không có sẽ dùng học kỳ hiện tại)
- `departmentId` (optional): ID khoa (chỉ Admin/Manager)
- `classId` (optional): ID lớp (chỉ Admin/Manager)

### Authentication
- **Required**: Yes (Bearer Token)
- **Roles**: `STUDENT`, `ADMIN`, `MANAGER`
- **Student Behavior**: Tự động filter theo studentId của user đang đăng nhập

### Response Format

```typescript
interface ScoreStatisticsResponse {
  statisticsByType: Map<ScoreType, ScoreTypeStatistics>;
  topStudents: TopStudentScoreItem[];
  averageByDepartment: Map<number, number>;  // departmentId -> average score
  averageByClass: Map<number, number>;        // classId -> average score
  averageBySemester: Map<number, number>;     // semesterId -> average score
  scoreDistribution: Map<string, number>;    // "0-10", "10-20", etc. -> count
}

interface ScoreTypeStatistics {
  scoreType: ScoreType;
  averageScore: number;
  maxScore: number;
  minScore: number;
  totalStudents: number;
}

interface TopStudentScoreItem {
  studentId: number;
  studentName: string;
  studentCode: string;
  scoreType: ScoreType;
  score: number;
  semesterId: number;
  semesterName: string;
}

enum ScoreType {
  REN_LUYEN = 'REN_LUYEN',
  CONG_TAC_XA_HOI = 'CONG_TAC_XA_HOI',
  CHUYEN_DE = 'CHUYEN_DE',
  KHAC = 'KHAC'
}
```

### Example Request

```typescript
async function getScoreStatistics(
  token: string,
  scoreType?: ScoreType,
  semesterId?: number
) {
  try {
    const params = new URLSearchParams();
    if (scoreType) params.append('scoreType', scoreType);
    if (semesterId) params.append('semesterId', semesterId.toString());

    const response = await axios.get(
      `${API_BASE_URL}/api/statistics/scores?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      return response.data.data as ScoreStatisticsResponse;
    } else {
      throw new Error(response.data.message || 'Failed to get score statistics');
    }
  } catch (error) {
    console.error('Error fetching score statistics:', error);
    throw error;
  }
}
```

---

## 3. Lịch Sử Điểm Chi Tiết

### Endpoint
```
GET /api/scores/history/student/{studentId}
```

### Mô Tả
API này trả về lịch sử điểm chi tiết của student, bao gồm:
- **ScoreHistory**: Lịch sử thay đổi điểm (tổng hợp)
- **ActivityParticipation**: Chi tiết từng lần tham gia activity/minigame

### Path Parameters
- `studentId` (required): ID của student

### Query Parameters
- `semesterId` (required): ID học kỳ
- `scoreType` (optional): Loại điểm - `REN_LUYEN`, `CONG_TAC_XA_HOI`, `CHUYEN_DE`, `KHAC`
- `page` (optional, default: 0): Số trang
- `size` (optional, default: 20): Số bản ghi mỗi trang

### Authentication
- **Required**: Yes (Bearer Token)
- **Roles**: `STUDENT`, `ADMIN`, `MANAGER`
- **Student Restriction**: Student chỉ xem được lịch sử của chính mình

### Response Format

```typescript
interface ScoreHistoryViewResponse {
  studentId: number;
  studentCode: string;
  studentName: string;
  semesterId: number;
  semesterName: string;
  scoreType: ScoreType | null;  // null nếu xem tất cả loại điểm
  currentScore: number;          // Điểm hiện tại
  scoreHistories: ScoreHistoryDetailResponse[];      // Lịch sử thay đổi điểm
  activityParticipations: ActivityParticipationDetailResponse[];  // Chi tiết tham gia
  totalRecords: number;
  page: number;
  size: number;
  totalPages: number;
}

interface ScoreHistoryDetailResponse {
  id: number;
  oldScore: number;
  newScore: number;
  changeDate: string;  // ISO 8601 format
  reason: string;      // Lý do thay đổi
  activityId: number | null;
  activityName: string | null;
  seriesId: number | null;
  seriesName: string | null;
  sourceType: 'ACTIVITY' | 'MINIGAME' | 'MILESTONE' | 'RECALCULATED';
  changedByUsername: string;
  changedByFullName: string;
}

interface ActivityParticipationDetailResponse {
  id: number;
  activityId: number;
  activityName: string;
  activityType: ActivityType;
  seriesId: number | null;
  seriesName: string | null;
  pointsEarned: number;
  participationType: ParticipationType;
  date: string;  // ISO 8601 format
  isCompleted: boolean;
  sourceType: 'ACTIVITY' | 'MINIGAME';
}

enum ActivityType {
  SUKIEN = 'SUKIEN',
  MINIGAME = 'MINIGAME',
  // ... other types
}

enum ParticipationType {
  CHECKED_IN = 'CHECKED_IN',
  COMPLETED = 'COMPLETED',
  // ... other types
}
```

### Example Request

```typescript
async function getScoreHistory(
  token: string,
  studentId: number,
  semesterId: number,
  scoreType?: ScoreType,
  page: number = 0,
  size: number = 20
) {
  try {
    const params = new URLSearchParams({
      semesterId: semesterId.toString(),
      page: page.toString(),
      size: size.toString()
    });
    if (scoreType) params.append('scoreType', scoreType);

    const response = await axios.get(
      `${API_BASE_URL}/api/scores/history/student/${studentId}?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      return response.data.data as ScoreHistoryViewResponse;
    } else {
      throw new Error(response.data.message || 'Failed to get score history');
    }
  } catch (error) {
    console.error('Error fetching score history:', error);
    throw error;
  }
}
```

### Example Usage

```typescript
function ScoreHistoryPage({ studentId, semesterId }: { studentId: number, semesterId: number }) {
  const [history, setHistory] = useState<ScoreHistoryViewResponse | null>(null);
  const [page, setPage] = useState(0);
  const [scoreType, setScoreType] = useState<ScoreType | undefined>();
  const token = localStorage.getItem('token');

  useEffect(() => {
    async function fetchHistory() {
      try {
        const data = await getScoreHistory(token!, studentId, semesterId, scoreType, page);
        setHistory(data);
      } catch (error) {
        console.error('Failed to load history:', error);
      }
    }
    
    if (token) {
      fetchHistory();
    }
  }, [token, studentId, semesterId, scoreType, page]);

  if (!history) return <div>Loading...</div>;

  return (
    <div>
      <h1>Lịch Sử Điểm - {history.studentName}</h1>
      <p>Học kỳ: {history.semesterName}</p>
      <p>Điểm hiện tại: {history.currentScore}</p>

      <div>
        <h2>Lịch Sử Thay Đổi Điểm</h2>
        {history.scoreHistories.map(item => (
          <div key={item.id}>
            <p>
              {item.oldScore} → {item.newScore} 
              ({item.sourceType}) - {item.reason}
            </p>
            <small>{new Date(item.changeDate).toLocaleString()}</small>
            {item.activityName && <p>Activity: {item.activityName}</p>}
            {item.seriesName && <p>Series: {item.seriesName}</p>}
          </div>
        ))}
      </div>

      <div>
        <h2>Chi Tiết Tham Gia</h2>
        {history.activityParticipations.map(participation => (
          <div key={participation.id}>
            <h3>{participation.activityName}</h3>
            <p>Loại: {participation.activityType}</p>
            <p>Điểm: {participation.pointsEarned}</p>
            <p>Trạng thái: {participation.isCompleted ? 'Hoàn thành' : 'Chưa hoàn thành'}</p>
            <small>{new Date(participation.date).toLocaleString()}</small>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div>
        <button 
          disabled={page === 0} 
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <span>Page {page + 1} of {history.totalPages}</span>
        <button 
          disabled={page >= history.totalPages - 1} 
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

---

## 4. Xem Điểm Theo Học Kỳ

### Endpoint
```
GET /api/scores/student/{studentId}/semester/{semesterId}
```

### Mô Tả
API này trả về điểm số của student theo từng loại điểm trong một học kỳ cụ thể.

### Path Parameters
- `studentId` (required): ID của student
- `semesterId` (required): ID học kỳ

### Authentication
- **Required**: Yes (Bearer Token)
- **Roles**: `STUDENT`, `ADMIN`, `MANAGER`
- **Student Restriction**: Student chỉ xem được điểm của chính mình

### Response Format

```typescript
interface ScoreViewResponse {
  studentId: number;
  semesterId: number;
  summaries: ScoreTypeSummary[];
}

interface ScoreTypeSummary {
  scoreType: ScoreType;
  total: number;
  items: ScoreItem[];
}

interface ScoreItem {
  score: number;
  notes: string;
}
```

### Example Request

```typescript
async function getStudentScores(
  token: string,
  studentId: number,
  semesterId: number
) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/scores/student/${studentId}/semester/${semesterId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      return response.data.data as ScoreViewResponse;
    } else {
      throw new Error(response.data.message || 'Failed to get scores');
    }
  } catch (error) {
    console.error('Error fetching scores:', error);
    throw error;
  }
}
```

---

## 5. Tổng Điểm Theo Học Kỳ

### Endpoint
```
GET /api/scores/student/{studentId}/semester/{semesterId}/total
```

### Mô Tả
API này trả về tổng điểm của student trong một học kỳ (tổng tất cả các loại điểm).

### Path Parameters
- `studentId` (required): ID của student
- `semesterId` (required): ID học kỳ

### Authentication
- **Required**: Yes (Bearer Token)
- **Roles**: `STUDENT`, `ADMIN`, `MANAGER`

### Response Format

```typescript
// Response.data sẽ là một số (BigDecimal) - tổng điểm
```

### Example Request

```typescript
async function getTotalScore(
  token: string,
  studentId: number,
  semesterId: number
) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/scores/student/${studentId}/semester/${semesterId}/total`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      return response.data.data as number;  // Tổng điểm
    } else {
      throw new Error(response.data.message || 'Failed to get total score');
    }
  } catch (error) {
    console.error('Error fetching total score:', error);
    throw error;
  }
}
```

---

## 6. Bảng Xếp Hạng

### Endpoint
```
GET /api/scores/ranking
```

### Mô Tả
API này trả về bảng xếp hạng điểm của students. Student có thể xem bảng xếp hạng để biết vị trí của mình.

### Query Parameters
- `semesterId` (required): ID học kỳ
- `scoreType` (optional): Loại điểm - `REN_LUYEN`, `CONG_TAC_XA_HOI`, `CHUYEN_DE`, `KHAC`
- `departmentId` (optional): ID khoa (filter theo khoa)
- `classId` (optional): ID lớp (filter theo lớp)
- `sortOrder` (optional, default: "DESC"): Thứ tự sắp xếp - `ASC` (thấp → cao) hoặc `DESC` (cao → thấp)

### Authentication
- **Required**: Yes (Bearer Token)
- **Roles**: `STUDENT`, `ADMIN`, `MANAGER`

### Response Format

```typescript
interface RankingResponse {
  semesterId: number;
  semesterName: string;
  scoreType: ScoreType | null;
  rankings: RankingItem[];
}

interface RankingItem {
  rank: number;
  studentId: number;
  studentName: string;
  studentCode: string;
  score: number;
  scoreType: ScoreType;
}
```

### Example Request

```typescript
async function getRanking(
  token: string,
  semesterId: number,
  scoreType?: ScoreType,
  departmentId?: number,
  classId?: number,
  sortOrder: 'ASC' | 'DESC' = 'DESC'
) {
  try {
    const params = new URLSearchParams({
      semesterId: semesterId.toString(),
      sortOrder: sortOrder
    });
    if (scoreType) params.append('scoreType', scoreType);
    if (departmentId) params.append('departmentId', departmentId.toString());
    if (classId) params.append('classId', classId.toString());

    const response = await axios.get(
      `${API_BASE_URL}/api/scores/ranking?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      return response.data.data as RankingResponse;
    } else {
      throw new Error(response.data.message || 'Failed to get ranking');
    }
  } catch (error) {
    console.error('Error fetching ranking:', error);
    throw error;
  }
}
```

### Example Usage

```typescript
function RankingPage({ semesterId }: { semesterId: number }) {
  const [ranking, setRanking] = useState<RankingResponse | null>(null);
  const [scoreType, setScoreType] = useState<ScoreType | undefined>();
  const token = localStorage.getItem('token');
  const currentStudentId = parseInt(localStorage.getItem('studentId') || '0');

  useEffect(() => {
    async function fetchRanking() {
      try {
        const data = await getRanking(token!, semesterId, scoreType);
        setRanking(data);
      } catch (error) {
        console.error('Failed to load ranking:', error);
      }
    }
    
    if (token) {
      fetchRanking();
    }
  }, [token, semesterId, scoreType]);

  if (!ranking) return <div>Loading...</div>;

  const currentStudentRank = ranking.rankings.findIndex(
    r => r.studentId === currentStudentId
  ) + 1;

  return (
    <div>
      <h1>Bảng Xếp Hạng</h1>
      <p>Học kỳ: {ranking.semesterName}</p>
      {currentStudentRank > 0 && (
        <div style={{ backgroundColor: '#e3f2fd', padding: '10px', margin: '10px 0' }}>
          <strong>Vị trí của bạn: #{currentStudentRank}</strong>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>Hạng</th>
            <th>Mã SV</th>
            <th>Họ Tên</th>
            <th>Điểm</th>
          </tr>
        </thead>
        <tbody>
          {ranking.rankings.map((item, index) => (
            <tr 
              key={item.studentId}
              style={item.studentId === currentStudentId ? { backgroundColor: '#fff9c4' } : {}}
            >
              <td>{item.rank}</td>
              <td>{item.studentCode}</td>
              <td>{item.studentName}</td>
              <td>{item.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 7. Thống Kê Series (Student View)

### Endpoint
```
GET /api/statistics/series
```

### Mô Tả
API này trả về thống kê về các activity series. Student có thể xem thống kê về series mà họ đã đăng ký.

### Query Parameters
- `seriesId` (optional): ID series cụ thể
- `semesterId` (optional): ID học kỳ

### Authentication
- **Required**: Yes (Bearer Token)
- **Roles**: `STUDENT`, `ADMIN`, `MANAGER`

### Response Format

```typescript
interface SeriesStatisticsResponse {
  totalSeries: number;
  seriesDetails: SeriesDetailItem[];
  studentsPerSeries: Map<number, number>;  // seriesId -> student count
  milestonePointsAwarded: Map<number, number>;  // seriesId -> points
  popularSeries: PopularSeriesItem[];
}

interface SeriesDetailItem {
  seriesId: number;
  seriesName: string;
  totalActivities: number;
  registeredStudents: number;
  completedStudents: number;
  completionRate: number;  // 0-1
}

interface PopularSeriesItem {
  seriesId: number;
  seriesName: string;
  studentCount: number;
  totalActivities: number;
}
```

---

## 8. Thống Kê MiniGame (Student View)

### Endpoint
```
GET /api/statistics/minigames
```

### Mô Tả
API này trả về thống kê về các minigame. Student có thể xem thống kê về minigame mà họ đã tham gia.

### Query Parameters
- `miniGameId` (optional): ID minigame cụ thể
- `startDate` (optional): Ngày bắt đầu (ISO 8601 format: `2024-01-01T00:00:00`)
- `endDate` (optional): Ngày kết thúc (ISO 8601 format: `2024-12-31T23:59:59`)

### Authentication
- **Required**: Yes (Bearer Token)
- **Roles**: `STUDENT`, `ADMIN`, `MANAGER`

### Response Format

```typescript
interface MiniGameStatisticsResponse {
  totalMiniGames: number;
  totalAttempts: number;
  passedAttempts: number;
  failedAttempts: number;
  passRate: number;  // 0-1
  miniGameDetails: Map<number, MiniGameDetailItem>;
  averageScoreByMiniGame: Map<number, number>;
  averageCorrectAnswersByMiniGame: Map<number, number>;
  popularMiniGames: PopularMiniGameItem[];
}

interface MiniGameDetailItem {
  miniGameId: number;
  title: string;
  totalAttempts: number;
  passedAttempts: number;
  failedAttempts: number;
  passRate: number;
  averageScore: number;
}

interface PopularMiniGameItem {
  miniGameId: number;
  title: string;
  attemptCount: number;
  uniqueStudentCount: number;
}
```

---

## Best Practices

### 1. Error Handling

Luôn xử lý lỗi một cách graceful:

```typescript
try {
  const data = await getDashboardOverview(token);
  // Handle success
} catch (error: any) {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const message = error.response.data?.message || 'Unknown error';
    
    if (status === 401) {
      // Unauthorized - redirect to login
      window.location.href = '/login';
    } else if (status === 403) {
      // Forbidden - show access denied message
      alert('Bạn không có quyền truy cập tính năng này');
    } else {
      // Other errors
      alert(`Lỗi: ${message}`);
    }
  } else {
    // Network error or other
    console.error('Network error:', error);
    alert('Không thể kết nối đến server. Vui lòng thử lại sau.');
  }
}
```

### 2. Loading States

Luôn hiển thị loading state khi fetch data:

```typescript
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [data, setData] = useState<DashboardOverviewResponse | null>(null);

useEffect(() => {
  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const result = await getDashboardOverview(token);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }
  
  fetchData();
}, [token]);

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage message={error} />;
if (!data) return <EmptyState />;
```

### 3. Caching và Refresh

Sử dụng React Query hoặc SWR để cache và tự động refresh:

```typescript
import { useQuery } from 'react-query';

function DashboardPage() {
  const token = localStorage.getItem('token');
  
  const { data, isLoading, error, refetch } = useQuery(
    'dashboard',
    () => getDashboardOverview(token!),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: true,
      retry: 2
    }
  );

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage />;
  if (!data) return <EmptyState />;

  return (
    <div>
      <button onClick={() => refetch()}>Refresh</button>
      {/* Render dashboard */}
    </div>
  );
}
```

### 4. Date Formatting

Format dates một cách nhất quán:

```typescript
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Usage
{formatDate(history.changeDate)}  // "24 tháng 12, 2024, 10:30"
```

### 5. Pagination

Implement pagination một cách user-friendly:

```typescript
function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  return (
    <div className="pagination">
      <button 
        disabled={currentPage === 0} 
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </button>
      
      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page - 1)}
          className={currentPage === page - 1 ? 'active' : ''}
        >
          {page}
        </button>
      ))}
      
      <button 
        disabled={currentPage >= totalPages - 1} 
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </button>
    </div>
  );
}
```

---

## Common Response Format

Tất cả API responses đều follow format này:

```typescript
interface Response<T> {
  success: boolean;
  message: string;
  data: T | null;
}
```

### Success Response Example
```json
{
  "success": true,
  "message": "Dashboard overview retrieved successfully",
  "data": {
    "totalActivities": 150,
    "totalStudents": 5000,
    ...
  }
}
```

### Error Response Example
```json
{
  "success": false,
  "message": "Student not found",
  "data": null
}
```

---

## Notes

1. **Student Access Control**: Student chỉ có thể xem thống kê của chính mình. Backend tự động filter dựa trên `studentId` từ JWT token.

2. **Date Formats**: Tất cả dates trong API responses đều ở format ISO 8601 (`YYYY-MM-DDTHH:mm:ss`).

3. **Score Types**: Có 4 loại điểm:
   - `REN_LUYEN`: Điểm rèn luyện
   - `CONG_TAC_XA_HOI`: Điểm công tác xã hội
   - `CHUYEN_DE`: Điểm chuyên đề
   - `KHAC`: Điểm khác

4. **Pagination**: Mặc định `page=0`, `size=20`. Có thể điều chỉnh tùy theo nhu cầu.

5. **CORS**: Backend đã cấu hình CORS cho frontend URL. Đảm bảo frontend URL match với cấu hình trong backend.

---

## Support

Nếu có vấn đề hoặc câu hỏi, vui lòng liên hệ backend team hoặc tạo issue trong repository.

