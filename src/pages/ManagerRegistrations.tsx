import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ActivityRegistrationResponse, RegistrationStatus } from '../types/registration';
import { registrationAPI } from '../services/registrationAPI';
import { eventAPI } from '../services/eventAPI';
import { ActivityResponse } from '../types/activity';
import { RegistrationList } from '../components/registration';

const ManagerRegistrations: React.FC = () => {
    const [events, setEvents] = useState<ActivityResponse[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
    const [registrations, setRegistrations] = useState<ActivityRegistrationResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<RegistrationStatus | 'ALL'>('ALL');

    useEffect(() => {
        loadEvents();
    }, []);

    useEffect(() => {
        if (selectedEventId) {
            loadRegistrations(selectedEventId);
        }
    }, [selectedEventId]);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const response = await eventAPI.getEvents();
            if (response.status && response.data) {
                setEvents(response.data);
                if (response.data.length > 0) {
                    setSelectedEventId(response.data[0].id);
                }
            }
        } catch (error) {
            console.error('Error loading events:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadRegistrations = async (eventId: number) => {
        try {
            const registrationsData = await registrationAPI.getActivityRegistrations(eventId);
            setRegistrations(registrationsData);
        } catch (error) {
            console.error('Error loading registrations:', error);
        }
    };

    const handleUpdateStatus = async (registrationId: number, status: string) => {
        try {
            await registrationAPI.updateRegistrationStatus(registrationId, status as RegistrationStatus);
            if (selectedEventId) {
                await loadRegistrations(selectedEventId);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Có lỗi xảy ra khi cập nhật trạng thái');
        }
    };

    const filteredRegistrations = registrations.filter(reg =>
        statusFilter === 'ALL' || reg.status === statusFilter
    );

    const selectedEvent = events.find(e => e.id === selectedEventId);

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
                            <h1 className="text-2xl font-bold text-gray-900">Quản lý đăng ký sự kiện</h1>
                            <p className="text-gray-600 mt-1">Duyệt và quản lý đăng ký sự kiện</p>
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
                {/* Event Selection */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Chọn sự kiện</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {events.map((event) => (
                                <button
                                    key={event.id}
                                    onClick={() => setSelectedEventId(event.id)}
                                    className={`p-4 text-left border rounded-lg transition-all ${selectedEventId === event.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <h3 className="font-medium text-gray-900">{event.name}</h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {new Date(event.startDate).toLocaleDateString('vi-VN')} - {new Date(event.endDate).toLocaleDateString('vi-VN')}
                                    </p>
                                    <p className="text-sm text-gray-500">{event.location}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Selected Event Info */}
                {selectedEvent && (
                    <div className="bg-white rounded-lg shadow mb-6">
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin sự kiện đã chọn</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="font-medium text-gray-500">Tên sự kiện:</span>
                                    <p className="text-gray-900">{selectedEvent.name}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-500">Ngày bắt đầu:</span>
                                    <p className="text-gray-900">{new Date(selectedEvent.startDate).toLocaleDateString('vi-VN')}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-500">Địa điểm:</span>
                                    <p className="text-gray-900">{selectedEvent.location}</p>
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

export default ManagerRegistrations;
