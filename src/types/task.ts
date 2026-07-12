import { ActivityResponse } from './activity';
import { Student } from './student';
import { User } from './auth';

// New ActivityTask interface matching backend
export interface ActivityTask {
    id: number;
    activity: ActivityResponse;
    title: string;
    description?: string;
    requiresSubmission: boolean;    dueDate?: string;
    status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    createdAt: string;
    updatedAt: string;
}

// New TaskAssignment interface matching backend
export interface TaskAssignment {
    id: number;
    task: ActivityTask;
    student: Student;
    assignedBy: User;
    assignedAt: string;
    dueDate?: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
    score?: number;
    feedback?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTaskRequest {
    activityId: number;
    title: string;
    description?: string;
    requiresSubmission: boolean;    dueDate?: string;
}

export interface UpdateTaskRequest {
    title: string;
    description?: string;
    requiresSubmission: boolean;    dueDate?: string;
}

export interface AssignTaskRequest {
    taskId: number;
    studentIds: number[];
    dueDate?: string;
    note?: string;
}

export interface UpdateAssignmentStatusRequest {
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
    feedback?: string;
}

export interface TaskFilters {
    activityId?: number;
    status?: string;
    search?: string;
    page?: number;
    size?: number;
}

export interface TaskListResponse {
    content: ActivityTask[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}

export interface AssignmentListResponse {
    content: TaskAssignment[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}

// New interfaces for updated backend
export interface CreateActivityTaskRequest {
    name: string;
    description?: string;
    deadline?: string;
    activityId: number;
}

export interface ActivityTaskResponse {
    id: number;
    name: string;
    description?: string;
    deadline?: string;
    activityId: number;
    activityName: string;
    createdAt: string;
    assignments: TaskAssignmentResponse[];
    totalAssignments: number;
    completedAssignments: number;
    pendingAssignments: number;
}

export interface TaskAssignmentRequest {
    taskId: number;
    studentIds: number[];
    status?: TaskStatus;
}

export interface TaskAssignmentResponse {
    id: number;
    taskName: string;
    taskId: number;
    activityId?: number; // ID của sự kiện chứa nhiệm vụ này
    activityName?: string; // Tên sự kiện
    studentId: number;
    studentCode: string;
    studentName: string;
    status: TaskStatus;
    assignedAt: string;
    updatedAt: string;
    createdAt?: string;
    requiresSubmission?: boolean; // Add this field
    submissionDeadline?: string; // LocalDateTime
}

export const ASSIGNMENT_STATUS = {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    OVERDUE: 'OVERDUE',
} as const;

export enum TaskStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    OVERDUE = 'OVERDUE'
}

export const getTaskStatusLabel = (status: string): string => {
    switch (status) {
        case 'PENDING':
            return 'Chờ xử lý';
        case 'ACTIVE':
            return 'Đang hoạt động';
        case 'COMPLETED':
            return 'Hoàn thành';
        case 'CANCELLED':
            return 'Đã hủy';
        case 'OVERDUE':
            return 'Quá hạn';
        default:
            return status;
    }
};

export const getAssignmentStatusLabel = (status: string): string => {
    switch (status) {
        case 'PENDING':
            return 'Chờ thực hiện';
        case 'IN_PROGRESS':
            return 'Đang thực hiện';
        case 'COMPLETED':
            return 'Đã hoàn thành';
        case 'OVERDUE':
            return 'Quá hạn';
        default:
            return status;
    }
};

export const getTaskStatusColor = (status: string): string => {
    switch (status) {
        case 'PENDING':
            return 'bg-yellow-100 text-yellow-800';
        case 'ACTIVE':
            return 'bg-blue-100 text-blue-800';
        case 'COMPLETED':
            return 'bg-green-100 text-green-800';
        case 'CANCELLED':
            return 'bg-red-100 text-red-800';
        case 'OVERDUE':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export const getAssignmentStatusColor = (status: string): string => {
    switch (status) {
        case 'PENDING':
            return 'bg-yellow-100 text-yellow-800';
        case 'IN_PROGRESS':
            return 'bg-blue-100 text-blue-800';
        case 'COMPLETED':
            return 'bg-green-100 text-green-800';
        case 'OVERDUE':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

// Interface for registered students in activity
export interface RegisteredStudent {
    id: number;
    studentCode: string;
    fullName: string;
    email: string;
    phone?: string;
    departmentName?: string;
    className?: string;
    registrationStatus: string;
    registeredDate: string;
}

/** Dashboard submission row from GET /api/tasks/activity/{id}/dashboard */
export type TaskSubmissionDashboardStatus =
    | 'SUBMITTED'
    | 'GRADED'
    | 'RETURNED'
    | 'LATE'
    | 'MISSING';

export interface TaskSubmissionSummary {
    id: number;
    studentId: number;
    studentName: string;
    studentCode: string;
    content: string | null;
    /** Full public URL (local/server) — do not prepend VITE_API_URL */
    fileUrls: string[] | null;
    isCompleted: boolean | null;
    feedback: string | null;
    status: TaskSubmissionDashboardStatus;
    submittedAt: string | null;
    gradedAt: string | null;
}

export interface TaskDashboardItem {
    id: number;
    name: string;
    description: string | null;
    deadline: string | null;
    activityId: number;
    activityName: string;
    createdAt: string;
    submissionCount: number;
    gradedCount: number;
    pendingGradeCount: number;
    submissions: TaskSubmissionSummary[];
}

export function isSubmissionGraded(s: TaskSubmissionSummary): boolean {
    return s.status === 'GRADED' || s.isCompleted != null;
}

export function getGradeLabel(s: TaskSubmissionSummary): string {
    if (!isSubmissionGraded(s)) return 'Chờ chấm';
    return s.isCompleted ? 'Đạt' : 'Không đạt';
}

export function getGradeBadgeClass(s: TaskSubmissionSummary): string {
    if (!isSubmissionGraded(s)) return 'bg-amber-50 text-amber-800 ring-1 ring-amber-200/80';
    return s.isCompleted
        ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80'
        : 'bg-red-50 text-red-800 ring-1 ring-red-200/80';
}
