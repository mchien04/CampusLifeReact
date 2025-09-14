import api from './api';
import {
    ActivityRegistrationRequest,
    ActivityRegistrationResponse,
    ActivityParticipationRequest,
    ActivityParticipationResponse,
    RegistrationStatus
} from '../types/registration';

export const registrationAPI = {
    // Student APIs
    registerForActivity: async (data: ActivityRegistrationRequest): Promise<ActivityRegistrationResponse> => {
        const response = await api.post('/registrations', data);
        return response.data.data;
    },

    cancelRegistration: async (activityId: number): Promise<void> => {
        await api.delete(`/registrations/activity/${activityId}`);
    },

    getMyRegistrations: async (): Promise<ActivityRegistrationResponse[]> => {
        const response = await api.get('/registrations/my');
        return response.data.data;
    },

    checkRegistrationStatus: async (activityId: number): Promise<{ status: RegistrationStatus; registrationId?: number }> => {
        const response = await api.get(`/registrations/check/${activityId}`);
        return response.data.data;
    },

    recordParticipation: async (data: ActivityParticipationRequest): Promise<ActivityParticipationResponse> => {
        const response = await api.post('/registrations/participate', data);
        return response.data.data;
    },

    getMyParticipations: async (): Promise<ActivityParticipationResponse[]> => {
        const response = await api.get('/registrations/my/participations');
        return response.data.data;
    },

    // Admin/Manager APIs
    getActivityRegistrations: async (activityId: number): Promise<ActivityRegistrationResponse[]> => {
        const response = await api.get(`/registrations/activity/${activityId}`);
        return response.data.data;
    },

    updateRegistrationStatus: async (registrationId: number, status: RegistrationStatus): Promise<ActivityRegistrationResponse> => {
        const response = await api.put(`/registrations/${registrationId}/status?status=${status}`);
        return response.data.data;
    },

    getRegistrationById: async (registrationId: number): Promise<ActivityRegistrationResponse> => {
        const response = await api.get(`/registrations/${registrationId}`);
        return response.data.data;
    },

    getActivityParticipations: async (activityId: number): Promise<ActivityParticipationResponse[]> => {
        const response = await api.get(`/registrations/activity/${activityId}/participations`);
        return response.data.data;
    }
};
