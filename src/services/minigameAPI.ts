import api from './api';
import { Response } from '../types/auth';
import {
    MiniGame,
    CreateMiniGameRequest,
    StartAttemptResponse,
    SubmitAttemptRequest,
    SubmitAttemptResponse,
    MiniGameAttempt
} from '../types/minigame';

export const minigameAPI = {
    // Create minigame with quiz
    createMiniGame: async (data: CreateMiniGameRequest): Promise<Response<MiniGame>> => {
        try {
            const response = await api.post('/api/minigames', data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error creating minigame:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi tạo minigame',
                data: undefined
            };
        }
    },

    // Get minigame by activity ID
    getMiniGameByActivity: async (activityId: number): Promise<Response<MiniGame>> => {
        try {
            const response = await api.get(`/api/minigames/activity/${activityId}`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error fetching minigame:', error);
            if (error.response?.status === 404) {
                return {
                    status: false,
                    message: 'Không tìm thấy minigame cho activity này',
                    data: undefined
                };
            }
            throw error;
        }
    },

    // Start attempt (Student)
    startAttempt: async (miniGameId: number): Promise<Response<StartAttemptResponse>> => {
        try {
            const response = await api.post(`/api/minigames/${miniGameId}/start`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error starting attempt:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi bắt đầu làm quiz',
                data: undefined
            };
        }
    },

    // Submit attempt (Student)
    submitAttempt: async (
        attemptId: number,
        data: SubmitAttemptRequest
    ): Promise<Response<SubmitAttemptResponse>> => {
        try {
            const response = await api.post(`/api/minigames/attempts/${attemptId}/submit`, data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error submitting attempt:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi nộp bài quiz',
                data: undefined
            };
        }
    },

    // Get my attempts (Student)
    getMyAttempts: async (miniGameId: number): Promise<Response<MiniGameAttempt[]>> => {
        try {
            const response = await api.get(`/api/minigames/${miniGameId}/attempts/my`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data || []
            };
        } catch (error: any) {
            console.error('Error fetching attempts:', error);
            return {
                status: false,
                message: 'Không thể tải lịch sử attempts',
                data: []
            };
        }
    },

    // Get all minigames (Admin/Manager)
    getAllMiniGames: async (): Promise<Response<MiniGame[]>> => {
        try {
            const response = await api.get('/api/minigames');
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data || []
            };
        } catch (error: any) {
            console.error('Error fetching minigames:', error);
            return {
                status: false,
                message: 'Không thể tải danh sách minigame',
                data: []
            };
        }
    },

    // Update minigame
    updateMiniGame: async (id: number, data: Partial<CreateMiniGameRequest>): Promise<Response<MiniGame>> => {
        try {
            const response = await api.put(`/api/minigames/${id}`, data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error updating minigame:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật minigame',
                data: undefined
            };
        }
    },

    // Delete minigame
    deleteMiniGame: async (id: number): Promise<Response<void>> => {
        try {
            const response = await api.delete(`/api/minigames/${id}`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error deleting minigame:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi xóa minigame',
                data: undefined
            };
        }
    }
};

