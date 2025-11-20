import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { eventAPI } from '../../services/eventAPI';
import { registrationAPI } from '../../services/registrationAPI';
import { ActivityResponse } from '../../types';
import { RegistrationStatus } from '../../types/registration';
import StudentLayout from '../layout/StudentLayout';

const StudentDashboard: React.FC = () => {
    const { username } = useAuth();
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
                const registration = await registrationAPI.checkRegistrationStatus(event.id);
                if (registration) {
                    statusMap.set(event.id, registration.status);
                }
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
        <StudentLayout>
            <div className="space-y-6">
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-xl p-6 text-white mb-6">
                    <h2 className="text-2xl font-bold mb-2">Chào mừng trở lại, {username}!</h2>
                    <p className="text-gray-200">Hôm nay bạn có gì cần làm không?</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    {stats.map((stat) => (
                        <div key={stat.name} className="stat-card p-5 fade-in">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <span className="text-3xl">{stat.icon}</span>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-200 truncate">
                                            {stat.name}
                                        </dt>
                                        <dd className="text-2xl font-bold text-[#FFD66D] mt-1">
                                            {stat.value}
                                        </dd>
                                    </dl>
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
                                            className="card p-5 group hover:border-[#FFD66D] border-2 border-gray-200 transition-all duration-200"
                                        >
                                            <div className="flex items-start">
                                                <div className="flex-shrink-0 w-12 h-12 bg-[#FFD66D] bg-opacity-20 rounded-lg flex items-center justify-center group-hover:bg-opacity-30 transition-all">
                                                    <span className="text-2xl">{action.icon}</span>
                                                </div>
                                                <div className="ml-4 flex-1">
                                                    <h4 className="text-base font-semibold text-[#001C44] group-hover:text-[#002A66] transition-colors">
                                                        {action.name}
                                                    </h4>
                                                    {action.description && (
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {action.description}
                                                        </p>
                                                    )}
                                                </div>
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
                                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                    <div
                                                        className="bg-gradient-to-r from-[#001C44] to-[#002A66] h-2.5 rounded-full transition-all duration-500"
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
                                        <span className="text-xl font-bold text-[#001C44]">
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
                                                            className="mt-2 w-full btn-primary px-3 py-2 rounded-lg text-xs font-medium"
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
                                        <span className="text-sm font-medium text-[#001C44]">Sinh viên tích cực</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
};

export default StudentDashboard;
