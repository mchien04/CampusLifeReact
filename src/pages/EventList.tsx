import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from '@phosphor-icons/react';
import { ActivityResponse, ActivityType, ScoreType } from '../types/activity';
import { eventAPI } from '../services/eventAPI';
import { ManagerEventRow, ManagerEventsPanel } from '../components/events';
import {
    formatEventDate,
    isEventDraft,
    getEventTimeStatus,
    EVENT_TIME_STATUS_META,
    sortEventsByEndDateDesc,
    sortEventsByStartDateAsc,
} from '../utils/eventDisplayUtils';

type ManagerStatusFilter = 'ALL' | 'ONGOING' | 'UPCOMING' | 'ENDED' | 'DRAFTS';

const SECTION_META: Record<string, { title: string; accent: string }> = {
    ONGOING: { title: 'Đang diễn ra', accent: 'bg-emerald-500' },
    UPCOMING: { title: 'Sắp diễn ra', accent: 'bg-sky-500' },
    ENDED: { title: 'Đã kết thúc', accent: 'bg-gray-400' },
    DRAFTS: { title: 'Bản nháp', accent: 'bg-amber-500' },
};

const EventList: React.FC = () => {
    const [events, setEvents] = useState<ActivityResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<ActivityType | 'ALL'>('ALL');
    const [scoreTypeFilter, setScoreTypeFilter] = useState<ScoreType | 'ALL'>('ALL');
    const [statusFilter, setStatusFilter] = useState<ManagerStatusFilter>('ALL');
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        fetchEvents();
    }, []);

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

    const filteredEvents = useMemo(() => events.filter(event => {
        const q = searchTerm.trim().toLowerCase();
        const matchesSearch = !q ||
            event.name.toLowerCase().includes(q) ||
            event.description?.toLowerCase().includes(q) ||
            event.location?.toLowerCase().includes(q);
        const typeMatch = filter === 'ALL' || event.type === filter;
        const scoreTypeMatch = scoreTypeFilter === 'ALL' ||
            (event.scoreRules && event.scoreRules.some(r => r.scoreType === scoreTypeFilter));
        return matchesSearch && typeMatch && scoreTypeMatch;
    }), [events, searchTerm, filter, scoreTypeFilter]);

    const categorized = useMemo(() => {
        const ended: ActivityResponse[] = [];
        const ongoing: ActivityResponse[] = [];
        const upcoming: ActivityResponse[] = [];
        const drafts: ActivityResponse[] = [];

        filteredEvents.forEach(event => {
            if (isEventDraft(event)) {
                drafts.push(event);
                return;
            }
            const status = getEventTimeStatus(event);
            if (status === 'ENDED') ended.push(event);
            else if (status === 'ONGOING') ongoing.push(event);
            else upcoming.push(event);
        });

        return {
            ended: sortEventsByEndDateDesc(ended),
            ongoing: sortEventsByStartDateAsc(ongoing),
            upcoming: sortEventsByStartDateAsc(upcoming),
            drafts,
        };
    }, [filteredEvents]);

    const stats = useMemo(() => ({
        total: filteredEvents.length,
        ongoing: categorized.ongoing.length,
        upcoming: categorized.upcoming.length,
        ended: categorized.ended.length,
        drafts: categorized.drafts.length,
    }), [filteredEvents.length, categorized]);

    const handleDeleteEvent = async (id: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa sự kiện này?')) return;
        setDeletingId(id);
        try {
            const response = await eventAPI.deleteEvent(id);
            if (response.status) {
                setEvents(prev => prev.filter(event => event.id !== id));
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

    const handleCopyEvent = async (event: ActivityResponse) => {
        const val = window.prompt('Nhập số ngày dịch (có thể bỏ trống):', '0');
        const offset = val === null || val.trim() === '' ? undefined : Number(val);
        const res = await eventAPI.copyActivity(event.id, isNaN(offset as number) ? undefined : offset);
        if (res.status && res.data) {
            window.location.href = `/manager/events/${res.data.id}`;
        } else {
            alert(res.message || 'Không thể sao chép');
        }
    };

    const getManagerEventStatus = (event: ActivityResponse) => {
        if (isEventDraft(event)) {
            return {
                label: 'Nháp',
                className: 'bg-amber-50 text-amber-900 border-amber-200',
                description: 'Chưa công bố',
            };
        }

        const now = new Date();
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);
        const registrationStartDate = event.registrationStartDate ? new Date(event.registrationStartDate) : null;
        const registrationDeadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;

        if (now > endDate) {
            return {
                label: 'Đã kết thúc',
                className: EVENT_TIME_STATUS_META.ENDED.className,
                description: `Kết thúc ${formatEventDate(event.endDate)}`,
            };
        }
        if (now >= startDate && now <= endDate) {
            return {
                label: 'Đang diễn ra',
                className: EVENT_TIME_STATUS_META.ONGOING.className,
                description: `Kết thúc ${formatEventDate(event.endDate)}`,
            };
        }
        if (registrationStartDate && registrationDeadline) {
            if (now < registrationStartDate) {
                return {
                    label: 'Sắp diễn ra',
                    className: EVENT_TIME_STATUS_META.UPCOMING.className,
                    description: `Mở đăng ký ${formatEventDate(event.registrationStartDate!)}`,
                };
            }
            if (now >= registrationStartDate && now <= registrationDeadline) {
                return {
                    label: 'Đang mở đăng ký',
                    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                    description: `Hết hạn ${formatEventDate(event.registrationDeadline!)}`,
                };
            }
            if (now > registrationDeadline) {
                return {
                    label: 'Đã đóng đăng ký',
                    className: 'bg-amber-50 text-amber-900 border-amber-200',
                    description: `Bắt đầu ${formatEventDate(event.startDate)}`,
                };
            }
        }
        return {
            label: 'Sắp diễn ra',
            className: EVENT_TIME_STATUS_META.UPCOMING.className,
            description: `Bắt đầu ${formatEventDate(event.startDate)}`,
        };
    };

    const statusOptions = [
        { value: 'ALL', label: 'Tất cả' },
        { value: 'ONGOING', label: 'Đang diễn ra' },
        { value: 'UPCOMING', label: 'Sắp diễn ra' },
        { value: 'ENDED', label: 'Đã kết thúc' },
        { value: 'DRAFTS', label: 'Bản nháp' },
    ];

    const sections: Array<{ key: ManagerStatusFilter; items: ActivityResponse[] }> = [
        { key: 'ONGOING', items: categorized.ongoing },
        { key: 'UPCOMING', items: categorized.upcoming },
        { key: 'ENDED', items: categorized.ended },
        { key: 'DRAFTS', items: categorized.drafts },
    ];

    const visibleSections = statusFilter === 'ALL'
        ? sections.filter(s => s.items.length > 0)
        : sections.filter(s => s.key === statusFilter);

    return (
        <div className="min-w-0 space-y-5">
            <ManagerEventsPanel
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                typeFilter={filter}
                onTypeFilterChange={setFilter}
                scoreTypeFilter={scoreTypeFilter}
                onScoreTypeFilterChange={setScoreTypeFilter}
                statusFilter={statusFilter}
                onStatusFilterChange={(v) => setStatusFilter(v as ManagerStatusFilter)}
                statusOptions={statusOptions}
                stats={stats}
                onRefresh={fetchEvents}
                loading={loading}
            />

            {loading && (
                <div className="space-y-2 animate-pulse">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-[4.5rem] rounded-xl bg-gray-200/80" />
                    ))}
                </div>
            )}

            {!loading && filteredEvents.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 px-6 text-center">
                    <p className="font-medium text-gray-800">Chưa có sự kiện phù hợp</p>
                    <p className="mt-1 text-sm text-gray-500">Thử đổi bộ lọc hoặc tạo sự kiện mới.</p>
                    <Link
                        to="/manager/events/create"
                        className="inline-flex mt-5 items-center gap-2 rounded-xl bg-primary-900 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800"
                    >
                        <Plus size={16} weight="bold" />
                        Tạo sự kiện
                    </Link>
                </div>
            )}

            {!loading && filteredEvents.length > 0 && visibleSections.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center">
                    <p className="text-gray-600 text-sm">Không có sự kiện trong nhóm đã chọn.</p>
                    <button
                        type="button"
                        onClick={() => setStatusFilter('ALL')}
                        className="mt-3 rounded-lg bg-primary-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-800"
                    >
                        Xem tất cả
                    </button>
                </div>
            )}

            {!loading && visibleSections.map(section => {
                const meta = SECTION_META[section.key];
                return (
                    <section key={section.key} className="space-y-2 min-w-0">
                        <div className="flex items-center gap-2 px-0.5">
                            <span className={`h-5 w-0.5 rounded-full ${meta.accent}`} aria-hidden />
                            <h2 className="text-sm font-semibold text-primary-900">
                                {meta.title}
                                <span className="ml-1.5 font-normal text-gray-400 tabular-nums">
                                    ({section.items.length})
                                </span>
                            </h2>
                        </div>
                        <div className="space-y-2 min-w-0">
                            {section.items.map(event => (
                                <ManagerEventRow
                                    key={event.id}
                                    event={event}
                                    status={getManagerEventStatus(event)}
                                    isDraft={isEventDraft(event)}
                                    onCopy={() => handleCopyEvent(event)}
                                    onDelete={() => handleDeleteEvent(event.id)}
                                    deleting={deletingId === event.id}
                                />
                            ))}
                        </div>
                    </section>
                );
            })}
        </div>
    );
};

export default EventList;
