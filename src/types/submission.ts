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
    // Task
    taskId: number;
    taskTitle: string;
    // Student
    studentId: number;
    studentCode: string;
    studentName: string;
    // Content & files
    content: string | null;
    fileUrls: string[];
    // Grading
    score: number | null;
    feedback: string | null;
    graderId: number | null;
    graderUsername: string | null;
    // Status & timestamps
    status: SubmissionStatus;
    submittedAt: string; // ISO string from LocalDateTime
    updatedAt: string; // ISO string from LocalDateTime
    gradedAt: string | null; // ISO string from LocalDateTime
}

export interface CreateSubmissionRequest {
    content?: string;
    files?: File[];
}

export interface UpdateSubmissionRequest {
    content?: string;
    files?: File[];
}
