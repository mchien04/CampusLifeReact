<!-- 0cd263ea-78e3-491c-ade9-e4d0aa644c39 7df691f4-9221-4004-b330-62c23a471427 -->
# Frontend Updates for Backend Check-in Refactor

## 1. Update TypeScript Types

### Update `src/types/registration.ts`

Update enums and interfaces to match backend DTOs exactly:

**ParticipationType enum:**

```typescript
export enum ParticipationType {
    REGISTERED = 'REGISTERED',
    CHECKED_IN = 'CHECKED_IN',
    CHECKED_OUT = 'CHECKED_OUT',  // NEW
    ATTENDED = 'ATTENDED',
    COMPLETED = 'COMPLETED'  // NEW
}
```

**RegistrationStatus enum:**

```typescript
export enum RegistrationStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED',
    ATTENDED = 'ATTENDED'  // NEW
}
```

**ActivityParticipationRequest interface** (match backend exactly):

```typescript
export interface ActivityParticipationRequest {
    ticketCode?: string;
    studentId?: number;
    participationType: ParticipationType;  // Required in backend
    pointsEarned?: number;
    notes?: string;
}
```

**ActivityRegistrationResponse interface** - add missing field:

```typescript
ticketCode?: string;  // Add this field
```

**Update label functions:**

- `getParticipationTypeLabel()`: Add cases for `CHECKED_OUT` ("Đã check-out") and `COMPLETED` ("Đã hoàn thành")
- `getRegistrationStatusLabel()`: Add case for `ATTENDED` ("Đã tham dự")

### Update `src/types/activity.ts`

Verify types match backend DTOs (already correct based on code review):

- `CreateActivityRequest.penaltyPointsIncomplete`: string (BigDecimal)
- `CreateActivityRequest.isImportant`: boolean
- `CreateActivityRequest.mandatoryForFacultyStudents`: boolean
- `ActivityResponse`: same fields exist

## 2. Update Check-in Flow in ManagerRegistrations

### Modify `src/pages/ManagerRegistrations.tsx`

**Remove debug code:**

- Delete import: `import { testGradeAPI } from '../utils/testGradeAPI';`
- Remove test button section in JSX

**Update `handleCheckIn()` function:**

```typescript
const handleCheckIn = async () => {
    try {
        if (!ticketCode && !studentId) {
            alert("Vui lòng nhập ticketCode hoặc studentId");
            return;
        }
        // Backend determines next state, but we still need to send participationType
        const payload: any = { 
            participationType: "CHECKED_IN"  // Keep this, backend uses it
        };
        if (ticketCode) payload.ticketCode = ticketCode;
        if (studentId) payload.studentId = Number(studentId);

        const response = await registrationAPI.checkIn(payload);
        if (response.status) {
            // Check response participationType to show appropriate message
            const data = response.data;
            if (data?.participationType === 'CHECKED_IN') {
                alert("✅ Check-in thành công. Vui lòng check-out khi sinh viên rời khỏi sự kiện.");
            } else if (data?.participationType === 'ATTENDED') {
                alert("✅ Check-out thành công. Đã hoàn thành tham gia sự kiện.");
            } else {
                alert("✅ " + (response.message || "Thành công"));
            }
            if (selectedEventId) await loadRegistrations(selectedEventId);
            setTicketCode("");
            setStudentId("");
        } else {
            alert(response.message || "Thao tác thất bại");
        }
    } catch (error) {
        console.error("Error check-in:", error);
        alert("Có lỗi xảy ra");
    }
};
```

**Update `handleScan()` function similarly:**

- Same logic as `handleCheckIn()`
- Keep `participationType: "CHECKED_IN"` in payload
- Update alert messages based on response `participationType`

## 3. Update Activity Form

### Modify `src/components/events/EventForm.tsx`

Add three new form fields after existing fields:

**1. Sự kiện quan trọng checkbox:**

```tsx
<div className="mb-4">
    <label className="flex items-center">
        <input
            type="checkbox"
            checked={formData.isImportant}
            onChange={(e) => setFormData({...formData, isImportant: e.target.checked})}
            className="mr-2"
        />
        <span className="text-sm font-medium text-gray-700">
            Sự kiện quan trọng (tự động đăng ký tất cả sinh viên)
        </span>
    </label>
    <p className="text-xs text-gray-500 mt-1">
        Tất cả sinh viên sẽ được đăng ký tự động với trạng thái đã duyệt
    </p>
</div>
```

**2. Bắt buộc cho sinh viên khoa checkbox:**

```tsx
<div className="mb-4">
    <label className="flex items-center">
        <input
            type="checkbox"
            checked={formData.mandatoryForFacultyStudents}
            onChange={(e) => setFormData({...formData, mandatoryForFacultyStudents: e.target.checked})}
            className="mr-2"
        />
        <span className="text-sm font-medium text-gray-700">
            Bắt buộc cho sinh viên thuộc khoa tổ chức
        </span>
    </label>
    <p className="text-xs text-gray-500 mt-1">
        Sinh viên thuộc các khoa tổ chức sẽ được đăng ký tự động
    </p>
</div>
```

**3. Điểm trừ khi không hoàn thành input:**

```tsx
<div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">
        Điểm trừ khi không hoàn thành
    </label>
    <input
        type="number"
        step="0.5"
        min="0"
        value={formData.penaltyPointsIncomplete || ''}
        onChange={(e) => setFormData({...formData, penaltyPointsIncomplete: e.target.value})}
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
        placeholder="Nhập điểm trừ (nếu có)"
    />
    <p className="text-xs text-gray-500 mt-1">
        Điểm sẽ bị trừ nếu sinh viên tham gia nhưng không hoàn thành yêu cầu
    </p>
</div>
```

## 4. Update Submission Grading for Completion

### Modify `src/components/task/SubmissionDetailsModal.tsx`

Update grading interface to support "Đạt/Không đạt" radio buttons while keeping numeric input:

**Add state for grading mode:**

```typescript
const [gradingMode, setGradingMode] = useState<'quick' | 'manual'>('quick');
const [isCompleted, setIsCompleted] = useState<boolean>(true);
```

**Update grading UI section:**

```tsx
<div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">
        Chế độ chấm điểm
    </label>
    <div className="flex gap-4 mb-4">
        <label className="flex items-center">
            <input
                type="radio"
                checked={gradingMode === 'quick'}
                onChange={() => setGradingMode('quick')}
                className="mr-2"
            />
            <span>Chấm nhanh (Đạt/Không đạt)</span>
        </label>
        <label className="flex items-center">
            <input
                type="radio"
                checked={gradingMode === 'manual'}
                onChange={() => setGradingMode('manual')}
                className="mr-2"
            />
            <span>Chấm thủ công (Nhập điểm)</span>
        </label>
    </div>

    {gradingMode === 'quick' ? (
        <div>
            <div className="flex gap-4 mb-2">
                <label className="flex items-center">
                    <input
                        type="radio"
                        checked={isCompleted}
                        onChange={() => {
                            setIsCompleted(true);
                            setCurrentScore(task.maxPoints || 10);
                        }}
                        className="mr-2"
                    />
                    <span className="text-green-600 font-medium">
                        ✓ Đạt (+{task.maxPoints || 10} điểm)
                    </span>
                </label>
                <label className="flex items-center">
                    <input
                        type="radio"
                        checked={!isCompleted}
                        onChange={() => {
                            setIsCompleted(false);
                            // Get penalty from activity if available, otherwise 0
                            const penalty = task.activity?.penaltyPointsIncomplete || 0;
                            setCurrentScore(-Math.abs(penalty));
                        }}
                        className="mr-2"
                    />
                    <span className="text-red-600 font-medium">
                        ✗ Không đạt (-{Math.abs(task.activity?.penaltyPointsIncomplete || 0)} điểm)
                    </span>
                </label>
            </div>
            <p className="text-sm text-gray-500">
                Điểm sẽ được gán tự động: {isCompleted ? `+${task.maxPoints || 10}` : `-${Math.abs(task.activity?.penaltyPointsIncomplete || 0)}`} điểm
            </p>
        </div>
    ) : (
        // Existing manual input
        <input
            type="number"
            value={currentScore}
            onChange={(e) => setCurrentScore(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Nhập điểm"
        />
    )}
</div>
```

Note: `task.activity` may need to be added to `ActivityTask` type or fetched separately to access `penaltyPointsIncomplete`.

## 5. Update Registration Display Components

### Modify `src/components/registration/RegistrationList.tsx`

Update to display new statuses and participation info:

**Update status badge section:**

```tsx
const getStatusBadge = (status: RegistrationStatus) => {
    const statusConfig = {
        PENDING: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-800' },
        APPROVED: { label: 'Đã duyệt', color: 'bg-green-100 text-green-800' },
        REJECTED: { label: 'Từ chối', color: 'bg-red-100 text-red-800' },
        CANCELLED: { label: 'Đã hủy', color: 'bg-gray-100 text-gray-800' },
        ATTENDED: { label: 'Đã tham dự', color: 'bg-blue-100 text-blue-800' }  // NEW
    };
    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
            {config.label}
        </span>
    );
};
```

**Add participation type badge (if available from API):**

```tsx
{registration.participationType && (
    <span className="text-xs text-gray-600">
        {getParticipationTypeLabel(registration.participationType)}
    </span>
)}
```

## 6. Update API Service

### Verify `src/services/registrationAPI.ts`

Ensure `checkIn()` method matches backend expectations:

```typescript
checkIn: async (request: ActivityParticipationRequest): Promise<Response<ActivityParticipationResponse>> => {
    const response = await api.post('/api/registrations/checkin', request);
    return {
        status: response.data.status,
        message: response.data.message,
        data: response.data.body || response.data.data
    };
}
```

Request should include:

- `ticketCode` OR `studentId`
- `participationType` (always "CHECKED_IN" per backend logic)
- Optional: `notes`

## 7. Update Student Event Detail Page

### Modify `src/pages/StudentEventDetail.tsx`

**Remove manual participation form** (lines with `showParticipationForm`, `handleRecordParticipation`):

- Remove state: `showParticipationForm`, `participationType`, `pointsEarned`, `notes`
- Remove `handleRecordParticipation` function
- Remove "Ghi nhận tham gia" button and form UI

**Add participation status display** if registered:

```tsx
{registrationStatus && (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-blue-900 mb-2">Trạng thái tham gia</h3>
        <p className="text-sm text-blue-800">
            {getRegistrationStatusLabel(registrationStatus)}
        </p>
        {/* Show message about check-in if approved */}
        {registrationStatus === RegistrationStatus.APPROVED && (
            <p className="text-xs text-blue-600 mt-2">
                💡 Vui lòng đến địa điểm sự kiện và check-in với ban tổ chức
            </p>
        )}
    </div>
)}
```

**Update task submission access check:**

```tsx
{/* Only show tasks if student has ATTENDED status */}
{registrationStatus === RegistrationStatus.ATTENDED && tasks.length > 0 && (
    <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Nhiệm vụ cần nộp bài</h3>
        {/* existing task list */}
    </div>
)}

{registrationStatus === RegistrationStatus.APPROVED && event.requiresSubmission && (
    <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
        <p className="text-sm text-yellow-800">
            ⚠️ Bạn cần hoàn thành check-in và check-out tại sự kiện trước khi nộp bài
        </p>
    </div>
)}
```

## 8. Clean Up Debug Code

**Delete file:**

- `src/utils/testGradeAPI.ts`

**Remove from `src/services/api.ts`:**

```typescript
// Remove debug logs in request interceptor
if (config.url?.includes('/grade')) { ... }

// Remove debug logs in response interceptor  
if (error.config?.url?.includes('/grade')) { ... }
```

**Remove from `src/services/submissionAPI.ts`:**

```typescript
// Remove all console.log statements in gradeSubmission method
console.log('=== GRADE SUBMISSION DEBUG ===');
// ... etc
```

## Files to Modify

1. `src/types/registration.ts` - Update enums and interfaces
2. `src/types/activity.ts` - Verify types (no changes needed)
3. `src/pages/ManagerRegistrations.tsx` - Update check-in flow, remove debug
4. `src/components/events/EventForm.tsx` - Add 3 new fields
5. `src/components/task/SubmissionDetailsModal.tsx` - Add quick grading mode
6. `src/components/registration/RegistrationList.tsx` - Display new statuses
7. `src/services/registrationAPI.ts` - Verify (likely no changes)
8. `src/pages/StudentEventDetail.tsx` - Remove manual check-in, add status display
9. `src/services/api.ts` - Remove debug logs
10. `src/services/submissionAPI.ts` - Remove debug logs
11. `src/utils/testGradeAPI.ts` - DELETE file