import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { eventAPI } from '../../services/eventAPI';
import { registrationAPI } from '../../services/registrationAPI';
import { ActivityResponse } from '../../types';
import { RegistrationStatus } from '../../types/registration';

const StudentDashboard: React.FC = () => {
    const { username, logout } = useAuth();
    const [upcomingEvents, setUpcomingEvents] = useState<ActivityResponse[]>([]);
    const [registrationStatuses, setRegistrationStatuses] = useState<Map<number, RegistrationStatus>>(new Map());
    const [loading, setLoading] = useState(true);

    const stats = [
        { name: 'Điểm rèn luyện HK này', value: '85', icon: '⭐' },
        { name: 'Sự kiện đã tham gia', value: '12', icon: '🎯' },
        { name: 'Hoạt động chờ duyệt', value: '3', icon: '⏳' },
        { name: 'Tin nhắn mới', value: '2', icon: '💬' },
    ];

    const quickActions = [
        { name: 'Xem sự kiện', href: '/student/events', icon: '📅', description: 'Xem danh sách sự kiện có sẵn' },
        { name: 'Lịch sử tham gia', href: '/student/participation-history', icon: '📝', description: 'Xem lịch sử tham gia sự kiện' },
        { name: 'Nhiệm vụ của tôi', href: '/student/tasks', icon: '✅', description: 'Xem và cập nhật nhiệm vụ' },
        { name: 'Xem điểm học kỳ', href: '/student/scores', icon: '📊', description: 'Xem điểm tổng hợp và chi tiết' },
        { name: 'Cập nhật profile', href: '/student/profile', icon: '👤', description: 'Cập nhật thông tin cá nhân và địa chỉ' },
    ];

    useEffect(() => {
        loadUpcomingEvents();
    }, []);

    const loadUpcomingEvents = async () => {
        try {
            setLoading(true);
            const response = await eventAPI.getEvents();
            if (response.status && response.data) {
                // Filter upcoming events (next 30 days)
                const now = new Date();
                const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

                const upcoming = response.data.filter((event: ActivityResponse) => {
                    const eventDate = new Date(event.startDate);
                    return eventDate >= now && eventDate <= thirtyDaysFromNow;
                }).slice(0, 3); // Show only 3 upcoming events

                setUpcomingEvents(upcoming);
                await loadRegistrationStatuses(upcoming);
            }
        } catch (error) {
            console.error('Error loading upcoming events:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadRegistrationStatuses = async (events: ActivityResponse[]) => {
        const statusMap = new Map<number, RegistrationStatus>();

        for (const event of events) {
            try {
                const status = await registrationAPI.checkRegistrationStatus(event.id);
                statusMap.set(event.id, status.status);
            } catch (err) {
                console.error(`Error checking registration status for event ${event.id}:`, err);
            }
        }

        setRegistrationStatuses(statusMap);
    };

    const handleQuickRegister = async (eventId: number) => {
        try {
            const response = await registrationAPI.registerForActivity({ activityId: eventId });
            if (response.status) {
                setRegistrationStatuses(prev => new Map(prev.set(eventId, RegistrationStatus.PENDING)));
                alert('Đăng ký thành công! Vui lòng chờ phê duyệt.');
            } else {
                alert('Đăng ký thất bại');
            }
        } catch (err) {
            alert('Có lỗi xảy ra khi đăng ký');
            console.error('Error registering for event:', err);
        }
    };

    const recentScores = [
        { criterion: 'Khen thưởng, kỷ luật', score: 20, maxScore: 25 },
        { criterion: 'Hoạt động xã hội', score: 18, maxScore: 20 },
        { criterion: 'Học tập', score: 25, maxScore: 25 },
        { criterion: 'Ý thức công dân', score: 22, maxScore: 25 },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
                            <p className="text-gray-600">Chào mừng, {username}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                            Đăng xuất
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Quick Actions */}
                    <div className="lg:col-span-2">
                        <div className="bg-white shadow rounded-lg mb-8">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                    Thao tác nhanh
                                </h3>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

                        {/* Recent Scores */}
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                    Điểm rèn luyện gần đây
                                </h3>
                                <div className="space-y-4">
                                    {recentScores.map((score, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-medium text-gray-900">{score.criterion}</span>
                                                    <span className="text-sm text-gray-500">{score.score}/{score.maxScore}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-primary-600 h-2 rounded-full"
                                                        style={{ width: `${(score.score / score.maxScore) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-semibold text-gray-900">Tổng điểm:</span>
                                        <span className="text-xl font-bold text-primary-600">
                                            {recentScores.reduce((sum, score) => sum + score.score, 0)}/
                                            {recentScores.reduce((sum, score) => sum + score.maxScore, 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Events */}
                    <div className="space-y-8">
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                    Sự kiện sắp tới
                                </h3>
                                <div className="space-y-4">
                                    {loading ? (
                                        <div className="text-center py-4">
                                            <div className="text-gray-500">Đang tải...</div>
                                        </div>
                                    ) : upcomingEvents.length === 0 ? (
                                        <div className="text-center py-4">
                                            <div className="text-gray-500">Không có sự kiện sắp tới</div>
                                        </div>
                                    ) : (
                                        upcomingEvents.map((event) => {
                                            const registrationStatus = registrationStatuses.get(event.id);
                                            const isRegistered = registrationStatus === RegistrationStatus.APPROVED || registrationStatus === RegistrationStatus.PENDING;
                                            const canRegister = !isRegistered;

                                            return (
                                                <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <h4 className="text-sm font-medium text-gray-900">{event.name}</h4>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                📅 {new Date(event.startDate).toLocaleDateString('vi-VN')} - {new Date(event.endDate).toLocaleDateString('vi-VN')}
                                                            </p>
                                                            <p className="text-xs text-gray-500">📍 {event.location}</p>
                                                        </div>
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isRegistered ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {isRegistered ? 'Đã đăng ký' : 'Chưa đăng ký'}
                                                        </span>
                                                    </div>
                                                    {canRegister && (
                                                        <button
                                                            onClick={() => handleQuickRegister(event.id)}
                                                            className="mt-2 w-full bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                                                        >
                                                            Đăng ký ngay
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                    Thống kê nhanh
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Xếp hạng lớp:</span>
                                        <span className="text-sm font-medium text-gray-900">#5/45</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Điểm trung bình:</span>
                                        <span className="text-sm font-medium text-gray-900">85/100</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Hoạt động tháng này:</span>
                                        <span className="text-sm font-medium text-gray-900">8 sự kiện</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Thành tích:</span>
                                        <span className="text-sm font-medium text-primary-600">Sinh viên tích cực</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StudentDashboard;
