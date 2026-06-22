import api from './api';
import { TrainingCalculateResponse, ScoreViewResponse, StudentRankingResponseData, ScoreHistoryViewResponse, ScoreType } from '../types/score';

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

    getStudentRanking: async (params: {
        semesterId: number;
        scoreType?: string | null; // "REN_LUYEN" | "CONG_TAC_XA_HOI" | "CHUYEN_DE" | "KHAC" | null
        departmentId?: number | null;
        classId?: number | null;
        sortOrder?: "ASC" | "DESC";
    }): Promise<{ status: boolean; message: string; data?: StudentRankingResponseData }> => {
        const { semesterId, scoreType, departmentId, classId, sortOrder = "DESC" } = params;
        
        const queryParams = new URLSearchParams();
        queryParams.append('semesterId', String(semesterId));
        if (scoreType) {
            queryParams.append('scoreType', scoreType);
        }
        if (departmentId) {
            queryParams.append('departmentId', String(departmentId));
        }
        if (classId) {
            queryParams.append('classId', String(classId));
        }
        queryParams.append('sortOrder', sortOrder);

        const res = await api.get(`/api/scores/ranking?${queryParams.toString()}`);
        return normalize<StudentRankingResponseData>(res.data);
    },

    getScoreHistory: async (params: {
        studentId: number;
        semesterId: number;
        scoreType?: ScoreType | null;
        page?: number;
        size?: number;
    }): Promise<{ status: boolean; message: string; data?: ScoreHistoryViewResponse }> => {
        const { studentId, semesterId, scoreType, page = 0, size = 20 } = params;
        
        const queryParams = new URLSearchParams();
        queryParams.append('semesterId', String(semesterId));
        if (scoreType) {
            queryParams.append('scoreType', scoreType);
        }
        if (page !== undefined) {
            queryParams.append('page', String(page));
        }
        if (size !== undefined) {
            queryParams.append('size', String(size));
        }

        const res = await api.get(`/api/scores/history/student/${studentId}?${queryParams.toString()}`);
        return normalize<ScoreHistoryViewResponse>(res.data);
    },

    getTotalScore: async (
        studentId: number,
        semesterId: number
    ): Promise<{ status: boolean; message: string; data?: number }> => {
        const res = await api.get(`/api/scores/student/${studentId}/semester/${semesterId}/total`);
        return normalize<number>(res.data);
    },

    recalculateStudentScore: async (
        studentId: number,
        semesterId?: number
    ): Promise<{ status: boolean; message: string; data?: string }> => {
        const queryParams = new URLSearchParams();
        if (semesterId) {
            queryParams.append('semesterId', String(semesterId));
        }
        const url = `/api/scores/recalculate/student/${studentId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const res = await api.post(url);
        return normalize<string>(res.data);
    },

    recalculateAllScores: async (): Promise<{ status: boolean; message: string; data?: string }> => {
        const res = await api.post('/api/scores/recalculate/all');
        return normalize<string>(res.data);
    },
};