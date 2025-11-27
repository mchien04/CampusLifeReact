import api from './api';
import { Response } from '../types/auth';
import {
    ActivitySeries,
    SeriesResponse,
    CreateSeriesRequest,
    CreateActivityInSeriesRequest,
    AddActivityToSeriesRequest,
    SeriesRegistrationResponse,
    StudentSeriesProgress
} from '../types/series';
import { ActivityResponse } from '../types/activity';

export const seriesAPI = {
    // Get all series
    getSeries: async (): Promise<Response<SeriesResponse[]>> => {
        try {
            const response = await api.get('/api/series');
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data || []
            };
        } catch (error: any) {
            console.error('Error fetching series:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Không thể tải danh sách chuỗi sự kiện',
                data: []
            };
        }
    },

    // Get series by ID
    getSeriesById: async (id: number): Promise<Response<SeriesResponse>> => {
        try {
            const response = await api.get(`/api/series/${id}`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error fetching series:', error);
            throw error;
        }
    },

    // Get activities in series
    getSeriesActivities: async (seriesId: number): Promise<Response<ActivityResponse[]>> => {
        try {
            const response = await api.get(`/api/series/${seriesId}/activities`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data || []
            };
        } catch (error: any) {
            console.error('Error fetching series activities:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Không thể tải danh sách sự kiện trong chuỗi',
                data: []
            };
        }
    },

    // Create series
    createSeries: async (data: CreateSeriesRequest): Promise<Response<SeriesResponse>> => {
        try {
            const response = await api.post('/api/series', data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error creating series:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi tạo chuỗi sự kiện',
                data: undefined
            };
        }
    },

    // Create activity in series
    createActivityInSeries: async (
        seriesId: number,
        data: CreateActivityInSeriesRequest
    ): Promise<Response<ActivityResponse>> => {
        try {
            const response = await api.post(`/api/series/${seriesId}/activities/create`, data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error creating activity in series:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi tạo sự kiện trong chuỗi',
                data: undefined
            };
        }
    },

    // Add existing activity to series
    addActivityToSeries: async (
        seriesId: number,
        data: AddActivityToSeriesRequest
    ): Promise<Response<ActivityResponse>> => {
        try {
            const response = await api.post(`/api/series/${seriesId}/activities`, data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error adding activity to series:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi thêm sự kiện vào chuỗi',
                data: undefined
            };
        }
    },

    // Register for series (Student)
    registerForSeries: async (seriesId: number): Promise<SeriesRegistrationResponse> => {
        try {
            const response = await api.post(`/api/series/${seriesId}/register`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data || []
            };
        } catch (error: any) {
            console.error('Error registering for series:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi đăng ký chuỗi sự kiện',
                data: []
            };
        }
    },

    // Get my series progress (Student)
    getMySeriesProgress: async (seriesId: number): Promise<Response<StudentSeriesProgress>> => {
        try {
            const response = await api.get(`/api/series/${seriesId}/progress/my`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error fetching series progress:', error);
            // Return null if not found (student hasn't registered)
            if (error.response?.status === 404) {
                return {
                    status: false,
                    message: 'Chưa đăng ký chuỗi sự kiện này',
                    data: undefined
                };
            }
            throw error;
        }
    },

    // Calculate milestone (Admin)
    calculateMilestone: async (seriesId: number, studentId: number): Promise<Response<any>> => {
        try {
            const response = await api.post(`/api/series/${seriesId}/students/${studentId}/calculate-milestone`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error calculating milestone:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi tính điểm milestone',
                data: undefined
            };
        }
    },

    // Update series
    updateSeries: async (id: number, data: Partial<CreateSeriesRequest>): Promise<Response<SeriesResponse>> => {
        try {
            const response = await api.put(`/api/series/${id}`, data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error updating series:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật chuỗi sự kiện',
                data: undefined
            };
        }
    },

    // Delete series
    deleteSeries: async (id: number): Promise<Response<void>> => {
        try {
            const response = await api.delete(`/api/series/${id}`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error deleting series:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi xóa chuỗi sự kiện',
                data: undefined
            };
        }
    }
};

