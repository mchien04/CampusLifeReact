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
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONGOING' | 'UPCOMING' | 'ENDED'>('ALL');
    const [registrationStatuses, setRegistrationStatuses] = useState<Map<number, RegistrationStatus>>(new Map());

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const response = await eventAPI.getEvents();
            if (response.status) {
                // Filter out activities that belong to a series (they're shown in series pages)
                const standaloneEvents = (response.data || []).filter(event => !event.seriesId);
                setEvents(standaloneEvents);
                await loadRegistrationStatuses(standaloneEvents);
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

    const getTypeLabel = (type: ActivityType | null) => {
        if (!type) return 'N/A';
        const labels: Record<ActivityType, string> = {
            [ActivityType.SUKIEN]: 'Sự kiện',
            [ActivityType.MINIGAME]: 'Mini Game',
            [ActivityType.CONG_TAC_XA_HOI]: 'Công tác xã hội',
            [ActivityType.CHUYEN_DE_DOANH_NGHIEP]: 'Chuyên đề doanh nghiệp'
        };
        return labels[type] || type;
    };

    const getScoreTypeLabel = (scoreType: ScoreType | null) => {
        if (!scoreType) return 'N/A';
        const labels: Record<ScoreType, string> = {
            [ScoreType.REN_LUYEN]: 'Rèn luyện',
            [ScoreType.CONG_TAC_XA_HOI]: 'Công tác xã hội',
            [ScoreType.CHUYEN_DE]: 'Chuyên đề'
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

    // Phân loại events theo trạng thái thời gian
    const categorizeEvents = () => {
        const now = new Date();
        const ended: ActivityResponse[] = [];
        const ongoing: ActivityResponse[] = [];
        const upcoming: ActivityResponse[] = [];

        filteredEvents.forEach(event => {
            const startDate = new Date(event.startDate);
            const endDate = new Date(event.endDate);

            // Đã kết thúc
            if (now > endDate) {
                ended.push(event);
            }
            // Đang diễn ra
            else if (now >= startDate && now <= endDate) {
                ongoing.push(event);
            }
            // Sắp diễn ra
            else {
                upcoming.push(event);
            }
        });

        return { ended, ongoing, upcoming };
    };

    const { ended, ongoing, upcoming } = categorizeEvents();

    // Render event card component
    const renderEventCard = (event: ActivityResponse) => {
        const registrationStatus = registrationStatuses.get(event.id);
        const eventStatus = getEventStatus(event);
        // Đã đăng ký nếu có status APPROVED, PENDING, hoặc ATTENDED
        const isRegistered = registrationStatus === RegistrationStatus.APPROVED || 
                            registrationStatus === RegistrationStatus.PENDING ||
                            registrationStatus === RegistrationStatus.ATTENDED;
        
        // Kiểm tra có thể đăng ký: trong thời gian đăng ký và chưa đăng ký
        const canRegister = (() => {
            if (isRegistered) return false; // Đã đăng ký rồi (bao gồm cả ATTENDED)
            
            const now = new Date();
            const registrationStartDate = event.registrationStartDate ? new Date(event.registrationStartDate) : null;
            const registrationDeadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;
            
            // Kiểm tra thời gian đăng ký
            if (registrationStartDate && now < registrationStartDate) {
                return false; // Chưa đến thời gian mở đăng ký
            }
            if (registrationDeadline && now > registrationDeadline) {
                return false; // Đã hết hạn đăng ký
            }
            
            // Kiểm tra sự kiện chưa kết thúc
            return eventStatus === 'UPCOMING' || eventStatus === 'ONGOING';
        })();
        
        const canCancel = isRegistered && eventStatus === 'UPCOMING' &&
            registrationStatus !== RegistrationStatus.APPROVED;

        const formatDate = (dateString: string): string => {
            return new Date(dateString).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        return (
            <div key={event.id} className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col h-full border-2 overflow-hidden group relative border-gray-100 hover:border-[#001C44]">
                {/* Event Banner */}
                {event.bannerUrl && (
                    <div className="h-56 bg-gray-200 rounded-t-xl bg-cover bg-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300"
                        style={{ backgroundImage: `url(${getImageUrl(event.bannerUrl)})` }}>
                    </div>
                )}

                <div className="p-6 flex flex-col flex-grow">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <div className="flex items-start gap-2 mb-3">
                                <h3 className="text-xl font-bold line-clamp-2 leading-tight group-hover:text-[#002A66] transition-colors text-[#001C44]">
                                    {event.name}
                                </h3>
                                {event.isImportant && (
                                    <span className="text-[#FFD66D] text-xl flex-shrink-0 mt-1" title="Sự kiện quan trọng">⭐</span>
                                )}
                            </div>

                            {/* Status and Type Tags */}
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border-2 shadow-sm ${
                                    eventStatus === 'UPCOMING' ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' :
                                    eventStatus === 'ONGOING' ? 'bg-green-100 text-green-800 border-2 border-green-300' :
                                    'bg-gray-100 text-gray-800 border-2 border-gray-300'
                                }`}>
                                    {eventStatus === 'UPCOMING' ? '⏰ Sắp diễn ra' :
                                        eventStatus === 'ONGOING' ? '🟢 Đang diễn ra' : '✅ Đã kết thúc'}
                                </span>
                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border-2 shadow-sm bg-purple-100 text-purple-800 border-purple-300">
                                    {getTypeLabel(event.type)}
                                </span>
                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FFD66D] text-[#001C44] border-2 border-[#FFD66D] shadow-sm">
                                    {getScoreTypeLabel(event.scoreType)}
                                </span>
                                {event.seriesId && (
                                    <Link
                                        to={`/student/series/${event.seriesId}`}
                                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-100 text-yellow-800 border-2 border-yellow-300 hover:bg-yellow-200 transition-colors"
                                    >
                                        📋 Thuộc chuỗi
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-700 text-sm mb-5 line-clamp-3 flex-grow leading-relaxed">
                        {event.description || 'Chưa có mô tả'}
                    </p>

                    {/* Event Info */}
                    <div className="space-y-2.5 text-sm text-gray-600 mb-5 bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center">
                            <span className="w-5 h-5 mr-2.5 text-[#001C44]">📅</span>
                            <span className="truncate font-medium">Bắt đầu: <span className="text-gray-800">{formatDate(event.startDate)}</span></span>
                        </div>
                        <div className="flex items-center">
                            <span className="w-5 h-5 mr-2.5 text-[#001C44]">📅</span>
                            <span className="truncate font-medium">Kết thúc: <span className="text-gray-800">{formatDate(event.endDate)}</span></span>
                        </div>
                        {event.registrationStartDate && (
                            <div className="flex items-center">
                                <span className="w-5 h-5 mr-2.5 text-green-600">📝</span>
                                <span className="truncate font-medium">Mở đăng ký: <span className="text-gray-800">{formatDate(event.registrationStartDate)}</span></span>
                            </div>
                        )}
                        {event.registrationDeadline && (
                            <div className="flex items-center">
                                <span className="w-5 h-5 mr-2.5 text-orange-600">⏰</span>
                                <span className="truncate font-medium">Hết hạn: <span className="text-gray-800">{formatDate(event.registrationDeadline)}</span></span>
                            </div>
                        )}
                        <div className="flex items-center">
                            <span className="w-5 h-5 mr-2.5 text-blue-600">📍</span>
                            <span className="truncate font-medium text-gray-800">{event.location}</span>
                        </div>
                        {event.participantCount && event.participantCount > 0 && (
                            <div className="flex items-center">
                                <span className="w-5 h-5 mr-2.5 text-purple-600">👥</span>
                                <span className="truncate font-medium text-gray-800">{event.participantCount} người tham gia</span>
                            </div>
                        )}
                        {event.maxPoints && parseFloat(event.maxPoints) > 0 && (
                            <div className="flex items-center">
                                <span className="w-5 h-5 mr-2.5 text-[#FFD66D]">🏆</span>
                                <span className="truncate font-semibold text-[#001C44]">{event.maxPoints} điểm</span>
                            </div>
                        )}
                        {event.mandatoryForFacultyStudents && (
                            <div className="flex items-center">
                                <span className="w-5 h-5 mr-2.5 text-red-600">🎯</span>
                                <span className="truncate font-medium text-red-700">Bắt buộc cho sinh viên khoa</span>
                            </div>
                        )}
                        {event.requiresApproval && (
                            <div className="flex items-center">
                                <span className="w-5 h-5 mr-2.5 text-green-600">✓</span>
                                <span className="truncate font-medium text-gray-800">Cần duyệt đăng ký</span>
                            </div>
                        )}
                    </div>

                    {/* Registration Status */}
                    {registrationStatus && (
                        <div className="mb-4">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border-2 shadow-sm ${getStatusColor(registrationStatus)}`}>
                                {getStatusLabel(registrationStatus)}
                            </span>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-gray-100">
                        <Link
                            to={`/student/events/${event.id}`}
                            className="flex-1 min-w-[100px] bg-[#001C44] hover:bg-[#002A66] text-white text-center py-2 px-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md"
                        >
                            Xem chi tiết
                        </Link>

                        {canRegister && (
                            <button
                                onClick={() => handleRegister(event.id)}
                                className="flex-1 min-w-[100px] bg-[#FFD66D] hover:bg-[#FFC947] text-[#001C44] text-center py-2 px-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md"
                            >
                                Đăng ký
                            </button>
                        )}

                        {canCancel && (
                            <button
                                onClick={() => handleCancelRegistration(event.id)}
                                className="flex-1 min-w-[100px] bg-red-600 hover:bg-red-700 text-white text-center py-2 px-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md"
                            >
                                Hủy đăng ký
                            </button>
                        )}

                        {isRegistered && registrationStatus === RegistrationStatus.APPROVED && eventStatus === 'UPCOMING' && (
                            <div className="w-full text-center">
                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-green-100 text-green-800 border-2 border-green-200">
                                    ✅ Đã được duyệt
                                </span>
                            </div>
                        )}

                        {/* Với sự kiện thường, khi đang diễn ra và đã đăng ký, cho phép vào nhanh để ghi nhận tham gia.
                            Với MINIGAME, quiz sẽ tự lấy điểm nên không cần nút "Ghi nhận tham gia" ở danh sách. */}
                        {isRegistered && eventStatus === 'ONGOING' && event.type !== ActivityType.MINIGAME && (
                            <Link
                                to={`/student/events/${event.id}`}
                                className="flex-1 min-w-[100px] bg-[#FFD66D] hover:bg-[#FFC947] text-[#001C44] text-center py-2 px-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md"
                            >
                                Ghi nhận tham gia
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        );
    };

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
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-[#001C44] mb-4">Bộ lọc</h3>
                    
                    {/* Search */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tìm kiếm
                        </label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm kiếm sự kiện..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
                        />
                    </div>

                    {/* Activity Type Filter */}
                    <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Loại sự kiện:</h4>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setTypeFilter('ALL')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${typeFilter === 'ALL'
                                    ? 'bg-[#001C44] text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Tất cả
                            </button>
                            {[ActivityType.SUKIEN, ActivityType.MINIGAME, ActivityType.CONG_TAC_XA_HOI, ActivityType.CHUYEN_DE_DOANH_NGHIEP].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setTypeFilter(type)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${typeFilter === type
                                        ? 'bg-[#001C44] text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {getTypeLabel(type)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Score Type Filter */}
                    <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Kiểu tính điểm:</h4>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setScoreTypeFilter('ALL')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${scoreTypeFilter === 'ALL'
                                    ? 'bg-[#FFD66D] text-[#001C44] shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Tất cả
                            </button>
                            {[ScoreType.REN_LUYEN, ScoreType.CONG_TAC_XA_HOI, ScoreType.CHUYEN_DE].map(scoreType => (
                                <button
                                    key={scoreType}
                                    onClick={() => setScoreTypeFilter(scoreType)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${scoreTypeFilter === scoreType
                                        ? 'bg-[#FFD66D] text-[#001C44] shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {getScoreTypeLabel(scoreType)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Status Filter - Chọn nhanh theo trạng thái thời gian */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Trạng thái thời gian:</h4>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setStatusFilter('ALL')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${statusFilter === 'ALL'
                                    ? 'bg-[#001C44] text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                <span>📋</span>
                                <span>Tất cả</span>
                            </button>
                            <button
                                onClick={() => setStatusFilter('ONGOING')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${statusFilter === 'ONGOING'
                                    ? 'bg-green-600 text-white shadow-md'
                                    : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                                    }`}
                            >
                                <span>🟢</span>
                                <span>Đang diễn ra</span>
                            </button>
                            <button
                                onClick={() => setStatusFilter('UPCOMING')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${statusFilter === 'UPCOMING'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                                    }`}
                            >
                                <span>⏰</span>
                                <span>Sắp diễn ra</span>
                            </button>
                            <button
                                onClick={() => setStatusFilter('ENDED')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${statusFilter === 'ENDED'
                                    ? 'bg-gray-600 text-white shadow-md'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                                    }`}
                            >
                                <span>✅</span>
                                <span>Đã diễn ra</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Events List - Chia theo section */}
                <div className="space-y-8">
                    {filteredEvents.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-lg p-12 text-center border border-gray-100">
                            <div className="text-gray-400 text-7xl mb-6">📅</div>
                            <h3 className="text-xl font-semibold text-[#001C44] mb-3">Không có sự kiện nào</h3>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">Không tìm thấy sự kiện phù hợp với bộ lọc của bạn.</p>
                        </div>
                    ) : (
                        <>
                            {/* Section: Đang diễn ra */}
                            {ongoing.length > 0 && (statusFilter === 'ALL' || statusFilter === 'ONGOING') && (
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-1 flex-1 bg-gradient-to-r from-green-500 to-green-300 rounded-full"></div>
                                        <h2 className="text-2xl font-bold text-[#001C44] flex items-center gap-2">
                                            <span className="text-green-600">🟢</span>
                                            Đang diễn ra
                                            <span className="text-sm font-normal text-gray-500">({ongoing.length})</span>
                                        </h2>
                                        <div className="h-1 flex-1 bg-gradient-to-r from-green-300 to-green-500 rounded-full"></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {ongoing.map((event) => {
                                            return renderEventCard(event);
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Section: Sắp diễn ra */}
                            {upcoming.length > 0 && (statusFilter === 'ALL' || statusFilter === 'UPCOMING') && (
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-1 flex-1 bg-gradient-to-r from-blue-500 to-blue-300 rounded-full"></div>
                                        <h2 className="text-2xl font-bold text-[#001C44] flex items-center gap-2">
                                            <span className="text-blue-600">⏰</span>
                                            Sắp diễn ra
                                            <span className="text-sm font-normal text-gray-500">({upcoming.length})</span>
                                        </h2>
                                        <div className="h-1 flex-1 bg-gradient-to-r from-blue-300 to-blue-500 rounded-full"></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {upcoming.map((event) => {
                                            return renderEventCard(event);
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Section: Đã diễn ra */}
                            {ended.length > 0 && (statusFilter === 'ALL' || statusFilter === 'ENDED') && (
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-1 flex-1 bg-gradient-to-r from-gray-500 to-gray-300 rounded-full"></div>
                                        <h2 className="text-2xl font-bold text-[#001C44] flex items-center gap-2">
                                            <span className="text-gray-600">✅</span>
                                            Đã diễn ra
                                            <span className="text-sm font-normal text-gray-500">({ended.length})</span>
                                        </h2>
                                        <div className="h-1 flex-1 bg-gradient-to-r from-gray-300 to-gray-500 rounded-full"></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {ended.map((event) => {
                                            return renderEventCard(event);
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Thông báo khi không có events trong section được chọn */}
                            {statusFilter !== 'ALL' && ongoing.length === 0 && upcoming.length === 0 && ended.length === 0 && (
                                <div className="bg-white rounded-lg shadow-lg p-12 text-center border border-gray-100">
                                    <div className="text-gray-400 text-7xl mb-6">
                                        {statusFilter === 'ONGOING' && '🟢'}
                                        {statusFilter === 'UPCOMING' && '⏰'}
                                        {statusFilter === 'ENDED' && '✅'}
                                    </div>
                                    <h3 className="text-xl font-semibold text-[#001C44] mb-3">
                                        {statusFilter === 'ONGOING' && 'Không có sự kiện đang diễn ra'}
                                        {statusFilter === 'UPCOMING' && 'Không có sự kiện sắp diễn ra'}
                                        {statusFilter === 'ENDED' && 'Không có sự kiện đã diễn ra'}
                                    </h3>
                                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                        Không có sự kiện nào phù hợp với bộ lọc đã chọn.
                                    </p>
                                    <button
                                        onClick={() => setStatusFilter('ALL')}
                                        className="inline-block bg-[#001C44] hover:bg-[#002A66] text-white px-6 py-3 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
                                    >
                                        Xem tất cả sự kiện
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </StudentLayout>
    );
};

export default StudentEvents;
