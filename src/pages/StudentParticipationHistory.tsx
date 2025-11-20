import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ActivityRegistrationResponse, RegistrationStatus } from '../types';
import { registrationAPI } from '../services';
import StudentLayout from '../components/layout/StudentLayout';

const StudentParticipationHistory: React.FC = () => {
    const [registrations, setRegistrations] = useState<ActivityRegistrationResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        status: 'ALL' as RegistrationStatus | 'ALL',
        timeRange: 'ALL' as 'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR',
    });

    useEffect(() => {
        loadRegistrations();
    }, [filters]);

    const loadRegistrations = async () => {
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
            setError('Có lỗi xảy ra khi tải lịch sử tham gia');
        } finally {
            setLoading(false);
        }
    };

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
                {/* Header Actions */}
                <div className="flex justify-end mb-4">
                    <Link
                        to="/student/events"
                        className="btn-primary px-4 py-2 text-sm font-medium"
                    >
                        Xem sự kiện
                    </Link>
                </div>

                {/* Filters */}
                <div className="card p-6">
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
                <div className="card overflow-hidden">
                    {registrations.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-gray-400 text-6xl mb-4">📅</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có lịch sử tham gia</h3>
                            <p className="text-gray-600 mb-4">Bạn chưa đăng ký tham gia sự kiện nào.</p>
                            <Link
                                to="/student/events"
                                className="btn-primary inline-flex items-center px-4 py-2"
                            >
                                Xem sự kiện
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tên sự kiện
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ngày đăng ký
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Trạng thái
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ngày sự kiện
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {registrations.map((registration) => (
                                        <tr key={registration.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {registration.activityName}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {registration.activityDescription}
                                                </div>
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

                {/* Summary Stats */}
                {registrations.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="card p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-gradient-to-br from-[#001C44] to-[#002A66] rounded-full flex items-center justify-center">
                                        <span className="text-[#FFD66D] text-lg">📅</span>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Tổng đăng ký</p>
                                    <p className="text-2xl font-semibold text-[#001C44]">{registrations.length}</p>
                                </div>
                            </div>
                        </div>

                        <div className="card p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                        <span className="text-green-600 text-lg">✅</span>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Đã duyệt</p>
                                    <p className="text-2xl font-semibold text-[#001C44]">
                                        {registrations.filter(r => r.status === 'APPROVED').length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                        <span className="text-yellow-600 text-lg">⏳</span>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Chờ duyệt</p>
                                    <p className="text-2xl font-semibold text-[#001C44]">
                                        {registrations.filter(r => r.status === 'PENDING').length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                        <span className="text-red-600 text-lg">❌</span>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Từ chối</p>
                                    <p className="text-2xl font-semibold text-[#001C44]">
                                        {registrations.filter(r => r.status === 'REJECTED').length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};

export default StudentParticipationHistory;
