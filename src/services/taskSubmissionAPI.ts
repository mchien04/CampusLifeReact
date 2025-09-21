import api from './api';
import { TaskSubmission } from '../types/taskSubmission';

export const taskSubmissionAPI = {
    // Nộp bài cho task
    submitTask: async (taskId: number, content?: string, files?: File[]): Promise<TaskSubmission> => {
        const formData = new FormData();
        if (content) {
            formData.append('content', content);
        }
        if (files && files.length > 0) {
            files.forEach(file => {
                formData.append('files', file);
            });
        }

        const response = await api.post(`/api/submissions/task/${taskId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.body;
    },

    // Cập nhật bài nộp
    updateSubmission: async (submissionId: number, content?: string, files?: File[]): Promise<TaskSubmission> => {
        const formData = new FormData();
        if (content) {
            formData.append('content', content);
        }
        if (files && files.length > 0) {
            files.forEach(file => {
                formData.append('files', file);
            });
        }

        const response = await api.put(`/api/submissions/${submissionId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.body;
    },

    // Lấy danh sách bài nộp của student cho một task
    getMySubmissions: async (taskId: number): Promise<TaskSubmission[]> => {
        const response = await api.get(`/api/submissions/task/${taskId}/my`);
        return response.data.body;
    },

    // Lấy tất cả bài nộp của một task (Admin/Manager)
    getTaskSubmissions: async (taskId: number): Promise<TaskSubmission[]> => {
        const response = await api.get(`/api/submissions/task/${taskId}`);
        return response.data.body;
    },

    // Chấm điểm bài nộp
    gradeSubmission: async (submissionId: number, score: number, feedback?: string): Promise<TaskSubmission> => {
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
        return response.data.body;
    },

    // Lấy chi tiết bài nộp
    getSubmissionDetails: async (submissionId: number): Promise<TaskSubmission> => {
        const response = await api.get(`/api/submissions/${submissionId}`);
        return response.data.body;
    },

    // Xóa bài nộp
    deleteSubmission: async (submissionId: number): Promise<void> => {
        await api.delete(`/api/submissions/${submissionId}`);
    },

    // Lấy danh sách file đính kèm
    getSubmissionFiles: async (submissionId: number): Promise<string[]> => {
        const response = await api.get(`/api/submissions/${submissionId}/files`);
        return response.data.body;
    },
};
