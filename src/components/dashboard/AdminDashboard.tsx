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
                setError(response.message || 'Không thể tải dữ liệu thống kê');
            }
        } catch (err) {
            console.error('Error loading dashboard data:', err);
            setError('Có lỗi xảy ra khi tải dữ liệu thống kê');
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    const stats = dashboardData ? [
        { name: 'Tổng sinh viên', value: formatNumber(dashboardData.totalStudents), icon: '👥' },
        { name: 'Sự kiện hoạt động', value: formatNumber(dashboardData.totalActivities), icon: '📅' },
        { name: 'Chuỗi sự kiện', value: formatNumber(dashboardData.totalSeries), icon: '📋' },
        { name: 'Mini Games', value: formatNumber(dashboardData.totalMiniGames), icon: '🎮' },
    ] : [
        { name: 'Tổng sinh viên', value: '...', icon: '👥' },
        { name: 'Sự kiện hoạt động', value: '...', icon: '📅' },
        { name: 'Chuỗi sự kiện', value: '...', icon: '📋' },
        { name: 'Mini Games', value: '...', icon: '🎮' },
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
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-[#001C44] mb-2">Thống kê tổng quan</h1>
                    <p className="text-gray-600">Xem tổng quan các số liệu thống kê của hệ thống</p>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {/* Main Stats Cards */}
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


                {/* Statistics Overview */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
                    {/* Monthly Statistics */}
                    <div className="lg:col-span-2 bg-white shadow-lg rounded-xl p-6 border border-gray-100">
                        <h3 className="text-xl font-semibold text-[#001C44] mb-6 flex items-center">
                            <span className="mr-2">📊</span>
                            Thống kê tháng này
                        </h3>
                        {dashboardData ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                                    <div className="flex items-center">
                                        <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                                            <span className="text-2xl text-white">📝</span>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Đăng ký mới</p>
                                            <p className="text-2xl font-bold text-green-700">{formatNumber(dashboardData.monthlyRegistrations)}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                                    <div className="flex items-center">
                                        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                                            <span className="text-2xl text-white">✅</span>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Tham gia</p>
                                            <p className="text-2xl font-bold text-blue-700">{formatNumber(dashboardData.monthlyParticipations)}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                                    <div className="flex items-center">
                                        <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
                                            <span className="text-2xl text-white">📈</span>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Tỷ lệ tham gia</p>
                                            <p className="text-2xl font-bold text-purple-700">{(dashboardData.averageParticipationRate * 100).toFixed(1)}%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">Đang tải dữ liệu...</div>
                        )}
                    </div>

                    {/* Quick Info */}
                    <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
                        <h3 className="text-xl font-semibold text-[#001C44] mb-6 flex items-center">
                            <span className="mr-2">ℹ️</span>
                            Thông tin hệ thống
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-600">Trạng thái</span>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    ✓ Hoạt động
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-600">Người dùng</span>
                                <span className="text-sm font-semibold text-gray-900">{username || 'Admin'}</span>
                            </div>
                            <Link
                                to="/admin/statistics"
                                className="block w-full mt-6 px-4 py-3 bg-[#001C44] text-white rounded-lg hover:bg-[#002A66] transition-colors text-center font-medium"
                            >
                                Xem thống kê chi tiết →
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Top Activities and Students */}
                {dashboardData && (dashboardData.topActivities.length > 0 || dashboardData.topStudents.length > 0) && (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Top Activities */}
                        {dashboardData.topActivities.length > 0 && (
                            <div className="bg-white shadow-lg rounded-xl border border-gray-100">
                                <div className="px-6 py-5 border-b border-gray-200">
                                    <h3 className="text-xl font-semibold text-[#001C44] flex items-center">
                                        <span className="mr-2">🏆</span>
                                        Top hoạt động phổ biến
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-3">
                                        {dashboardData.topActivities.slice(0, 5).map((activity, index) => (
                                            <div key={activity.activityId} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                                                <div className="flex items-center flex-1">
                                                    <div className="w-8 h-8 bg-[#FFD66D] rounded-full flex items-center justify-center mr-3 font-bold text-[#001C44]">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-gray-900">{activity.activityName}</p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Đăng ký: <span className="font-semibold">{formatNumber(activity.registrationCount)}</span> | 
                                                            Tham gia: <span className="font-semibold">{formatNumber(activity.participationCount)}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Top Students */}
                        {dashboardData.topStudents.length > 0 && (
                            <div className="bg-white shadow-lg rounded-xl border border-gray-100">
                                <div className="px-6 py-5 border-b border-gray-200">
                                    <h3 className="text-xl font-semibold text-[#001C44] flex items-center">
                                        <span className="mr-2">⭐</span>
                                        Top sinh viên tích cực
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-3">
                                        {dashboardData.topStudents.slice(0, 5).map((student, index) => (
                                            <div key={student.studentId} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                                                <div className="flex items-center flex-1">
                                                    <div className="w-8 h-8 bg-[#FFD66D] rounded-full flex items-center justify-center mr-3 font-bold text-[#001C44]">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-gray-900">{student.studentName}</p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {student.studentCode} | 
                                                            Tham gia: <span className="font-semibold">{formatNumber(student.participationCount)}</span> hoạt động
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
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

export default AdminDashboard;