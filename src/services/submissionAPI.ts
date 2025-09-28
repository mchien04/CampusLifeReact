import api from './api';
import { Response } from '../types/auth';
import {
    SubmissionRequirementResponse,
    TaskSubmissionResponse,
    CreateSubmissionRequest,
    UpdateSubmissionRequest,
} from '../types/submission';

export const submissionAPI = {
    // Check if an activity requires submission
    checkSubmissionRequirement: async (activityId: number): Promise<Response<SubmissionRequirementResponse>> => {
        const response = await api.get(`/api/activities/${activityId}/requires-submission`);
        return response.data;
    },

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
        return response.data;
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
        return response.data;
    },

    // Get student's submission for a specific task
    getMySubmissionForTask: async (taskId: number): Promise<Response<TaskSubmissionResponse>> => {
        const response = await api.get(`/api/submissions/task/${taskId}/my`);
        return response.data;
    },

    // Get submission details by ID
    getSubmissionDetails: async (submissionId: number): Promise<Response<TaskSubmissionResponse>> => {
        const response = await api.get(`/api/submissions/${submissionId}`);
        return response.data;
    },

    // Delete a submission
    deleteSubmission: async (submissionId: number): Promise<Response<any>> => {
        const response = await api.delete(`/api/submissions/${submissionId}`);
        return response.data;
    },

    // Get submission files
    getSubmissionFiles: async (submissionId: number): Promise<Response<string[]>> => {
        const response = await api.get(`/api/submissions/${submissionId}/files`);
        return response.data;
    },

    // Get all submissions for a task (Admin/Manager)
    getTaskSubmissions: async (taskId: number): Promise<Response<TaskSubmissionResponse[]>> => {
        const response = await api.get(`/api/submissions/task/${taskId}`);
        return response.data;
    },

    // Grade a submission
    gradeSubmission: async (submissionId: number, score: number, feedback?: string): Promise<Response<TaskSubmissionResponse>> => {
        const formData = new FormData();
        formData.append('score', score.toString());
        if (feedback) {
            formData.append('feedback', feedback);
        }
        const response = await api.put(`/api/submissions/${submissionId}/grade`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};
