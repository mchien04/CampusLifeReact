import api from './api';
import publicApi from './publicApi';
import type {
    ApiResponse,
    ArticleCategoryRequest,
    ArticleCategoryResponse,
    ArticleImageRequest,
    ArticleImageResponse,
    EventArticleAdminResponse,
    EventArticleDetailResponse,
    EventArticleUpsertRequest,
    ArticleAnalytics,
    ArticleMetrics,
    DashboardAnalytics,
    ArticleListResponse,
    ArticleStatisticsResponse,
    ArticleTagRequest,
    ArticleTagResponse,
    ArticleWishlistItemResponse,
    SpringPage,
} from '../types/article';

const toApiResponse = <T>(payload: any): ApiResponse<T> => {
    if (payload && typeof payload.status === 'boolean' && ('body' in payload || 'message' in payload)) {
        return {
            status: Boolean(payload.status),
            message: payload?.message || '',
            body: (payload?.body ?? null) as T | null,
        };
    }

    return {
        status: true,
        message: '',
        body: (payload ?? null) as T | null,
    };
};

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

    addToWishlist: async (slug: string): Promise<ApiResponse<null>> => {
        const response = await api.post(`/api/articles/${encodeURIComponent(slug)}/wishlist`);
        return toApiResponse<null>(response.data);
    },

    removeFromWishlist: async (slug: string): Promise<ApiResponse<null>> => {
        const response = await api.delete(`/api/articles/${encodeURIComponent(slug)}/wishlist`);
        return toApiResponse<null>(response.data);
    },

    getWishlistedArticles: async (params?: {
        page?: number;
        size?: number;
    }): Promise<ApiResponse<SpringPage<ArticleWishlistItemResponse>>> => {
        const response = await api.get('/api/articles/wishlist', { params });
        return toApiResponse<SpringPage<ArticleWishlistItemResponse>>(response.data);
    },

    // Analytics endpoints
    getArticleAnalytics: async (articleId: number): Promise<ApiResponse<ArticleAnalytics>> => {
        const response = await api.get(`/api/admin/articles/${articleId}/analytics`);
        return toApiResponse<ArticleAnalytics>(response.data);
    },

    getArticlesAnalytics: async (filters?: { startDate?: string; endDate?: string; status?: 'all' | 'published' }): Promise<ApiResponse<ArticleMetrics[]>> => {
        const response = await api.get('/api/admin/articles/analytics', { params: filters });
        return toApiResponse<ArticleMetrics[]>(response.data);
    },

    getDashboardAnalytics: async (): Promise<ApiResponse<DashboardAnalytics>> => {
        const response = await api.get('/api/admin/articles/analytics/dashboard');
        return toApiResponse<DashboardAnalytics>(response.data);
    },

    // Track article view
    trackArticleView: async (slug: string): Promise<void> => {
        try {
            await publicApi.post(`/api/articles/${encodeURIComponent(slug)}/track-view`);
        } catch {
            // Silently fail - view tracking should not block article loading
        }
    },

    joinWaitlist: async (slug: string): Promise<ApiResponse<null>> => {
        const response = await api.post(`/api/articles/${encodeURIComponent(slug)}/waitlist`);
        return toApiResponse<null>(response.data);
    },

    // Get calendar event
    getArticleCalendar: async (slug: string): Promise<Blob> => {
        const response = await publicApi.get(`/api/articles/${encodeURIComponent(slug)}/calendar`, {
            responseType: 'blob',
        });
        return response.data;
    },

    // List endpoints
    getPublicArticlesList: async (params?: {
        status?: 'published' | 'all';
        featured?: boolean;
        page?: number;
        size?: number;
    }): Promise<ApiResponse<SpringPage<ArticleListResponse>>> => {
        const response = await publicApi.get('/api/articles', { params });
        return toApiResponse<SpringPage<ArticleListResponse>>(response.data);
    },

    getArticlesList: async (params?: {
        status?: 'all' | 'published' | 'draft';
        page?: number;
        size?: number;
    }): Promise<ApiResponse<SpringPage<ArticleListResponse>>> => {
        const response = await api.get('/api/admin/articles', { params });
        return toApiResponse<SpringPage<ArticleListResponse>>(response.data);
    },

    // Featured articles
    getFeaturedArticles: async (limit?: number): Promise<ApiResponse<ArticleListResponse[]>> => {
        const response = await publicApi.get('/api/articles/featured', { params: { limit } });
        return toApiResponse<ArticleListResponse[]>(response.data);
    },

    // Articles by category
    getArticlesByCategory: async (categorySlug: string, params?: {
        page?: number;
        size?: number;
    }): Promise<ApiResponse<SpringPage<ArticleListResponse>>> => {
        const response = await publicApi.get(`/api/articles/category/${encodeURIComponent(categorySlug)}`, { params });
        return toApiResponse<SpringPage<ArticleListResponse>>(response.data);
    },

    // Search articles
    searchArticles: async (keyword: string, params?: {
        page?: number;
        size?: number;
    }): Promise<ApiResponse<SpringPage<ArticleListResponse>>> => {
        const response = await publicApi.get('/api/articles/search', {
            params: { keyword, q: keyword, ...params },
        });
        return toApiResponse<SpringPage<ArticleListResponse>>(response.data);
    },

    getRelatedArticles: async (slug: string, params?: { limit?: number }): Promise<ApiResponse<ArticleListResponse[]>> => {
        const response = await publicApi.get(`/api/articles/${encodeURIComponent(slug)}/related`, { params });
        return toApiResponse<ArticleListResponse[]>(response.data);
    },

    // Admin statistics
    getStatistics: async (): Promise<ApiResponse<ArticleStatisticsResponse>> => {
        const response = await api.get('/api/admin/articles/statistics');
        return toApiResponse<ArticleStatisticsResponse>(response.data);
    },

    // Categories management
    getCategories: async (): Promise<ApiResponse<{ id: number; name: string; slug: string; description?: string }[]>> => {
        const response = await publicApi.get('/api/articles/categories');
        return toApiResponse(response.data);
    },

    getAdminCategories: async (): Promise<ApiResponse<ArticleCategoryResponse[]>> => {
        const response = await api.get('/api/admin/articles/categories');
        return toApiResponse<ArticleCategoryResponse[]>(response.data);
    },

    createCategory: async (data: ArticleCategoryRequest): Promise<ApiResponse<ArticleCategoryResponse>> => {
        const response = await api.post('/api/admin/articles/categories', data);
        return toApiResponse<ArticleCategoryResponse>(response.data);
    },

    updateCategory: async (categoryId: number, data: ArticleCategoryRequest): Promise<ApiResponse<ArticleCategoryResponse>> => {
        const response = await api.put(`/api/admin/articles/categories/${categoryId}`, data);
        return toApiResponse<ArticleCategoryResponse>(response.data);
    },

    deleteCategory: async (categoryId: number): Promise<ApiResponse<null>> => {
        const response = await api.delete(`/api/admin/articles/categories/${categoryId}`);
        return toApiResponse<null>(response.data);
    },

    getAdminTags: async (): Promise<ApiResponse<ArticleTagResponse[]>> => {
        const response = await api.get('/api/admin/articles/tags');
        return toApiResponse<ArticleTagResponse[]>(response.data);
    },

    createTag: async (data: ArticleTagRequest): Promise<ApiResponse<ArticleTagResponse>> => {
        const response = await api.post('/api/admin/articles/tags', data);
        return toApiResponse<ArticleTagResponse>(response.data);
    },

    deleteTag: async (tagId: number): Promise<ApiResponse<null>> => {
        const response = await api.delete(`/api/admin/articles/tags/${tagId}`);
        return toApiResponse<null>(response.data);
    },

    // Image gallery management
    uploadArticleImages: async (articleId: number, files: FormData): Promise<ApiResponse<any>> => {
        const response = await api.post(`/api/admin/articles/${articleId}/images`, files, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return toApiResponse(response.data);
    },

    addArticleImage: async (articleId: number, data: ArticleImageRequest): Promise<ApiResponse<ArticleImageResponse>> => {
        const response = await api.post(`/api/admin/articles/${articleId}/images`, data);
        return toApiResponse<ArticleImageResponse>(response.data);
    },

    removeArticleImage: async (articleId: number, imageId: number): Promise<ApiResponse<null>> => {
        const response = await api.delete(`/api/admin/articles/${articleId}/images/${imageId}`);
        return toApiResponse<null>(response.data);
    },
};
