import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ActivityResponse, ActivityType, ScoreType } from '../types/activity';
import { eventAPI } from '../services/eventAPI';
import { getImageUrl } from '../utils/imageUtils';

const EventList: React.FC = () => {
    const [events, setEvents] = useState<ActivityResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<ActivityType | 'ALL'>('ALL');
    const [scoreTypeFilter, setScoreTypeFilter] = useState<ScoreType | 'ALL'>('ALL');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONGOING' | 'UPCOMING' | 'ENDED' | 'DRAFTS'>('ALL');
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        // TODO: Replace with actual API call
        const fetchEvents = async () => {
            setLoading(true);
            console.log('🔍 EventList: fetchEvents called...');

            try {
                console.log('🔍 EventList: Calling eventAPI.getEvents...');
                const response = await eventAPI.getEvents();
                console.log('🔍 EventList: API response:', response);

                if (response.status && response.data) {
                    console.log('🔍 EventList: API successful, setting events:', response.data);
                    // Filter out activities that belong to a series (they're shown in series pages)
                    const standaloneEvents = response.data.filter(event => !event.seriesId);
                    setEvents(standaloneEvents);
                } else {
                    console.warn('🔍 EventList: API failed, no data available');
                    setEvents([]);
                }
            } catch (error) {
                console.error('Error fetching events:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const filteredEvents = events.filter(event => {
        const typeMatch = filter === 'ALL' || event.type === filter;
        const scoreTypeMatch = scoreTypeFilter === 'ALL' || event.scoreType === scoreTypeFilter;
        return typeMatch && scoreTypeMatch;
    });

    // Phân loại events theo trạng thái thời gian
    const categorizeEvents = () => {
        const now = new Date();
        const ended: ActivityResponse[] = [];
        const ongoing: ActivityResponse[] = [];
        const upcoming: ActivityResponse[] = [];
        const drafts: ActivityResponse[] = [];

        filteredEvents.forEach(event => {
            const draftValue = event.draft !== undefined ? event.draft : event.isDraft;
            const isDraft = draftValue === true || (draftValue !== undefined && draftValue !== null && Boolean(draftValue));
            
            if (isDraft) {
                drafts.push(event);
                return;
            }

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

        return { ended, ongoing, upcoming, drafts };
    };

    const { ended, ongoing, upcoming, drafts } = categorizeEvents();

    const getTypeLabel = (type: ActivityType | null): string => {
        if (!type) return 'N/A';
        const typeLabels: Record<ActivityType, string> = {
            [ActivityType.SUKIEN]: 'Sự kiện',
            [ActivityType.MINIGAME]: 'Mini Game',
            [ActivityType.CONG_TAC_XA_HOI]: 'Công tác xã hội',
            [ActivityType.CHUYEN_DE_DOANH_NGHIEP]: 'Chuyên đề doanh nghiệp'
        };
        return typeLabels[type] || type;
    };

    const getScoreTypeLabel = (scoreType: ScoreType | null): string => {
        if (!scoreType) return 'N/A';
        const scoreTypeLabels: Record<ScoreType, string> = {
            [ScoreType.REN_LUYEN]: 'Điểm rèn luyện',
            [ScoreType.CONG_TAC_XA_HOI]: 'Điểm công tác xã hội',
            [ScoreType.CHUYEN_DE]: 'Điểm chuyên đề doanh nghiệp'
        };
        return scoreTypeLabels[scoreType] || scoreType;
    };

    const handleDeleteEvent = async (id: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa sự kiện này?')) {
            return;
        }

        setDeletingId(id);
        try {
            const response = await eventAPI.deleteEvent(id);
            if (response.status) {
                // Remove the event from the list
                setEvents(prev => prev.filter(event => event.id !== id));
                alert('Xóa sự kiện thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi xóa sự kiện');
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Có lỗi xảy ra khi xóa sự kiện');
        } finally {
            setDeletingId(null);
        }
    };

    const getStatusColor = (status?: string): string => {
        switch (status) {
            case 'ACTIVE':
                return 'bg-green-100 text-green-800 border border-green-300';
            case 'INACTIVE':
                return 'bg-gray-100 text-gray-800 border border-gray-300';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800 border border-red-300';
            default:
                return 'bg-[#001C44] text-white border border-[#001C44]';
        }
    };

    const getTypeBadgeColor = (type: ActivityType | null): string => {
        if (!type) return 'bg-gray-100 text-gray-800 border-2 border-gray-300';
        switch (type) {
            case ActivityType.SUKIEN:
                return 'bg-blue-100 text-blue-800 border-2 border-blue-300';
            case ActivityType.MINIGAME:
                return 'bg-purple-100 text-purple-800 border-2 border-purple-300';
            case ActivityType.CONG_TAC_XA_HOI:
                return 'bg-green-100 text-green-800 border-2 border-green-300';
            case ActivityType.CHUYEN_DE_DOANH_NGHIEP:
                return 'bg-orange-100 text-orange-800 border-2 border-orange-300';
            default:
                return 'bg-gray-100 text-gray-800 border-2 border-gray-300';
        }
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

    // Xác định trạng thái sự kiện dựa trên thời gian
    const getEventStatus = (event: ActivityResponse): {
        status: 'DRAFT' | 'UPCOMING' | 'ONGOING' | 'ENDED' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED';
        label: string;
        color: string;
        description?: string;
    } => {
        const now = new Date();
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);
        const registrationStartDate = event.registrationStartDate ? new Date(event.registrationStartDate) : null;
        const registrationDeadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;

        // Nháp - handle both 'draft' (from API) and 'isDraft' (from type)
        const draftValue = event.draft !== undefined ? event.draft : event.isDraft;
        const isDraft = draftValue === true || (draftValue !== undefined && draftValue !== null && Boolean(draftValue));
        if (isDraft) {
            return {
                status: 'DRAFT',
                label: 'Nháp',
                color: 'bg-orange-100 text-orange-800 border-orange-300',
                description: 'Sự kiện chưa được công bố'
            };
        }

        // Đã kết thúc
        if (now > endDate) {
            return {
                status: 'ENDED',
                label: 'Đã kết thúc',
                color: 'bg-gray-100 text-gray-800 border-2 border-gray-300',
                description: `Kết thúc: ${formatDate(event.endDate)}`
            };
        }

        // Đang diễn ra
        if (now >= startDate && now <= endDate) {
            return {
                status: 'ONGOING',
                label: 'Đang diễn ra',
                color: 'bg-green-100 text-green-800 border-2 border-green-300',
                description: `Kết thúc: ${formatDate(event.endDate)}`
            };
        }

        // Sắp diễn ra - kiểm tra đăng ký
        if (now < startDate) {
            // Kiểm tra thời gian đăng ký
            if (registrationStartDate && registrationDeadline) {
                if (now < registrationStartDate) {
                    return {
                        status: 'UPCOMING',
                        label: 'Sắp diễn ra',
                        color: 'bg-blue-100 text-blue-800 border-2 border-blue-300',
                        description: `Bắt đầu đăng ký: ${formatDate(event.registrationStartDate!)}`
                    };
                } else if (now >= registrationStartDate && now <= registrationDeadline) {
                    return {
                        status: 'REGISTRATION_OPEN',
                        label: 'Đang mở đăng ký',
                        color: 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300',
                        description: `Hết hạn đăng ký: ${formatDate(event.registrationDeadline!)}`
                    };
                } else if (now > registrationDeadline) {
                    return {
                        status: 'REGISTRATION_CLOSED',
                        label: 'Đã đóng đăng ký',
                        color: 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300',
                        description: `Bắt đầu: ${formatDate(event.startDate)}`
                    };
                }
            }

            // Không có thông tin đăng ký hoặc đã qua thời gian đăng ký
            return {
                status: 'UPCOMING',
                label: 'Sắp diễn ra',
                color: 'bg-blue-100 text-blue-800 border-blue-300',
                description: `Bắt đầu: ${formatDate(event.startDate)}`
            };
        }

        // Mặc định
        return {
            status: 'UPCOMING',
            label: 'Sắp diễn ra',
            color: 'bg-blue-100 text-blue-800 border-blue-300',
            description: `Bắt đầu: ${formatDate(event.startDate)}`
        };
    };

    // Render event card component
    const renderEventCard = (event: ActivityResponse) => {
        // Handle both 'draft' (from API) and 'isDraft' (from type)
        // API returns 'draft' but type definition uses 'isDraft'
        const draftValue = event.draft !== undefined ? event.draft : event.isDraft;
        const isDraft = draftValue === true || (draftValue !== undefined && draftValue !== null && Boolean(draftValue));

        return (
            <div key={event.id} className={`bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col h-full border-2 overflow-hidden group relative ${isDraft ? 'border-orange-400 border-dashed' : 'border-gray-100 hover:border-[#001C44]'}`}>
                {/* Draft Overlay Badge */}
                {isDraft && (
                    <div className="absolute top-3 right-3 z-20">
                        <div className="bg-orange-500 text-white px-4 py-2 rounded-lg shadow-xl flex items-center gap-2 text-xs font-bold uppercase tracking-wide animate-pulse">
                            <span>📝</span>
                            <span>Bản nháp</span>
                        </div>
                    </div>
                )}

                {/* Draft Banner */}
                {isDraft && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 text-white text-center py-2 text-xs font-bold z-20 shadow-md">
                        ⚠️ Sự kiện chưa được công bố
                    </div>
                )}

                {event.bannerUrl && (
                    <div className={`h-56 bg-gray-200 rounded-t-xl bg-cover bg-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300 ${isDraft ? 'opacity-60' : ''}`}
                        style={{ backgroundImage: `url(${getImageUrl(event.bannerUrl)})` }}>
                    </div>
                )}

                <div className={`p-6 flex flex-col flex-grow ${isDraft ? 'pt-8' : ''}`}>
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <div className="flex items-start gap-2 mb-3">
                                <h3 className={`text-xl font-bold line-clamp-2 leading-tight group-hover:text-[#002A66] transition-colors ${isDraft ? 'text-orange-700' : 'text-[#001C44]'}`}>
                                    {event.name}
                                </h3>
                                {event.isImportant && (
                                    <span className="text-[#FFD66D] text-xl flex-shrink-0 mt-1" title="Sự kiện quan trọng">⭐</span>
                                )}
                            </div>

                            {/* Draft Tag - Always show if draft */}
                            {isDraft && (
                                <div className="mb-3">
                                    <span className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-bold bg-orange-500 text-white border-2 border-orange-600 shadow-lg">
                                        📝 BẢN NHÁP - Chưa được công bố
                                    </span>
                                </div>
                            )}

                            {/* Trạng thái sự kiện */}
                            {!isDraft && (
                                <div className="mb-3 flex flex-wrap items-center gap-2">
                                    {(() => {
                                        const eventStatus = getEventStatus(event);
                                        return (
                                            <>
                                                <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border-2 shadow-sm ${eventStatus.color}`}>
                                                    {eventStatus.status === 'UPCOMING' && '⏰ '}
                                                    {eventStatus.status === 'ONGOING' && '🟢 '}
                                                    {eventStatus.status === 'ENDED' && '✅ '}
                                                    {eventStatus.status === 'REGISTRATION_OPEN' && '📝 '}
                                                    {eventStatus.status === 'REGISTRATION_CLOSED' && '🔒 '}
                                                    {eventStatus.label}
                                                </span>
                                                {eventStatus.description && (
                                                    <p className="text-xs text-gray-500 w-full">{eventStatus.description}</p>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* Type and Score Type Tags */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border-2 shadow-sm ${getTypeBadgeColor(event.type)}`}>
                                    {getTypeLabel(event.type)}
                                </span>
                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FFD66D] text-[#001C44] border-2 border-[#FFD66D] shadow-sm">
                                    {getScoreTypeLabel(event.scoreType)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <p className="text-gray-700 text-sm mb-5 line-clamp-3 flex-grow leading-relaxed">
                        {event.description || 'Chưa có mô tả'}
                    </p>

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
                        {event.ticketQuantity && event.ticketQuantity > 0 && (
                            <div className="flex items-center">
                                <span className="w-5 h-5 mr-2.5 text-indigo-600">🎫</span>
                                <span className="truncate font-medium text-gray-800">{event.ticketQuantity} vé</span>
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

                    <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-gray-100">
                        <Link
                            to={`/manager/events/${event.id}`}
                            className="flex-1 min-w-[100px] bg-[#001C44] hover:bg-[#002A66] text-white text-center py-2 px-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md"
                        >
                            Xem chi tiết
                        </Link>
                        <Link
                            to={`/manager/events/${event.id}/edit`}
                            className="flex-1 min-w-[100px] bg-gray-600 hover:bg-gray-700 text-white text-center py-2 px-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md"
                        >
                            Chỉnh sửa
                        </Link>
                        <Link
                            to={`/manager/events/${event.id}`}
                            onClick={async (e) => {
                                e.preventDefault();
                                const val = window.prompt('Nhập số ngày dịch (có thể bỏ trống):', '0');
                                const offset = val === null || val.trim() === '' ? undefined : Number(val);
                                const res = await eventAPI.copyActivity(event.id, isNaN(offset as any) ? undefined : offset);
                                if (res.status && res.data) {
                                    alert('Đã tạo bản sao');
                                    window.location.href = `/manager/events/${res.data.id}`;
                                } else {
                                    alert(res.message || 'Không thể sao chép');
                                }
                            }}
                            className="flex-1 min-w-[100px] bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-[#001C44] text-center py-2 px-3 rounded-lg text-sm font-medium transition-all"
                        >
                            Sao chép
                        </Link>
                        <button
                            onClick={() => handleDeleteEvent(event.id)}
                            disabled={deletingId === event.id}
                            className="flex-1 min-w-[100px] bg-red-600 hover:bg-red-700 text-white text-center py-2 px-3 rounded-lg text-sm font-medium disabled:opacity-50 transition-all shadow-sm hover:shadow-md"
                        >
                            {deletingId === event.id ? 'Đang xóa...' : 'Xóa'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải danh sách sự kiện...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Quick Actions */}
            <div className="mb-6 flex flex-wrap gap-3">
                <Link
                    to="/manager/series"
                    className="px-4 py-2 bg-[#001C44] hover:bg-[#002A66] text-white rounded-lg text-sm font-medium transition-colors"
                >
                    📋 Chuỗi sự kiện
                </Link>
                <Link
                    to="/manager/minigames"
                    className="px-4 py-2 bg-[#001C44] hover:bg-[#002A66] text-white rounded-lg text-sm font-medium transition-colors"
                >
                    🎮 Mini Game
                </Link>
                <Link
                    to="/manager/events/create"
                    className="px-4 py-2 bg-[#FFD66D] hover:bg-[#FFC947] text-[#001C44] rounded-lg text-sm font-medium transition-colors"
                >
                    + Tạo sự kiện mới
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-[#001C44] mb-4">Bộ lọc</h3>
                
                {/* Activity Type Filter */}
                <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Loại sự kiện:</h4>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setFilter('ALL')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'ALL'
                                ? 'bg-[#001C44] text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Tất cả
                        </button>
                        {[ActivityType.SUKIEN, ActivityType.MINIGAME, ActivityType.CONG_TAC_XA_HOI, ActivityType.CHUYEN_DE_DOANH_NGHIEP].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilter(type)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === type
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
                        <button
                            onClick={() => setStatusFilter('DRAFTS')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${statusFilter === 'DRAFTS'
                                ? 'bg-orange-600 text-white shadow-md'
                                : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                                }`}
                        >
                            <span>📝</span>
                            <span>Bản nháp</span>
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
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">Chưa có sự kiện nào được tạo hoặc không có sự kiện phù hợp với bộ lọc.</p>
                        <Link
                            to="/manager/events/create"
                            className="inline-block bg-[#001C44] hover:bg-[#002A66] text-white px-6 py-3 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
                        >
                            + Tạo sự kiện đầu tiên
                        </Link>
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
                                    {ongoing.map(event => {
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
                                    {upcoming.map(event => {
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
                                    {ended.map(event => {
                                        return renderEventCard(event);
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Section: Bản nháp (nếu có) */}
                        {drafts.length > 0 && (statusFilter === 'ALL' || statusFilter === 'DRAFTS') && (
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-1 flex-1 bg-gradient-to-r from-orange-500 to-orange-300 rounded-full"></div>
                                    <h2 className="text-2xl font-bold text-[#001C44] flex items-center gap-2">
                                        <span className="text-orange-600">📝</span>
                                        Bản nháp
                                        <span className="text-sm font-normal text-gray-500">({drafts.length})</span>
                                    </h2>
                                    <div className="h-1 flex-1 bg-gradient-to-r from-orange-300 to-orange-500 rounded-full"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {drafts.map(event => {
                                        return renderEventCard(event);
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Thông báo khi không có events trong section được chọn */}
                        {statusFilter !== 'ALL' && ongoing.length === 0 && upcoming.length === 0 && ended.length === 0 && drafts.length === 0 && (
                            <div className="bg-white rounded-lg shadow-lg p-12 text-center border border-gray-100">
                                <div className="text-gray-400 text-7xl mb-6">
                                    {statusFilter === 'ONGOING' && '🟢'}
                                    {statusFilter === 'UPCOMING' && '⏰'}
                                    {statusFilter === 'ENDED' && '✅'}
                                    {statusFilter === 'DRAFTS' && '📝'}
                                </div>
                                <h3 className="text-xl font-semibold text-[#001C44] mb-3">
                                    {statusFilter === 'ONGOING' && 'Không có sự kiện đang diễn ra'}
                                    {statusFilter === 'UPCOMING' && 'Không có sự kiện sắp diễn ra'}
                                    {statusFilter === 'ENDED' && 'Không có sự kiện đã diễn ra'}
                                    {statusFilter === 'DRAFTS' && 'Không có bản nháp'}
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
    );
};

export default EventList;
