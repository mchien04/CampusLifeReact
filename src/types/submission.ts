export enum SubmissionStatus {
    SUBMITTED = 'SUBMITTED',
    GRADED = 'GRADED',
    RETURNED = 'RETURNED',
    LATE = 'LATE',
    MISSING = 'MISSING',
}

export interface SubmissionRequirementResponse {
    activityId: number;
    activityName: string;
    requiresSubmission: boolean;
    isImportant: boolean;
    mandatoryForFacultyStudents: boolean;
    maxPoints?: number;
    scoreType?: string;
}

export interface TaskSubmissionResponse {
    id: number;
    taskId: number;
    studentId: number;
    studentName?: string; // Add student name for display
    studentCode?: string; // Add student code for display
    content?: string;
    fileUrls?: string[] | string; // Backend can return array of URLs or comma-separated string
    score?: number;
    feedback?: string;
    graderId?: number;
    status: SubmissionStatus;
    submittedAt: string;
    updatedAt: string;
    gradedAt?: string;
}

export interface CreateSubmissionRequest {
    content?: string;
    files?: File[];
}

export interface UpdateSubmissionRequest {
    content?: string;
    files?: File[];
}
