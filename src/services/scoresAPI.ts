import api from './api';
import { TrainingCalculateResponse, ScoreViewResponse, StudentRankingResponseData } from '../types/score';
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

    // Mocked list for manager view (deprecated - use getStudentRanking instead)
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