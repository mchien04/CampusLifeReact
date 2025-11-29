import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { statisticsAPI } from '../../services/statisticsAPI';
import { DashboardStatisticsResponse } from '../../types/statistics';
import { LoadingSpinner } from '../common';

const AdminDashboard: React.FC = () => {
    const { username } = useAuth();
    const [dashboardData, setDashboardData] = useState<DashboardStatisticsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await statisticsAPI.getDashboardStatistics();
            if (response.status && response.data) {
                setDashboardData(response.data);
            } else {
                setError(response.message || 'Không thể tải dữ liệu dashboard');
            }
        } catch (err) {
            console.error('Error loading dashboard data:', err);
            setError('Có lỗi xảy ra khi tải dữ liệu dashboard');
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    const stats = dashboardData ? [
        { name: 'Tổng sinh viên', value: formatNumber(dashboardData.totalStudents), icon: '👥', color: 'bg-blue-500' },
        { name: 'Sự kiện hoạt động', value: formatNumber(dashboardData.totalActivities), icon: '📅', color: 'bg-green-500' },
        { name: 'Chuỗi sự kiện', value: formatNumber(dashboardData.totalSeries), icon: '📋', color: 'bg-yellow-500' },
        { name: 'Mini Games', value: formatNumber(dashboardData.totalMiniGames), icon: '🎮', color: 'bg-purple-500' },
    ] : [
        { name: 'Tổng sinh viên', value: '...', icon: '👥', color: 'bg-blue-500' },
        { name: 'Sự kiện hoạt động', value: '...', icon: '📅', color: 'bg-green-500' },
        { name: 'Chuỗi sự kiện', value: '...', icon: '📋', color: 'bg-yellow-500' },
        { name: 'Mini Games', value: '...', icon: '🎮', color: 'bg-purple-500' },
    ];

    const quickActions = [
        { name: 'Quản lý sự kiện', href: '/manager/events', icon: '📅', description: 'Tạo và quản lý các sự kiện hoạt động' },
        { name: 'Chuỗi sự kiện', href: '/manager/series', icon: '📋', description: 'Tạo và quản lý chuỗi sự kiện' },
        { name: 'Mini Game', href: '/manager/minigames', icon: '🎮', description: 'Tạo và quản lý quiz minigame' },
        { name: 'Quản lý lớp học', href: '/admin/classes', icon: '🏫', description: 'Quản lý lớp học và sinh viên' },
        { name: 'Quản lý năm học', href: '/admin/academic-years', icon: '📚', description: 'Quản lý năm học và học kỳ' },
        { name: 'Quản lý phòng ban', href: '/admin/departments', icon: '🏢', description: 'Quản lý khoa và phòng ban' },
        { name: 'Quản lý sinh viên', href: '/admin/students', icon: '🎓', description: 'Quản lý thông tin sinh viên' },
        { name: 'Báo cáo thống kê', href: '/admin/statistics', icon: '📈', description: 'Xem báo cáo và thống kê hệ thống' },
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div>
            <div className="max-w-7xl mx-auto">
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}
                {/* Stats */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    {stats.map((stat) => (
                        <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className={`flex-shrink-0 w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                                        <span className="text-2xl text-white">{stat.icon}</span>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                {stat.name}
                                            </dt>
                                            <dd className="text-2xl font-bold text-gray-900">
                                                {stat.value}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                            Thao tác nhanh
                        </h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {quickActions.map((action) => (
                                <Link
                                    key={action.name}
                                    to={action.href}
                                    className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200"
                                >
                                    <div>
                                        <div className="flex items-center mb-3">
                                            <span className="text-3xl mr-3">{action.icon}</span>
                                            <div className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                {action.name}
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
                                            {action.description}
                                        </p>
                                    </div>
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>


                {/* Top Activities and Students */}
                {dashboardData && (dashboardData.topActivities.length > 0 || dashboardData.topStudents.length > 0) && (
                    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Top Activities */}
                        {dashboardData.topActivities.length > 0 && (
                            <div className="bg-white shadow rounded-lg">
                                <div className="px-4 py-5 sm:p-6">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                        Top hoạt động
                                    </h3>
                                    <div className="space-y-3">
                                        {dashboardData.topActivities.slice(0, 5).map((activity) => (
                                            <div key={activity.activityId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900">{activity.activityName}</p>
                                                    <p className="text-xs text-gray-500">
                                                        Đăng ký: {formatNumber(activity.registrationCount)} | Tham gia: {formatNumber(activity.participationCount)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Top Students */}
                        {dashboardData.topStudents.length > 0 && (
                            <div className="bg-white shadow rounded-lg">
                                <div className="px-4 py-5 sm:p-6">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                        Top sinh viên
                                    </h3>
                                    <div className="space-y-3">
                                        {dashboardData.topStudents.slice(0, 5).map((student) => (
                                            <div key={student.studentId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900">{student.studentName}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {student.studentCode} | Tham gia: {formatNumber(student.participationCount)} hoạt động
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Quick Stats */}
                <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                Thống kê nhanh
                            </h3>
                            <div className="space-y-3">
                                {dashboardData && (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Đăng ký tháng này</span>
                                            <span className="text-lg font-semibold text-green-600">{formatNumber(dashboardData.monthlyRegistrations)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Tham gia tháng này</span>
                                            <span className="text-lg font-semibold text-blue-600">{formatNumber(dashboardData.monthlyParticipations)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Tỷ lệ tham gia</span>
                                            <span className="text-lg font-semibold text-purple-600">{(dashboardData.averageParticipationRate * 100).toFixed(1)}%</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                Hệ thống
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Trạng thái hệ thống</span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Hoạt động bình thường
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Phiên bản</span>
                                    <span className="text-sm font-medium text-gray-900">v2.1.0</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Cập nhật cuối</span>
                                    <span className="text-sm text-gray-500">2 ngày trước</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;