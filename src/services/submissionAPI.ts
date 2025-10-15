import api from './api';
import { Response } from '../types/auth';
import {
    SubmissionRequirementResponse,
    TaskSubmissionResponse,
    CreateSubmissionRequest,
    UpdateSubmissionRequest,
} from '../types/submission';

const normalize = <T>(raw: any): Response<T> => {
    // Handles backend Response{status,message,body} and also raw payloads
    if (raw && typeof raw === 'object' && 'status' in raw && 'message' in raw) {
        return {
            status: Boolean((raw as any).status),
            message: (raw as any).message,
            data: (raw as any).body ?? (raw as any).data,
        } as Response<T>;
    }
    // If raw is array or object without status/message, assume success
    return {
        status: true,
        message: 'OK',
        data: raw as T,
    } as Response<T>;
};

export const submissionAPI = {
    // Deprecated: backend may require auth; derive from ActivityResponse instead
    // checkSubmissionRequirement removed to avoid 403s

    // Submit a task
    submitTask: async (taskId: number, data: CreateSubmissionRequest): Promise<Response<TaskSubmissionResponse>> => {
        const formData = new FormData();
        if (data.content) {
            formData.append('content', data.content);
        }
        if (data.files) {
            data.files.forEach(file => {
                formData.append('files', file);
            });
        }
        const response = await api.post(`/api/submissions/task/${taskId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return normalize<TaskSubmissionResponse>(response.data);
    },

    // Update an existing submission
    updateSubmission: async (submissionId: number, data: UpdateSubmissionRequest): Promise<Response<TaskSubmissionResponse>> => {
        const formData = new FormData();
        if (data.content) {
            formData.append('content', data.content);
        }
        if (data.files) {
            data.files.forEach(file => {
                formData.append('files', file);
            });
        }
        const response = await api.put(`/api/submissions/${submissionId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return normalize<TaskSubmissionResponse>(response.data);
    },

    // Get student's submission for a specific task
    getMySubmissionForTask: async (taskId: number): Promise<Response<TaskSubmissionResponse>> => {
        const response = await api.get(`/api/submissions/task/${taskId}/my`);
        return normalize<TaskSubmissionResponse>(response.data);
    },

    // Get submission details by ID
    getSubmissionDetails: async (submissionId: number): Promise<Response<TaskSubmissionResponse>> => {
        const response = await api.get(`/api/submissions/${submissionId}`);
        return normalize<TaskSubmissionResponse>(response.data);
    },

    // Delete a submission
    deleteSubmission: async (submissionId: number): Promise<Response<any>> => {
        const response = await api.delete(`/api/submissions/${submissionId}`);
        return normalize<any>(response.data);
    },

    // Get submission files
    getSubmissionFiles: async (submissionId: number): Promise<Response<string[]>> => {
        const response = await api.get(`/api/submissions/${submissionId}/files`);
        return normalize<string[]>(response.data);
    },

    // Get all submissions for a task (Admin/Manager)
    getTaskSubmissions: async (taskId: number): Promise<Response<TaskSubmissionResponse[]>> => {
        const response = await api.get(`/api/submissions/task/${taskId}`);
        return normalize<TaskSubmissionResponse[]>(response.data);
    },

    // Grade a submission
    gradeSubmission: async (submissionId: number, score: number, feedback?: string): Promise<Response<TaskSubmissionResponse>> => {
        const params = new URLSearchParams();
        params.append('score', score.toString());
        if (feedback) {
            params.append('feedback', feedback);
        }

        console.log('=== GRADE SUBMISSION DEBUG ===');
        console.log('Request URL:', `/api/submissions/${submissionId}/grade?${params.toString()}`);
        console.log('Request params:', { submissionId, score, feedback });

        try {
            const response = await api.put(`/api/submissions/${submissionId}/grade?${params.toString()}`);
            console.log('Response status:', response.status);
            console.log('Response data:', response.data);
            console.log('=== SUCCESS ===');
            return normalize<TaskSubmissionResponse>(response.data);
        } catch (error: any) {
            console.log('=== ERROR ===');
            console.log('Error status:', error.response?.status);
            console.log('Error data:', error.response?.data);
            console.log('Error message:', error.message);
            console.log('=== END ERROR ===');
            throw error;
        }
    },
};
