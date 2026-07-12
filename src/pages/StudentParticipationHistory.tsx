import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ActivityRegistrationResponse, RegistrationStatus, EventTimeStatus } from '../types';
import { registrationAPI } from '../services';
import StudentLayout from '../components/layout/StudentLayout';
import { 
    ListChecks, 
    CalendarCheck, 
    CheckCircle, 
    Hourglass, 
    XCircle, 
    CalendarBlank,
    Eye,
    X
} from '@phosphor-icons/react';

const StudentParticipationHistory: React.FC = () => {
    const [registrations, setRegistrations] = useState<ActivityRegistrationResponse[]>([]);
    // P7-4: canCancel từ BE (/registration-status) — /my không trả canCancel.
    const [canCancelMap, setCanCancelMap] = useState<Map<number, boolean>>(new Map());
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: 'ALL' as RegistrationStatus | 'ALL',
        timeRange: 'ALL' as 'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR',
    });
    const [eventTimeStatus, setEventTimeStatus] = useState<EventTimeStatus | undefined>(undefined);

    const loadRegistrations = useCallback(async () => {
        try {
            setLoading(true);
            const data = await registrationAPI.getMyRegistrations(eventTimeStatus);

            let filteredData = data;

            // Filter by status
            if (filters.status !== 'ALL') {
                filteredData = filteredData.filter(reg => reg.status === filters.status);
            }

            // Filter by time range
            if (filters.timeRange !== 'ALL') {
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                filteredData = filteredData.filter(reg => {
                    const regDate = new Date(reg.registeredDate);
                    const regMonth = regDate.getMonth();
                    const regYear = regDate.getFullYear();

                    switch (filters.timeRange) {
                        case 'THIS_MONTH':
                            return regMonth === currentMonth && regYear === currentYear;
                        case 'LAST_MONTH':
                            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                            const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                            return regMonth === lastMonth && regYear === lastMonthYear;
                        case 'THIS_YEAR':
                            return regYear === currentYear;
                        default:
                            return true;
                    }
                });
            }

            setRegistrations(filteredData);
            // P7-4: fetch canCancel per-row từ /registration-status (song song, bỏ qua lỗi).
            loadCanCancelStatuses(filteredData);
        } catch (error) {
            console.error('Error loading registrations:', error);
        } finally {
            setLoading(false);
        }
    }, [filters, eventTimeStatus]);

    const loadCanCancelStatuses = async (regs: ActivityRegistrationResponse[]) => {
        const map = new Map<number, boolean>();
        const seen = new Set<number>();
        const uniqueIds = regs.reduce<number[]>((acc, r) => {
            if (r.activityId != null && !seen.has(r.activityId)) {
                seen.add(r.activityId);
                acc.push(r.activityId);
            }
            return acc;
        }, []);
        await Promise.all(uniqueIds.map(async (activityId) => {
            try {
                const regStatus = await registrationAPI.getActivityRegistrationStatus(activityId);
                if (regStatus?.canCancel === true) {
                    map.set(activityId, true);
                }
            } catch { /* ignore per-row error */ }
        }));
        setCanCancelMap(map);
    };

    useEffect(() => {
        loadRegistrations();
    }, [loadRegistrations]);

    const handleCancelRegistration = async (activityId: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn hủy đăng ký sự kiện này?')) {
            return;
        }

        try {
            await registrationAPI.cancelRegistration(activityId);
            await loadRegistrations();
            alert('Hủy đăng ký thành công!');
        } catch (error) {
            console.error('Error canceling registration:', error);
            alert('Có lỗi xảy ra khi hủy đăng ký');
        }
    };

    const getStatusLabel = (status: RegistrationStatus): string => {
        switch (status) {
            case 'PENDING':
                return 'Chờ duyệt';
            case 'APPROVED':
                return 'Đã duyệt';
            case 'REJECTED':
                return 'Từ chối';
            case 'CANCELLED':
                return 'Đã hủy';
            default:
                return status;
        }
    };

    const getStatusColor = (status: RegistrationStatus): string => {
        switch (status) {
            case 'PENDING':
                return 'bg-amber-100 text-amber-700 border border-amber-200/50';
            case 'APPROVED':
                return 'bg-emerald-100 text-emerald-700 border border-emerald-200/50';
            case 'REJECTED':
                return 'bg-rose-100 text-rose-700 border border-rose-200/50';
            case 'CANCELLED':
                return 'bg-gray-100 text-gray-700 border border-gray-200/50';
            default:
                return 'bg-gray-100 text-gray-700 border border-gray-200/50';
        }
    };

    const canCancel = (registration: ActivityRegistrationResponse): boolean => {
        // P7-4: dùng canCancel từ BE (/registration-status) thay vì tự tính status === 'PENDING'.
        return canCancelMap.get(registration.activityId) === true;
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001C44] mx-auto"></div>
                        <p className="mt-4 text-gray-600">Đang tải lịch sử tham gia...</p>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-br from-[#001C44] via-[#002A66] to-[#003B8E] rounded-2xl shadow-xl p-8 text-white mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold mb-2 flex items-center tracking-tight">
                                <ListChecks weight="duotone" className="mr-3 text-4xl text-blue-200" />
                                Lịch sử tham gia
                            </h1>
                            <p className="text-blue-100 text-lg">Xem và quản lý lịch sử đăng ký tham gia các sự kiện</p>
                        </div>
                        <Link
                            to="/student/events"
                            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center group"
                        >
                            Khám phá sự kiện 
                            <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                        </Link>
                    </div>
                </div>

                {/* Summary Stats */}
                {registrations.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-2xl p-6 border-l-4 border-[#001C44] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mr-3 text-[#001C44] group-hover:scale-110 transition-transform duration-300">
                                    <CalendarCheck weight="duotone" size={24} />
                                </div>
                                <p className="text-sm font-medium text-gray-500">Tổng đăng ký</p>
                            </div>
                            <p className="text-4xl font-bold text-gray-900 tracking-tight">{registrations.length}</p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border-l-4 border-emerald-500 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mr-3 text-emerald-600 group-hover:scale-110 transition-transform duration-300">
                                    <CheckCircle weight="duotone" size={24} />
                                </div>
                                <p className="text-sm font-medium text-gray-500">Đã duyệt</p>
                            </div>
                            <p className="text-4xl font-bold text-gray-900 tracking-tight">
                                {registrations.filter(r => r.status === 'APPROVED').length}
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border-l-4 border-amber-500 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mr-3 text-amber-600 group-hover:scale-110 transition-transform duration-300">
                                    <Hourglass weight="duotone" size={24} />
                                </div>
                                <p className="text-sm font-medium text-gray-500">Chờ duyệt</p>
                            </div>
                            <p className="text-4xl font-bold text-gray-900 tracking-tight">
                                {registrations.filter(r => r.status === 'PENDING').length}
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border-l-4 border-rose-500 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center mr-3 text-rose-600 group-hover:scale-110 transition-transform duration-300">
                                    <XCircle weight="duotone" size={24} />
                                </div>
                                <p className="text-sm font-medium text-gray-500">Từ chối</p>
                            </div>
                            <p className="text-4xl font-bold text-gray-900 tracking-tight">
                                {registrations.filter(r => r.status === 'REJECTED').length}
                            </p>
                        </div>
                    </div>
                )}

                {/* Control Bar: Filters & Tabs */}
                <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
                    {/* Event Time Status Tabs */}
                    <div className="flex items-center p-1.5 bg-gray-50/80 rounded-xl border border-gray-100/50 self-start">
                        {[
                            { label: 'Tất cả', value: undefined },
                            { label: 'Sắp tới', value: EventTimeStatus.UPCOMING },
                            { label: 'Đang diễn ra', value: EventTimeStatus.ONGOING },
                            { label: 'Đã qua', value: EventTimeStatus.PAST },
                        ].map((tab) => {
                            const isActive = eventTimeStatus === tab.value;
                            return (
                                <button
                                    key={tab.label}
                                    onClick={() => setEventTimeStatus(tab.value)}
                                    className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                                        isActive
                                            ? 'bg-white text-[#001C44] shadow-sm ring-1 ring-black/5'
                                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Dropdown Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative min-w-[180px]">
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as RegistrationStatus | 'ALL' }))}
                                className="w-full appearance-none pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium cursor-pointer"
                            >
                                <option value="ALL">Tất cả trạng thái</option>
                                <option value="PENDING">Chờ duyệt</option>
                                <option value="APPROVED">Đã duyệt</option>
                                <option value="REJECTED">Từ chối</option>
                                <option value="CANCELLED">Đã hủy</option>
                            </select>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                        <div className="relative min-w-[180px]">
                            <select
                                value={filters.timeRange}
                                onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value as any }))}
                                className="w-full appearance-none pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium cursor-pointer"
                            >
                                <option value="ALL">Tất cả thời gian</option>
                                <option value="THIS_MONTH">Tháng này</option>
                                <option value="LAST_MONTH">Tháng trước</option>
                                <option value="THIS_YEAR">Năm nay</option>
                            </select>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Registrations List */}
                <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden relative">
                    {registrations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                <CalendarBlank weight="duotone" className="text-gray-400" size={48} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có lịch sử tham gia</h3>
                            <p className="text-gray-500 mb-8 max-w-sm text-center leading-relaxed">Bạn chưa đăng ký tham gia sự kiện nào. Hãy khám phá và tham gia các sự kiện sắp tới nhé.</p>
                            <Link
                                to="/student/events"
                                className="inline-flex items-center px-6 py-3 bg-[#001C44] text-white rounded-xl hover:bg-[#002A66] hover:shadow-lg transition-all duration-300 font-semibold"
                            >
                                Khám phá sự kiện ngay
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead>
                                    <tr className="bg-gray-50/50">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Sự kiện
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Ngày đăng ký
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Trạng thái
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Thời gian & Địa điểm
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {registrations.map((registration) => (
                                        <tr key={registration.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="text-base font-semibold text-gray-900 group-hover:text-[#001C44] transition-colors">
                                                    {registration.activityName}
                                                </div>
                                                {registration.activityDescription && (
                                                    <div className="text-sm text-gray-500 mt-1 line-clamp-1 max-w-md">
                                                        {registration.activityDescription}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600 font-medium">
                                                {formatDate(registration.registeredDate)}
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${getStatusColor(registration.status)}`}>
                                                    {getStatusLabel(registration.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 mb-0.5">
                                                    {new Date(registration.activityStartDate).toLocaleDateString('vi-VN')}
                                                </div>
                                                <div className="text-sm text-gray-500 max-w-[200px] truncate">
                                                    {registration.activityLocation || 'Chưa cập nhật'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link
                                                        to={`/student/events/${registration.activityId}`}
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye size={18} weight="bold" />
                                                    </Link>
                                                    {canCancel(registration) && (
                                                        <button
                                                            onClick={() => handleCancelRegistration(registration.activityId)}
                                                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-colors"
                                                            title="Hủy đăng ký"
                                                        >
                                                            <X size={18} weight="bold" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </StudentLayout>
    );
};

export default StudentParticipationHistory;
