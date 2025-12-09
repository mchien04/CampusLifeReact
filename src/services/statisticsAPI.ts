import api from './api';
import { Response } from '../types';
import {
    DashboardStatisticsResponse,
    ActivityStatisticsResponse,
    StudentStatisticsResponse,
    ScoreStatisticsResponse,
    SeriesStatisticsResponse,
    MinigameStatisticsResponse
} from '../types/statistics';

export interface ActivityStatisticsParams {
    activityType?: 'SUKIEN' | 'MINIGAME' | 'CONG_TAC_XA_HOI' | 'CHUYEN_DE_DOANH_NGHIEP';
    scoreType?: 'REN_LUYEN' | 'CONG_TAC_XA_HOI' | 'CHUYEN_DE';
    departmentId?: number;
    startDate?: string; // ISO 8601 format
    endDate?: string; // ISO 8601 format
}

export interface StudentStatisticsParams {
    departmentId?: number;
    classId?: number;
    semesterId?: number;
}

export interface ScoreStatisticsParams {
    scoreType?: 'REN_LUYEN' | 'CONG_TAC_XA_HOI' | 'CHUYEN_DE';
    semesterId?: number;
    departmentId?: number;
    classId?: number;
}

export interface SeriesStatisticsParams {
    seriesId?: number;
    semesterId?: number;
}

export interface MinigameStatisticsParams {
    miniGameId?: number;
    startDate?: string; // ISO 8601 format
    endDate?: string; // ISO 8601 format
}


export const statisticsAPI = {
    getDashboardStatistics: async (): Promise<Response<DashboardStatisticsResponse>> => {
        try {
            const response = await api.get('/api/statistics/dashboard');
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.data || response.data.body
            };
        } catch (error: any) {
            console.error('Error fetching dashboard statistics:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Failed to fetch dashboard statistics',
                data: undefined
            };
        }
    },

    getActivityStatistics: async (params?: ActivityStatisticsParams): Promise<Response<ActivityStatisticsResponse>> => {
        try {
            const queryParams = new URLSearchParams();
            if (params?.activityType) queryParams.append('activityType', params.activityType);
            if (params?.scoreType) queryParams.append('scoreType', params.scoreType);
            if (params?.departmentId) queryParams.append('departmentId', params.departmentId.toString());
            if (params?.startDate) queryParams.append('startDate', params.startDate);
            if (params?.endDate) queryParams.append('endDate', params.endDate);

            const url = `/api/statistics/activities${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await api.get(url);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.data || response.data.body
            };
        } catch (error: any) {
            console.error('Error fetching activity statistics:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Failed to fetch activity statistics',
                data: undefined
            };
        }
    },

    getStudentStatistics: async (params?: StudentStatisticsParams): Promise<Response<StudentStatisticsResponse>> => {
        try {
            const queryParams = new URLSearchParams();
            if (params?.departmentId) queryParams.append('departmentId', params.departmentId.toString());
            if (params?.classId) queryParams.append('classId', params.classId.toString());
            if (params?.semesterId) queryParams.append('semesterId', params.semesterId.toString());

            const url = `/api/statistics/students${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await api.get(url);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.data || response.data.body
            };
        } catch (error: any) {
            console.error('Error fetching student statistics:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Failed to fetch student statistics',
                data: undefined
            };
        }
    },

    getScoreStatistics: async (params?: ScoreStatisticsParams): Promise<Response<ScoreStatisticsResponse>> => {
        try {
            const queryParams = new URLSearchParams();
            if (params?.scoreType) queryParams.append('scoreType', params.scoreType);
            if (params?.semesterId) queryParams.append('semesterId', params.semesterId.toString());
            if (params?.departmentId) queryParams.append('departmentId', params.departmentId.toString());
            if (params?.classId) queryParams.append('classId', params.classId.toString());

            const url = `/api/statistics/scores${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await api.get(url);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.data || response.data.body
            };
        } catch (error: any) {
            console.error('Error fetching score statistics:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Failed to fetch score statistics',
                data: undefined
            };
        }
    },

    getSeriesStatistics: async (params?: SeriesStatisticsParams): Promise<Response<SeriesStatisticsResponse>> => {
        try {
            const queryParams = new URLSearchParams();
            if (params?.seriesId) queryParams.append('seriesId', params.seriesId.toString());
            if (params?.semesterId) queryParams.append('semesterId', params.semesterId.toString());

            const url = `/api/statistics/series${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await api.get(url);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.data || response.data.body
            };
        } catch (error: any) {
            console.error('Error fetching series statistics:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Failed to fetch series statistics',
                data: undefined
            };
        }
    },

    getMinigameStatistics: async (params?: MinigameStatisticsParams): Promise<Response<MinigameStatisticsResponse>> => {
        try {
            const queryParams = new URLSearchParams();
            if (params?.miniGameId) queryParams.append('miniGameId', params.miniGameId.toString());
            if (params?.startDate) queryParams.append('startDate', params.startDate);
            if (params?.endDate) queryParams.append('endDate', params.endDate);

            const url = `/api/statistics/minigames${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await api.get(url);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.data || response.data.body
            };
        } catch (error: any) {
            console.error('Error fetching minigame statistics:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Failed to fetch minigame statistics',
                data: undefined
            };
        }
    },

};

