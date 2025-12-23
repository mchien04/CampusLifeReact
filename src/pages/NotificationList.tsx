import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';
import { Notification, NotificationFilters } from '../types/notification';
import { notificationAPI } from '../services/notificationAPI';
import { getNotificationTypeLabel, getNotificationTypeColor } from '../types/notification';
import { LoadingSpinner } from '../components/common';
import { toast } from 'react-toastify';
import StudentLayout from '../components/layout/StudentLayout';

const NotificationList: React.FC = () => {
    const navigate = useNavigate();
    const { userRole } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [filters, setFilters] = useState<NotificationFilters>({
        page: 0,
        size: 20,
        sort: 'createdAt,desc'
    });

    useEffect(() => {
        loadUnreadCount();
        loadNotifications();
    }, [filters]);

    const loadUnreadCount = async () => {
        try {
            const data = await notificationAPI.getUnreadCount();
            setUnreadCount(data.count);
        } catch (error) {
            console.error('Error loading unread count:', error);
        }
    };

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const data = await notificationAPI.getNotifications(filters);
            setNotifications(data.content || []);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements);
            setPage(data.number);
        } catch (error) {
            console.error('Error loading notifications:', error);
            toast.error('Không thể tải danh sách thông báo');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationAPI.markAllAsRead();
            await loadUnreadCount();
            await loadNotifications();
            toast.success('Đã đánh dấu tất cả thông báo đã đọc');
        } catch (error) {
            console.error('Error marking all as read:', error);
            toast.error('Không thể đánh dấu tất cả đã đọc');
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        try {
            // Mark as read if unread
            if (notification.status === 'UNREAD') {
                await notificationAPI.markAsRead(notification.id);
                await loadUnreadCount();
                setNotifications(prev =>
                    prev.map(n => n.id === notification.id ? { ...n, status: 'READ' as const } : n)
                );
            }

            // Navigate to detail page
            if (userRole === Role.STUDENT) {
                navigate(`/notifications/${notification.id}`);
            } else {
                navigate(`/manager/notifications/${notification.id}`);
            }
        } catch (error) {
            console.error('Error handling notification click:', error);
        }
    };

    const handleDelete = async (notificationId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Bạn có chắc muốn xóa thông báo này?')) {
            try {
                await notificationAPI.deleteNotification(notificationId);
                await loadNotifications();
                await loadUnreadCount();
                toast.success('Đã xóa thông báo');
            } catch (error) {
                console.error('Error deleting notification:', error);
                toast.error('Không thể xóa thông báo');
            }
        }
    };

    const handleFilterChange = (key: keyof NotificationFilters, value: string | number | undefined) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            page: 0 // Reset to first page when filter changes
        }));
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInHours < 1) {
            return 'Vừa xong';
        } else if (diffInHours < 24) {
            return `${diffInHours} giờ trước`;
        } else if (diffInDays === 1) {
            return 'Hôm qua';
        } else if (diffInDays < 7) {
            return `${diffInDays} ngày trước`;
        } else {
            return date.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };

    if (loading && notifications.length === 0) {
        return (
            <div className="flex justify-center items-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    const content = (
        <div className="max-w-7xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-xl shadow-lg p-6 text-white mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center">
                            <span className="mr-3 text-4xl">🔔</span>
                            Thông báo
                        </h1>
                        <p className="text-gray-200 text-lg">
                            {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Tất cả thông báo đã đọc'}
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="px-4 py-2 bg-[#FFD66D] text-[#001C44] rounded-lg hover:bg-[#FFC947] font-medium transition-colors"
                        >
                            Đánh dấu tất cả đã đọc
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Loại thông báo
                        </label>
                        <select
                            value={filters.type || ''}
                            onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                        >
                            <option value="">Tất cả</option>
                            <option value="ACTIVITY_REGISTRATION">Đăng ký sự kiện</option>
                            <option value="TASK_ASSIGNMENT">Giao nhiệm vụ</option>
                            <option value="TASK_SUBMISSION">Nộp bài</option>
                            <option value="TASK_GRADING">Chấm điểm</option>
                            <option value="ACTIVITY_REMINDER">Nhắc nhở sự kiện</option>
                            <option value="SYSTEM_ANNOUNCEMENT">Thông báo hệ thống</option>
                            <option value="SCORE_UPDATE">Cập nhật điểm</option>
                            <option value="GENERAL">Thông báo chung</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Trạng thái
                        </label>
                        <select
                            value={filters.status || ''}
                            onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                        >
                            <option value="">Tất cả</option>
                            <option value="UNREAD">Chưa đọc</option>
                            <option value="READ">Đã đọc</option>
                            <option value="ARCHIVED">Đã lưu trữ</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sắp xếp
                        </label>
                        <select
                            value={filters.sort || 'createdAt,desc'}
                            onChange={(e) => handleFilterChange('sort', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                        >
                            <option value="createdAt,desc">Mới nhất trước</option>
                            <option value="createdAt,asc">Cũ nhất trước</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
                        <div className="text-gray-400 text-6xl mb-4">🔔</div>
                        <p className="text-lg text-gray-600">Chưa có thông báo nào</p>
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`bg-white rounded-xl shadow-lg border border-gray-100 p-6 cursor-pointer hover:shadow-xl transition-all ${
                                notification.status === 'UNREAD' ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getNotificationTypeColor(notification.type)}`}>
                                            {getNotificationTypeLabel(notification.type)}
                                        </span>
                                        {notification.status === 'UNREAD' && (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                Chưa đọc
                                            </span>
                                        )}
                                        {(notification.activityId || notification.seriesId) && (
                                            <span className="text-xs text-blue-600">
                                                {notification.activityId ? `📅 Sự kiện #${notification.activityId}` : `📋 Chuỗi #${notification.seriesId}`}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        {notification.title}
                                    </h3>
                                    {notification.content && (
                                        <p className="text-gray-600 mb-3 line-clamp-3">
                                            {notification.content}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span>📅 {formatDate(notification.createdAt)}</span>
                                        {notification.readAt && (
                                            <span>✅ Đã đọc: {formatDate(notification.readAt)}</span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(notification.id, e)}
                                    className="ml-4 p-2 text-gray-400 hover:text-red-600 transition-colors"
                                    title="Xóa thông báo"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                    <button
                        onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 0) - 1 }))}
                        disabled={page === 0}
                        className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                        Trước
                    </button>
                    <span className="px-4 py-2 text-gray-700">
                        Trang {page + 1} / {totalPages} ({totalElements} thông báo)
                    </span>
                    <button
                        onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 0) + 1 }))}
                        disabled={page >= totalPages - 1}
                        className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                        Sau
                    </button>
                </div>
            )}
        </div>
    );

    // Wrap with StudentLayout if user is a student
    if (userRole === Role.STUDENT) {
        return <StudentLayout>{content}</StudentLayout>;
    }

    return content;
};

export default NotificationList;

