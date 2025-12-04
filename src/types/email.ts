import { ApiResponse } from './common';

// Enums
export enum RecipientType {
    INDIVIDUAL = "INDIVIDUAL",
    BULK = "BULK",
    ACTIVITY_REGISTRATIONS = "ACTIVITY_REGISTRATIONS",
    SERIES_REGISTRATIONS = "SERIES_REGISTRATIONS",
    ALL_STUDENTS = "ALL_STUDENTS",
    BY_CLASS = "BY_CLASS",
    BY_DEPARTMENT = "BY_DEPARTMENT",
    CUSTOM_LIST = "CUSTOM_LIST"
}

export enum EmailStatus {
    SUCCESS = "SUCCESS",
    FAILED = "FAILED",
    PARTIAL = "PARTIAL"
}

export enum NotificationType {
    SYSTEM_ANNOUNCEMENT = "SYSTEM_ANNOUNCEMENT",
    ACTIVITY_REGISTRATION = "ACTIVITY_REGISTRATION",
    GENERAL = "GENERAL"
}

// Interfaces
export interface SendEmailRequest {
    recipientType: RecipientType;
    recipientIds?: number[];
    activityId?: number;
    seriesId?: number;
    classId?: number;
    departmentId?: number;
    subject: string;
    content: string;
    isHtml?: boolean;
    templateVariables?: Record<string, string>;
    createNotification?: boolean;
    notificationTitle?: string;
    notificationType?: NotificationType;
    notificationActionUrl?: string;
}

export interface SendNotificationOnlyRequest {
    recipientType: RecipientType;
    recipientIds?: number[];
    activityId?: number;
    seriesId?: number;
    classId?: number;
    departmentId?: number;
    title: string;
    content: string;
    type: NotificationType;
    actionUrl?: string;
}

export interface EmailAttachmentResponse {
    id: number;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    contentType: string;
}

export interface EmailHistoryResponse {
    id: number;
    senderId: number;
    senderName: string;
    recipientId?: number;
    recipientEmail: string;
    subject: string;
    content: string;
    isHtml: boolean;
    recipientType: RecipientType;
    recipientCount: number;
    sentAt: string;
    status: EmailStatus;
    errorMessage?: string;
    notificationCreated: boolean;
    attachments: EmailAttachmentResponse[];
}

export interface EmailSendResult {
    totalRecipients: number;
    successCount: number;
    failedCount: number;
    status: EmailStatus;
    emailHistories?: EmailHistoryResponse[];
}

export interface NotificationSendResult {
    totalRecipients: number;
    successCount: number;
    failedCount: number;
}

export interface EmailHistoryPage {
    content: EmailHistoryResponse[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

// Helper functions
export const getRecipientTypeLabel = (recipientType: RecipientType): string => {
    const labels: Record<RecipientType, string> = {
        [RecipientType.INDIVIDUAL]: "Cá nhân",
        [RecipientType.BULK]: "Hàng loạt",
        [RecipientType.ACTIVITY_REGISTRATIONS]: "Danh sách đăng ký sự kiện",
        [RecipientType.SERIES_REGISTRATIONS]: "Danh sách đăng ký chuỗi sự kiện",
        [RecipientType.ALL_STUDENTS]: "Tất cả sinh viên",
        [RecipientType.BY_CLASS]: "Theo lớp",
        [RecipientType.BY_DEPARTMENT]: "Theo khoa",
        [RecipientType.CUSTOM_LIST]: "Danh sách tùy chọn"
    };
    return labels[recipientType] || recipientType;
};

export const getEmailStatusLabel = (status: EmailStatus): string => {
    const labels: Record<EmailStatus, string> = {
        [EmailStatus.SUCCESS]: "Thành công",
        [EmailStatus.FAILED]: "Thất bại",
        [EmailStatus.PARTIAL]: "Một phần"
    };
    return labels[status] || status;
};

export const getEmailStatusColor = (status: EmailStatus): string => {
    const colors: Record<EmailStatus, string> = {
        [EmailStatus.SUCCESS]: "bg-green-100 text-green-800",
        [EmailStatus.FAILED]: "bg-red-100 text-red-800",
        [EmailStatus.PARTIAL]: "bg-yellow-100 text-yellow-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
};

export const getNotificationTypeLabel = (type: NotificationType): string => {
    const labels: Record<NotificationType, string> = {
        [NotificationType.SYSTEM_ANNOUNCEMENT]: "Thông báo hệ thống",
        [NotificationType.ACTIVITY_REGISTRATION]: "Đăng ký sự kiện",
        [NotificationType.GENERAL]: "Chung"
    };
    return labels[type] || type;
};

