import api from './api';
import { TrainingCalculateResponse, ScoreViewResponse } from '../types/score';

export const scoresAPI = {
    calculateTrainingScore: async (
        studentId: number,
        semesterId: number,
        excludedCriterionIds: number[]
    ): Promise<TrainingCalculateResponse> => {
        const qs = new URLSearchParams({
            studentId: String(studentId),
            semesterId: String(semesterId)
        });
        const res = await api.post(
            `/api/scores/training/calculate?${qs.toString()}`,
            excludedCriterionIds
        );
        return res.data.body;
    },

    getSemesterScores: async (
        studentId: number,
        semesterId: number
    ): Promise<ScoreViewResponse> => {
        const res = await api.get(`/api/scores/student/${studentId}/semester/${semesterId}`);
        return res.data.body;
    },
};