import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { eventAPI } from '../../services/eventAPI';
import { registrationAPI } from '../../services/registrationAPI';
import { statisticsAPI } from '../../services/statisticsAPI';
import { studentAPI } from '../../services/studentAPI';
import { academicPublicAPI } from '../../services/academicPublicAPI';
import { ActivityResponse } from '../../types';
import { RegistrationStatus } from '../../types/registration';
import { DashboardStatisticsResponse } from '../../types/statistics';
import StudentLayout from '../layout/StudentLayout';
import { LoadingSpinner } from '../common';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StudentDashboard: React.FC = () => {
    const { username } = useAuth();
    const [dashboardData, setDashboardData] = useState<DashboardStatisticsResponse | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [error, setError] = useState('');

    // Events data
    const [ongoingEvents, setOngoingEvents] = useState<ActivityResponse[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<ActivityResponse[]>([]);
    const [registrationStatuses, setRegistrationStatuses] = useState<Map<number, RegistrationStatus>>(new Map());
    const [loadingEvents, setLoadingEvents] = useState(false);

    // Student and semester data
    const [studentId, setStudentId] = useState<number | null>(null);
    const [currentSemesterId, setCurrentSemesterId] = useState<number | null>(null);
    const [semesterName, setSemesterName] = useState<string>('');

    useEffect(() => {
        loadDashboardData();
        loadStudentData();
    }, []);

    useEffect(() => {
        if (studentId) {
            loadEvents();
        }
    }, [studentId]);


    const loadStudentData = async () => {
        try {
            const profile = await studentAPI.getMyProfile();
            setStudentId(profile.id);

            // Load current semester
            const semesters = await academicPublicAPI.getSemesters();
            if (semesters && semesters.length > 0) {
                // Get the most recent semester (assuming it's sorted or we can find current one)
                const currentSemester = semesters.find((s: any) => s.isCurrent) || semesters[0];
                setCurrentSemesterId(currentSemester.id);
                setSemesterName(currentSemester.name || `Học kỳ ${currentSemester.id}`);
            }
        } catch (err) {
            console.error('Error loading student data:', err);
        }
    };

    const loadEvents = async () => {
        try {
            setLoadingEvents(true);
            const response = await eventAPI.getEvents();
            if (response.status && response.data) {
                const now = new Date();
                const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

                // Sự kiện đang diễn ra: startDate <= now <= endDate
                const ongoing = response.data.filter((event: ActivityResponse) => {
                    const startDate = new Date(event.startDate);
                    const endDate = new Date(event.endDate);
                    return startDate <= now && now <= endDate;
                }).slice(0, 5);

                // Sự kiện sắp tới: startDate > now và trong vòng 30 ngày
                const upcoming = response.data.filter((event: ActivityResponse) => {
                    const startDate = new Date(event.startDate);
                    return startDate > now && startDate <= thirtyDaysFromNow;
                }).slice(0, 5);

                setOngoingEvents(ongoing);
                setUpcomingEvents(upcoming);

                // Load registration statuses for both ongoing and upcoming events
                await loadRegistrationStatuses([...ongoing, ...upcoming]);
            }
        } catch (error) {
            console.error('Error loading events:', error);
        } finally {
            setLoadingEvents(false);
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

    const loadDashboardData = async () => {
        setLoadingStats(true);
        setError('');
        try {
            const response = await statisticsAPI.getDashboardStatistics();
            if (response.status && response.data) {
                setDashboardData(response.data);
            } else {
                setError(response.message || 'Không thể tải dữ liệu thống kê');
            }
        } catch (err) {
            console.error('Error loading dashboard data:', err);
            setError('Có lỗi xảy ra khi tải dữ liệu thống kê');
        } finally {
            setLoadingStats(false);
        }
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    const formatScore = (score: string | number | null | undefined): number => {
        if (score === null || score === undefined) {
            return 0;
        }
        if (typeof score === 'string') {
            const parsed = parseFloat(score);
            return isNaN(parsed) ? 0 : parsed;
        }
        if (typeof score === 'number') {
            return isNaN(score) ? 0 : score;
        }
        return 0;
    };



    const stats = dashboardData ? [
        { name: 'Sự kiện đã tham gia', value: formatNumber(dashboardData.monthlyParticipations), icon: '🎯' },
        { name: 'Đăng ký tháng này', value: formatNumber(dashboardData.monthlyRegistrations), icon: '📝' },
        { name: 'Tỷ lệ tham gia', value: (dashboardData.averageParticipationRate * 100).toFixed(1) + '%', icon: '📊' },
        { name: 'Tổng hoạt động', value: formatNumber(dashboardData.totalActivities), icon: '📅' },
    ] : [
        { name: 'Sự kiện đã tham gia', value: '...', icon: '🎯' },
        { name: 'Đăng ký tháng này', value: '...', icon: '📝' },
        { name: 'Tỷ lệ tham gia', value: '...', icon: '📊' },
        { name: 'Tổng hoạt động', value: '...', icon: '📅' },
    ];




    if (loadingStats) {
        return (
            <StudentLayout>
                <div className="flex justify-center items-center py-12">
                    <LoadingSpinner />
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-xl shadow-lg p-6 text-white mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Chào mừng trở lại, {username}!</h2>
                            <p className="text-gray-200">Hôm nay bạn có gì cần làm không?</p>
                        </div>
                        {currentSemesterId && (
                            <div className="hidden md:block text-right">
                                <p className="text-sm text-gray-300">Học kỳ hiện tại</p>
                                <p className="text-lg font-semibold">{semesterName}</p>
                            </div>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 shadow-md">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    {stats.map((stat, index) => {
                        const iconVariants = [
                            'from-[#001C44] to-[#002A66]',
                            'from-[#002A66] to-[#003A88]',
                            'from-[#001C44] to-[#002A66]',
                            'from-[#FFD66D] to-[#FFC947]',
                        ];
                        const iconBg = iconVariants[index % iconVariants.length];

                        return (
                            <div
                                key={stat.name}
                                className="bg-gray-50 rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl hover:bg-gray-100 transition-all duration-300 overflow-hidden group relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-[#001C44] to-[#002A66] opacity-0 group-hover:opacity-3 transition-opacity duration-300"></div>
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-600 mb-2">{stat.name}</p>
                                        <p className="text-3xl font-bold text-[#001C44] group-hover:text-[#002A66] transition-colors duration-300">
                                            {stat.value}
                                        </p>
                                    </div>
                                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${iconBg} flex items-center justify-center text-3xl shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300`}>
                                        {stat.icon}
                                    </div>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#001C44] to-[#002A66] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                            </div>
                        );
                    })}
                </div>

                {/* Monthly Statistics */}
                {dashboardData && (
                    <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-[#001C44] flex items-center">
                                <span className="mr-3 text-3xl">📊</span>
                                Thống kê tháng này
                            </h3>
                            <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                {new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-50 rounded-xl p-5 border-l-4 border-[#001C44] hover:shadow-lg hover:bg-gray-100 transition-all group">
                                <div className="flex items-center mb-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-[#001C44] to-[#002A66] rounded-xl flex items-center justify-center mr-3 shadow-md group-hover:scale-105 transition-transform">
                                        <span className="text-2xl text-white">📝</span>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700">Đăng ký mới</p>
                                </div>
                                <p className="text-3xl font-bold text-[#001C44]">{formatNumber(dashboardData.monthlyRegistrations)}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-5 border-l-4 border-[#002A66] hover:shadow-lg hover:bg-gray-100 transition-all group">
                                <div className="flex items-center mb-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-[#002A66] to-[#003A88] rounded-xl flex items-center justify-center mr-3 shadow-md group-hover:scale-105 transition-transform">
                                        <span className="text-2xl text-white">✅</span>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700">Tham gia</p>
                                </div>
                                <p className="text-3xl font-bold text-[#002A66]">{formatNumber(dashboardData.monthlyParticipations)}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-5 border-l-4 border-[#FFD66D] hover:shadow-lg hover:bg-gray-100 transition-all group">
                                <div className="flex items-center mb-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-[#FFD66D] to-[#FFC947] rounded-xl flex items-center justify-center mr-3 shadow-md group-hover:scale-105 transition-transform">
                                        <span className="text-2xl text-[#001C44]">📈</span>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700">Tỷ lệ tham gia</p>
                                </div>
                                <p className="text-3xl font-bold text-[#001C44]">{(dashboardData.averageParticipationRate * 100).toFixed(1)}%</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Top Activities and Events Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Top Activities - Left side, 2 columns */}
                    {dashboardData && dashboardData.topActivities.length > 0 ? (
                        <div className="lg:col-span-2 bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                            <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] px-6 py-5">
                                <h3 className="text-2xl font-bold text-white flex items-center">
                                    <span className="mr-3 text-3xl">🏆</span>
                                    Top hoạt động phổ biến
                                </h3>
                                <p className="text-sm text-gray-300 mt-1">5 hoạt động được đăng ký nhiều nhất</p>
                            </div>
                            <div className="p-6">
                                <div className="mb-6 bg-gray-50 rounded-lg p-4 h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={dashboardData.topActivities.slice(0, 5).map((activity) => ({
                                                name: activity.activityName.length > 15
                                                    ? activity.activityName.substring(0, 15) + '...'
                                                    : activity.activityName,
                                                fullName: activity.activityName,
                                                'Đăng ký': activity.registrationCount,
                                                'Tham gia': activity.participationCount,
                                            }))}
                                            margin={{ top: 10, right: 20, left: 10, bottom: 70 }}
                                        >
                                            <defs>
                                                <linearGradient id="colorDangKy" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#001C44" stopOpacity={1} />
                                                    <stop offset="100%" stopColor="#002A66" stopOpacity={0.8} />
                                                </linearGradient>
                                                <linearGradient id="colorThamGia" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#FFD66D" stopOpacity={1} />
                                                    <stop offset="100%" stopColor="#FFC947" stopOpacity={0.8} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} vertical={false} />
                                            <XAxis
                                                dataKey="name"
                                                angle={-45}
                                                textAnchor="end"
                                                height={80}
                                                tick={{ fontSize: 11, fill: '#6B7280' }}
                                                stroke="#9CA3AF"
                                                strokeWidth={0.5}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 11, fill: '#6B7280' }}
                                                stroke="#9CA3AF"
                                                strokeWidth={0.5}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#fff',
                                                    border: '2px solid #001C44',
                                                    borderRadius: '12px',
                                                    padding: '12px 16px',
                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                                }}
                                                cursor={{ fill: 'rgba(0, 28, 68, 0.05)' }}
                                                formatter={(value: number) => formatNumber(value)}
                                                labelFormatter={(label) => {
                                                    const item = dashboardData.topActivities.find(a =>
                                                        a.activityName.length > 15
                                                            ? a.activityName.substring(0, 15) + '...' === label
                                                            : a.activityName === label
                                                    );
                                                    return (
                                                        <div style={{ fontWeight: 'bold', color: '#001C44', marginBottom: '4px' }}>
                                                            {item?.activityName || label}
                                                        </div>
                                                    );
                                                }}
                                            />
                                            <Legend
                                                wrapperStyle={{ paddingTop: '20px' }}
                                                iconType="rect"
                                                formatter={(value) => (
                                                    <span style={{ color: '#374151', fontSize: '13px', fontWeight: '500' }}>{value}</span>
                                                )}
                                            />
                                            <Bar
                                                dataKey="Đăng ký"
                                                fill="url(#colorDangKy)"
                                                radius={[8, 8, 0, 0]}
                                                animationDuration={800}
                                            />
                                            <Bar
                                                dataKey="Tham gia"
                                                fill="url(#colorThamGia)"
                                                radius={[8, 8, 0, 0]}
                                                animationDuration={800}
                                                animationBegin={100}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-2">
                                    {dashboardData.topActivities.slice(0, 5).map((activity, index) => {
                                        const badgeColors = [
                                            'from-[#FFD66D] to-[#FFC947]',
                                            'from-gray-300 to-gray-400',
                                            'from-[#002A66] to-[#003A88]',
                                            'from-[#001C44] to-[#002A66]',
                                            'from-[#001C44] to-[#002A66]',
                                        ];
                                        const badgeColor = badgeColors[index] || 'from-[#001C44] to-[#002A66]';

                                        return (
                                            <div key={activity.activityId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:shadow-md transition-all group">
                                                <div className="flex items-center flex-1">
                                                    <div className={`w-10 h-10 bg-gradient-to-br ${badgeColor} rounded-lg flex items-center justify-center mr-3 font-bold ${index < 3 ? 'text-[#001C44]' : 'text-white'} text-sm shadow-md group-hover:scale-105 transition-transform`}>
                                                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#001C44] transition-colors">{activity.activityName}</p>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-xs text-gray-500 flex items-center">
                                                                <svg className="w-3 h-3 mr-1 text-[#001C44]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                                </svg>
                                                                <span className="font-semibold text-[#001C44]">{formatNumber(activity.registrationCount)}</span>
                                                            </span>
                                                            <span className="text-xs text-gray-500 flex items-center">
                                                                <svg className="w-3 h-3 mr-1 text-[#002A66]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                <span className="font-semibold text-[#002A66]">{formatNumber(activity.participationCount)}</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="lg:col-span-2"></div>
                    )}

                    {/* Events - Right side, 1 column, stacked */}
                    <div className="space-y-6">
                        {/* Ongoing Events */}
                        <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                            <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] px-4 py-3">
                                <h3 className="text-lg font-bold text-white flex items-center">
                                    <span className="mr-2 text-2xl">🎯</span>
                                    Sự kiện đang diễn ra
                                </h3>
                                <p className="text-xs text-gray-300 mt-1">Các sự kiện đang được tổ chức</p>
                            </div>
                            <div className="p-4">
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {loadingEvents ? (
                                        <div className="text-center py-6">
                                            <LoadingSpinner />
                                        </div>
                                    ) : ongoingEvents.length === 0 ? (
                                        <div className="text-center py-6 text-gray-500 text-sm">
                                            <p>Không có sự kiện đang diễn ra</p>
                                        </div>
                                    ) : (
                                        ongoingEvents.map((event) => {
                                            const registrationStatus = registrationStatuses.get(event.id);
                                            const isRegistered = registrationStatus === RegistrationStatus.APPROVED ||
                                                registrationStatus === RegistrationStatus.PENDING ||
                                                registrationStatus === RegistrationStatus.ATTENDED;

                                            return (
                                                <Link
                                                    key={event.id}
                                                    to={`/student/events/${event.id}`}
                                                    className="block border border-gray-200 rounded-lg p-3 hover:border-[#001C44] hover:shadow-md transition-all group"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-xs font-semibold text-gray-900 group-hover:text-[#001C44] transition-colors truncate">{event.name}</h4>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                📅 {new Date(event.startDate).toLocaleDateString('vi-VN')} - {new Date(event.endDate).toLocaleDateString('vi-VN')}
                                                            </p>
                                                            {event.location && (
                                                                <p className="text-xs text-gray-500 truncate">📍 {event.location}</p>
                                                            )}
                                                        </div>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${isRegistered ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                            {isRegistered ? 'Đã đăng ký' : 'Chưa đăng ký'}
                                                        </span>
                                                    </div>
                                                </Link>
                                            );
                                        })
                                    )}
                                </div>
                                {ongoingEvents.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <Link
                                            to="/student/events"
                                            className="block text-center text-xs text-[#001C44] hover:text-[#002A66] font-medium"
                                        >
                                            Xem tất cả →
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Upcoming Events */}
                        <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                            <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] px-4 py-3">
                                <h3 className="text-lg font-bold text-white flex items-center">
                                    <span className="mr-2 text-2xl">📅</span>
                                    Sự kiện sắp tới
                                </h3>
                                <p className="text-xs text-gray-300 mt-1">Các sự kiện sắp diễn ra</p>
                            </div>
                            <div className="p-4">
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {loadingEvents ? (
                                        <div className="text-center py-6">
                                            <LoadingSpinner />
                                        </div>
                                    ) : upcomingEvents.length === 0 ? (
                                        <div className="text-center py-6 text-gray-500 text-sm">
                                            <p>Không có sự kiện sắp tới</p>
                                        </div>
                                    ) : (
                                        upcomingEvents.map((event) => {
                                            const registrationStatus = registrationStatuses.get(event.id);
                                            const isRegistered = registrationStatus === RegistrationStatus.APPROVED ||
                                                registrationStatus === RegistrationStatus.PENDING ||
                                                registrationStatus === RegistrationStatus.ATTENDED;

                                            const canRegister = (() => {
                                                if (isRegistered) return false;
                                                const now = new Date();
                                                const registrationStartDate = event.registrationStartDate ? new Date(event.registrationStartDate) : null;
                                                const registrationDeadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;
                                                if (registrationStartDate && now < registrationStartDate) return false;
                                                if (registrationDeadline && now > registrationDeadline) return false;
                                                return true;
                                            })();

                                            return (
                                                <div key={event.id} className="border border-gray-200 rounded-lg p-3 hover:border-[#001C44] hover:shadow-md transition-all">
                                                    <Link
                                                        to={`/student/events/${event.id}`}
                                                        className="block"
                                                    >
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-xs font-semibold text-gray-900 hover:text-[#001C44] transition-colors truncate">{event.name}</h4>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    📅 {new Date(event.startDate).toLocaleDateString('vi-VN')} - {new Date(event.endDate).toLocaleDateString('vi-VN')}
                                                                </p>
                                                                {event.location && (
                                                                    <p className="text-xs text-gray-500 truncate">📍 {event.location}</p>
                                                                )}
                                                            </div>
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${isRegistered ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                                {isRegistered ? 'Đã đăng ký' : 'Chưa đăng ký'}
                                                            </span>
                                                        </div>
                                                    </Link>
                                                    {canRegister && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleQuickRegister(event.id);
                                                            }}
                                                            className="mt-2 w-full bg-[#001C44] text-white px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-[#002A66] transition-colors"
                                                        >
                                                            Đăng ký ngay
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                                {upcomingEvents.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <Link
                                            to="/student/events"
                                            className="block text-center text-xs text-[#001C44] hover:text-[#002A66] font-medium"
                                        >
                                            Xem tất cả →
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Students - Full width, below */}
                {dashboardData && dashboardData.topStudents.length > 0 && (
                    <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 mb-8">
                        <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] px-6 py-5">
                            <h3 className="text-2xl font-bold text-white flex items-center">
                                <span className="mr-3 text-3xl">⭐</span>
                                Top sinh viên tích cực
                            </h3>
                            <p className="text-sm text-gray-300 mt-1">5 sinh viên tham gia nhiều nhất</p>
                        </div>
                        <div className="p-6">
                            <div className="mb-6 bg-gray-50 rounded-lg p-4 h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={dashboardData.topStudents.slice(0, 5).map((student) => ({
                                            name: student.studentName.length > 12
                                                ? student.studentName.substring(0, 12) + '...'
                                                : student.studentName,
                                            fullName: student.studentName,
                                            studentCode: student.studentCode,
                                            'Số lần tham gia': student.participationCount,
                                            isCurrent: student.studentId === studentId,
                                        }))}
                                        margin={{ top: 10, right: 20, left: 10, bottom: 70 }}
                                    >
                                        <defs>
                                            <linearGradient id="colorThamGiaStudent" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#001C44" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#002A66" stopOpacity={0.8} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                            tick={{ fontSize: 11, fill: '#6B7280' }}
                                            stroke="#9CA3AF"
                                            strokeWidth={0.5}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 11, fill: '#6B7280' }}
                                            stroke="#9CA3AF"
                                            strokeWidth={0.5}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '2px solid #001C44',
                                                borderRadius: '12px',
                                                padding: '12px 16px',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                            }}
                                            cursor={{ fill: 'rgba(0, 28, 68, 0.05)' }}
                                            formatter={(value: number) => formatNumber(value)}
                                            labelFormatter={(label) => {
                                                const item = dashboardData.topStudents.find(s =>
                                                    s.studentName.length > 12
                                                        ? s.studentName.substring(0, 12) + '...' === label
                                                        : s.studentName === label
                                                );
                                                return (
                                                    <div style={{ fontWeight: 'bold', color: '#001C44', marginBottom: '4px' }}>
                                                        {item?.studentName || label} ({item?.studentCode || ''})
                                                    </div>
                                                );
                                            }}
                                        />
                                        <Bar
                                            dataKey="Số lần tham gia"
                                            fill="url(#colorThamGiaStudent)"
                                            radius={[8, 8, 0, 0]}
                                            animationDuration={800}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-2">
                                {dashboardData.topStudents.slice(0, 5).map((student, index) => {
                                    const badgeColors = [
                                        'from-[#FFD66D] to-[#FFC947]',
                                        'from-gray-300 to-gray-400',
                                        'from-[#002A66] to-[#003A88]',
                                        'from-[#001C44] to-[#002A66]',
                                        'from-[#001C44] to-[#002A66]',
                                    ];
                                    const badgeColor = badgeColors[index] || 'from-[#001C44] to-[#002A66]';
                                    const isCurrent = student.studentId === studentId;

                                    return (
                                        <div key={student.studentId} className={`flex items-center justify-between p-3 rounded-lg border transition-all group ${isCurrent ? 'bg-blue-50 border-blue-300 shadow-md' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:shadow-md'}`}>
                                            <div className="flex items-center flex-1">
                                                <div className={`w-10 h-10 bg-gradient-to-br ${badgeColor} rounded-lg flex items-center justify-center mr-3 font-bold ${index < 3 ? 'text-[#001C44]' : 'text-white'} text-sm shadow-md group-hover:scale-105 transition-transform`}>
                                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-semibold truncate group-hover:text-[#001C44] transition-colors ${isCurrent ? 'text-[#001C44]' : 'text-gray-900'}`}>
                                                        {student.studentName}
                                                        {isCurrent && <span className="ml-2 text-xs text-blue-600 font-bold">(Bạn)</span>}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-xs text-gray-500">{student.studentCode}</span>
                                                        <span className="text-xs text-gray-500 flex items-center">
                                                            <svg className="w-3 h-3 mr-1 text-[#002A66]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <span className="font-semibold text-[#002A66]">{formatNumber(student.participationCount)}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};

export default StudentDashboard;
