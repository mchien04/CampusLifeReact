import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { eventAPI } from '../../services/eventAPI';
import { statisticsAPI } from '../../services/statisticsAPI';
import { ActivityResponse } from '../../types/activity';
import { DashboardStatisticsResponse } from '../../types/statistics';
import { LoadingSpinner } from '../common';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const ManagerDashboard: React.FC = () => {
    const { username } = useAuth();
    const [upcomingEvents, setUpcomingEvents] = useState<ActivityResponse[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [dashboardData, setDashboardData] = useState<DashboardStatisticsResponse | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadDashboardData();
        loadUpcomingEvents();
    }, []);

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

    const stats = dashboardData ? [
        { name: 'Sự kiện đã tạo', value: formatNumber(dashboardData.totalActivities), icon: '📅' },
        { name: 'Sinh viên tham gia', value: formatNumber(dashboardData.totalStudents), icon: '👥' },
        { name: 'Chuỗi sự kiện', value: formatNumber(dashboardData.totalSeries), icon: '📋' },
        { name: 'Mini Games', value: formatNumber(dashboardData.totalMiniGames), icon: '🎮' },
    ] : [
        { name: 'Sự kiện đã tạo', value: '...', icon: '📅' },
        { name: 'Sinh viên tham gia', value: '...', icon: '👥' },
        { name: 'Chuỗi sự kiện', value: '...', icon: '📋' },
        { name: 'Mini Games', value: '...', icon: '🎮' },
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

    if (loadingStats) {
        return (
            <div className="flex justify-center items-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-xl shadow-lg p-6 text-white mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2 flex items-center">
                                <span className="mr-3 text-4xl">📊</span>
                                Thống kê tổng quan
                            </h1>
                            <p className="text-gray-200 text-lg">Xem tổng quan các số liệu thống kê của hệ thống</p>
                        </div>
                        <div className="hidden md:flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-sm text-gray-200">Hệ thống hoạt động</span>
                        </div>
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

                {/* Main Stats Cards */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    {stats.map((stat, index) => {
                        // Sử dụng theme colors: xanh đậm và vàng, với các tone khác nhau
                        const iconVariants = [
                            'from-[#001C44] to-[#002A66]', // Xanh đậm chính
                            'from-[#002A66] to-[#003A88]', // Xanh đậm nhạt hơn
                            'from-[#001C44] to-[#002A66]', // Xanh đậm chính
                            'from-[#FFD66D] to-[#FFC947]', // Vàng theme
                        ];
                        const iconBg = iconVariants[index % iconVariants.length];

                        return (
                            <div
                                key={stat.name}
                                className="bg-gray-50 rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl hover:bg-gray-100 transition-all duration-300 overflow-hidden group relative"
                            >
                                {/* Subtle gradient overlay on hover */}
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

                                {/* Subtle decorative line */}
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#001C44] to-[#002A66] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                            </div>
                        );
                    })}
                </div>

                {/* Statistics Overview */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
                    {/* Monthly Statistics */}
                    <div className="lg:col-span-2 bg-white shadow-lg rounded-xl p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-[#001C44] flex items-center">
                                <span className="mr-3 text-3xl">📊</span>
                                Thống kê tháng này
                            </h3>
                            <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                {new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                            </div>
                        </div>
                        {dashboardData ? (
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
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <LoadingSpinner />
                            </div>
                        )}
                    </div>

                    {/* Quick Info */}
                    <div className="bg-gradient-to-br from-[#001C44] to-[#002A66] rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-300">
                        <h3 className="text-2xl font-bold mb-6 flex items-center">
                            <span className="mr-3 text-3xl">ℹ️</span>
                            Thông tin hệ thống
                        </h3>
                        <div className="space-y-4">
                            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-20 hover:bg-opacity-20 transition-all">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-200">Trạng thái</span>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-white shadow-md">
                                        <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                                        Hoạt động
                                    </span>
                                </div>
                            </div>
                            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-20 hover:bg-opacity-20 transition-all">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-200">Người dùng</span>
                                    <span className="text-sm font-bold text-[#FFD66D] flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        {username || 'Manager'}
                                    </span>
                                </div>
                            </div>
                            <Link
                                to="/manager/events"
                                className="block w-full mt-6 px-4 py-3 bg-[#FFD66D] text-[#001C44] rounded-xl hover:bg-[#FFC947] transition-all text-center font-bold shadow-lg hover:shadow-xl hover:scale-105 transform duration-300 flex items-center justify-center"
                            >
                                <span>Quản lý sự kiện</span>
                                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Top Activities and Students */}
                {dashboardData && (dashboardData.topActivities.length > 0 || dashboardData.topStudents.length > 0) && (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Top Activities */}
                        {dashboardData.topActivities.length > 0 && (
                            <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                                <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] px-6 py-5">
                                    <h3 className="text-2xl font-bold text-white flex items-center">
                                        <span className="mr-3 text-3xl">🏆</span>
                                        Top hoạt động phổ biến
                                    </h3>
                                    <p className="text-sm text-gray-300 mt-1">5 hoạt động được đăng ký nhiều nhất</p>
                                </div>
                                <div className="p-6">
                                    {/* Chart */}
                                    <div className="mb-6 bg-gray-50 rounded-lg p-4 h-96">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={dashboardData.topActivities.slice(0, 5).map((activity, index) => ({
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
                                                    animationBegin={0}
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
                                    {/* List */}
                                    <div className="space-y-2">
                                        {dashboardData.topActivities.slice(0, 5).map((activity, index) => {
                                            // Sử dụng theme colors với các tone khác nhau
                                            const badgeColors = [
                                                'from-[#FFD66D] to-[#FFC947]', // Vàng cho top 1
                                                'from-gray-300 to-gray-400', // Xám cho top 2
                                                'from-[#002A66] to-[#003A88]', // Xanh nhạt cho top 3
                                                'from-[#001C44] to-[#002A66]', // Xanh đậm cho các vị trí khác
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
                        )}

                        {/* Top Students */}
                        {dashboardData.topStudents.length > 0 && (
                            <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                                <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] px-6 py-5">
                                    <h3 className="text-2xl font-bold text-white flex items-center">
                                        <span className="mr-3 text-3xl">⭐</span>
                                        Top sinh viên tích cực
                                    </h3>
                                    <p className="text-sm text-gray-300 mt-1">5 sinh viên tham gia nhiều nhất</p>
                                </div>
                                <div className="p-6">
                                    {/* Chart */}
                                    <div className="mb-6 bg-gray-50 rounded-lg p-4 h-96">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={dashboardData.topStudents.slice(0, 5).map((student, index) => ({
                                                    name: student.studentName.length > 12
                                                        ? student.studentName.substring(0, 12) + '...'
                                                        : student.studentName,
                                                    fullName: student.studentName,
                                                    studentCode: student.studentCode,
                                                    'Số lần tham gia': student.participationCount,
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
                                                    labelFormatter={(label, payload) => {
                                                        const item = payload && payload[0]?.payload;
                                                        if (item) {
                                                            return (
                                                                <div style={{ fontWeight: 'bold', color: '#001C44', marginBottom: '4px' }}>
                                                                    {item.fullName}
                                                                    <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 'normal', marginTop: '2px' }}>
                                                                        {item.studentCode}
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return label;
                                                    }}
                                                />
                                                <Bar
                                                    dataKey="Số lần tham gia"
                                                    fill="url(#colorThamGiaStudent)"
                                                    radius={[8, 8, 0, 0]}
                                                    animationDuration={800}
                                                    animationBegin={0}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    {/* List */}
                                    <div className="space-y-2">
                                        {dashboardData.topStudents.slice(0, 5).map((student, index) => {
                                            // Sử dụng theme colors với các tone khác nhau
                                            const badgeColors = [
                                                'from-[#FFD66D] to-[#FFC947]', // Vàng cho top 1
                                                'from-gray-300 to-gray-400', // Xám cho top 2
                                                'from-[#002A66] to-[#003A88]', // Xanh nhạt cho top 3
                                                'from-[#001C44] to-[#002A66]', // Xanh đậm cho các vị trí khác
                                                'from-[#001C44] to-[#002A66]',
                                            ];
                                            const badgeColor = badgeColors[index] || 'from-[#001C44] to-[#002A66]';

                                            return (
                                                <div key={student.studentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:shadow-md transition-all group">
                                                    <div className="flex items-center flex-1">
                                                        <div className={`w-10 h-10 bg-gradient-to-br ${badgeColor} rounded-lg flex items-center justify-center mr-3 font-bold ${index < 3 ? 'text-[#001C44]' : 'text-white'} text-sm shadow-md group-hover:scale-105 transition-transform`}>
                                                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#001C44] transition-colors">{student.studentName}</p>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <span className="text-xs text-gray-500 flex items-center">
                                                                    <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                                                    </svg>
                                                                    <span className="font-medium">{student.studentCode}</span>
                                                                </span>
                                                                <span className="text-xs text-gray-500 flex items-center">
                                                                    <svg className="w-3 h-3 mr-1 text-[#002A66]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                    <span className="font-semibold text-[#002A66]">{formatNumber(student.participationCount)}</span>
                                                                    <span className="ml-1">hoạt động</span>
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
                )}
            </div>
        </div>
    );
};

export default ManagerDashboard;
