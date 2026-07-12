import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { statisticsAPI } from '../../services/statisticsAPI';
import { DashboardStatisticsResponse } from '../../types/statistics';
import { LoadingSpinner } from '../common';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { 
    Users, 
    CalendarBlank, 
    ListDashes, 
    GameController, 
    ChartBar, 
    Trophy, 
    Star, 
    Info,
    CheckCircle,
    TrendUp,
    User,
    ArrowRight
} from '@phosphor-icons/react';

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
        { name: 'Tổng sinh viên', value: formatNumber(dashboardData.totalStudents), icon: Users, color: 'text-[#001C44]', bg: 'bg-[#001C44]/5' },
        { name: 'Sự kiện hoạt động', value: formatNumber(dashboardData.totalActivities), icon: CalendarBlank, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { name: 'Chuỗi sự kiện', value: formatNumber(dashboardData.totalSeries), icon: ListDashes, color: 'text-purple-600', bg: 'bg-purple-50' },
        { name: 'Mini Games', value: formatNumber(dashboardData.totalMiniGames), icon: GameController, color: 'text-[#FFD66D]', bg: 'bg-[#FFD66D]/10' },
    ] : [
        { name: 'Tổng sinh viên', value: '...', icon: Users, color: 'text-gray-400', bg: 'bg-gray-50' },
        { name: 'Sự kiện hoạt động', value: '...', icon: CalendarBlank, color: 'text-gray-400', bg: 'bg-gray-50' },
        { name: 'Chuỗi sự kiện', value: '...', icon: ListDashes, color: 'text-gray-400', bg: 'bg-gray-50' },
        { name: 'Mini Games', value: '...', icon: GameController, color: 'text-gray-400', bg: 'bg-gray-50' },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring" as const, stiffness: 300, damping: 24 }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <motion.div 
            className="space-y-6"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <motion.div variants={itemVariants} className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    {/* Subtle decorative background */}
                    <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-gradient-to-br from-[#001C44]/5 to-transparent rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-gradient-to-tr from-[#FFD66D]/10 to-transparent rounded-full blur-2xl"></div>
                    
                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2 flex items-center gap-3">
                                <ChartBar className="text-[#001C44]" weight="duotone" size={36} />
                                Thống kê tổng quan
                            </h1>
                            <p className="text-gray-500 text-lg">Xem tổng quan các số liệu thống kê của hệ thống</p>
                        </div>
                        <div className="flex items-center space-x-3 bg-green-50/50 border border-green-100 px-4 py-2 rounded-full">
                            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-green-700">Hệ thống hoạt động ổn định</span>
                        </div>
                    </div>
                </motion.div>

                {error && (
                    <motion.div variants={itemVariants} className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 flex items-center gap-3">
                        <Info size={20} weight="bold" />
                        {error}
                    </motion.div>
                )}

                {/* Main Stats Cards */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <div
                            key={stat.name}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">{stat.name}</p>
                                    <p className="text-3xl font-bold text-gray-900 tracking-tight">
                                        {stat.value}
                                    </p>
                                </div>
                                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                                    <stat.icon className={`${stat.color} transition-transform group-hover:scale-110`} weight="duotone" size={24} />
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* Statistics Overview */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Monthly Statistics */}
                    <motion.div variants={itemVariants} className="lg:col-span-2 bg-white shadow-sm rounded-2xl p-6 md:p-8 border border-gray-100">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                                <CalendarBlank className="text-[#001C44]" weight="bold" size={24} />
                                Thống kê tháng này
                            </h3>
                            <div className="text-xs font-medium text-[#001C44] bg-[#001C44]/5 px-3 py-1.5 rounded-full">
                                {new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                            </div>
                        </div>
                        {dashboardData ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="bg-slate-50/50 rounded-2xl p-6 border border-gray-100 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                            <ListDashes weight="bold" size={20} />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-600">Đăng ký mới</p>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900 tracking-tight">{formatNumber(dashboardData.monthlyRegistrations)}</p>
                                </div>
                                <div className="bg-slate-50/50 rounded-2xl p-6 border border-gray-100 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                                            <CheckCircle weight="bold" size={20} />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-600">Tham gia</p>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900 tracking-tight">{formatNumber(dashboardData.monthlyParticipations)}</p>
                                </div>
                                <div className="bg-slate-50/50 rounded-2xl p-6 border border-gray-100 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                                            <TrendUp weight="bold" size={20} />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-600">Tỷ lệ tham gia</p>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900 tracking-tight">{(dashboardData.averageParticipationRate * 100).toFixed(1)}%</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <LoadingSpinner />
                            </div>
                        )}
                    </motion.div>

                    {/* Quick Info */}
                    <motion.div variants={itemVariants} className="bg-[#001C44] rounded-2xl shadow-sm p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-[#FFD66D]/10 rounded-full blur-2xl"></div>
                        <h3 className="text-xl font-bold mb-8 tracking-tight flex items-center gap-2 relative z-10">
                            <Info weight="fill" size={24} className="text-[#FFD66D]" />
                            Thông tin hệ thống
                        </h3>
                        <div className="space-y-4 relative z-10">
                            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-300">Người dùng</span>
                                    <span className="text-sm font-semibold flex items-center gap-1.5 text-white">
                                        <User size={16} weight="bold" className="text-[#FFD66D]" />
                                        {username || 'Admin'}
                                    </span>
                                </div>
                            </div>
                            <Link
                                to="/admin/statistics"
                                className="mt-8 flex items-center justify-between w-full px-5 py-3.5 bg-white text-[#001C44] rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-sm group"
                            >
                                <span>Xem báo cáo chi tiết</span>
                                <ArrowRight size={20} weight="bold" className="transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>
                    </motion.div>
                </div>

                {/* Top Activities and Students */}
                {dashboardData && (dashboardData.topActivities.length > 0 || dashboardData.topStudents.length > 0) && (
                    <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Top Activities */}
                        {dashboardData.topActivities.length > 0 && (
                            <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
                                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                                            <Trophy weight="duotone" size={24} className="text-[#FFD66D]" />
                                            Top hoạt động
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">Phổ biến nhất tháng này</p>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="mb-6 h-72">
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
                                                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" axisLine={false} tickLine={false} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                                                    cursor={{ fill: '#f8fafc' }}
                                                />
                                                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                                                <Bar dataKey="Đăng ký" fill="#001C44" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                                <Bar dataKey="Tham gia" fill="#FFD66D" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="space-y-3">
                                        {dashboardData.topActivities.slice(0, 5).map((activity, index) => (
                                            <div key={activity.activityId} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-[#FFD66D]/20 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900 line-clamp-1">{activity.activityName}</p>
                                                        <div className="flex items-center gap-4 mt-1">
                                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                                Đăng ký: <span className="font-semibold text-gray-900">{formatNumber(activity.registrationCount)}</span>
                                                            </span>
                                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                                Tham gia: <span className="font-semibold text-gray-900">{formatNumber(activity.participationCount)}</span>
                                                            </span>
                                                        </div>
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
                            <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
                                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                                            <Star weight="duotone" size={24} className="text-[#001C44]" />
                                            Sinh viên tích cực
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">Tham gia nhiều nhất tháng</p>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="mb-6 h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={dashboardData.topStudents.slice(0, 5).map((student) => ({
                                                    name: student.studentName.length > 12
                                                        ? student.studentName.substring(0, 12) + '...'
                                                        : student.studentName,
                                                    'Lượt tham gia': student.participationCount,
                                                }))}
                                                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" axisLine={false} tickLine={false} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                                                    cursor={{ fill: '#f8fafc' }}
                                                />
                                                <Bar dataKey="Lượt tham gia" fill="#001C44" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="space-y-3">
                                        {dashboardData.topStudents.slice(0, 5).map((student, index) => (
                                            <div key={student.studentId} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-[#FFD66D]/20 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">{student.studentName}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">{student.studentCode}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-gray-900">{formatNumber(student.participationCount)}</p>
                                                    <p className="text-xs text-gray-500">hoạt động</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default AdminDashboard;