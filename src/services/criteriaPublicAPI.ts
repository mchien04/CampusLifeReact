import api from './api';

export const criteriaPublicAPI = {
    getGroups: async (): Promise<any[]> => {
        const res = await api.get('/api/criteria/groups');
        return res.data.body ?? res.data.data ?? [];
    },
    getGroup: async (groupId: number): Promise<any> => {
        const res = await api.get(`/api/criteria/groups/${groupId}`);
        return res.data.body ?? res.data.data ?? null;
    },
    getCriteriaByGroup: async (groupId: number): Promise<any[]> => {
        const res = await api.get(`/api/criteria/groups/${groupId}/list`);
        return res.data.body ?? res.data.data ?? [];
    },
    getAll: async (): Promise<any[]> => {
        const res = await api.get('/api/criteria');
        return res.data.body ?? res.data.data ?? [];
    },
};


