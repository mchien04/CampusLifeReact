import api from './api';
import { StandardActivityCreateRequest, StandardActivityUpdateRequest, ActivityResponse } from '../types/activity';
import { Response } from '../types/auth';

export const standardActivityAPI = {
    createStandardActivity: async (data: StandardActivityCreateRequest): Promise<Response<ActivityResponse>> => {
        try {
            const response = await api.post('/api/activities/standard', data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error creating standard activity:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi tạo sự kiện',
                data: undefined
            };
        }
    },

    updateStandardActivity: async (id: number, data: StandardActivityUpdateRequest): Promise<Response<ActivityResponse>> => {
        try {
            const response = await api.put(`/api/activities/standard/${id}`, data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error updating standard activity:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật sự kiện',
                data: undefined
            };
        }
    }
};
