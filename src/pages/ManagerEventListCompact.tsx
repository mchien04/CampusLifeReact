import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ActivityResponse, ActivityType, ScoreType } from '../types/activity';
import { eventAPI } from '../services/eventAPI';

type TimeStatusFilter = 'ALL' | 'ONGOING' | 'UPCOMING' | 'ENDED' | 'DRAFTS';

type ActionIconProps = {
    title: string;
    tone: 'primary' | 'neutral' | 'danger';
    as?: 'button' | 'link';
    to?: string;
    onClick?: () => void;
    disabled?: boolean;
    children: React.ReactNode;
};

const ActionIcon: React.FC<ActionIconProps> = ({
    title,
    tone,
    as = 'button',
    to,
    onClick,
    disabled,
    children
}) => {
    const toneClasses = {
        primary: 'border-[#001C44]/15 text-[#001C44] hover:bg-[#001C44] hover:text-white',
        neutral: 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900',
        danger: 'border-red-200 text-red-600 hover:bg-red-600 hover:text-white'
    };

    const className = `inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-white transition-colors ${toneClasses[tone]} ${
        disabled ? 'cursor-not-allowed opacity-50' : ''
    }`;

    if (as === 'link' && to) {
        return (
            <Link to={to} className={className} title={title} aria-label={title}>
                {children}
            </Link>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={className}
            title={title}
            aria-label={title}
        >
            {children}
        </button>
    );
};

const ManagerEventListCompact: React.FC = () => {
    const [events, setEvents] = useState<ActivityResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<ActivityType | 'ALL'>('ALL');
    const [scoreTypeFilter, setScoreTypeFilter] = useState<ScoreType | 'ALL'>('ALL');
    const [statusFilter, setStatusFilter] = useState<TimeStatusFilter>('ALL');
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 10;

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

    const getEventStatus = (event: ActivityResponse) => {
        const now = new Date();
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);
        const registrationStartDate = event.registrationStartDate ? new Date(event.registrationStartDate) : null;
        const registrationDeadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;

        if (isDraftEvent(event)) {
            return {
                label: 'Bản nháp',
                color: 'bg-orange-100 text-orange-800 border-orange-200'
            };
        }

        if (now > endDate) {
            return {
                label: 'Đã kết thúc',
                color: 'bg-slate-100 text-slate-800 border-slate-200'
            };
        }

        if (now >= startDate && now <= endDate) {
            return {
                label: 'Đang diễn ra',
                color: 'bg-emerald-100 text-emerald-800 border-emerald-200'
            };
        }

        if (registrationStartDate && registrationDeadline && now >= registrationStartDate && now <= registrationDeadline) {
            return {
                label: 'Mở đăng ký',
                color: 'bg-teal-100 text-teal-800 border-teal-200'
            };
        }

        return {
            label: 'Sắp diễn ra',
            color: 'bg-blue-100 text-blue-800 border-blue-200'
        };
    };

    const matchesStatusFilter = (event: ActivityResponse) => {
        if (statusFilter === 'ALL') {
            return true;
        }

        if (statusFilter === 'DRAFTS') {
            return isDraftEvent(event);
        }

        if (isDraftEvent(event)) {
            return false;
        }

        const now = new Date();
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);

        if (statusFilter === 'ONGOING') {
            return now >= startDate && now <= endDate;
        }

        if (statusFilter === 'UPCOMING') {
            return now < startDate;
        }

        if (statusFilter === 'ENDED') {
            return now > endDate;
        }

        return true;
    };

    const filteredEvents = events
        .filter(event => {
            const typeMatch = filter === 'ALL' || event.type === filter;
            const scoreTypeMatch =
                scoreTypeFilter === 'ALL' ||
                (event.scoreRules && event.scoreRules.some(rule => rule.scoreType === scoreTypeFilter));

            return typeMatch && scoreTypeMatch;
        })
        .filter(matchesStatusFilter)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize));
    const paginatedEvents = filteredEvents.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

    useEffect(() => {
        setCurrentPage(0);
    }, [filter, scoreTypeFilter, statusFilter]);

    useEffect(() => {
        if (currentPage > totalPages - 1) {
            setCurrentPage(Math.max(0, totalPages - 1));
        }
    }, [currentPage, totalPages]);

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

    const renderEventRow = (event: ActivityResponse, index: number) => {
        const eventStatus = getEventStatus(event);
        const isDraft = isDraftEvent(event);
        const rowNumber = currentPage * pageSize + index + 1;

        return (
            <tr key={event.id} className="border-b border-gray-100 align-top hover:bg-slate-50/70">
                <td className="px-4 py-4 text-sm font-semibold text-gray-500">
                    <div className="min-w-[48px]">{rowNumber}</div>
                </td>
                <td className="px-4 py-4">
                    <div className="min-w-[320px]">
                        <div className="flex flex-wrap items-center gap-2">
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
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 font-semibold ${getTypeBadgeColor(event.type)}`}>
                                {getTypeLabel(event.type)}
                            </span>
                            <span className="inline-flex items-center rounded-full border border-[#F3D768] bg-[#FFF3C4] px-2.5 py-1 font-semibold text-[#001C44]">
                                {getScoreSummary(event)}
                            </span>
                        </div>
                    </div>
                </td>

                <td className="px-4 py-4">
                    <div className="min-w-[220px] space-y-1 text-sm text-gray-700">
                        <p><span className="font-medium text-gray-500">Bắt đầu:</span> {formatDate(event.startDate)}</p>
                        <p><span className="font-medium text-gray-500">Kết thúc:</span> {formatDate(event.endDate)}</p>
                        <p><span className="font-medium text-gray-500">Hạn đăng ký:</span> {formatDate(event.registrationDeadline)}</p>
                    </div>
                </td>

                <td className="px-4 py-4">
                    <div className="flex min-w-[180px] flex-col gap-2">
                        <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-bold ${eventStatus.color}`}>
                            {eventStatus.label}
                        </span>

                        <div className="flex flex-wrap gap-1.5">
                            {isDraft && (
                                <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700">
                                    Draft
                                </span>
                            )}
                            {event.requiresApproval && (
                                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                    Duyệt đăng ký
                                </span>
                            )}
                            {event.mandatoryForFacultyStudents && (
                                <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                                    Bắt buộc
                                </span>
                            )}
                        </div>
                    </div>
                </td>

                <td className="px-4 py-4">
                    <div className="min-w-[220px] space-y-1 text-sm text-gray-700">
                        <p className="line-clamp-2"><span className="font-medium text-gray-500">Địa điểm:</span> {event.location || '--'}</p>
                        <p><span className="font-medium text-gray-500">Số vé:</span> {event.ticketQuantity == null || event.ticketQuantity <= 0 ? 'Không giới hạn' : event.ticketQuantity}</p>
                    </div>
                </td>

                <td className="px-4 py-4">
                    <div className="flex min-w-[160px] items-center gap-2">
                        <ActionIcon title="Xem chi tiết" tone="primary" as="link" to={`/manager/events/${event.id}`}>
                            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                                <path d="M12 5c5.5 0 9.5 5.2 10.7 7-.2.3-4.2 7-10.7 7S2.5 12.3 1.3 10.5C2.5 8.7 6.5 5 12 5Zm0 2C8.3 7 5.2 10 3.8 12c1.4 2 4.5 5 8.2 5s6.8-3 8.2-5C18.8 10 15.7 7 12 7Zm0 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" />
                            </svg>
                        </ActionIcon>

                        <ActionIcon title="Chỉnh sửa" tone="neutral" as="link" to={`/manager/events/${event.id}/edit`}>
                            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                                <path d="m16.24 3.56 4.2 4.2-11.2 11.2-4.89.7.69-4.89 11.2-11.2Zm1.42-1.42a2 2 0 0 1 2.83 0l1.37 1.37a2 2 0 0 1 0 2.83l-.71.71-4.2-4.2.71-.71Z" />
                            </svg>
                        </ActionIcon>

                        <ActionIcon title="Sao chép" tone="neutral" onClick={() => handleCopyEvent(event.id)}>
                            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                                <path d="M8 7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-1v-2h1a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-8a1 1 0 0 0-1 1v1H8V7Zm-5 4a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-8Zm3-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1H6Z" />
                            </svg>
                        </ActionIcon>

                        <ActionIcon
                            title={deletingId === event.id ? 'Đang xóa' : 'Xóa'}
                            tone="danger"
                            onClick={() => handleDeleteEvent(event.id)}
                            disabled={deletingId === event.id}
                        >
                            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                                <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h2v9H7V9Zm4 0h2v9h-2V9Zm4 0h2v9h-2V9ZM6 21a2 2 0 0 1-2-2V8h16v11a2 2 0 0 1-2 2H6Z" />
                            </svg>
                        </ActionIcon>
                    </div>
                </td>
            </tr>
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
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-[#001C44]">Bộ lọc</h3>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                        {filteredEvents.length} sự kiện
                    </span>
                </div>

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

            {filteredEvents.length === 0 ? (
                <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
                    <h3 className="mb-3 text-xl font-semibold text-[#001C44]">Không có sự kiện nào</h3>
                    <p className="mx-auto mb-6 max-w-md text-gray-600">
                        Không có sự kiện nào phù hợp với bộ lọc hiện tại.
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            setFilter('ALL');
                            setScoreTypeFilter('ALL');
                            setStatusFilter('ALL');
                        }}
                        className="inline-block rounded-lg bg-[#001C44] px-6 py-3 text-sm font-medium text-white transition-all hover:bg-[#002A66]"
                    >
                        Xóa bộ lọc
                    </button>
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-100 bg-slate-50 px-5 py-3 text-sm text-slate-600">
                        Sắp xếp theo ngày bắt đầu mới nhất
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-white text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                <tr>
                                    <th className="px-4 py-3">STT</th>
                                    <th className="px-4 py-3">Sự kiện</th>
                                    <th className="px-4 py-3">Thời gian</th>
                                    <th className="px-4 py-3">Trạng thái</th>
                                    <th className="px-4 py-3">Thông tin</th>
                                    <th className="px-4 py-3">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>{paginatedEvents.map((event, index) => renderEventRow(event, index))}</tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-slate-50 px-5 py-3">
                            <div className="text-sm text-slate-600">
                                Trang <span className="font-semibold text-[#001C44]">{currentPage + 1}</span> / <span className="font-semibold text-[#001C44]">{totalPages}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                    disabled={currentPage === 0}
                                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Trước
                                </button>
                                {Array.from({ length: totalPages }, (_, index) => index)
                                    .slice(Math.max(0, currentPage - 1), Math.min(totalPages, currentPage + 2))
                                    .map(page => (
                                        <button
                                            key={page}
                                            type="button"
                                            onClick={() => setCurrentPage(page)}
                                            className={`h-9 min-w-9 rounded-lg px-3 text-sm font-medium transition-colors ${
                                                page === currentPage
                                                    ? 'bg-[#001C44] text-white'
                                                    : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            {page + 1}
                                        </button>
                                    ))}
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                                    disabled={currentPage >= totalPages - 1}
                                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ManagerEventListCompact;
