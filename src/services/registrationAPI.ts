import api from './api';
import {
    ActivityRegistrationRequest,
    ActivityRegistrationResponse,
    ActivityParticipationRequest,
    ActivityParticipationResponse,
    RegistrationStatus
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

    getMyRegistrations: async (): Promise<ActivityRegistrationResponse[]> => {
        const response = await api.get('/api/registrations/my');
        return response.data.body;
    },

    checkRegistrationStatus: async (activityId: number): Promise<{ status: RegistrationStatus; registrationId?: number }> => {
        const response = await api.get(`/api/registrations/check/${activityId}`);
        return response.data.body;
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

    checkIn: async (data: ActivityParticipationRequest): Promise<ApiResponse<ActivityParticipationResponse>> => {
        const response = await api.post('/api/registrations/checkin', data);
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


};
