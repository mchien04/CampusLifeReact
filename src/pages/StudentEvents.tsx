import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { eventAPI } from '../services/eventAPI';
import { registrationAPI } from '../services/registrationAPI';
import { ActivityResponse, ActivityType, ScoreType } from '../types';
import { RegistrationStatus } from '../types/registration';
import { LoadingSpinner } from '../components/common';

const StudentEvents: React.FC = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState<ActivityResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<ActivityType | 'ALL'>('ALL');
    const [scoreTypeFilter, setScoreTypeFilter] = useState<ScoreType | 'ALL'>('ALL');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'UPCOMING' | 'ONGOING' | 'ENDED'>('ALL');
    const [registrationStatuses, setRegistrationStatuses] = useState<Map<number, RegistrationStatus>>(new Map());

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const response = await eventAPI.getEvents();
            if (response.status) {
                setEvents(response.data || []);
                await loadRegistrationStatuses(response.data || []);
            } else {
                setError(response.message || 'Không thể tải danh sách sự kiện');
            }
        } catch (err) {
            setError('Có lỗi xảy ra khi tải danh sách sự kiện');
            console.error('Error loading events:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadRegistrationStatuses = async (events: ActivityResponse[]) => {
        const statusMap = new Map<number, RegistrationStatus>();

        for (const event of events) {
            try {
                const status = await registrationAPI.checkRegistrationStatus(event.id);
                statusMap.set(event.id, status.status);
            } catch (err) {
                console.error(`Error checking registration status for event ${event.id}:`, err);
            }
        }

        setRegistrationStatuses(statusMap);
    };

    const handleRegister = async (eventId: number) => {
        try {
            const response = await registrationAPI.registerForActivity({ activityId: eventId });
            console.log('Registration response:', response);
            if (response) {
                setRegistrationStatuses(prev => new Map(prev.set(eventId, RegistrationStatus.PENDING)));
                alert('Đăng ký thành công! Vui lòng chờ phê duyệt.');
            } else {
                alert('Đăng ký thất bại');
            }
        } catch (err: any) {
            console.error('Registration error details:', err);
            console.error('Error response:', err.response?.data);
            alert('Có lỗi xảy ra khi đăng ký: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleCancelRegistration = async (eventId: number) => {
        // Hiển thị thông báo xác nhận
        const confirmed = window.confirm(
            'Bạn có chắc chắn muốn hủy đăng ký sự kiện này?\n\n' +
            '⚠️ Lưu ý: Sau khi hủy, bạn sẽ không thể đăng ký lại sự kiện này.'
        );

        if (!confirmed) {
            return; // Người dùng không xác nhận, không làm gì
        }

        try {
            await registrationAPI.cancelRegistration(eventId);
            setRegistrationStatuses(prev => new Map(prev.set(eventId, RegistrationStatus.CANCELLED)));
            alert('Hủy đăng ký thành công!');
        } catch (err: any) {
            alert('Có lỗi xảy ra khi hủy đăng ký: ' + (err.response?.data?.message || err.message));
            console.error('Error canceling registration:', err);
        }
    };

    const getTypeLabel = (type: ActivityType) => {
        const typeLabels: Record<ActivityType, string> = {
            [ActivityType.SUKIEN]: 'Sự kiện',
            [ActivityType.MINIGAME]: 'Mini Game',
            [ActivityType.SERIES_BONUS]: 'Chuỗi sự kiện',
            [ActivityType.CONG_TAC_XA_HOI]: 'Công tác xã hội',
            [ActivityType.CHUYEN_DE_DOANH_NGHIEP]: 'Chuyên đề doanh nghiệp',
        };

        return typeLabels[type] || type;
    };

    const getScoreTypeLabel = (scoreType: ScoreType) => {
        const labels: Record<ScoreType, string> = {
            [ScoreType.REN_LUYEN]: 'Rèn luyện',
            [ScoreType.CONG_TAC_XA_HOI]: 'Công tác xã hội',
            [ScoreType.CHUYEN_DE]: 'Chuyên đề',
            [ScoreType.KHAC]: 'Khác'
        };
        return labels[scoreType] || scoreType;
    };

    const getStatusLabel = (status: RegistrationStatus) => {
        const labels: Record<RegistrationStatus, string> = {
            [RegistrationStatus.PENDING]: 'Chờ duyệt',
            [RegistrationStatus.APPROVED]: 'Đã duyệt',
            [RegistrationStatus.REJECTED]: 'Từ chối',
            [RegistrationStatus.CANCELLED]: 'Đã hủy'
        };
        return labels[status] || status;
    };

    const getStatusColor = (status: RegistrationStatus) => {
        const colors: Record<RegistrationStatus, string> = {
            [RegistrationStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
            [RegistrationStatus.APPROVED]: 'bg-green-100 text-green-800',
            [RegistrationStatus.REJECTED]: 'bg-red-100 text-red-800',
            [RegistrationStatus.CANCELLED]: 'bg-gray-100 text-gray-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getEventStatus = (event: ActivityResponse) => {
        const now = new Date();
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);

        if (now < startDate) return 'UPCOMING';
        if (now >= startDate && now <= endDate) return 'ONGOING';
        return 'ENDED';
    };

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'ALL' || event.type === typeFilter;
        const matchesScoreType = scoreTypeFilter === 'ALL' || event.scoreType === scoreTypeFilter;
        const matchesStatus = statusFilter === 'ALL' || getEventStatus(event) === statusFilter;

        return matchesSearch && matchesType && matchesScoreType && matchesStatus;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 text-xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Có lỗi xảy ra</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={loadEvents}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Danh sách sự kiện</h1>
                                <p className="mt-1 text-sm text-gray-500">
                                    Khám phá và đăng ký tham gia các sự kiện hoạt động
                                </p>
                            </div>
                            <Link
                                to="/dashboard"
                                className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
                            >
                                ← Quay lại Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {/* Filters */}
                <div className="bg-white shadow rounded-lg mb-6">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Bộ lọc</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Search */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tìm kiếm
                                </label>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Tìm kiếm sự kiện..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Type Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Loại sự kiện
                                </label>
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value as ActivityType | 'ALL')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="ALL">Tất cả</option>
                                    <option value={ActivityType.SUKIEN}>Sự kiện</option>
                                    <option value={ActivityType.MINIGAME}>Mini Game</option>
                                    <option value={ActivityType.CONG_TAC_XA_HOI}>Công tác xã hội</option>
                                    <option value={ActivityType.CHUYEN_DE_DOANH_NGHIEP}>Chuyên đề doanh nghiệp</option>
                                </select>
                            </div>

                            {/* Score Type Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Loại điểm
                                </label>
                                <select
                                    value={scoreTypeFilter}
                                    onChange={(e) => setScoreTypeFilter(e.target.value as ScoreType | 'ALL')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="ALL">Tất cả</option>
                                    <option value={ScoreType.REN_LUYEN}>Rèn luyện</option>
                                    <option value={ScoreType.CONG_TAC_XA_HOI}>Công tác xã hội</option>
                                    <option value={ScoreType.CHUYEN_DE}>Chuyên đề</option>
                                    <option value={ScoreType.KHAC}>Khác</option>
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Trạng thái
                                </label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'UPCOMING' | 'ONGOING' | 'ENDED')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="ALL">Tất cả</option>
                                    <option value="UPCOMING">Sắp diễn ra</option>
                                    <option value="ONGOING">Đang diễn ra</option>
                                    <option value="ENDED">Đã kết thúc</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Events List */}
                <div className="space-y-6">
                    {filteredEvents.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-gray-400 text-6xl mb-4">📅</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có sự kiện nào</h3>
                            <p className="text-gray-500">Không tìm thấy sự kiện phù hợp với bộ lọc của bạn.</p>
                        </div>
                    ) : (
                        filteredEvents.map((event) => {
                            const registrationStatus = registrationStatuses.get(event.id);
                            const eventStatus = getEventStatus(event);
                            const isRegistered = registrationStatus === RegistrationStatus.APPROVED || registrationStatus === RegistrationStatus.PENDING;
                            const canRegister = eventStatus === 'UPCOMING' && !isRegistered;
                            const canCancel = isRegistered && eventStatus === 'UPCOMING' &&
                                registrationStatus !== RegistrationStatus.APPROVED;

                            return (
                                <div key={event.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                                    <div className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <h3 className="text-xl font-semibold text-gray-900">
                                                        {event.name}
                                                    </h3>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${eventStatus === 'UPCOMING' ? 'bg-blue-100 text-blue-800' :
                                                        eventStatus === 'ONGOING' ? 'bg-green-100 text-green-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {eventStatus === 'UPCOMING' ? 'Sắp diễn ra' :
                                                            eventStatus === 'ONGOING' ? 'Đang diễn ra' : 'Đã kết thúc'}
                                                    </span>
                                                </div>

                                                <p className="text-gray-600 mb-4">{event.description}</p>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <span className="mr-2">📅</span>
                                                        <span>{new Date(event.startDate).toLocaleDateString('vi-VN')} - {new Date(event.endDate).toLocaleDateString('vi-VN')}</span>
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <span className="mr-2">📍</span>
                                                        <span>{event.location}</span>
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <span className="mr-2">🏷️</span>
                                                        <span>{getTypeLabel(event.type)}</span>
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <span className="mr-2">⭐</span>
                                                        <span>{getScoreTypeLabel(event.scoreType)}</span>
                                                    </div>
                                                </div>

                                                {event.ticketQuantity && (
                                                    <div className="text-sm text-gray-500 mb-2">
                                                        <span className="mr-2">🎫</span>
                                                        <span>Số lượng vé: {event.ticketQuantity}</span>
                                                    </div>
                                                )}

                                                {event.mandatoryForFacultyStudents && (
                                                    <div className="text-sm text-orange-600 mb-2">
                                                        <span className="mr-2">⚠️</span>
                                                        <span>Bắt buộc cho sinh viên khoa</span>
                                                    </div>
                                                )}

                                                {registrationStatus && (
                                                    <div className="mb-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(registrationStatus)}`}>
                                                            {getStatusLabel(registrationStatus)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="ml-6 flex flex-col space-y-2">
                                                <Link
                                                    to={`/student/events/${event.id}`}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 text-center"
                                                >
                                                    Xem chi tiết
                                                </Link>

                                                {canRegister && (
                                                    <button
                                                        onClick={() => handleRegister(event.id)}
                                                        className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                                                    >
                                                        Đăng ký
                                                    </button>
                                                )}

                                                {canCancel && (
                                                    <button
                                                        onClick={() => handleCancelRegistration(event.id)}
                                                        className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                                                    >
                                                        Hủy đăng ký
                                                    </button>
                                                )}

                                                {isRegistered && registrationStatus === RegistrationStatus.APPROVED && eventStatus === 'UPCOMING' && (
                                                    <div className="text-center">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            ✅ Đã được duyệt - Không thể hủy
                                                        </span>
                                                    </div>
                                                )}

                                                {isRegistered && eventStatus === 'ONGOING' && (
                                                    <Link
                                                        to={`/student/events/${event.id}`}
                                                        className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700 text-center"
                                                    >
                                                        Ghi nhận tham gia
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </main>
        </div>
    );
};

export default StudentEvents;
