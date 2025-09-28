import React, { useState, useEffect, useRef } from 'react';
import { Notification, NotificationFilters } from '../../types';
import { notificationAPI } from '../../services';
import { getNotificationTypeLabel, getNotificationTypeColor } from '../../types/notification';

interface NotificationDropdownProps {
    onNotificationClick?: (notification: Notification) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
    onNotificationClick,
}) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
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
        }
    };

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const data = await notificationAPI.getNotifications({ size: 10 });
            setNotifications(data.content);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
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

        if (onNotificationClick) {
            onNotificationClick(notification);
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
                className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
            >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>

                {/* Unread Count Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-gray-900">Thông báo</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        className="text-xs text-blue-600 hover:text-blue-800"
                                    >
                                        Đánh dấu tất cả đã đọc
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="px-4 py-8 text-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="mt-2 text-sm text-gray-500">Đang tải thông báo...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="px-4 py-8 text-center">
                                    <div className="text-gray-400 text-4xl mb-2">🔔</div>
                                    <p className="text-sm text-gray-500">Chưa có thông báo nào</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${notification.status === 'UNREAD' ? 'bg-blue-50' : ''
                                            }`}
                                    >
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getNotificationTypeColor(notification.type)}`}>
                                                    {getNotificationTypeLabel(notification.type)}
                                                </span>
                                            </div>
                                            <div className="ml-3 flex-1">
                                                <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                                    {notification.title}
                                                </p>
                                                {notification.content && (
                                                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                                                        {notification.content}
                                                    </p>
                                                )}
                                                <p className="mt-1 text-xs text-gray-400">
                                                    {formatDate(notification.createdAt)}
                                                </p>
                                            </div>
                                            {notification.status === 'UNREAD' && (
                                                <div className="flex-shrink-0 ml-2">
                                                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="px-4 py-3 border-t border-gray-200">
                                <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800">
                                    Xem tất cả thông báo
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
