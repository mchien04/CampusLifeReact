import { Notification } from '../../types/notification';
import { Role } from '../../types';

// Mock notifications data for different roles
const mockNotifications: Record<Role, Notification[]> = {
    [Role.ADMIN]: [
        {
            id: 1,
            user: { id: 1, username: 'admin', role: Role.ADMIN } as any,
            title: 'Hệ thống cập nhật thành công',
            content: 'Hệ thống đã được cập nhật lên phiên bản mới nhất',
            type: 'SYSTEM',
            status: 'UNREAD',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 2,
            user: { id: 1, username: 'admin', role: Role.ADMIN } as any,
            title: 'Có 5 đăng ký mới cần duyệt',
            content: 'Có 5 sinh viên đăng ký sự kiện "Hội trại xuân" cần được duyệt',
            type: 'ACTIVITY',
            status: 'UNREAD',
            actionUrl: '/manager/registrations',
            createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 3,
            user: { id: 1, username: 'admin', role: Role.ADMIN } as any,
            title: 'Báo cáo tháng đã sẵn sàng',
            content: 'Báo cáo thống kê tháng 1/2025 đã được tạo',
            type: 'ANNOUNCEMENT',
            status: 'READ',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
    ],
    [Role.MANAGER]: [
        {
            id: 4,
            user: { id: 2, username: 'manager', role: Role.MANAGER } as any,
            title: 'Sự kiện "Hội trại xuân" sắp diễn ra',
            content: 'Sự kiện sẽ bắt đầu vào ngày mai. Vui lòng chuẩn bị check-in',
            type: 'REMINDER',
            status: 'UNREAD',
            actionUrl: '/manager/events',
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 5,
            user: { id: 2, username: 'manager', role: Role.MANAGER } as any,
            title: 'Có 3 bài nộp mới cần chấm điểm',
            content: 'Sinh viên đã nộp bài cho nhiệm vụ "Viết báo cáo"',
            type: 'TASK',
            status: 'UNREAD',
            actionUrl: '/manager/tasks',
            createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 6,
            user: { id: 2, username: 'manager', role: Role.MANAGER } as any,
            title: 'Đăng ký sự kiện đã đầy',
            content: 'Sự kiện "Workshop kỹ năng" đã đạt số lượng đăng ký tối đa',
            type: 'ACTIVITY',
            status: 'READ',
            createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        },
    ],
    [Role.STUDENT]: [
        {
            id: 7,
            user: { id: 3, username: 'student', role: Role.STUDENT } as any,
            title: 'Đăng ký sự kiện thành công',
            content: 'Bạn đã đăng ký thành công sự kiện "Hội trại xuân"',
            type: 'ACTIVITY',
            status: 'UNREAD',
            actionUrl: '/student/events',
            createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
        {
            id: 8,
            user: { id: 3, username: 'student', role: Role.STUDENT } as any,
            title: 'Bạn có nhiệm vụ mới',
            content: 'Bạn được phân công nhiệm vụ "Viết báo cáo" cho sự kiện "Hội trại xuân"',
            type: 'TASK',
            status: 'UNREAD',
            actionUrl: '/student/tasks',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 9,
            user: { id: 3, username: 'student', role: Role.STUDENT } as any,
            title: 'Điểm rèn luyện đã được cập nhật',
            content: 'Điểm rèn luyện học kỳ 1 của bạn là 85 điểm',
            type: 'SYSTEM',
            status: 'READ',
            createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        },
    ],
};

// Store for managing notification state (simulating backend)
let notificationStore: Record<Role, Notification[]> = {
    [Role.ADMIN]: [...mockNotifications[Role.ADMIN]],
    [Role.MANAGER]: [...mockNotifications[Role.MANAGER]],
    [Role.STUDENT]: [...mockNotifications[Role.STUDENT]],
};

export const getMockNotifications = (role: Role): Notification[] => {
    return notificationStore[role] || [];
};

export const updateMockNotification = (role: Role, notificationId: number, updates: Partial<Notification>) => {
    const notifications = notificationStore[role] || [];
    const index = notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
        notificationStore[role][index] = { ...notificationStore[role][index], ...updates };
    }
};

export const markAllAsReadMock = (role: Role) => {
    notificationStore[role] = notificationStore[role].map(n => ({
        ...n,
        status: 'READ' as const
    }));
};

export const getUnreadCountMock = (role: Role): number => {
    return (notificationStore[role] || []).filter(n => n.status === 'UNREAD').length;
};

