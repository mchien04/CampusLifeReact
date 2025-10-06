import api from './api';

export const academicPublicAPI = {
    getYears: async (): Promise<any[]> => {
        const res = await api.get('/api/academic/years');
        return res.data.body ?? res.data.data ?? [];
    },
    getSemestersByYear: async (yearId: number): Promise<any[]> => {
        const res = await api.get(`/api/academic/years/${yearId}/semesters`);
        return res.data.body ?? res.data.data ?? [];
    },
    getSemesters: async (): Promise<any[]> => {
        const res = await api.get('/api/academic/semesters');
        return res.data.body ?? res.data.data ?? [];
    },
};


