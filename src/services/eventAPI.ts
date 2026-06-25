import api from './api';
import { CreateActivityRequest, ActivityResponse } from '../types/activity';
import { Response } from '../types/auth';
import { ActivityPresetPreviewResponse, ActivityPresetDefinition } from '../types/presets';

export const eventAPI = {
    // Activity Presets
    getActivityPresets: async (): Promise<Response<ActivityPresetDefinition[]>> => {
        try {
            const response = await api.get('/api/activities/presets');
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data || []
            };
        } catch (error: any) {
            console.error('Error fetching activity presets:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Không thể tải danh sách mẫu sự kiện',
                data: []
            };
        }
    },

    previewActivityPreset: async (data: any): Promise<Response<ActivityPresetPreviewResponse>> => {
        try {
            const response = await api.post('/api/activities/presets/preview', data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error previewing activity preset:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi xem trước mẫu',
                data: undefined
            };
        }
    },

    // Get all events
    getEvents: async (): Promise<Response<ActivityResponse[]>> => {
        try {
            console.log('🔍 eventAPI: getEvents called, calling backend...');
            const response = await api.get('/api/activities');
            console.log('🔍 eventAPI: getEvents successful, response:', response.data);

            // Backend trả về: {status: true, message: "...", body: [...]}
            // Nhưng interface Response mong đợi: {status: true, message: "...", data: [...]}
            const processedResponse: Response<ActivityResponse[]> = {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body // Lấy data từ "body" thay vì "data"
            };

            console.log('🔍 eventAPI: Processed response:', processedResponse);
            return processedResponse;
        } catch (error: any) {
            console.error('🔍 eventAPI: getEvents failed with error:', error);
            console.error('🔍 eventAPI: Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                statusText: error.response?.statusText
            });
            // Return empty data on error
            return {
                status: false,
                message: 'Failed to fetch events',
                data: []
            };
        }
    },

    // Get event by ID
    getEvent: async (id: number): Promise<Response<ActivityResponse>> => {
        try {
            const response = await api.get(`/api/activities/${id}`);
            // Process response format
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error fetching event:', error);
            throw error;
        }
    },

    // Create new event
    createEvent: async (data: CreateActivityRequest): Promise<Response<ActivityResponse>> => {
        try {
            console.log('🔍 eventAPI: createEvent called with data:', data);
            console.log('🔍 eventAPI: bannerUrl in request:', data.bannerUrl);

            const response = await api.post('/api/activities', data);
            console.log('🔍 eventAPI: Backend response:', response.data);

            // Process response format
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('🔍 eventAPI: Error creating event:', error);
            console.error('🔍 eventAPI: Error response:', error.response?.data);
            // Return error response in expected format
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi tạo sự kiện',
                data: undefined
            };
        }
    },

    // Update event
    updateEvent: async (id: number, data: Partial<CreateActivityRequest>): Promise<Response<ActivityResponse>> => {
        try {
            const response = await api.put(`/api/activities/${id}`, data);
            // Process response format
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error updating event:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật sự kiện',
                data: undefined
            };
        }
    },

    // Publish activity
    publishActivity: async (id: number): Promise<Response<ActivityResponse>> => {
        try {
            const response = await api.put(`/api/activities/${id}/publish`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi khi public sự kiện',
                data: undefined
            };
        }
    },

    // Unpublish activity
    unpublishActivity: async (id: number): Promise<Response<ActivityResponse>> => {
        try {
            const response = await api.put(`/api/activities/${id}/unpublish`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi khi unpublish sự kiện',
                data: undefined
            };
        }
    },

    // Copy activity with optional offsetDays
    copyActivity: async (id: number, offsetDays?: number): Promise<Response<ActivityResponse>> => {
        try {
            const qs = new URLSearchParams();
            if (typeof offsetDays === 'number') qs.append('offsetDays', String(offsetDays));
            const url = qs.toString() ? `/api/activities/${id}/copy?${qs.toString()}` : `/api/activities/${id}/copy`;
            const response = await api.post(url);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi khi copy sự kiện',
                data: undefined
            };
        }
    },

    // Delete event
    deleteEvent: async (id: number): Promise<Response<void>> => {
        try {
            const response = await api.delete(`/api/activities/${id}`);
            // Process response format
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error deleting event:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi xóa sự kiện',
                data: undefined
            };
        }
    },

    // Get events by department
    getEventsByDepartment: async (departmentId: number): Promise<Response<ActivityResponse[]>> => {
        try {
            const response = await api.get(`/api/activities/department/${departmentId}`);
            const list = Array.isArray(response.data) ? response.data : (response.data.body || response.data.data || []);
            return {
                status: true,
                message: 'Success',
                data: list
            };
        } catch (error: any) {
            console.error('Error fetching events by department:', error);
            return {
                status: false,
                message: 'Failed to fetch events by department',
                data: []
            };
        }
    },

    // Get events by score type
    getEventsByScoreType: async (scoreType: string): Promise<Response<ActivityResponse[]>> => {
        try {
            const response = await api.get(`/api/activities/score-type/${scoreType}`);
            const list = Array.isArray(response.data) ? response.data : (response.data.body || response.data.data || []);
            return {
                status: true,
                message: 'Success',
                data: list
            };
        } catch (error: any) {
            console.error('Error fetching events by score type:', error);
            return {
                status: false,
                message: 'Failed to fetch events by score type',
                data: []
            };
        }
    },

    // Get events by month
    getEventsByMonth: async (year?: number, month?: number): Promise<Response<ActivityResponse[]>> => {
        try {
            const params = new URLSearchParams();
            if (year) params.append('year', year.toString());
            if (month) params.append('month', month.toString());

            const response = await api.get(`/api/activities/month?${params.toString()}`);
            const list = Array.isArray(response.data) ? response.data : (response.data.body || response.data.data || []);
            return {
                status: true,
                message: 'Success',
                data: list
            };
        } catch (error: any) {
            console.error('Error fetching events by month:', error);
            return {
                status: false,
                message: 'Failed to fetch events by month',
                data: []
            };
        }
    },

    // Get my events
    getMyEvents: async (): Promise<Response<ActivityResponse[]>> => {
        try {
            const response = await api.get('/api/activities/my');
            const list = Array.isArray(response.data) ? response.data : (response.data.body || response.data.data || []);
            return {
                status: true,
                message: 'Success',
                data: list
            };
        } catch (error: any) {
            console.error('Error fetching my events:', error);
            return {
                status: false,
                message: 'Failed to fetch my events',
                data: []
            };
        }
    },

    // Get upcoming events with optional keyword search
    getUpcomingActivities: async (keyword?: string): Promise<Response<ActivityResponse[]>> => {
        try {
            const params = new URLSearchParams();
            if (keyword) params.append('keyword', keyword);

            const response = await api.get(`/api/activities/upcoming?${params.toString()}`);
            const list = Array.isArray(response.data) ? response.data : (response.data.body || response.data.data || []);
            return {
                status: true,
                message: 'Success',
                data: list
            };
        } catch (error: any) {
            console.error('Error fetching upcoming activities:', error);
            return {
                status: false,
                message: 'Failed to fetch upcoming activities',
                data: []
            };
        }
    },

    // Register for event
    registerForEvent: async (eventId: number): Promise<Response<void>> => {
        try {
            const response = await api.post(`/api/activities/${eventId}/register`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error registering for event:', error);
            return {
                status: false,
                message: 'Failed to register for event',
                data: undefined
            };
        }
    },

    // Unregister from event
    unregisterFromEvent: async (eventId: number): Promise<Response<void>> => {
        try {
            const response = await api.delete(`/api/activities/${eventId}/register`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error unregistering from event:', error);
            return {
                status: false,
                message: 'Failed to unregister from event',
                data: undefined
            };
        }
    },

    // Get event participants
    getEventParticipants: async (eventId: number): Promise<Response<any[]>> => {
        try {
            const response = await api.get(`/api/activities/${eventId}/participants`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error fetching event participants:', error);
            return {
                status: false,
                message: 'Failed to fetch event participants',
                data: undefined
            };
        }
    },

    // Upload event banner
    uploadBanner: async (eventId: number, file: File): Promise<Response<{ bannerUrl: string }>> => {
        const formData = new FormData();
        formData.append('banner', file);

        const response = await api.post(`/api/activities/${eventId}/banner`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Debug endpoint to check user info
    debugUserInfo: async (): Promise<Response<any>> => {
        try {
            console.log('🔍 eventAPI: debugUserInfo called');
            const response = await api.get('/api/activities/debug/user-info');
            console.log('🔍 eventAPI: debugUserInfo response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('🔍 eventAPI: debugUserInfo failed:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Failed to get user info',
                data: null
            };
        }
    },

    // Backfill checkInCodes for existing activities (Admin/Manager only)
    backfillCheckInCodes: async (): Promise<Response<{ updatedCount: number; totalActivities: number } | null>> => {
        try {
            const response = await api.post('/api/activities/backfill-checkin-codes');
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data || null
            };
        } catch (error: any) {
            console.error('Error backfilling checkInCodes:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi tạo checkInCodes',
                data: null
            };
        }
    }
};
