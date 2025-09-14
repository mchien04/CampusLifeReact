import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ActivityRegistrationResponse, RegistrationStatus } from '../../types/registration';
import { registrationAPI } from '../../services/registrationAPI';
import { eventAPI } from '../../services/eventAPI';
import { ActivityResponse } from '../../types/activity';
import { RegistrationList } from '../../components/registration';

const EventRegistrations: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [event, setEvent] = useState<ActivityResponse | null>(null);
    const [registrations, setRegistrations] = useState<ActivityRegistrationResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<RegistrationStatus | 'ALL'>('ALL');

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [eventResponse, registrationsData] = await Promise.all([
                eventAPI.getEvent(parseInt(id!)),
                registrationAPI.getActivityRegistrations(parseInt(id!))
            ]);

            if (eventResponse.status && eventResponse.data) {
                setEvent(eventResponse.data);
            }
            setRegistrations(registrationsData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (registrationId: number, status: string) => {
        try {
            await registrationAPI.updateRegistrationStatus(registrationId, status as RegistrationStatus);
            await loadData(); // Reload data
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Có lỗi xảy ra khi cập nhật trạng thái');
        }
    };

    const filteredRegistrations = registrations.filter(reg =>
        statusFilter === 'ALL' || reg.status === statusFilter
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Quản lý đăng ký sự kiện
                            </h1>
                            <p className="text-gray-600 mt-1">
                                {event ? event.name : 'Đang tải...'}
                            </p>
                        </div>
                        <Link
                            to="/dashboard"
                            className="px-4 py-2 text-gray-600 hover:text-gray-900"
                        >
                            ← Quay lại Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Event Info */}
                {event && (
                    <div className="bg-white rounded-lg shadow mb-6">
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin sự kiện</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="font-medium text-gray-500">Ngày bắt đầu:</span>
                                    <p className="text-gray-900">{new Date(event.startDate).toLocaleDateString('vi-VN')}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-500">Ngày kết thúc:</span>
                                    <p className="text-gray-900">{new Date(event.endDate).toLocaleDateString('vi-VN')}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-500">Địa điểm:</span>
                                    <p className="text-gray-900">{event.location}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bộ lọc</h3>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setStatusFilter('ALL')}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${statusFilter === 'ALL'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Tất cả ({registrations.length})
                            </button>
                            <button
                                onClick={() => setStatusFilter(RegistrationStatus.PENDING)}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${statusFilter === RegistrationStatus.PENDING
                                    ? 'bg-yellow-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Chờ duyệt ({registrations.filter(r => r.status === RegistrationStatus.PENDING).length})
                            </button>
                            <button
                                onClick={() => setStatusFilter(RegistrationStatus.APPROVED)}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${statusFilter === RegistrationStatus.APPROVED
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Đã duyệt ({registrations.filter(r => r.status === RegistrationStatus.APPROVED).length})
                            </button>
                            <button
                                onClick={() => setStatusFilter(RegistrationStatus.REJECTED)}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${statusFilter === RegistrationStatus.REJECTED
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Từ chối ({registrations.filter(r => r.status === RegistrationStatus.REJECTED).length})
                            </button>
                            <button
                                onClick={() => setStatusFilter(RegistrationStatus.CANCELLED)}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${statusFilter === RegistrationStatus.CANCELLED
                                    ? 'bg-gray-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Đã hủy ({registrations.filter(r => r.status === RegistrationStatus.CANCELLED).length})
                            </button>
                        </div>
                    </div>
                </div>

                {/* Registrations List */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Danh sách đăng ký ({filteredRegistrations.length})
                        </h3>
                        <RegistrationList
                            registrations={filteredRegistrations}
                            onUpdateStatus={handleUpdateStatus}
                            showActions={true}
                            isAdmin={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventRegistrations;
