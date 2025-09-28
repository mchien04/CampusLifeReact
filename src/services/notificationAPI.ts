import api from './api';
import {
    Notification,
    NotificationFilters,
    NotificationListResponse,
    UnreadCountResponse
} from '../types/notification';

export const notificationAPI = {
    // Lấy danh sách thông báo
    getNotifications: async (filters?: NotificationFilters): Promise<NotificationListResponse> => {
        const params = new URLSearchParams();
        if (filters?.type) params.append('type', filters.type);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.size) params.append('size', filters.size.toString());

        const response = await api.get(`/api/notifications?${params.toString()}`);
        return response.data.body;
    },

    // Lấy thông báo chưa đọc
    getUnreadNotifications: async (): Promise<Notification[]> => {
        const response = await api.get('/api/notifications/unread');
        return response.data.body;
    },

    // Đánh dấu đã đọc
    markAsRead: async (notificationId: number): Promise<void> => {
        await api.put(`/api/notifications/${notificationId}/read`);
    },

    // Đánh dấu tất cả đã đọc
    markAllAsRead: async (): Promise<void> => {
        await api.put('/api/notifications/read-all');
    },

    // Đếm thông báo chưa đọc
    getUnreadCount: async (): Promise<UnreadCountResponse> => {
        const response = await api.get('/api/notifications/unread-count');
        return response.data.body;
    },
};
