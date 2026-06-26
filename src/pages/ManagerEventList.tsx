import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ActivityResponse, ActivityType, ScoreType } from '../types/activity';
import { eventAPI } from '../services/eventAPI';
import { getImageUrl } from '../utils/imageUtils';

type TimeStatusFilter = 'ALL' | 'ONGOING' | 'UPCOMING' | 'ENDED' | 'DRAFTS';

const ManagerEventList: React.FC = () => {
    const [events, setEvents] = useState<ActivityResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<ActivityType | 'ALL'>('ALL');
    const [scoreTypeFilter, setScoreTypeFilter] = useState<ScoreType | 'ALL'>('ALL');
    const [statusFilter, setStatusFilter] = useState<TimeStatusFilter>('ALL');
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);

            try {
                const response = await eventAPI.getEvents();

                if (response.status && response.data) {
                    setEvents(response.data.filter(event => !event.seriesId));
                } else {
                    setEvents([]);
                }
            } catch (error) {
                console.error('Error fetching events:', error);
                setEvents([]);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const isDraftEvent = (event: ActivityResponse) => {
        const draftValue = event.draft !== undefined ? event.draft : event.isDraft;
        return draftValue === true || (draftValue !== undefined && draftValue !== null && Boolean(draftValue));
    };

    const filteredEvents = events.filter(event => {
        const typeMatch = filter === 'ALL' || event.type === filter;
        const scoreTypeMatch =
            scoreTypeFilter === 'ALL' ||
            (event.scoreRules && event.scoreRules.some(rule => rule.scoreType === scoreTypeFilter));

        return typeMatch && scoreTypeMatch;
    });

    const categorizeEvents = () => {
        const now = new Date();
        const ended: ActivityResponse[] = [];
        const ongoing: ActivityResponse[] = [];
        const upcoming: ActivityResponse[] = [];
        const drafts: ActivityResponse[] = [];

        filteredEvents.forEach(event => {
            if (isDraftEvent(event)) {
                drafts.push(event);
                return;
            }

            const startDate = new Date(event.startDate);
            const endDate = new Date(event.endDate);

            if (now > endDate) {
                ended.push(event);
                return;
            }

            if (now >= startDate && now <= endDate) {
                ongoing.push(event);
                return;
            }

            upcoming.push(event);
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

    const getScoreTypeLabel = (scoreType: ScoreType | null | undefined): string => {
        if (!scoreType) return 'N/A';

        const scoreTypeLabels: Record<ScoreType, string> = {
            [ScoreType.REN_LUYEN]: 'Điểm rèn luyện',
            [ScoreType.CONG_TAC_XA_HOI]: 'Điểm công tác xã hội',
            [ScoreType.CHUYEN_DE]: 'Điểm chuyên đề doanh nghiệp'
        };

        return scoreTypeLabels[scoreType] || scoreType;
    };

    const getScoreSummary = (event: ActivityResponse): string => {
        if (event.seriesId) {
            return 'Chuỗi sự kiện';
        }

        if (event.scoreRules && event.scoreRules.length > 0) {
            return Array.from(new Set(event.scoreRules.map(rule => rule.scoreType)))
                .map(type => getScoreTypeLabel(type))
                .join(', ');
        }

        return 'Không cộng điểm';
    };

    const getTypeBadgeColor = (type: ActivityType | null): string => {
        if (!type) return 'bg-gray-100 text-gray-800 border-gray-200';

        switch (type) {
            case ActivityType.SUKIEN:
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case ActivityType.MINIGAME:
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case ActivityType.CONG_TAC_XA_HOI:
                return 'bg-green-100 text-green-800 border-green-200';
            case ActivityType.CHUYEN_DE_DOANH_NGHIEP:
                return 'bg-orange-100 text-orange-800 border-orange-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatDate = (dateString?: string | null): string => {
        if (!dateString) return '--';

        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getEventStatus = (event: ActivityResponse): {
        label: string;
        color: string;
        description?: string;
    } => {
        const now = new Date();
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);
        const registrationStartDate = event.registrationStartDate ? new Date(event.registrationStartDate) : null;
        const registrationDeadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;

        if (isDraftEvent(event)) {
            return {
                label: 'Bản nháp',
                color: 'bg-orange-100 text-orange-800 border-orange-200',
                description: 'Sự kiện chưa được công bố'
            };
        }

        if (now > endDate) {
            return {
                label: 'Đã kết thúc',
                color: 'bg-slate-100 text-slate-800 border-slate-200',
                description: `Kết thúc: ${formatDate(event.endDate)}`
            };
        }

        if (now >= startDate && now <= endDate) {
            return {
                label: 'Đang diễn ra',
                color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                description: `Kết thúc: ${formatDate(event.endDate)}`
            };
        }

        if (registrationStartDate && registrationDeadline) {
            if (now < registrationStartDate) {
                return {
                    label: 'Sắp diễn ra',
                    color: 'bg-blue-100 text-blue-800 border-blue-200',
                    description: `Mở đăng ký: ${formatDate(event.registrationStartDate)}`
                };
            }

            if (now >= registrationStartDate && now <= registrationDeadline) {
                return {
                    label: 'Đang mở đăng ký',
                    color: 'bg-teal-100 text-teal-800 border-teal-200',
                    description: `Hết hạn: ${formatDate(event.registrationDeadline)}`
                };
            }

            return {
                label: 'Đã đóng đăng ký',
                color: 'bg-amber-100 text-amber-800 border-amber-200',
                description: `Bắt đầu: ${formatDate(event.startDate)}`
            };
        }

        return {
            label: 'Sắp diễn ra',
            color: 'bg-blue-100 text-blue-800 border-blue-200',
            description: `Bắt đầu: ${formatDate(event.startDate)}`
        };
    };

    const handleDeleteEvent = async (id: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa sự kiện này?')) {
            return;
        }

        setDeletingId(id);

        try {
            const response = await eventAPI.deleteEvent(id);

            if (response.status) {
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

    const handleCopyEvent = async (eventId: number) => {
        const value = window.prompt('Nhập số ngày dịch (có thể bỏ trống):', '0');
        const offset = value === null || value.trim() === '' ? undefined : Number(value);
        const response = await eventAPI.copyActivity(eventId, Number.isNaN(offset as number) ? undefined : offset);

        if (response.status && response.data) {
            alert('Đã tạo bản sao');
            window.location.href = `/manager/events/${response.data.id}`;
            return;
        }

        alert(response.message || 'Không thể sao chép sự kiện');
    };

    const renderEventRow = (event: ActivityResponse) => {
        const eventStatus = getEventStatus(event);
        const isDraft = isDraftEvent(event);

        return (
            <tr key={event.id} className={`border-b border-gray-100 align-top ${isDraft ? 'bg-orange-50/40' : 'hover:bg-slate-50/70'}`}>
                <td className="px-4 py-4">
                    <div className="flex min-w-[300px] items-start gap-4">
                        <div className="h-16 w-24 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 flex-shrink-0">
                            {event.bannerUrl ? (
                                <img
                                    src={getImageUrl(event.bannerUrl) ?? ''}
                                    alt={event.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                                    No image
                                </div>
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start gap-2">
                                <Link
                                    to={`/manager/events/${event.id}`}
                                    className={`font-semibold leading-6 hover:text-[#002A66] ${isDraft ? 'text-orange-700' : 'text-[#001C44]'}`}
                                >
                                    {event.name}
                                </Link>

                                {event.isImportant && (
                                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                                        Quan trọng
                                    </span>
                                )}

                                {isDraft && (
                                    <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-800">
                                        Bản nháp
                                    </span>
                                )}
                            </div>

                            <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                                {event.description || 'Chưa có mô tả'}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 font-semibold ${getTypeBadgeColor(event.type)}`}>
                                    {getTypeLabel(event.type)}
                                </span>
                                <span className="inline-flex items-center rounded-full border border-[#F3D768] bg-[#FFF3C4] px-2.5 py-1 font-semibold text-[#001C44]">
                                    {getScoreSummary(event)}
                                </span>
                            </div>
                        </div>
                    </div>
                </td>

                <td className="px-4 py-4">
                    <div className="flex min-w-[180px] flex-col gap-2">
                        <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-bold ${eventStatus.color}`}>
                            {eventStatus.label}
                        </span>

                        {eventStatus.description && (
                            <p className="text-xs text-gray-500">{eventStatus.description}</p>
                        )}

                        {event.mandatoryForFacultyStudents && (
                            <span className="text-xs font-medium text-red-700">Bắt buộc cho sinh viên khoa</span>
                        )}

                        {event.requiresApproval && (
                            <span className="text-xs font-medium text-emerald-700">Cần duyệt đăng ký</span>
                        )}
                    </div>
                </td>

                <td className="px-4 py-4">
                    <div className="min-w-[210px] space-y-1 text-sm text-gray-700">
                        <p><span className="font-medium text-gray-500">Bắt đầu:</span> {formatDate(event.startDate)}</p>
                        <p><span className="font-medium text-gray-500">Kết thúc:</span> {formatDate(event.endDate)}</p>
                        <p><span className="font-medium text-gray-500">Mở đăng ký:</span> {formatDate(event.registrationStartDate)}</p>
                        <p><span className="font-medium text-gray-500">Hết hạn:</span> {formatDate(event.registrationDeadline)}</p>
                    </div>
                </td>

                <td className="px-4 py-4">
                    <div className="min-w-[210px] space-y-1 text-sm text-gray-700">
                        <p className="line-clamp-2"><span className="font-medium text-gray-500">Địa điểm:</span> {event.location || '--'}</p>
                        <p><span className="font-medium text-gray-500">Người tham gia:</span> {event.participantCount || 0}</p>
                        <p><span className="font-medium text-gray-500">Số vé:</span> {event.ticketQuantity || 0}</p>
                        <p><span className="font-medium text-gray-500">Trạng thái API:</span> {event.status || '--'}</p>
                    </div>
                </td>

                <td className="px-4 py-4">
                    <div className="flex min-w-[170px] flex-col gap-2">
                        <Link
                            to={`/manager/events/${event.id}`}
                            className="rounded-lg bg-[#001C44] px-3 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-[#002A66]"
                        >
                            Xem chi tiết
                        </Link>

                        <Link
                            to={`/manager/events/${event.id}/edit`}
                            className="rounded-lg bg-gray-700 px-3 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-gray-800"
                        >
                            Chỉnh sửa
                        </Link>

                        <button
                            onClick={() => handleCopyEvent(event.id)}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-[#001C44] hover:bg-gray-50"
                        >
                            Sao chép
                        </button>

                        <button
                            onClick={() => handleDeleteEvent(event.id)}
                            disabled={deletingId === event.id}
                            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                        >
                            {deletingId === event.id ? 'Đang xóa...' : 'Xóa'}
                        </button>
                    </div>
                </td>
            </tr>
        );
    };

    const renderEventSection = (
        title: string,
        accentClasses: string,
        eventsInSection: ActivityResponse[]
    ) => {
        if (eventsInSection.length === 0) {
            return null;
        }

        return (
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className={`border-b px-5 py-4 ${accentClasses}`}>
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-lg font-bold">{title}</h2>
                        <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-gray-700">
                            {eventsInSection.length} sự kiện
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                            <tr>
                                <th className="px-4 py-3">Sự kiện</th>
                                <th className="px-4 py-3">Trạng thái</th>
                                <th className="px-4 py-3">Thời gian</th>
                                <th className="px-4 py-3">Thông tin nhanh</th>
                                <th className="px-4 py-3">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>{eventsInSection.map(renderEventRow)}</tbody>
                    </table>
                </div>
            </section>
        );
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Đang tải danh sách sự kiện...</p>
                </div>
            </div>
        );
    }

    const noResultsForStatus =
        statusFilter !== 'ALL' &&
        ((statusFilter === 'ONGOING' && ongoing.length === 0) ||
            (statusFilter === 'UPCOMING' && upcoming.length === 0) ||
            (statusFilter === 'ENDED' && ended.length === 0) ||
            (statusFilter === 'DRAFTS' && drafts.length === 0));

    return (
        <div>
            <div className="mb-6 flex flex-wrap gap-3">
                <Link
                    to="/manager/series"
                    className="rounded-lg bg-[#001C44] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#002A66]"
                >
                    Chuỗi sự kiện
                </Link>
                <Link
                    to="/manager/minigames"
                    className="rounded-lg bg-[#001C44] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#002A66]"
                >
                    Mini Game
                </Link>
                <Link
                    to="/manager/events/create"
                    className="rounded-lg bg-[#FFD66D] px-4 py-2 text-sm font-medium text-[#001C44] transition-colors hover:bg-[#FFC947]"
                >
                    + Tạo sự kiện mới
                </Link>
            </div>

            <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-[#001C44]">Bộ lọc</h3>

                <div className="mb-4">
                    <h4 className="mb-3 text-sm font-medium text-gray-700">Loại sự kiện:</h4>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setFilter('ALL')}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                                filter === 'ALL' ? 'bg-[#001C44] text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Tất cả
                        </button>
                        {[ActivityType.SUKIEN, ActivityType.MINIGAME, ActivityType.CONG_TAC_XA_HOI, ActivityType.CHUYEN_DE_DOANH_NGHIEP].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilter(type)}
                                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                                    filter === type ? 'bg-[#001C44] text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {getTypeLabel(type)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-4">
                    <h4 className="mb-3 text-sm font-medium text-gray-700">Kiểu tính điểm:</h4>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setScoreTypeFilter('ALL')}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                                scoreTypeFilter === 'ALL'
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
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                                    scoreTypeFilter === scoreType
                                        ? 'bg-[#FFD66D] text-[#001C44] shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {getScoreTypeLabel(scoreType)}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="mb-3 text-sm font-medium text-gray-700">Trạng thái thời gian:</h4>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setStatusFilter('ALL')}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                                statusFilter === 'ALL' ? 'bg-[#001C44] text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Tất cả
                        </button>
                        <button
                            onClick={() => setStatusFilter('ONGOING')}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                                statusFilter === 'ONGOING'
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                        >
                            Đang diễn ra
                        </button>
                        <button
                            onClick={() => setStatusFilter('UPCOMING')}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                                statusFilter === 'UPCOMING'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                            }`}
                        >
                            Sắp diễn ra
                        </button>
                        <button
                            onClick={() => setStatusFilter('ENDED')}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                                statusFilter === 'ENDED'
                                    ? 'bg-slate-600 text-white shadow-md'
                                    : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            Đã diễn ra
                        </button>
                        <button
                            onClick={() => setStatusFilter('DRAFTS')}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                                statusFilter === 'DRAFTS'
                                    ? 'bg-orange-600 text-white shadow-md'
                                    : 'border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
                            }`}
                        >
                            Bản nháp
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {filteredEvents.length === 0 ? (
                    <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
                        <h3 className="mb-3 text-xl font-semibold text-[#001C44]">Không có sự kiện nào</h3>
                        <p className="mx-auto mb-6 max-w-md text-gray-600">
                            Chưa có sự kiện nào được tạo hoặc không có sự kiện phù hợp với bộ lọc.
                        </p>
                        <Link
                            to="/manager/events/create"
                            className="inline-block rounded-lg bg-[#001C44] px-6 py-3 text-sm font-medium text-white transition-all hover:bg-[#002A66]"
                        >
                            + Tạo sự kiện đầu tiên
                        </Link>
                    </div>
                ) : (
                    <>
                        {(statusFilter === 'ALL' || statusFilter === 'ONGOING') &&
                            renderEventSection('Đang diễn ra', 'bg-emerald-50 text-emerald-900', ongoing)}

                        {(statusFilter === 'ALL' || statusFilter === 'UPCOMING') &&
                            renderEventSection('Sắp diễn ra', 'bg-blue-50 text-blue-900', upcoming)}

                        {(statusFilter === 'ALL' || statusFilter === 'ENDED') &&
                            renderEventSection('Đã diễn ra', 'bg-slate-100 text-slate-900', ended)}

                        {(statusFilter === 'ALL' || statusFilter === 'DRAFTS') &&
                            renderEventSection('Bản nháp', 'bg-orange-50 text-orange-900', drafts)}

                        {noResultsForStatus && (
                            <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
                                <h3 className="mb-3 text-xl font-semibold text-[#001C44]">
                                    {statusFilter === 'ONGOING' && 'Không có sự kiện đang diễn ra'}
                                    {statusFilter === 'UPCOMING' && 'Không có sự kiện sắp diễn ra'}
                                    {statusFilter === 'ENDED' && 'Không có sự kiện đã diễn ra'}
                                    {statusFilter === 'DRAFTS' && 'Không có bản nháp'}
                                </h3>
                                <p className="mx-auto mb-6 max-w-md text-gray-600">
                                    Không có sự kiện nào phù hợp với bộ lọc đã chọn.
                                </p>
                                <button
                                    onClick={() => setStatusFilter('ALL')}
                                    className="inline-block rounded-lg bg-[#001C44] px-6 py-3 text-sm font-medium text-white transition-all hover:bg-[#002A66]"
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

export default ManagerEventList;
