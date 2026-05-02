import api from './api';
import publicApi from './publicApi';
import type {
    ApiResponse,
    EventArticleAdminResponse,
    EventArticleDetailResponse,
    EventArticleUpsertRequest,
    WishlistToggleResponse,
    ArticleAnalytics,
    ArticleMetrics,
    DashboardAnalytics,
    ArticleListResponse,
    SpringPage,
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

    // Wishlist endpoints
    toggleWishlist: async (articleId: number): Promise<ApiResponse<WishlistToggleResponse>> => {
        const response = await api.post(`/api/articles/${articleId}/wishlist`);
        return toApiResponse<WishlistToggleResponse>(response.data);
    },

    getWishlistStatus: async (articleId: number): Promise<ApiResponse<{ isWishlisted: boolean }>> => {
        const response = await api.get(`/api/articles/${articleId}/wishlist/status`);
        return toApiResponse<{ isWishlisted: boolean }>(response.data);
    },

    getWishlistedArticles: async (): Promise<ApiResponse<EventArticleDetailResponse[]>> => {
        const response = await api.get('/api/articles/wishlist');
        return toApiResponse<EventArticleDetailResponse[]>(response.data);
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
    getFeaturedArticles: async (limit?: number): Promise<ApiResponse<EventArticleDetailResponse[]>> => {
        const response = await publicApi.get('/api/articles/featured', { params: { limit } });
        return toApiResponse<EventArticleDetailResponse[]>(response.data);
    },

    // Articles by category
    getArticlesByCategory: async (categorySlug: string, filters?: {
        limit?: number;
        offset?: number;
    }): Promise<ApiResponse<EventArticleDetailResponse[]>> => {
        const response = await publicApi.get(`/api/articles/category/${encodeURIComponent(categorySlug)}`, { params: filters });
        return toApiResponse<EventArticleDetailResponse[]>(response.data);
    },

    // Search articles
    searchArticles: async (query: string, filters?: {
        limit?: number;
        offset?: number;
    }): Promise<ApiResponse<EventArticleDetailResponse[]>> => {
        const response = await publicApi.get('/api/articles/search', { params: { q: query, ...filters } });
        return toApiResponse<EventArticleDetailResponse[]>(response.data);
    },

    // Admin statistics
    getStatistics: async (): Promise<ApiResponse<{
        totalViews: number;
        totalArticles: number;
        featuredArticles: number;
        categoryDistribution: { name: string; count: number }[];
        topArticles: ArticleMetrics[];
    }>> => {
        const response = await api.get('/api/admin/articles/statistics');
        return toApiResponse(response.data);
    },

    // Categories management
    getCategories: async (): Promise<ApiResponse<{ id: number; name: string; slug: string; description?: string }[]>> => {
        const response = await publicApi.get('/api/articles/categories');
        return toApiResponse(response.data);
    },

    createCategory: async (data: { name: string; slug: string; description?: string }): Promise<ApiResponse<any>> => {
        const response = await api.post('/api/admin/articles/categories', data);
        return toApiResponse(response.data);
    },

    updateCategory: async (categoryId: number, data: { name?: string; slug?: string; description?: string }): Promise<ApiResponse<any>> => {
        const response = await api.put(`/api/admin/articles/categories/${categoryId}`, data);
        return toApiResponse(response.data);
    },

    deleteCategory: async (categoryId: number): Promise<ApiResponse<any>> => {
        const response = await api.delete(`/api/admin/articles/categories/${categoryId}`);
        return toApiResponse(response.data);
    },

    // Image gallery management
    uploadArticleImages: async (articleId: number, files: FormData): Promise<ApiResponse<any>> => {
        const response = await api.post(`/api/admin/articles/${articleId}/images`, files, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return toApiResponse(response.data);
    },
};