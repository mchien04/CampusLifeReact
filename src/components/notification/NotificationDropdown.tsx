import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Notification, NotificationFilters } from '../../types';
import { notificationAPI } from '../../services';
import { getNotificationTypeLabel, getNotificationTypeColor } from '../../types/notification';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';

interface NotificationDropdownProps {
    onNotificationClick?: (notification: Notification) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
    onNotificationClick,
}) => {
    const navigate = useNavigate();
    const { userRole } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState<number | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadUnreadCount();
        if (isOpen) {
            loadNotifications();
        }
    }, [isOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const loadUnreadCount = async () => {
        try {
            const data = await notificationAPI.getUnreadCount();
            setUnreadCount(data.count);
        } catch (error) {
            console.error('Error loading unread count:', error);
            setUnreadCount(0);
        }
    };

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const data = await notificationAPI.getNotifications({ 
                size: 10,
                sort: 'createdAt,desc'
            });
            setNotifications(data.content || []);
        } catch (error) {
            console.error('Error loading notifications:', error);
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        try {
            setLoadingDetail(notification.id);
            
            // Mark as read if unread
            if (notification.status === 'UNREAD') {
                try {
                    await notificationAPI.markAsRead(notification.id);
                    setUnreadCount(prev => Math.max(0, prev - 1));
                    setNotifications(prev =>
                        prev.map(n => n.id === notification.id ? { ...n, status: 'READ' as const } : n)
                    );
                } catch (error) {
                    console.error('Error marking notification as read:', error);
                }
            }

            // Fetch detail to get parsed metadata and activityId/seriesId
            try {
                const detail = await notificationAPI.getNotificationDetail(notification.id);
                
                // Close dropdown
                setIsOpen(false);

                // Navigate based on priority: actionUrl > activityId > seriesId
                if (detail.actionUrl) {
                    // Check if it's a full URL or relative path
                    if (detail.actionUrl.startsWith('http://') || detail.actionUrl.startsWith('https://')) {
                        window.location.href = detail.actionUrl;
                    } else {
                        navigate(detail.actionUrl);
                    }
                } else if (detail.activityId) {
                    // Navigate to activity detail
                    if (userRole === Role.STUDENT) {
                        navigate(`/student/events/${detail.activityId}`);
                    } else {
                        navigate(`/manager/events/${detail.activityId}`);
                    }
                } else if (detail.seriesId) {
                    // Navigate to series detail
                    if (userRole === Role.STUDENT) {
                        navigate(`/student/series/${detail.seriesId}`);
                    } else {
                        navigate(`/manager/series/${detail.seriesId}`);
                    }
                } else {
                    // Navigate to notification detail page
                    if (userRole === Role.STUDENT) {
                        navigate(`/notifications/${notification.id}`);
                    } else {
                        navigate(`/manager/notifications/${notification.id}`);
                    }
                }

                if (onNotificationClick) {
                    onNotificationClick(notification);
                }
            } catch (error) {
                console.error('Error fetching notification detail:', error);
                // Fallback: navigate to notification detail page
                setIsOpen(false);
                if (userRole === Role.STUDENT) {
                    navigate(`/notifications/${notification.id}`);
                } else {
                    navigate(`/manager/notifications/${notification.id}`);
                }
            }
        } finally {
            setLoadingDetail(null);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationAPI.markAllAsRead();
            setUnreadCount(0);
            setNotifications(prev =>
                prev.map(n => ({ ...n, status: 'READ' as const }))
            );
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) {
            return 'Vừa xong';
        } else if (diffInHours < 24) {
            return `${diffInHours} giờ trước`;
        } else if (diffInHours < 48) {
            return 'Hôm qua';
        } else {
            return date.toLocaleDateString('vi-VN');
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Notification Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-[#001C44] focus:outline-none focus:ring-2 focus:ring-[#001C44] rounded-full transition-colors"
            >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>

                {/* Unread Count Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 z-50 border border-gray-100 overflow-hidden">
                    <div className="py-0">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] px-4 py-4 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-bold flex items-center">
                                        <span className="mr-2 text-xl">🔔</span>
                                        Thông báo
                                    </h3>
                                    {unreadCount > 0 && (
                                        <p className="text-xs text-gray-200 mt-1">
                                            {unreadCount} thông báo chưa đọc
                                        </p>
                                    )}
                                </div>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1.5 rounded-lg font-medium transition-colors"
                                    >
                                        Đánh dấu tất cả
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="px-4 py-12 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#001C44] mx-auto"></div>
                                    <p className="mt-3 text-sm text-gray-500">Đang tải thông báo...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="px-4 py-12 text-center">
                                    <div className="text-gray-300 text-5xl mb-3">🔔</div>
                                    <p className="text-sm text-gray-500 font-medium">Chưa có thông báo nào</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`px-4 py-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 relative transition-all ${
                                            notification.status === 'UNREAD' ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'bg-white'
                                        } ${loadingDetail === notification.id ? 'opacity-50 pointer-events-none' : ''}`}
                                    >
                                        {loadingDetail === notification.id && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10 rounded-lg">
                                                <div className="flex flex-col items-center">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#001C44]"></div>
                                                    <p className="mt-2 text-xs text-gray-600">Đang tải...</p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-0.5">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${getNotificationTypeColor(notification.type)}`}>
                                                    {getNotificationTypeLabel(notification.type)}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
                                                            {notification.title}
                                                        </p>
                                                        {notification.content && (
                                                            <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                                                {notification.content}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <span className="text-xs text-gray-400 flex items-center">
                                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                {formatDate(notification.createdAt)}
                                                            </span>
                                                            {(notification.activityId || notification.seriesId) && (
                                                                <span className="text-xs text-[#001C44] font-medium flex items-center bg-blue-50 px-2 py-0.5 rounded">
                                                                    {notification.activityId ? (
                                                                        <>
                                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                            </svg>
                                                                            Sự kiện #{notification.activityId}
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                            </svg>
                                                                            Chuỗi #{notification.seriesId}
                                                                        </>
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {notification.status === 'UNREAD' && (
                                                        <div className="flex-shrink-0">
                                                            <div className="h-2.5 w-2.5 bg-blue-500 rounded-full animate-pulse"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                                <button 
                                    onClick={() => {
                                        setIsOpen(false);
                                        if (userRole === Role.STUDENT) {
                                            navigate('/notifications');
                                        } else {
                                            navigate('/manager/notifications');
                                        }
                                    }}
                                    className="w-full text-center text-sm font-medium text-[#001C44] hover:text-[#002A66] transition-colors flex items-center justify-center"
                                >
                                    <span>Xem tất cả thông báo</span>
                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
