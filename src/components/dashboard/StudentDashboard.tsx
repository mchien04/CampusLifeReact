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
import { motion } from 'framer-motion';
import { 
    CalendarBlank, 
    CalendarCheck, 
    Target, 
    ChartBar,
    ClipboardText,
    TrendUp,
    CheckCircle,
    HandPointing,
    Info,
    Trophy,
    Star,
    MapPin,
    ArrowRight
} from '@phosphor-icons/react';

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

                const ongoing = response.data.filter((event: ActivityResponse) => {
                    const startDate = new Date(event.startDate);
                    const endDate = new Date(event.endDate);
                    return startDate <= now && now <= endDate;
                }).slice(0, 5);

                const upcoming = response.data.filter((event: ActivityResponse) => {
                    const startDate = new Date(event.startDate);
                    return startDate > now && startDate <= thirtyDaysFromNow;
                }).slice(0, 5);

                setOngoingEvents(ongoing);
                setUpcomingEvents(upcoming);

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

    const stats = dashboardData ? [
        { name: 'Sự kiện đã tham gia', value: formatNumber(dashboardData.monthlyParticipations), icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { name: 'Đăng ký tháng này', value: formatNumber(dashboardData.monthlyRegistrations), icon: ClipboardText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { name: 'Tỷ lệ tham gia', value: (dashboardData.averageParticipationRate * 100).toFixed(1) + '%', icon: TrendUp, color: 'text-purple-600', bg: 'bg-purple-50' },
        { name: 'Tổng hoạt động', value: formatNumber(dashboardData.totalActivities), icon: CalendarBlank, color: 'text-amber-600', bg: 'bg-amber-50' },
    ] : [
        { name: 'Sự kiện đã tham gia', value: '...', icon: Target, color: 'text-gray-400', bg: 'bg-gray-50' },
        { name: 'Đăng ký tháng này', value: '...', icon: ClipboardText, color: 'text-gray-400', bg: 'bg-gray-50' },
        { name: 'Tỷ lệ tham gia', value: '...', icon: TrendUp, color: 'text-gray-400', bg: 'bg-gray-50' },
        { name: 'Tổng hoạt động', value: '...', icon: CalendarBlank, color: 'text-gray-400', bg: 'bg-gray-50' },
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
            <motion.div 
                className="space-y-6"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <motion.div variants={itemVariants} className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-gradient-to-br from-[#001C44]/5 to-transparent rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-gradient-to-tr from-[#FFD66D]/10 to-transparent rounded-full blur-2xl"></div>
                        
                        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
                                    Chào mừng trở lại, <span className="text-[#001C44]">{username}</span>!
                                </h1>
                                <p className="text-gray-500 text-lg">Hôm nay bạn có gì cần làm không?</p>
                            </div>
                            {currentSemesterId && (
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-medium text-gray-500">Học kỳ hiện tại</span>
                                    <span className="text-lg font-bold text-[#001C44] bg-[#001C44]/5 px-4 py-1.5 rounded-full mt-1">
                                        {semesterName}
                                    </span>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {error && (
                        <motion.div variants={itemVariants} className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 flex items-center gap-3">
                            <Info size={20} weight="bold" />
                            {error}
                        </motion.div>
                    )}

                    {/* Stats Cards */}
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

                    {/* Monthly Statistics */}
                    {dashboardData && (
                        <motion.div variants={itemVariants} className="bg-white shadow-sm rounded-2xl p-6 md:p-8 border border-gray-100">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                                    <ChartBar className="text-[#001C44]" weight="bold" size={24} />
                                    Thống kê tháng này
                                </h3>
                                <div className="text-xs font-medium text-[#001C44] bg-[#001C44]/5 px-3 py-1.5 rounded-full">
                                    {new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-slate-50/50 rounded-2xl p-6 border border-gray-100 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                            <ClipboardText weight="bold" size={20} />
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
                        </motion.div>
                    )}

                    {/* Top Activities and Events Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Top Activities - Left side, 2 columns */}
                        {dashboardData && dashboardData.topActivities.length > 0 ? (
                            <motion.div variants={itemVariants} className="lg:col-span-2 bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden flex flex-col h-full">
                                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                                            <Trophy weight="duotone" size={24} className="text-[#FFD66D]" />
                                            Top hoạt động
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">Phổ biến nhất tháng này</p>
                                    </div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
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
                                    <div className="space-y-3 mt-auto">
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
                            </motion.div>
                        ) : (
                            <div className="lg:col-span-2"></div>
                        )}

                        {/* Events - Right side, 1 column, stacked */}
                        <div className="space-y-6 flex flex-col">
                            {/* Ongoing Events */}
                            <motion.div variants={itemVariants} className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden flex-1">
                                <div className="px-5 py-4 border-b border-gray-100">
                                    <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
                                        <div className="relative flex h-3 w-3">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                        </div>
                                        Đang diễn ra
                                    </h3>
                                </div>
                                <div className="p-4">
                                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
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
                                                        className="block p-3 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/50 transition-colors group"
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1 min-w-0 pr-3">
                                                                <h4 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors truncate">{event.name}</h4>
                                                                <div className="flex flex-col gap-1 mt-1">
                                                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                                                        <CalendarBlank size={14} /> 
                                                                        {new Date(event.startDate).toLocaleDateString('vi-VN')} - {new Date(event.endDate).toLocaleDateString('vi-VN')}
                                                                    </p>
                                                                    {event.location && (
                                                                        <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                                                                            <MapPin size={14} /> {event.location}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ml-2 flex-shrink-0 ${isRegistered ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                {isRegistered ? 'Đã đăng ký' : 'Chưa đăng ký'}
                                                            </span>
                                                        </div>
                                                    </Link>
                                                );
                                            })
                                        )}
                                    </div>
                                    {ongoingEvents.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                                            <Link
                                                to="/student/events"
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#001C44] hover:text-indigo-600 transition-colors"
                                            >
                                                Xem tất cả <ArrowRight size={12} weight="bold" />
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Upcoming Events */}
                            <motion.div variants={itemVariants} className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden flex-1">
                                <div className="px-5 py-4 border-b border-gray-100">
                                    <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
                                        <CalendarCheck weight="duotone" size={20} className="text-indigo-600" />
                                        Sự kiện sắp tới
                                    </h3>
                                </div>
                                <div className="p-4">
                                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
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
                                                    <div key={event.id} className="p-3 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/50 transition-colors group relative">
                                                        <Link to={`/student/events/${event.id}`} className="block">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div className="flex-1 min-w-0 pr-3">
                                                                    <h4 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors truncate">{event.name}</h4>
                                                                    <div className="flex flex-col gap-1 mt-1">
                                                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                                                            <CalendarBlank size={14} /> 
                                                                            {new Date(event.startDate).toLocaleDateString('vi-VN')}
                                                                        </p>
                                                                        {event.location && (
                                                                            <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                                                                                <MapPin size={14} /> {event.location}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ml-2 flex-shrink-0 ${isRegistered ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
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
                                                                className="mt-2 w-full bg-[#001C44] text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1"
                                                            >
                                                                <HandPointing size={14} weight="bold" />
                                                                Đăng ký ngay
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                    {upcomingEvents.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                                            <Link
                                                to="/student/events"
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#001C44] hover:text-indigo-600 transition-colors"
                                            >
                                                Xem tất cả <ArrowRight size={12} weight="bold" />
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Top Students - Full width, below */}
                    {dashboardData && dashboardData.topStudents.length > 0 && (
                        <motion.div variants={itemVariants} className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden mb-8">
                            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                                        <Star weight="duotone" size={24} className="text-[#001C44]" />
                                        Sinh viên tích cực
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">Gương mặt tham gia nhiều nhất tháng</p>
                                </div>
                            </div>
                            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="h-72">
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
                                            margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" axisLine={false} tickLine={false} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                                                cursor={{ fill: '#f8fafc' }}
                                            />
                                            <Bar dataKey="Số lần tham gia" fill="#001C44" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-3">
                                    {dashboardData.topStudents.slice(0, 5).map((student, index) => {
                                        const isCurrentUser = student.studentId === studentId;
                                        return (
                                            <div key={student.studentId} className={`flex items-center justify-between p-3 rounded-xl transition-colors border border-transparent ${isCurrentUser ? 'bg-indigo-50 border-indigo-100 shadow-sm' : 'hover:bg-slate-50'}`}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-[#FFD66D]/20 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                                            {student.studentName}
                                                            {isCurrentUser && <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">Bạn</span>}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-0.5">{student.studentCode}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-gray-900">{formatNumber(student.participationCount)}</p>
                                                    <p className="text-xs text-gray-500">hoạt động</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </StudentLayout>
    );
};

export default StudentDashboard;
