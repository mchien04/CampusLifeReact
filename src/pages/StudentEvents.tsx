import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { eventAPI } from '../services/eventAPI';
import { registrationAPI } from '../services/registrationAPI';
import { ActivityResponse, ActivityType, ScoreType } from '../types';
import { RegistrationStatus } from '../types/registration';
import { LoadingSpinner } from '../components/common';
import { getImageUrl } from '../utils/imageUtils';
import StudentLayout from '../components/layout/StudentLayout';

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

    const handleRegister = async (eventId: number) => {
        try {
            const event = events.find(e => e.id === eventId);
            const response = await registrationAPI.registerForActivity({ activityId: eventId });
            console.log('Registration response:', response);
            if (response) {
                // If event doesn't require approval (auto-approve), set status to APPROVED immediately
                const newStatus = event && event.requiresApproval === false
                    ? RegistrationStatus.APPROVED
                    : RegistrationStatus.PENDING;
                setRegistrationStatuses(prev => new Map(prev.set(eventId, newStatus)));

                if (newStatus === RegistrationStatus.APPROVED) {
                    alert('Đăng ký thành công! Bạn đã được duyệt tự động.');
                } else {
                    alert('Đăng ký thành công! Vui lòng chờ phê duyệt.');
                }
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
        const labels: Record<ActivityType, string> = {
            [ActivityType.SUKIEN]: 'Sự kiện',
            [ActivityType.MINIGAME]: 'Mini Game',
            [ActivityType.CONG_TAC_XA_HOI]: 'Công tác xã hội',
            [ActivityType.CHUYEN_DE_DOANH_NGHIEP]: 'Chuyên đề doanh nghiệp'
        };
        return labels[type] || type;
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
            [RegistrationStatus.CANCELLED]: 'Đã hủy',
            [RegistrationStatus.ATTENDED]: 'Đã tham dự'
        };
        return labels[status] || status;
    };

    const getStatusColor = (status: RegistrationStatus) => {
        const colors: Record<RegistrationStatus, string> = {
            [RegistrationStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
            [RegistrationStatus.APPROVED]: 'bg-green-100 text-green-800',
            [RegistrationStatus.REJECTED]: 'bg-red-100 text-red-800',
            [RegistrationStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
            [RegistrationStatus.ATTENDED]: 'bg-blue-100 text-blue-800'
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
            <StudentLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <LoadingSpinner />
                </div>
            </StudentLayout>
        );
    }

    if (error) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="text-red-600 text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-[#001C44] mb-2">Có lỗi xảy ra</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={loadEvents}
                            className="btn-primary px-6 py-3 rounded-lg font-medium"
                        >
                            Thử lại
                        </button>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-xl p-6 text-white mb-6">
                    <h1 className="text-3xl font-bold mb-2">Danh sách sự kiện</h1>
                    <p className="text-gray-200">
                        Khám phá và đăng ký tham gia các sự kiện hoạt động
                    </p>
                </div>

                {/* Filters */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-[#001C44] mb-4">Bộ lọc</h3>
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                            >
                                <option value="ALL">Tất cả</option>
                                <option value="UPCOMING">Sắp diễn ra</option>
                                <option value="ONGOING">Đang diễn ra</option>
                                <option value="ENDED">Đã kết thúc</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Events List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.length === 0 ? (
                        <div className="col-span-full text-center py-12">
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
                                <div key={event.id} className="card overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col h-full border-2 border-transparent hover:border-[#FFD66D]">
                                    {/* Event Banner */}
                                    {event.bannerUrl && (
                                        <div className="h-48 bg-gray-200 bg-cover bg-center"
                                            style={{ backgroundImage: `url(${getImageUrl(event.bannerUrl)})` }}>
                                        </div>
                                    )}

                                    <div className="p-6 flex flex-col flex-grow">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                                                    {event.name}
                                                </h3>
                                                <div className="flex flex-wrap gap-1">
                                                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${eventStatus === 'UPCOMING' ? 'bg-blue-100 text-blue-800' :
                                                        eventStatus === 'ONGOING' ? 'bg-green-100 text-green-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {eventStatus === 'UPCOMING' ? 'Sắp diễn ra' :
                                                            eventStatus === 'ONGOING' ? 'Đang diễn ra' : 'Đã kết thúc'}
                                                    </span>
                                                    <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                                        {getTypeLabel(event.type)}
                                                    </span>
                                                </div>
                                            </div>
                                            {event.isImportant && (
                                                <span className="text-yellow-500 text-lg flex-shrink-0">⭐</span>
                                            )}
                                        </div>

                                        {/* Description */}
                                        <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
                                            {event.description}
                                        </p>

                                        {/* Event Info */}
                                        <div className="space-y-2 text-sm text-gray-500 mb-4">
                                            <div className="flex items-center">
                                                <span className="w-4 h-4 mr-2">📅</span>
                                                <span className="truncate">{new Date(event.startDate).toLocaleString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            {event.registrationStartDate && (
                                                <div className="flex items-center">
                                                    <span className="w-4 h-4 mr-2">🚀</span>
                                                    <span className="truncate">Mở đăng ký: {new Date(event.registrationStartDate).toLocaleString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            )}
                                            {event.registrationDeadline && (
                                                <div className="flex items-center">
                                                    <span className="w-4 h-4 mr-2">⏰</span>
                                                    <span className="truncate">Hạn đăng ký: {new Date(event.registrationDeadline).toLocaleString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center">
                                                <span className="w-4 h-4 mr-2">📍</span>
                                                <span className="truncate">{event.location}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="w-4 h-4 mr-2">⭐</span>
                                                <span className="truncate">{getScoreTypeLabel(event.scoreType)}</span>
                                            </div>
                                            {event.participantCount && (
                                                <div className="flex items-center">
                                                    <span className="w-4 h-4 mr-2">👥</span>
                                                    <span className="truncate">{event.participantCount} người tham gia</span>
                                                </div>
                                            )}
                                            <div className="flex items-center">
                                                <span className="w-4 h-4 mr-2">📝</span>
                                                <span className="truncate">{event.requiresApproval ? 'Đăng ký cần duyệt' : 'Đăng ký tự duyệt'}</span>
                                            </div>
                                            {event.maxPoints && parseFloat(event.maxPoints) > 0 && (
                                                <div className="flex items-center">
                                                    <span className="w-4 h-4 mr-2">🏆</span>
                                                    <span className="truncate">{event.maxPoints} điểm</span>
                                                </div>
                                            )}
                                            {event.mandatoryForFacultyStudents && (
                                                <div className="flex items-center">
                                                    <span className="w-4 h-4 mr-2">🎯</span>
                                                    <span className="truncate">Bắt buộc</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Registration Status */}
                                        {registrationStatus && (
                                            <div className="mb-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(registrationStatus)}`}>
                                                    {getStatusLabel(registrationStatus)}
                                                </span>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex flex-col space-y-2 mt-auto">
                                            <Link
                                                to={`/student/events/${event.id}`}
                                                className="w-full btn-primary px-4 py-2 rounded-lg text-sm font-medium text-center"
                                            >
                                                Xem chi tiết
                                            </Link>

                                            {canRegister && (
                                                <button
                                                    onClick={() => handleRegister(event.id)}
                                                    className="w-full btn-yellow px-4 py-2 rounded-lg text-sm font-medium"
                                                >
                                                    Đăng ký
                                                </button>
                                            )}

                                            {canCancel && (
                                                <button
                                                    onClick={() => handleCancelRegistration(event.id)}
                                                    className="w-full bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                                                >
                                                    Hủy đăng ký
                                                </button>
                                            )}

                                            {isRegistered && registrationStatus === RegistrationStatus.APPROVED && eventStatus === 'UPCOMING' && (
                                                <div className="text-center">
                                                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                        ✅ Đã được duyệt
                                                    </span>
                                                </div>
                                            )}

                                            {isRegistered && eventStatus === 'ONGOING' && (
                                                <Link
                                                    to={`/student/events/${event.id}`}
                                                    className="w-full btn-yellow px-4 py-2 rounded-lg text-sm font-medium text-center"
                                                >
                                                    Ghi nhận tham gia
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </StudentLayout>
    );
};

export default StudentEvents;
