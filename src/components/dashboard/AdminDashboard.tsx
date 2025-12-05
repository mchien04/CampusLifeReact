import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { statisticsAPI } from '../../services/statisticsAPI';
import { DashboardStatisticsResponse } from '../../types/statistics';
import { LoadingSpinner } from '../common';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

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
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-[#001C44] mb-2 flex items-center">
                                <span className="mr-4 text-5xl">📊</span>
                                Thống kê tổng quan
                            </h1>
                            <p className="text-gray-600 text-lg">Xem tổng quan các số liệu thống kê của hệ thống</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {/* Main Stats Cards */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    {stats.map((stat) => (
                        <div 
                            key={stat.name} 
                            className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 overflow-hidden group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-600 mb-2">{stat.name}</p>
                                    <p className="text-3xl font-bold text-[#001C44]">{stat.value}</p>
                                </div>
                                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#001C44] to-[#002A66] flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform">
                                    {stat.icon}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>


                {/* Statistics Overview */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
                    {/* Monthly Statistics */}
                    <div className="lg:col-span-2 bg-white shadow-lg rounded-xl p-6 border border-gray-100">
                        <h3 className="text-2xl font-bold text-[#001C44] mb-6 flex items-center">
                            <span className="mr-3 text-3xl">📊</span>
                            Thống kê tháng này
                        </h3>
                        {dashboardData ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-50 rounded-xl p-5 border-2 border-gray-200 hover:shadow-lg transition-all">
                                    <div className="flex items-center mb-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-[#001C44] to-[#002A66] rounded-xl flex items-center justify-center mr-3 shadow-md">
                                            <span className="text-2xl text-white">📝</span>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-700">Đăng ký mới</p>
                                    </div>
                                    <p className="text-3xl font-bold text-[#001C44]">{formatNumber(dashboardData.monthlyRegistrations)}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-5 border-2 border-gray-200 hover:shadow-lg transition-all">
                                    <div className="flex items-center mb-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-[#001C44] to-[#002A66] rounded-xl flex items-center justify-center mr-3 shadow-md">
                                            <span className="text-2xl text-white">✅</span>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-700">Tham gia</p>
                                    </div>
                                    <p className="text-3xl font-bold text-[#001C44]">{formatNumber(dashboardData.monthlyParticipations)}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-5 border-2 border-gray-200 hover:shadow-lg transition-all">
                                    <div className="flex items-center mb-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-[#001C44] to-[#002A66] rounded-xl flex items-center justify-center mr-3 shadow-md">
                                            <span className="text-2xl text-white">📈</span>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-700">Tỷ lệ tham gia</p>
                                    </div>
                                    <p className="text-3xl font-bold text-[#001C44]">{(dashboardData.averageParticipationRate * 100).toFixed(1)}%</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">Đang tải dữ liệu...</div>
                        )}
                    </div>

                    {/* Quick Info */}
                    <div className="bg-gradient-to-br from-[#001C44] to-[#002A66] rounded-xl shadow-lg p-6 text-white">
                        <h3 className="text-2xl font-bold mb-6 flex items-center">
                            <span className="mr-3 text-3xl">ℹ️</span>
                            Thông tin hệ thống
                        </h3>
                        <div className="space-y-4">
                            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-20">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-200">Trạng thái</span>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-white">
                                        ✓ Hoạt động
                                    </span>
                                </div>
                            </div>
                            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-20">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-200">Người dùng</span>
                                    <span className="text-sm font-bold text-[#FFD66D]">{username || 'Admin'}</span>
                                </div>
                            </div>
                            <Link
                                to="/admin/statistics"
                                className="block w-full mt-6 px-4 py-3 bg-[#FFD66D] text-[#001C44] rounded-xl hover:bg-[#FFC947] transition-all text-center font-bold shadow-lg hover:shadow-xl"
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
                            <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden">
                                <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] px-6 py-5">
                                    <h3 className="text-2xl font-bold text-white flex items-center">
                                        <span className="mr-3 text-3xl">🏆</span>
                                        Top hoạt động phổ biến
                                    </h3>
                                </div>
                                <div className="p-6">
                                    {/* Chart */}
                                    <div className="mb-6" style={{ height: '300px' }}>
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
                                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                <XAxis 
                                                    dataKey="name" 
                                                    angle={-45}
                                                    textAnchor="end"
                                                    height={80}
                                                    tick={{ fontSize: 12 }}
                                                />
                                                <YAxis tick={{ fontSize: 12 }} />
                                                <Tooltip 
                                                    contentStyle={{ 
                                                        backgroundColor: '#fff', 
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '8px',
                                                        padding: '10px'
                                                    }}
                                                    formatter={(value: number) => formatNumber(value)}
                                                    labelFormatter={(label) => {
                                                        const item = dashboardData.topActivities.find(a => 
                                                            a.activityName.length > 15 
                                                                ? a.activityName.substring(0, 15) + '...' === label
                                                                : a.activityName === label
                                                        );
                                                        return item?.activityName || label;
                                                    }}
                                                />
                                                <Legend />
                                                <Bar dataKey="Đăng ký" fill="#001C44" radius={[8, 8, 0, 0]}>
                                                    {dashboardData.topActivities.slice(0, 5).map((_, index) => {
                                                        const shades = ['#001C44', '#002A66', '#003A88', '#004AAA', '#005ACC'];
                                                        return <Cell key={`cell-${index}`} fill={shades[index]} />;
                                                    })}
                                                </Bar>
                                                <Bar dataKey="Tham gia" fill="#FFD66D" radius={[8, 8, 0, 0]}>
                                                    {dashboardData.topActivities.slice(0, 5).map((_, index) => {
                                                        const shades = ['#FFD66D', '#FFC947', '#FFB82E', '#FFA715', '#FF9600'];
                                                        return <Cell key={`cell-p-${index}`} fill={shades[index]} />;
                                                    })}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    {/* List */}
                                    <div className="space-y-2">
                                        {dashboardData.topActivities.slice(0, 5).map((activity, index) => (
                                            <div key={activity.activityId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center flex-1">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-[#001C44] to-[#002A66] rounded-lg flex items-center justify-center mr-3 font-bold text-white text-sm shadow-md">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 truncate">{activity.activityName}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            ĐK: <span className="font-semibold">{formatNumber(activity.registrationCount)}</span> | 
                                                            TG: <span className="font-semibold">{formatNumber(activity.participationCount)}</span>
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
                            <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden">
                                <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] px-6 py-5">
                                    <h3 className="text-2xl font-bold text-white flex items-center">
                                        <span className="mr-3 text-3xl">⭐</span>
                                        Top sinh viên tích cực
                                    </h3>
                                </div>
                                <div className="p-6">
                                    {/* Chart */}
                                    <div className="mb-6" style={{ height: '300px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={dashboardData.topStudents.slice(0, 5).map((student) => ({
                                                    name: student.studentName.length > 12 
                                                        ? student.studentName.substring(0, 12) + '...' 
                                                        : student.studentName,
                                                    fullName: student.studentName,
                                                    'Số lần tham gia': student.participationCount,
                                                }))}
                                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                <XAxis 
                                                    dataKey="name" 
                                                    angle={-45}
                                                    textAnchor="end"
                                                    height={80}
                                                    tick={{ fontSize: 12 }}
                                                />
                                                <YAxis tick={{ fontSize: 12 }} />
                                                <Tooltip 
                                                    contentStyle={{ 
                                                        backgroundColor: '#fff', 
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '8px',
                                                        padding: '10px'
                                                    }}
                                                    formatter={(value: number) => formatNumber(value)}
                                                    labelFormatter={(label) => {
                                                        const item = dashboardData.topStudents.find(s => 
                                                            s.studentName.length > 12 
                                                                ? s.studentName.substring(0, 12) + '...' === label
                                                                : s.studentName === label
                                                        );
                                                        return item ? `${item.studentName} (${item.studentCode})` : label;
                                                    }}
                                                />
                                                <Bar dataKey="Số lần tham gia" fill="#001C44" radius={[8, 8, 0, 0]}>
                                                    {dashboardData.topStudents.slice(0, 5).map((_, index) => {
                                                        const shades = ['#001C44', '#002A66', '#003A88', '#004AAA', '#005ACC'];
                                                        return <Cell key={`cell-${index}`} fill={shades[index]} />;
                                                    })}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    {/* List */}
                                    <div className="space-y-2">
                                        {dashboardData.topStudents.slice(0, 5).map((student, index) => (
                                            <div key={student.studentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center flex-1">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-[#001C44] to-[#002A66] rounded-lg flex items-center justify-center mr-3 font-bold text-white text-sm shadow-md">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 truncate">{student.studentName}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            {student.studentCode} | 
                                                            TG: <span className="font-semibold">{formatNumber(student.participationCount)}</span> hoạt động
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