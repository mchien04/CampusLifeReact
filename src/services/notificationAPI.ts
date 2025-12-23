import api from './api';
import {
    Notification,
    NotificationDetail,
    NotificationFilters,
    NotificationListResponse,
    UnreadCountResponse
} from '../types/notification';

export const notificationAPI = {
    // Lấy danh sách thông báo của user hiện tại
    getNotifications: async (filters?: NotificationFilters): Promise<NotificationListResponse> => {
        const params = new URLSearchParams();
        
        // Pageable parameters
        const page = filters?.page || 0;
        const size = filters?.size || 10;
        params.append('page', page.toString());
        params.append('size', size.toString());
        
        // Optional filters
        if (filters?.type) {
            params.append('type', filters.type);
        }
        if (filters?.status) {
            params.append('status', filters.status);
        }
        if (filters?.sort) {
            params.append('sort', filters.sort);
        }

        const response = await api.get(`/api/notifications?${params.toString()}`);
        
        // Backend returns Response wrapper, extract body/data
        const responseData = response.data.body || response.data.data || response.data;
        
        // If backend returns Page object directly
        if (responseData.content) {
            return responseData;
        }
        
        // If backend returns array, wrap it in Page format
        if (Array.isArray(responseData)) {
            return {
                content: responseData,
                totalElements: responseData.length,
                totalPages: Math.ceil(responseData.length / size),
                size: size,
                number: page,
                first: page === 0,
                last: (page + 1) * size >= responseData.length,
            };
        }
        
        return responseData;
    },

    // Lấy thông báo chưa đọc
    getUnreadNotifications: async (): Promise<Notification[]> => {
        const response = await api.get('/api/notifications/unread');
        const responseData = response.data.body || response.data.data || response.data;
        
        // Backend may return array or wrapped in Response
        if (Array.isArray(responseData)) {
            return responseData;
        }
        
        // If wrapped, extract array
        return Array.isArray(responseData) ? responseData : [];
    },

    // Đánh dấu thông báo đã đọc
    markAsRead: async (notificationId: number): Promise<void> => {
        await api.put(`/api/notifications/${notificationId}/read`);
    },

    // Đánh dấu tất cả thông báo đã đọc
    markAllAsRead: async (): Promise<void> => {
        await api.put('/api/notifications/read-all');
    },

    // Đếm số lượng thông báo chưa đọc
    getUnreadCount: async (): Promise<UnreadCountResponse> => {
        const response = await api.get('/api/notifications/unread-count');
        const responseData = response.data.body || response.data.data || response.data;
        
        // Backend may return { count: number } or just number
        if (typeof responseData === 'number') {
            return { count: responseData };
        }
        
        if (responseData && typeof responseData.count === 'number') {
            return responseData;
        }
        
        // Fallback
        return { count: 0 };
    },

    // Xóa thông báo
    deleteNotification: async (notificationId: number): Promise<void> => {
        await api.delete(`/api/notifications/${notificationId}`);
    },

    // Lưu trữ thông báo
    archiveNotification: async (notificationId: number): Promise<void> => {
        await api.put(`/api/notifications/${notificationId}/archive`);
    },

    // Lấy chi tiết thông báo (với metadata đã parse)
    getNotificationDetail: async (notificationId: number): Promise<NotificationDetail> => {
        const response = await api.get(`/api/notifications/${notificationId}`);
        const responseData = response.data.body || response.data.data || response.data;
        return responseData;
    },
};
