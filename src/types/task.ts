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
    taskId: number;
    taskName: string;
    studentId: number;
    studentName: string;
    studentCode: string;
    status: TaskStatus;
    updatedAt: string;
    createdAt: string;
}

export enum TaskStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

export interface Student {
    id: number;
    fullName: string;
    studentCode: string;
    email: string;
    departmentId: number;
    departmentName?: string;
}
