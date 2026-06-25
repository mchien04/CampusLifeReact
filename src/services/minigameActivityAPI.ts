import api from './api';
import { MinigameActivityCreateRequest, MinigameActivityUpdateRequest, ActivityResponse } from '../types/activity';
import { Response } from '../types/auth';

export const minigameActivityAPI = {
    createMinigameActivity: async (data: MinigameActivityCreateRequest): Promise<Response<ActivityResponse>> => {
        try {
            const response = await api.post('/api/activities/minigames', data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error creating minigame activity:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi tạo mini game',
                data: undefined
            };
        }
    },

    updateMinigameActivity: async (id: number, data: MinigameActivityUpdateRequest): Promise<Response<ActivityResponse>> => {
        try {
            const response = await api.patch(`/api/activities/minigames/${id}`, data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error updating minigame activity:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật mini game',
                data: undefined
            };
        }
    }
};
