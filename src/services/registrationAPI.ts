import type { AxiosResponse } from 'axios';
import api from './api';
import {
    ActivityRegistrationRequest,
    ActivityRegistrationResponse,
    ActivityRegistrationStatusResponse,
    ActivityParticipationRequest,
    ActivityParticipationResponse,
    RegistrationStatus,
    TicketCodeValidateResponse,
    EventTimeStatus,
    PersonalCalendarResponse,
} from '../types/registration';
import { ApiResponse } from '../types/common';
import axios from "axios";

export const registrationAPI = {
    // Student APIs
    registerForActivity: async (data: ActivityRegistrationRequest): Promise<ActivityRegistrationResponse> => {
        const response = await api.post('/api/registrations', data);
        return response.data.body;
    },

    cancelRegistration: async (activityId: number): Promise<void> => {
        await api.delete(`/api/registrations/activity/${activityId}`);
    },

    getMyRegistrations: async (eventStatus?: EventTimeStatus): Promise<ActivityRegistrationResponse[]> => {
        const params = eventStatus ? `?eventStatus=${eventStatus}` : '';
        const response = await api.get(`/api/registrations/my${params}`);
        return response.data.body;
    },

    /**
     * GET /api/registrations/personal-calendar
     * body: PersonalCalendarResponse { markedDates, events } — not a flat array.
     */
    getPersonalCalendar: async (params?: {
        from?: string;
        to?: string;
        date?: string;
    }): Promise<ApiResponse<PersonalCalendarResponse>> => {
        const response = await api.get('/api/registrations/personal-calendar', { params });
        return response.data;
    },

    checkRegistrationStatus: async (activityId: number): Promise<ActivityRegistrationResponse | null> => {
        const response = await api.get(`/api/registrations/check/${activityId}`);
        // Backend returns null if not registered, or ActivityRegistrationResponse if registered
        return response.data.body || null;
    },

    /**
     * P7-1: GET /api/activities/{activityId}/registration-status — trả Map với
     * { isRegistered, status, canCancel, ...}. Dùng cho quyết định hiển thị nút huỷ.
     * Parse dùng optional/fallback (BE trả Map, không có DTO cố định).
     */
    getActivityRegistrationStatus: async (activityId: number): Promise<ActivityRegistrationStatusResponse> => {
        const response = await api.get(`/api/activities/${activityId}/registration-status`);
        return (response.data.body || {}) as ActivityRegistrationStatusResponse;
    },

    /**
     * P7-7/P7-9: GET /api/registrations/series/{seriesId} — danh sách đăng ký của series.
     * FE đếm distinct APPROVED student client-side (Q4 — BE không có overview APPROVED-only).
     */
    getSeriesRegistrations: async (seriesId: number): Promise<ActivityRegistrationResponse[]> => {
        const response = await api.get(`/api/registrations/series/${seriesId}`);
        return response.data.body || [];
    },



    getMyParticipations: async (): Promise<ActivityParticipationResponse[]> => {
        const response = await api.get('/api/registrations/my/participations');
        return response.data.body;
    },

    // Admin/Manager APIs
    getActivityRegistrations: async (activityId: number): Promise<ActivityRegistrationResponse[]> => {
        const response = await api.get(`/api/registrations/activity/${activityId}`);
        return response.data.body;
    },

    updateRegistrationStatus: async (registrationId: number, status: RegistrationStatus): Promise<{ status: boolean; message: string; data?: ActivityRegistrationResponse }> => {
        const response = await api.put(`/api/registrations/${registrationId}/status?status=${status}`);
        return {
            status: response.data.status,
            message: response.data.message,
            data: response.data.body
        };
    },

    getRegistrationById: async (registrationId: number): Promise<ActivityRegistrationResponse> => {
        const response = await api.get(`/api/registrations/${registrationId}`);
        return response.data.body;
    },

    validateTicketCode: async (ticketCode: string): Promise<ApiResponse<TicketCodeValidateResponse>> => {
        const response = await api.get(`/api/registrations/checkin/validate?ticketCode=${encodeURIComponent(ticketCode)}`);
        return response.data;
    },

    checkIn: async (data: ActivityParticipationRequest): Promise<ApiResponse<ActivityParticipationResponse>> => {
        const response = await api.post('/api/registrations/checkin', data);
        return response.data; // { status, message, body }
    },

    checkInByQrCode: async (checkInCode: string): Promise<ApiResponse<ActivityParticipationResponse>> => {
        const response = await api.post('/api/registrations/checkin/qr', { checkInCode });
        return response.data; // { status, message, body }
    },

    getParticipationReport: async (activityId: number) => {
        const token = localStorage.getItem("token");
        const res = await api.get(`/api/registrations/activities/${activityId}/report`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return res.data.body;
    },

    /** GET /api/registrations/activities/{activityId}/export — Excel binary (3 sheets). */
    exportActivityParticipationExcel: (
        activityId: number
    ): Promise<AxiosResponse<Blob>> =>
        api.get(`/api/registrations/activities/${activityId}/export`, {
            responseType: 'blob',
        }),
};
