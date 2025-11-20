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
                    setEvents(response.data);
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

    const getTypeLabel = (type: ActivityType): string => {
        const typeLabels: Record<ActivityType, string> = {
            [ActivityType.SUKIEN]: 'Sự kiện',
            [ActivityType.MINIGAME]: 'Mini Game',
            [ActivityType.CONG_TAC_XA_HOI]: 'Công tác xã hội',
            [ActivityType.CHUYEN_DE_DOANH_NGHIEP]: 'Chuyên đề doanh nghiệp'
        };
        return typeLabels[type] || type;
    };

    const getScoreTypeLabel = (scoreType: ScoreType): string => {
        const scoreTypeLabels: Record<ScoreType, string> = {
            [ScoreType.REN_LUYEN]: 'Điểm rèn luyện',
            [ScoreType.CONG_TAC_XA_HOI]: 'Điểm công tác xã hội',
            [ScoreType.CHUYEN_DE]: 'Điểm chuyên đề doanh nghiệp',
            [ScoreType.KHAC]: 'Các loại khác'
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
                return 'bg-green-100 text-green-800';
            case 'INACTIVE':
                return 'bg-gray-100 text-gray-800';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
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

        // Nháp - handle both boolean and string values
        const isDraft = typeof event.isDraft === 'boolean'
            ? event.isDraft
            : event.isDraft === 'true' || event.isDraft === true;
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
                color: 'bg-gray-100 text-gray-800 border-gray-300',
                description: `Kết thúc: ${formatDate(event.endDate)}`
            };
        }

        // Đang diễn ra
        if (now >= startDate && now <= endDate) {
            return {
                status: 'ONGOING',
                label: 'Đang diễn ra',
                color: 'bg-green-100 text-green-800 border-green-300',
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
                        color: 'bg-blue-100 text-blue-800 border-blue-300',
                        description: `Bắt đầu đăng ký: ${formatDate(event.registrationStartDate!)}`
                    };
                } else if (now >= registrationStartDate && now <= registrationDeadline) {
                    return {
                        status: 'REGISTRATION_OPEN',
                        label: 'Đang mở đăng ký',
                        color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                        description: `Hết hạn đăng ký: ${formatDate(event.registrationDeadline!)}`
                    };
                } else if (now > registrationDeadline) {
                    return {
                        status: 'REGISTRATION_CLOSED',
                        label: 'Đã đóng đăng ký',
                        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
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
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Quản lý sự kiện</h1>
                            <p className="text-gray-600 mt-1">Danh sách tất cả sự kiện</p>
                        </div>
                        <div className="flex space-x-3">
                            <Link
                                to="/dashboard"
                                className="px-4 py-2 text-gray-600 hover:text-gray-900"
                            >
                                ← Quay lại Dashboard
                            </Link>
                            <Link
                                to="/manager/events/create"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                            >
                                + Tạo sự kiện mới
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => setFilter('ALL')}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'ALL'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Tất cả
                        </button>
                        {[ActivityType.SUKIEN, ActivityType.MINIGAME, ActivityType.CONG_TAC_XA_HOI, ActivityType.CHUYEN_DE_DOANH_NGHIEP].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilter(type)}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${filter === type
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {getTypeLabel(type)}
                            </button>
                        ))}
                    </div>

                    {/* Score Type Filter */}
                    <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Lọc theo kiểu tính điểm:</h4>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setScoreTypeFilter('ALL')}
                                className={`px-3 py-1 rounded-md text-xs font-medium ${scoreTypeFilter === 'ALL'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Tất cả
                            </button>
                            {[ScoreType.REN_LUYEN, ScoreType.CONG_TAC_XA_HOI, ScoreType.CHUYEN_DE, ScoreType.KHAC].map(scoreType => (
                                <button
                                    key={scoreType}
                                    onClick={() => setScoreTypeFilter(scoreType)}
                                    className={`px-3 py-1 rounded-md text-xs font-medium ${scoreTypeFilter === scoreType
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {getScoreTypeLabel(scoreType)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Events List */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                    {filteredEvents.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-8 text-center">
                            <div className="text-gray-400 text-6xl mb-4">📅</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có sự kiện nào</h3>
                            <p className="text-gray-600 mb-4">Chưa có sự kiện nào được tạo hoặc không có sự kiện phù hợp với bộ lọc.</p>
                            <Link
                                to="/manager/events/create"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                            >
                                Tạo sự kiện đầu tiên
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredEvents.map(event => (
                                <div key={event.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow flex flex-col h-full">
                                    {event.bannerUrl && (
                                        <div className="h-48 bg-gray-200 rounded-t-lg bg-cover bg-center flex-shrink-0"
                                            style={{ backgroundImage: `url(${getImageUrl(event.bannerUrl)})` }}>
                                        </div>
                                    )}

                                    <div className="p-6 flex flex-col flex-grow">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                                                        {event.name}
                                                    </h3>
                                                    {event.isImportant && (
                                                        <span className="text-yellow-500 text-lg flex-shrink-0" title="Sự kiện quan trọng">⭐</span>
                                                    )}
                                                </div>

                                                {/* Trạng thái sự kiện */}
                                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                                    {(() => {
                                                        // Handle both boolean and string values from API
                                                        const isDraft = typeof event.isDraft === 'boolean'
                                                            ? event.isDraft
                                                            : event.isDraft === 'true' || event.isDraft === true;

                                                        if (isDraft) {
                                                            return (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300">
                                                                    📝 Nháp
                                                                </span>
                                                            );
                                                        } else {
                                                            const eventStatus = getEventStatus(event);
                                                            return (
                                                                <>
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${eventStatus.color}`}>
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
                                                        }
                                                    })()}
                                                </div>

                                                <div className="flex flex-wrap gap-1">
                                                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(event.status)}`}>
                                                        {getTypeLabel(event.type)}
                                                    </span>
                                                    <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                        {getScoreTypeLabel(event.scoreType)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
                                            {event.description}
                                        </p>

                                        <div className="space-y-2 text-sm text-gray-500 mb-4">
                                            <div className="flex items-center">
                                                <span className="w-4 h-4 mr-2">📅</span>
                                                <span className="truncate">Bắt đầu: {formatDate(event.startDate)}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="w-4 h-4 mr-2">📅</span>
                                                <span className="truncate">Kết thúc: {formatDate(event.endDate)}</span>
                                            </div>
                                            {event.registrationStartDate && (
                                                <div className="flex items-center">
                                                    <span className="w-4 h-4 mr-2">📝</span>
                                                    <span className="truncate">Mở đăng ký: {formatDate(event.registrationStartDate)}</span>
                                                </div>
                                            )}
                                            {event.registrationDeadline && (
                                                <div className="flex items-center">
                                                    <span className="w-4 h-4 mr-2">⏰</span>
                                                    <span className="truncate">Hết hạn đăng ký: {formatDate(event.registrationDeadline)}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center">
                                                <span className="w-4 h-4 mr-2">📍</span>
                                                <span className="truncate">{event.location}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="w-4 h-4 mr-2">👥</span>
                                                <span className="truncate">{event.participantCount || 0} người tham gia</span>
                                            </div>
                                            {event.maxPoints && parseFloat(event.maxPoints) > 0 && (
                                                <div className="flex items-center">
                                                    <span className="w-4 h-4 mr-2">🏆</span>
                                                    <span className="truncate">{event.maxPoints} điểm</span>
                                                </div>
                                            )}
                                            {event.ticketQuantity && event.ticketQuantity > 0 && (
                                                <div className="flex items-center">
                                                    <span className="w-4 h-4 mr-2">🎫</span>
                                                    <span className="truncate">{event.ticketQuantity} vé</span>
                                                </div>
                                            )}
                                            {event.mandatoryForFacultyStudents && (
                                                <div className="flex items-center">
                                                    <span className="w-4 h-4 mr-2">🎯</span>
                                                    <span className="truncate">Bắt buộc cho sinh viên khoa</span>
                                                </div>
                                            )}
                                            {event.requiresApproval && (
                                                <div className="flex items-center">
                                                    <span className="w-4 h-4 mr-2">✓</span>
                                                    <span className="truncate">Cần duyệt đăng ký</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex space-x-2 mt-auto">
                                            <Link
                                                to={`/manager/events/${event.id}`}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-3 rounded-md text-sm font-medium"
                                            >
                                                Xem chi tiết
                                            </Link>
                                            <Link
                                                to={`/manager/events/${event.id}/edit`}
                                                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-center py-2 px-3 rounded-md text-sm font-medium"
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
                                                className="flex-1 bg-white border text-gray-700 hover:bg-gray-50 text-center py-2 px-3 rounded-md text-sm font-medium"
                                            >
                                                Sao chép
                                            </Link>
                                            <button
                                                onClick={() => handleDeleteEvent(event.id)}
                                                disabled={deletingId === event.id}
                                                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-center py-2 px-3 rounded-md text-sm font-medium disabled:opacity-50"
                                            >
                                                {deletingId === event.id ? 'Đang xóa...' : 'Xóa'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventList;
