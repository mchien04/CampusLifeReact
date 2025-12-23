import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';
import { NotificationDetail } from '../types/notification';
import { notificationAPI } from '../services/notificationAPI';
import { getNotificationTypeLabel, getNotificationTypeColor } from '../types/notification';
import { LoadingSpinner } from '../components/common';
import { toast } from 'react-toastify';
import StudentLayout from '../components/layout/StudentLayout';

const NotificationDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { userRole } = useAuth();
    const [notification, setNotification] = useState<NotificationDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [navigating, setNavigating] = useState(false);

    useEffect(() => {
        if (id) {
            loadNotificationDetail();
        }
    }, [id]);

    const loadNotificationDetail = async () => {
        if (!id) return;
        
        try {
            setLoading(true);
            const detail = await notificationAPI.getNotificationDetail(parseInt(id));
            setNotification(detail);

            // Auto mark as read if unread
            if (detail.status === 'UNREAD') {
                try {
                    await notificationAPI.markAsRead(detail.id);
                    setNotification(prev => prev ? { ...prev, status: 'READ' as const, readAt: new Date().toISOString() } : null);
                } catch (error) {
                    console.error('Error marking notification as read:', error);
                }
            }
        } catch (error: any) {
            console.error('Error loading notification detail:', error);
            if (error.response?.status === 404) {
                toast.error('Thông báo không tồn tại');
                navigate(userRole === Role.STUDENT ? '/notifications' : '/manager/notifications');
            } else {
                toast.error('Không thể tải chi tiết thông báo');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = async () => {
        if (!notification) return;

        try {
            setNavigating(true);

            // Navigate based on priority: actionUrl > activityId > seriesId
            if (notification.actionUrl) {
                // Check if it's a full URL or relative path
                if (notification.actionUrl.startsWith('http://') || notification.actionUrl.startsWith('https://')) {
                    window.location.href = notification.actionUrl;
                } else {
                    navigate(notification.actionUrl);
                }
            } else if (notification.activityId) {
                // Navigate to activity detail
                if (userRole === Role.STUDENT) {
                    navigate(`/student/events/${notification.activityId}`);
                } else {
                    navigate(`/manager/events/${notification.activityId}`);
                }
            } else if (notification.seriesId) {
                // Navigate to series detail
                if (userRole === Role.STUDENT) {
                    navigate(`/student/series/${notification.seriesId}`);
                } else {
                    navigate(`/manager/series/${notification.seriesId}`);
                }
            } else {
                toast.info('Thông báo này không có liên kết');
            }
        } catch (error) {
            console.error('Error navigating:', error);
            toast.error('Không thể điều hướng');
        } finally {
            setNavigating(false);
        }
    };

    const handleDelete = async () => {
        if (!notification) return;
        
        if (window.confirm('Bạn có chắc muốn xóa thông báo này?')) {
            try {
                await notificationAPI.deleteNotification(notification.id);
                toast.success('Đã xóa thông báo');
                navigate(userRole === Role.STUDENT ? '/notifications' : '/manager/notifications');
            } catch (error) {
                console.error('Error deleting notification:', error);
                toast.error('Không thể xóa thông báo');
            }
        }
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex justify-center items-center py-12">
                    <LoadingSpinner />
                </div>
            );
        }

        if (!notification) {
            return (
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
                        <div className="text-gray-400 text-6xl mb-4">❌</div>
                        <p className="text-lg text-gray-600 mb-4">Không tìm thấy thông báo</p>
                        <button
                            onClick={() => navigate(userRole === Role.STUDENT ? '/notifications' : '/manager/notifications')}
                            className="px-4 py-2 bg-[#001C44] text-white rounded-lg hover:bg-[#002A66]"
                        >
                            Quay lại danh sách
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate(userRole === Role.STUDENT ? '/notifications' : '/manager/notifications')}
                        className="flex items-center text-gray-600 hover:text-[#001C44] mb-4 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Quay lại danh sách thông báo
                    </button>
                </div>

                {/* Notification Card */}
                <div className={`bg-white rounded-xl shadow-lg border border-gray-100 p-8 ${
                    notification.status === 'UNREAD' ? 'border-l-4 border-l-blue-500' : ''
                }`}>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getNotificationTypeColor(notification.type)}`}>
                                    {getNotificationTypeLabel(notification.type)}
                                </span>
                                {notification.status === 'UNREAD' && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                        Chưa đọc
                                    </span>
                                )}
                                {notification.status === 'READ' && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                        Đã đọc
                                    </span>
                                )}
                                {(notification.activityId || notification.seriesId) && (
                                    <span className="text-sm text-blue-600">
                                        {notification.activityId ? `📅 Sự kiện #${notification.activityId}` : `📋 Chuỗi #${notification.seriesId}`}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                {notification.title}
                            </h1>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>📅 Tạo: {formatDate(notification.createdAt)}</span>
                                {notification.readAt && (
                                    <span>✅ Đã đọc: {formatDate(notification.readAt)}</span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={handleDelete}
                            className="ml-4 p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Xóa thông báo"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    {notification.content && (
                        <div className="mb-6">
                            <div className="prose max-w-none">
                                <p className="text-gray-700 text-lg whitespace-pre-wrap">
                                    {notification.content}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Metadata (if available and not just activityId/seriesId) */}
                    {notification.metadata && 
                     typeof notification.metadata === 'object' && 
                     Object.keys(notification.metadata).length > 0 &&
                     (!notification.activityId && !notification.seriesId || Object.keys(notification.metadata).length > 1) && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Metadata:</h3>
                            <pre className="text-xs text-gray-600 overflow-auto">
                                {JSON.stringify(notification.metadata, null, 2)}
                            </pre>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
                        {(notification.actionUrl || notification.activityId || notification.seriesId) && (
                            <button
                                onClick={handleNavigate}
                                disabled={navigating}
                                className="px-6 py-3 bg-[#001C44] text-white rounded-lg hover:bg-[#002A66] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                {navigating ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Đang điều hướng...
                                    </>
                                ) : (
                                    <>
                                        {notification.activityId ? 'Xem chi tiết sự kiện' : 
                                         notification.seriesId ? 'Xem chi tiết chuỗi sự kiện' : 
                                         'Đi đến liên kết'}
                                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Wrap with StudentLayout if user is a student
    if (userRole === Role.STUDENT) {
        return <StudentLayout>{renderContent()}</StudentLayout>;
    }

    return renderContent();
};

export default NotificationDetailPage;

