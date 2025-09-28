import { User } from './auth';

export interface Notification {
    id: number;
    user: User;
    title: string;
    content?: string;
    type: 'SYSTEM' | 'ACTIVITY' | 'TASK' | 'ANNOUNCEMENT' | 'REMINDER';
    status: 'UNREAD' | 'READ' | 'ARCHIVED';
    actionUrl?: string;
    metadata?: string;
    createdAt: string;
    updatedAt: string;
}

export interface NotificationFilters {
    type?: string;
    status?: string;
    page?: number;
    size?: number;
}

export interface NotificationListResponse {
    content: Notification[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}

export interface UnreadCountResponse {
    count: number;
}

export const NOTIFICATION_STATUS = {
    UNREAD: 'UNREAD',
    READ: 'READ',
    ARCHIVED: 'ARCHIVED',
} as const;

export const getNotificationTypeLabel = (type: string): string => {
    switch (type) {
        case 'SYSTEM':
            return 'Hệ thống';
        case 'ACTIVITY':
            return 'Sự kiện';
        case 'TASK':
            return 'Nhiệm vụ';
        case 'ANNOUNCEMENT':
            return 'Thông báo';
        case 'REMINDER':
            return 'Nhắc nhở';
        default:
            return type;
    }
};

export const getNotificationTypeColor = (type: string): string => {
    switch (type) {
        case 'SYSTEM':
            return 'bg-blue-100 text-blue-800';
        case 'ACTIVITY':
            return 'bg-green-100 text-green-800';
        case 'TASK':
            return 'bg-yellow-100 text-yellow-800';
        case 'ANNOUNCEMENT':
            return 'bg-purple-100 text-purple-800';
        case 'REMINDER':
            return 'bg-orange-100 text-orange-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};
