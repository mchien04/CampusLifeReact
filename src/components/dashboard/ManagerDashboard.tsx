import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { eventAPI } from '../../services/eventAPI';
import { statisticsAPI } from '../../services/statisticsAPI';
import { ActivityResponse } from '../../types/activity';
import { DashboardStatisticsResponse } from '../../types/statistics';
import { LoadingSpinner } from '../common';

const ManagerDashboard: React.FC = () => {
    const { username } = useAuth();
    const [upcomingEvents, setUpcomingEvents] = useState<ActivityResponse[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [dashboardData, setDashboardData] = useState<DashboardStatisticsResponse | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        loadDashboardData();
        loadUpcomingEvents();
    }, []);

    const loadDashboardData = async () => {
        setLoadingStats(true);
        try {
            const response = await statisticsAPI.getDashboardStatistics();
            if (response.status && response.data) {
                setDashboardData(response.data);
            }
        } catch (err) {
            console.error('Error loading dashboard data:', err);
        } finally {
            setLoadingStats(false);
        }
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    const stats = dashboardData ? [
        { name: 'Sự kiện đã tạo', value: formatNumber(dashboardData.totalActivities), icon: '📅' },
        { name: 'Sinh viên tham gia', value: formatNumber(dashboardData.totalStudents), icon: '👥' },
        { name: 'Đăng ký tháng này', value: formatNumber(dashboardData.monthlyRegistrations), icon: '📝' },
        { name: 'Tham gia tháng này', value: formatNumber(dashboardData.monthlyParticipations), icon: '✅' },
    ] : [
        { name: 'Sự kiện đã tạo', value: '...', icon: '📅' },
        { name: 'Sinh viên tham gia', value: '...', icon: '👥' },
        { name: 'Đăng ký tháng này', value: '...', icon: '📝' },
        { name: 'Tham gia tháng này', value: '...', icon: '✅' },
    ];

    const quickActions = [
        { name: 'Tạo sự kiện mới', href: '/manager/events/create', icon: '➕', description: 'Tạo sự kiện hoạt động mới' },
        { name: 'Quản lý sự kiện', href: '/manager/events', icon: '📅', description: 'Xem và quản lý sự kiện' },
        { name: 'Chuỗi sự kiện', href: '/manager/series', icon: '📋', description: 'Tạo và quản lý chuỗi sự kiện' },
        { name: 'Mini Game', href: '/manager/minigames', icon: '🎮', description: 'Tạo và quản lý quiz minigame' },
        { name: 'Quản lý đăng ký', href: '/manager/registrations', icon: '📝', description: 'Duyệt đăng ký sự kiện' },
        { name: 'Điểm sinh viên', href: '/manager/scores', icon: '📊', description: 'Xem và sắp xếp theo điểm' },
    ];

    const loadUpcomingEvents = async () => {
        try {
            setLoadingEvents(true);
            const response = await eventAPI.getEvents();
            if (response.status && response.data) {
                const now = new Date();
                const upcoming = response.data
                    .filter(event => new Date(event.startDate) >= now)
                    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                    .slice(0, 3); // Show only first 3 upcoming events
                setUpcomingEvents(upcoming);
            }
        } catch (error) {
            console.error('Error loading upcoming events:', error);
        } finally {
            setLoadingEvents(false);
        }
    };

    const getEventStatus = (event: ActivityResponse) => {
        const now = new Date();
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);

        if (now < startDate) {
            return { status: 'Sắp diễn ra', color: 'bg-yellow-100 text-yellow-800' };
        } else if (now >= startDate && now <= endDate) {
            return { status: 'Đang diễn ra', color: 'bg-green-100 text-green-800' };
        } else {
            return { status: 'Đã kết thúc', color: 'bg-gray-100 text-gray-800' };
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div>
            <div className="max-w-7xl mx-auto">
                {/* Stats */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    {stats.map((stat) => (
                        <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <span className="text-2xl">{stat.icon}</span>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                {stat.name}
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {stat.value}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Quick Actions */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                Thao tác nhanh
                            </h3>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {quickActions.map((action) => (
                                    <Link
                                        key={action.name}
                                        to={action.href}
                                        className="relative group bg-white p-4 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                                    >
                                        <div>
                                            <span className="text-xl mb-2 block">{action.icon}</span>
                                            <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                                                {action.name}
                                            </div>
                                            {action.description && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {action.description}
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Events */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                Sự kiện sắp tới
                            </h3>
                            <div className="space-y-4">
                                {loadingEvents ? (
                                    <div className="text-center py-4">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                        <p className="text-sm text-gray-500 mt-2">Đang tải sự kiện...</p>
                                    </div>
                                ) : upcomingEvents.length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="text-gray-400 text-4xl mb-2">📅</div>
                                        <p className="text-sm text-gray-500">Không có sự kiện sắp tới</p>
                                    </div>
                                ) : (
                                    upcomingEvents.map((event) => {
                                        const eventStatus = getEventStatus(event);
                                        return (
                                            <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-medium text-gray-900 mb-1">{event.name}</h4>
                                                        <p className="text-sm text-gray-500">📅 {formatDate(event.startDate)}</p>
                                                        <p className="text-sm text-gray-500">📍 {event.location}</p>
                                                        {event.participantCount && (
                                                            <p className="text-sm text-gray-500">👥 {event.participantCount} người tham gia</p>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col items-end space-y-2">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${eventStatus.color}`}>
                                                            {eventStatus.status}
                                                        </span>
                                                        <Link
                                                            to={`/manager/events/${event.id}`}
                                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                                        >
                                                            Xem chi tiết →
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activities */}
                <div className="mt-8 bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                            Hoạt động gần đây
                        </h3>
                        <div className="flow-root">
                            <ul className="-mb-8">
                                {[
                                    { action: 'Tạo sự kiện "Workshop AI"', time: '1 giờ trước', type: 'create' },
                                    { action: 'Duyệt bài thu hoạch của Nguyễn Văn A', time: '3 giờ trước', type: 'approve' },
                                    { action: 'Nhập điểm rèn luyện cho lớp CNTT1', time: '5 giờ trước', type: 'score' },
                                    { action: 'Trả lời tin nhắn từ sinh viên', time: '1 ngày trước', type: 'message' },
                                ].map((item, index) => (
                                    <li key={index}>
                                        <div className="relative pb-8">
                                            {index !== 3 && (
                                                <span
                                                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                                    aria-hidden="true"
                                                />
                                            )}
                                            <div className="relative flex space-x-3">
                                                <div>
                                                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${item.type === 'create' ? 'bg-green-500' :
                                                        item.type === 'approve' ? 'bg-blue-500' :
                                                            item.type === 'score' ? 'bg-yellow-500' : 'bg-purple-500'
                                                        }`}>
                                                        <span className="text-white text-sm">
                                                            {item.type === 'create' ? '➕' :
                                                                item.type === 'approve' ? '✅' :
                                                                    item.type === 'score' ? '📊' : '💬'}
                                                        </span>
                                                    </span>
                                                </div>
                                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                                    <div>
                                                        <p className="text-sm text-gray-500">
                                                            {item.action}
                                                        </p>
                                                    </div>
                                                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                                        {item.time}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;
