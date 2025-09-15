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

    recordParticipation: async (data: ActivityParticipationRequest): Promise<ActivityParticipationResponse> => {
        const response = await api.post('/api/registrations/participate', data);
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

    updateRegistrationStatus: async (registrationId: number, status: RegistrationStatus): Promise<ActivityRegistrationResponse> => {
        const response = await api.put(`/api/registrations/${registrationId}/status?status=${status}`);
        return response.data.body;
    },

    getRegistrationById: async (registrationId: number): Promise<ActivityRegistrationResponse> => {
        const response = await api.get(`/api/registrations/${registrationId}`);
        return response.data.body;
    },

    getActivityParticipations: async (activityId: number): Promise<ActivityParticipationResponse[]> => {
        const response = await api.get(`/api/registrations/activity/${activityId}/participations`);
        return response.data.body;
    }
};
