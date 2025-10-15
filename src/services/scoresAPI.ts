import api from './api';
import { TrainingCalculateResponse, ScoreViewResponse } from '../types/score';

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
};