import { User } from './auth';

export type NotificationType = 
    | 'ACTIVITY_REGISTRATION' 
    | 'TASK_ASSIGNMENT' 
    | 'TASK_SUBMISSION' 
    | 'TASK_GRADING' 
    | 'ACTIVITY_REMINDER' 
    | 'REMINDER_1_DAY' 
    | 'REMINDER_1_HOUR' 
    | 'SYSTEM_ANNOUNCEMENT' 
    | 'PROFILE_UPDATE' 
    | 'SCORE_UPDATE' 
    | 'GENERAL' 
    | 'SYSTEM' 
    | 'ACTIVITY' 
    | 'TASK' 
    | 'ANNOUNCEMENT' 
    | 'REMINDER';

export interface Notification {
    id: number;
    user?: User;
    title: string;
    content?: string;
    type: NotificationType;
    status: 'UNREAD' | 'READ' | 'ARCHIVED';
    actionUrl?: string;
    metadata?: string | Record<string, any>; // String from list API, object from detail API
    activityId?: number; // Extracted from metadata
    seriesId?: number; // Extracted from metadata
    readAt?: string; // Only present when status = READ
    createdAt: string;
    updatedAt: string;
}

export interface NotificationDetail extends Notification {
    metadata: Record<string, any>; // Always parsed from JSON string in detail API
    activityId?: number; // Extracted from metadata
    seriesId?: number; // Extracted from metadata
    readAt?: string; // Only present when status = READ
}

export interface NotificationFilters {
    type?: string;
    status?: string;
    page?: number;
    size?: number;
    sort?: string; // e.g., "createdAt,desc"
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
        case 'ACTIVITY_REGISTRATION':
            return 'Đăng ký sự kiện';
        case 'TASK_ASSIGNMENT':
            return 'Giao nhiệm vụ';
        case 'TASK_SUBMISSION':
            return 'Nộp bài';
        case 'TASK_GRADING':
            return 'Chấm điểm';
        case 'ACTIVITY_REMINDER':
            return 'Nhắc nhở sự kiện';
        case 'REMINDER_1_DAY':
            return 'Nhắc nhở 1 ngày';
        case 'REMINDER_1_HOUR':
            return 'Nhắc nhở 1 giờ';
        case 'SYSTEM_ANNOUNCEMENT':
            return 'Thông báo hệ thống';
        case 'PROFILE_UPDATE':
            return 'Cập nhật hồ sơ';
        case 'SCORE_UPDATE':
            return 'Cập nhật điểm';
        case 'GENERAL':
            return 'Thông báo chung';
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
        case 'ACTIVITY_REGISTRATION':
        case 'ACTIVITY_REMINDER':
        case 'ACTIVITY':
            return 'bg-green-100 text-green-800';
        case 'TASK_ASSIGNMENT':
        case 'TASK_SUBMISSION':
        case 'TASK_GRADING':
        case 'TASK':
            return 'bg-yellow-100 text-yellow-800';
        case 'REMINDER_1_DAY':
        case 'REMINDER_1_HOUR':
        case 'REMINDER':
            return 'bg-orange-100 text-orange-800';
        case 'SYSTEM_ANNOUNCEMENT':
        case 'SYSTEM':
            return 'bg-blue-100 text-blue-800';
        case 'PROFILE_UPDATE':
            return 'bg-indigo-100 text-indigo-800';
        case 'SCORE_UPDATE':
            return 'bg-purple-100 text-purple-800';
        case 'GENERAL':
        case 'ANNOUNCEMENT':
            return 'bg-purple-100 text-purple-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};
