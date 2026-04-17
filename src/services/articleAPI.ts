import api from './api';
import publicApi from './publicApi';
import type {
    ApiResponse,
    EventArticleAdminResponse,
    EventArticleDetailResponse,
    EventArticleUpsertRequest,
} from '../types/article';

const toApiResponse = <T>(payload: any): ApiResponse<T> => ({
    status: Boolean(payload?.status),
    message: payload?.message || '',
    body: payload?.body ?? payload?.data ?? null,
});

export const articleAPI = {
    getArticleBySlug: async (slug: string): Promise<ApiResponse<EventArticleDetailResponse>> => {
        const response = await publicApi.get(`/api/articles/${encodeURIComponent(slug)}`);
        return toApiResponse<EventArticleDetailResponse>(response.data);
    },

    getArticleById: async (articleId: number): Promise<ApiResponse<EventArticleAdminResponse>> => {
        const response = await api.get(`/api/admin/articles/${articleId}`);
        return toApiResponse<EventArticleAdminResponse>(response.data);
    },

    getArticleByActivityId: async (activityId: number): Promise<ApiResponse<EventArticleAdminResponse>> => {
        const response = await api.get(`/api/admin/articles/by-activity/${activityId}`);
        return toApiResponse<EventArticleAdminResponse>(response.data);
    },

    createArticle: async (data: EventArticleUpsertRequest): Promise<ApiResponse<EventArticleAdminResponse>> => {
        const response = await api.post('/api/admin/articles', data);
        return toApiResponse<EventArticleAdminResponse>(response.data);
    },

    updateArticle: async (articleId: number, data: EventArticleUpsertRequest): Promise<ApiResponse<EventArticleAdminResponse>> => {
        const response = await api.put(`/api/admin/articles/${articleId}`, data);
        return toApiResponse<EventArticleAdminResponse>(response.data);
    },

    publishArticle: async (articleId: number): Promise<ApiResponse<EventArticleAdminResponse>> => {
        const response = await api.put(`/api/admin/articles/${articleId}/publish`);
        return toApiResponse<EventArticleAdminResponse>(response.data);
    },

    unpublishArticle: async (articleId: number): Promise<ApiResponse<EventArticleAdminResponse>> => {
        const response = await api.put(`/api/admin/articles/${articleId}/unpublish`);
        return toApiResponse<EventArticleAdminResponse>(response.data);
    },
};