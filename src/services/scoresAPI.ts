import api from './api';
import { TrainingCalculateResponse, ScoreViewResponse } from '../types/score';
import { mockSemesterScores } from './mocks/scores.mock';

// Normalize response format
const normalize = <T>(data: any): { status: boolean; message: string; data?: T } => {
    if (data && typeof data === 'object' && 'status' in data) {
        return {
            status: data.status,
            message: data.message || '',
            data: data.body || data.data,
        } as { status: boolean; message: string; data?: T };
    }
    return {
        status: true,
        message: 'Success',
        data: data,
    } as { status: boolean; message: string; data?: T };
};

export const scoresAPI = {
    calculateTrainingScore: async (
        studentId: number,
        semesterId: number,
        excludedCriterionIds: number[]
    ): Promise<{ status: boolean; message: string; data?: TrainingCalculateResponse }> => {
        const qs = new URLSearchParams({
            studentId: String(studentId),
            semesterId: String(semesterId)
        });
        const res = await api.post(
            `/api/scores/training/calculate?${qs.toString()}`,
            excludedCriterionIds
        );
        return normalize<TrainingCalculateResponse>(res.data);
    },

    getSemesterScores: async (
        studentId: number,
        semesterId: number
    ): Promise<{ status: boolean; message: string; data?: ScoreViewResponse }> => {
        const res = await api.get(`/api/scores/student/${studentId}/semester/${semesterId}`);
        return normalize<ScoreViewResponse>(res.data);
    },

    // Mocked list for manager view (to be replaced with backend endpoint)
    listSemesterScores: async (params: {
        semesterId: number;
        facultyName?: string;
        className?: string;
        sort?: 'asc' | 'desc';
        page?: number;
        pageSize?: number;
    }): Promise<{ status: boolean; message: string; data?: { items: any[]; total: number } }> => {
        const { semesterId, facultyName, className, sort = 'desc', page = 1, pageSize = 10 } = params;
        let rows = mockSemesterScores.filter(r => r.semesterId === semesterId);
        if (facultyName) rows = rows.filter(r => r.facultyName === facultyName);
        if (className) rows = rows.filter(r => r.className === className);
        rows = rows.sort((a, b) => (sort === 'asc' ? a.totalScore - b.totalScore : b.totalScore - a.totalScore));
        const start = (page - 1) * pageSize;
        const items = rows.slice(start, start + pageSize);
        return {
            status: true,
            message: 'OK',
            data: { items, total: rows.length },
        };
    },
};