import api from './api';
import {CreateActivityRequest, ActivityResponse, ActivitySeries} from '../types/activity';
import { Response } from '../types/auth';

export const eventAPI = {
    ////Events
    // Get all events
    getEvents: async (): Promise<Response<ActivityResponse[]>> => {
        try {
            console.log('🔍 eventAPI: getEvents called, calling backend...');
            const response = await api.get('/api/activities');
            console.log('🔍 eventAPI: getEvents successful, response:', response.data);


            const processedResponse: Response<ActivityResponse[]> = {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body
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
            const res = await api.get(`/api/activities/${id}`);
            const raw = res.data || res;

            const data = raw.body || raw.data || raw;

            console.log(" [eventAPI.getEvent] Response raw:", raw);
            console.log(" [eventAPI.getEvent] Parsed data:", data);

            return {
                status: raw.status ?? true,
                message: raw.message ?? "Fetched successfully",
                data
            };
        } catch (error: any) {
            console.error("❌ eventAPI.getEvent failed:", error);
            throw error;
        }
    },


    createEvent: async (data: CreateActivityRequest) => {
        const res = await api.post("/api/activities", data);
        return res.data;
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
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error fetching events by department:', error);
            return {
                status: false,
                message: 'Failed to fetch events by department',
                data: undefined
            };
        }
    },

    // Get events by score type
    getEventsByScoreType: async (scoreType: string): Promise<Response<ActivityResponse[]>> => {
        try {
            const response = await api.get(`/api/activities/score-type/${scoreType}`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error fetching events by score type:', error);
            return {
                status: false,
                message: 'Failed to fetch events by score type',
                data: undefined
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
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error fetching events by month:', error);
            return {
                status: false,
                message: 'Failed to fetch events by month',
                data: undefined
            };
        }
    },

    // Get my events
    getMyEvents: async (): Promise<Response<ActivityResponse[]>> => {
        try {
            const response = await api.get('/api/activities/my');
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error fetching my events:', error);
            return {
                status: false,
                message: 'Failed to fetch my events',
                data: undefined
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
    ///// Series
    /**
     *  Tạo chuỗi
     */
    createSeriesEvent: async (data: Pick<any, string | number | symbol>) => {
        try {
            console.log("📦 POST /api/activity-series", data);
            const res = await api.post("/api/activity-series", data);
            console.log("✅ createSeriesEvent success:", res.data);
            return res.data;
        } catch (error: any) {
            console.error("❌ createSeriesEvent failed:", {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
            });
            throw error;
        }
    },
    /**
     *  Xem sự kiện trong chuỗi
     */
    getEventsBySeries: async (seriesId: number): Promise<Response<ActivityResponse[]>> => {
        try {
            console.log(`📥 GET /api/activity-series/${seriesId}/events`);
            const res = await api.get(`/api/activity-series/${seriesId}/events`);
            const raw = res.data;

            return {
                status: raw?.status ?? true,
                message: raw?.message ?? "Fetched successfully",
                data: Array.isArray(raw?.body)
                    ? raw.body
                    : Array.isArray(raw?.data)
                        ? raw.data
                        : [],
            };
        } catch (err: any) {
            console.error("❌ eventAPI.getEventsBySeries failed:", {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status,
            });
            return { status: false, message: "Failed to fetch events by series", data: [] };
        }
    },

    getSeriesEvents: async (seriesId: number): Promise<Response<ActivityResponse[]>> => {
        const res = await api.get(`/api/activity-series/${seriesId}/events`);
        return res.data;
    },

    /**
     *  Xóa một sự kiện khỏi chuỗi
     */
    deleteEventFromSeries: async (
        seriesId: number,
        eventId: number
    ): Promise<Response<void>> => {
        try {
            console.log(`🗑️ DELETE /api/activity-series/${seriesId}/event/${eventId}`);
            const res = await api.delete(`/api/activity-series/${seriesId}/event/${eventId}`);
            return {
                status: res.data.status,
                message: res.data.message,
                data: res.data.body || res.data.data,
            };
        } catch (error: any) {
            console.error("❌ eventAPI.deleteEventFromSeries failed:", {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
            });
            return {
                status: false,
                message:
                    error.response?.data?.message || "Không thể xóa sự kiện khỏi chuỗi",
                data: undefined,
            };
        }
    },

    /**
     *  Thêm sự kiện mới vào chuỗi
     */
    addEventToSeries: async (
        seriesId: number,
        data: CreateActivityRequest
    ): Promise<Response<ActivityResponse>> => {
        try {
            console.log(`➕ POST /api/activity-series/${seriesId}/events`, data);
            const payload = { ...data }; // seriesId truyền qua URL, không cần trong body
            const res = await api.post(`/api/activity-series/${seriesId}/events`, payload);

            return {
                status: res.data.status,
                message: res.data.message,
                data: res.data.body || res.data.data,
            };
        } catch (error: any) {
            console.error("❌ eventAPI.addEventToSeries failed:", {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
            });
            return {
                status: false,
                message:
                    error.response?.data?.message || "Không thể thêm sự kiện vào chuỗi",
                data: undefined,
            };
        }
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
    }
};
