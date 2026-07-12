import type { AxiosResponse } from 'axios';
import api from './api';
import {
    TrainingCalculateResponse,
    ScoreViewResponse,
    ScoreTotalResponse,
    StudentRankingResponseData,
    ScoreHistoryViewResponse,
    ScoreType,
    ExportSemesterScoresParams,
    RecalculationJobResponse,
    ManualScoreRequest,
    ManualScoreResponse,
    ManualScoreReverseRequest,
    BulkManualScoreRequest,
    BulkManualScoreResponse,
    CreateScoreAppealRequest,
    ScoreAppealResponse,
    ScoreAppealPageBody,
    ScoreAppealStatus,
    ScoreAppealMessageRequest,
    ScoreAppealDecisionRequest,
    ScoreAppealDecisionPreviewResponse,
    ScoreAppealEvidenceUploadResponse,
} from '../types/score';

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

    /** GET /api/scores/export — Excel binary. */
    exportSemesterScoresExcel: (
        params: ExportSemesterScoresParams
    ): Promise<AxiosResponse<Blob>> =>
        api.get('/api/scores/export', {
            params,
            responseType: 'blob',
        }),

    getScoreHistory: async (params: {
        studentId: number;
        semesterId: number;
        scoreType?: ScoreType | null;
        page?: number;
        size?: number;
        /** ISO datetime string — backend filter. */
        startDate?: string | null;
        /** ISO datetime string — backend filter. */
        endDate?: string | null;
        /** Tìm kiếm theo tên hoạt động. */
        keyword?: string | null;
    }): Promise<{ status: boolean; message: string; data?: ScoreHistoryViewResponse }> => {
        const { studentId, semesterId, scoreType, page = 0, size = 20, startDate, endDate, keyword } = params;

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
        if (startDate) {
            queryParams.append('startDate', startDate);
        }
        if (endDate) {
            queryParams.append('endDate', endDate);
        }
        if (keyword) {
            queryParams.append('keyword', keyword);
        }

        const res = await api.get(`/api/scores/history/student/${studentId}?${queryParams.toString()}`);
        return normalize<ScoreHistoryViewResponse>(res.data);
    },

    getTotalScore: async (
        studentId: number,
        semesterId: number
    ): Promise<{ status: boolean; message: string; data?: ScoreTotalResponse }> => {
        const res = await api.get(`/api/scores/student/${studentId}/semester/${semesterId}/total`);
        return normalize<ScoreTotalResponse>(res.data);
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

    recalculateAllScores: async (semesterId?: number): Promise<{ status: boolean; message: string; data?: string }> => {
        const queryParams = new URLSearchParams();
        if (semesterId) {
            queryParams.append('semesterId', String(semesterId));
        }
        const url = `/api/scores/recalculate/all${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const res = await api.post(url);
        return normalize<string>(res.data);
    },

    recalculateAsync: async (semesterId?: number): Promise<{ status: boolean; message: string; data?: { jobId: number; semesterId: number; totalStudents: number; status: string } }> => {
        const queryParams = new URLSearchParams();
        if (semesterId) {
            queryParams.append('semesterId', String(semesterId));
        }
        const url = `/api/scores/recalculate/async${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const res = await api.post(url);
        return normalize(res.data);
    },

    getRecalculationStatus: async (jobId: number): Promise<{ status: boolean; message: string; data?: RecalculationJobResponse }> => {
        const res = await api.get(`/api/scores/recalculate/status/${jobId}`);
        return normalize<RecalculationJobResponse>(res.data);
    },

    retryRecalculation: async (jobId: number): Promise<{ status: boolean; message: string; data?: { jobId: number } }> => {
        const res = await api.post(`/api/scores/recalculate/retry/${jobId}`);
        return normalize(res.data);
    },

    createManualScore: async (
        body: ManualScoreRequest
    ): Promise<{ status: boolean; message: string; data?: ManualScoreResponse }> => {
        const res = await api.post('/api/scores/manual', body);
        return normalize<ManualScoreResponse>(res.data);
    },

    createBulkManualScore: async (
        body: BulkManualScoreRequest
    ): Promise<{ status: boolean; message: string; data?: BulkManualScoreResponse }> => {
        const res = await api.post('/api/scores/manual/bulk', body);
        return normalize<BulkManualScoreResponse>(res.data);
    },

    reverseManualScore: async (
        adjustmentId: number,
        body: ManualScoreReverseRequest
    ): Promise<{ status: boolean; message: string; data?: { adjustmentId: number; reversedEntries: number } }> => {
        const res = await api.post(`/api/scores/manual/${adjustmentId}/reverse`, body);
        return normalize(res.data);
    },

    uploadAppealEvidence: async (
        files: File[]
    ): Promise<{ status: boolean; message: string; data?: ScoreAppealEvidenceUploadResponse }> => {
        const form = new FormData();
        files.forEach((f) => form.append('files', f));
        const res = await api.post('/api/scores/appeals/evidence', form);
        return normalize<ScoreAppealEvidenceUploadResponse>(res.data);
    },

    createScoreAppeal: async (
        body: CreateScoreAppealRequest
    ): Promise<{ status: boolean; message: string; data?: ScoreAppealResponse }> => {
        const res = await api.post('/api/scores/appeals', body);
        return normalize<ScoreAppealResponse>(res.data);
    },

    previewAppealDecision: async (
        id: number,
        body: ScoreAppealDecisionRequest
    ): Promise<{ status: boolean; message: string; data?: ScoreAppealDecisionPreviewResponse }> => {
        const res = await api.post(`/api/scores/appeals/${id}/decide/preview`, body);
        return normalize<ScoreAppealDecisionPreviewResponse>(res.data);
    },

    listMyScoreAppeals: async (): Promise<{ status: boolean; message: string; data?: ScoreAppealResponse[] }> => {
        const res = await api.get('/api/scores/appeals/my');
        return normalize<ScoreAppealResponse[]>(res.data);
    },

    listScoreAppeals: async (params: {
        status?: ScoreAppealStatus;
        semesterId?: number;
        studentId?: number;
        page?: number;
        size?: number;
    }): Promise<{ status: boolean; message: string; data?: ScoreAppealPageBody }> => {
        const queryParams = new URLSearchParams();
        if (params.status) queryParams.append('status', params.status);
        if (params.semesterId != null) queryParams.append('semesterId', String(params.semesterId));
        if (params.studentId != null) queryParams.append('studentId', String(params.studentId));
        queryParams.append('page', String(params.page ?? 0));
        queryParams.append('size', String(params.size ?? 20));
        const res = await api.get(`/api/scores/appeals?${queryParams.toString()}`);
        return normalize<ScoreAppealPageBody>(res.data);
    },

    getScoreAppeal: async (
        id: number
    ): Promise<{ status: boolean; message: string; data?: ScoreAppealResponse }> => {
        const res = await api.get(`/api/scores/appeals/${id}`);
        return normalize<ScoreAppealResponse>(res.data);
    },

    addScoreAppealMessage: async (
        id: number,
        body: ScoreAppealMessageRequest
    ): Promise<{ status: boolean; message: string; data?: ScoreAppealResponse }> => {
        const res = await api.post(`/api/scores/appeals/${id}/messages`, body);
        return normalize<ScoreAppealResponse>(res.data);
    },

    decideScoreAppeal: async (
        id: number,
        body: ScoreAppealDecisionRequest
    ): Promise<{ status: boolean; message: string; data?: ScoreAppealResponse }> => {
        const res = await api.put(`/api/scores/appeals/${id}/decide`, body);
        return normalize<ScoreAppealResponse>(res.data);
    },

    closeScoreAppeal: async (
        id: number
    ): Promise<{ status: boolean; message: string; data?: ScoreAppealResponse }> => {
        const res = await api.put(`/api/scores/appeals/${id}/close`);
        return normalize<ScoreAppealResponse>(res.data);
    },

    withdrawScoreAppeal: async (
        id: number
    ): Promise<{ status: boolean; message: string; data?: ScoreAppealResponse }> => {
        const res = await api.put(`/api/scores/appeals/${id}/withdraw`);
        return normalize<ScoreAppealResponse>(res.data);
    },
};