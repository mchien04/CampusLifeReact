import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ActivityRegistrationResponse, RegistrationStatus } from '../types';
import { registrationAPI } from '../services';
import StudentLayout from '../components/layout/StudentLayout';

const StudentParticipationHistory: React.FC = () => {
    const [registrations, setRegistrations] = useState<ActivityRegistrationResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: 'ALL' as RegistrationStatus | 'ALL',
        timeRange: 'ALL' as 'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR',
    });

    const loadRegistrations = useCallback(async () => {
        try {
            setLoading(true);
            const data = await registrationAPI.getMyRegistrations();

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
        } catch (error) {
            console.error('Error loading registrations:', error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

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
                return 'bg-yellow-100 text-yellow-800';
            case 'APPROVED':
                return 'bg-green-100 text-green-800';
            case 'REJECTED':
                return 'bg-red-100 text-red-800';
            case 'CANCELLED':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const canCancel = (status: RegistrationStatus): boolean => {
        return status === 'PENDING';
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
                <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-xl shadow-lg p-6 text-white mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2 flex items-center">
                                <span className="mr-3 text-4xl">📋</span>
                                Lịch sử tham gia
                            </h1>
                            <p className="text-gray-200">Xem và quản lý lịch sử đăng ký tham gia các sự kiện</p>
                        </div>
                        <Link
                            to="/student/events"
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                        >
                            Xem sự kiện →
                        </Link>
                    </div>
                </div>

                {/* Summary Stats */}
                {registrations.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-gray-50 rounded-xl p-5 border-l-4 border-[#001C44] shadow-md hover:shadow-xl hover:bg-gray-100 transition-all group">
                            <div className="flex items-center mb-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-[#001C44] to-[#002A66] rounded-xl flex items-center justify-center mr-3 shadow-md group-hover:scale-105 transition-transform">
                                    <span className="text-2xl text-white">📅</span>
                                </div>
                                <p className="text-sm font-semibold text-gray-700">Tổng đăng ký</p>
                            </div>
                            <p className="text-3xl font-bold text-[#001C44]">{registrations.length}</p>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-5 border-l-4 border-green-500 shadow-md hover:shadow-xl hover:bg-gray-100 transition-all group">
                            <div className="flex items-center mb-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-3 shadow-md group-hover:scale-105 transition-transform">
                                    <span className="text-2xl text-white">✅</span>
                                </div>
                                <p className="text-sm font-semibold text-gray-700">Đã duyệt</p>
                            </div>
                            <p className="text-3xl font-bold text-[#001C44]">
                                {registrations.filter(r => r.status === 'APPROVED').length}
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-5 border-l-4 border-yellow-500 shadow-md hover:shadow-xl hover:bg-gray-100 transition-all group">
                            <div className="flex items-center mb-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center mr-3 shadow-md group-hover:scale-105 transition-transform">
                                    <span className="text-2xl text-[#001C44]">⏳</span>
                                </div>
                                <p className="text-sm font-semibold text-gray-700">Chờ duyệt</p>
                            </div>
                            <p className="text-3xl font-bold text-[#001C44]">
                                {registrations.filter(r => r.status === 'PENDING').length}
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-5 border-l-4 border-red-500 shadow-md hover:shadow-xl hover:bg-gray-100 transition-all group">
                            <div className="flex items-center mb-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mr-3 shadow-md group-hover:scale-105 transition-transform">
                                    <span className="text-2xl text-white">❌</span>
                                </div>
                                <p className="text-sm font-semibold text-gray-700">Từ chối</p>
                            </div>
                            <p className="text-3xl font-bold text-[#001C44]">
                                {registrations.filter(r => r.status === 'REJECTED').length}
                            </p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Trạng thái
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as RegistrationStatus | 'ALL' }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
                            >
                                <option value="ALL">Tất cả trạng thái</option>
                                <option value="PENDING">Chờ duyệt</option>
                                <option value="APPROVED">Đã duyệt</option>
                                <option value="REJECTED">Từ chối</option>
                                <option value="CANCELLED">Đã hủy</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Thời gian
                            </label>
                            <select
                                value={filters.timeRange}
                                onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value as any }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
                            >
                                <option value="ALL">Tất cả thời gian</option>
                                <option value="THIS_MONTH">Tháng này</option>
                                <option value="LAST_MONTH">Tháng trước</option>
                                <option value="THIS_YEAR">Năm nay</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Registrations List */}
                <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden">
                    {registrations.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-gray-400 text-6xl mb-4">📅</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có lịch sử tham gia</h3>
                            <p className="text-gray-600 mb-4">Bạn chưa đăng ký tham gia sự kiện nào.</p>
                            <Link
                                to="/student/events"
                                className="inline-flex items-center px-4 py-2 bg-[#001C44] text-white rounded-lg hover:bg-[#002A66] transition-colors font-medium"
                            >
                                Xem sự kiện
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-[#001C44] to-[#002A66]">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Tên sự kiện
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Ngày đăng ký
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Trạng thái
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Ngày sự kiện
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {registrations.map((registration) => (
                                        <tr key={registration.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {registration.activityName}
                                                </div>
                                                {registration.activityDescription && (
                                                    <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                        {registration.activityDescription}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {formatDate(registration.registeredDate)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(registration.status)}`}>
                                                    {getStatusLabel(registration.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {new Date(registration.activityStartDate).toLocaleDateString('vi-VN')}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {registration.activityLocation}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <Link
                                                        to={`/student/events/${registration.activityId}`}
                                                        className="text-[#001C44] hover:text-[#002A66] font-medium transition-colors"
                                                    >
                                                        Xem chi tiết
                                                    </Link>
                                                    {canCancel(registration.status) && (
                                                        <button
                                                            onClick={() => handleCancelRegistration(registration.activityId)}
                                                            className="text-red-600 hover:text-red-800 font-medium transition-colors"
                                                        >
                                                            Hủy đăng ký
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
