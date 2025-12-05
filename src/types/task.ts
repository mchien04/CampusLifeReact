import { ActivityResponse, Activity } from './activity';
import { Student } from './student';
import { User } from './auth';

// New ActivityTask interface matching backend
export interface ActivityTask {
    id: number;
    activity: Activity;
    title: string;
    description?: string;
    requiresSubmission: boolean;
    maxPoints?: number;
    dueDate?: string;
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
    requiresSubmission: boolean;
    maxPoints?: number;
    dueDate?: string;
}

export interface UpdateTaskRequest {
    title: string;
    description?: string;
    requiresSubmission: boolean;
    maxPoints?: number;
    dueDate?: string;
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
    CANCELLED = 'CANCELLED'
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
