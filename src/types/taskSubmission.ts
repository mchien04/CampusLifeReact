import { ActivityTask } from './task';
import { Student } from './student';
import { User } from './auth';

export interface TaskSubmission {
    id: number;
    task: ActivityTask;
    student: Student;
    content?: string;
    fileUrls?: string;
    score?: number;
    feedback?: string;
    grader?: User;
    status: 'PENDING' | 'SUBMITTED' | 'GRADED' | 'REJECTED' | 'RESUBMITTED';
    submittedAt: string;
    updatedAt: string;
    gradedAt?: string;
}

export interface CreateTaskSubmissionRequest {
    taskId: number;
    content?: string;
    fileUrls?: string;
}

export interface UpdateTaskSubmissionRequest {
    content?: string;
    fileUrls?: string;
}

export interface GradeTaskSubmissionRequest {
    score: number;
    feedback?: string;
}

export const getSubmissionStatusLabel = (status: string): string => {
    switch (status) {
        case 'PENDING':
            return 'Chờ nộp bài';
        case 'SUBMITTED':
            return 'Đã nộp bài';
        case 'GRADED':
            return 'Đã chấm điểm';
        case 'REJECTED':
            return 'Từ chối';
        case 'RESUBMITTED':
            return 'Nộp lại';
        default:
            return status;
    }
};

export const getSubmissionStatusColor = (status: string): string => {
    switch (status) {
        case 'PENDING':
            return 'bg-yellow-100 text-yellow-800';
        case 'SUBMITTED':
            return 'bg-blue-100 text-blue-800';
        case 'GRADED':
            return 'bg-green-100 text-green-800';
        case 'REJECTED':
            return 'bg-red-100 text-red-800';
        case 'RESUBMITTED':
            return 'bg-purple-100 text-purple-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};
