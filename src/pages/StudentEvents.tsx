import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { eventAPI } from '../services/eventAPI';
import { registrationAPI } from '../services/registrationAPI';
import { ActivityResponse, ActivityType, ScoreType } from '../types';
import { RegistrationStatus } from '../types/registration';
import { findCancelledActivityIds } from '../utils/registrationRules';
import { EventListCard, EventListFilters, EventListSection } from '../components/events';
import StudentLayout from '../components/layout/StudentLayout';
import {
    getEventTimeStatus,
    EVENT_TIME_STATUS_META,
    sortEventsByEndDateDesc,
    sortEventsByStartDateAsc,
} from '../utils/eventDisplayUtils';

const btnPrimary =
    'flex-1 min-w-[7rem] rounded-xl bg-primary-900 px-3 py-2.5 text-sm font-medium text-white text-center transition-all hover:bg-primary-800 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900';
const btnAccent =
    'flex-1 min-w-[7rem] rounded-xl bg-accent px-3 py-2.5 text-sm font-medium text-primary-900 text-center transition-all hover:bg-accent-hover active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900';
const btnDanger =
    'flex-1 min-w-[7rem] rounded-xl bg-red-600 px-3 py-2.5 text-sm font-medium text-white text-center transition-all hover:bg-red-700 active:scale-[0.98]';

const StudentEvents: React.FC = () => {
    const { user } = useAuth();
    void user;

    const [events, setEvents] = useState<ActivityResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<ActivityType | 'ALL'>('ALL');
    const [scoreTypeFilter, setScoreTypeFilter] = useState<ScoreType | 'ALL'>('ALL');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONGOING' | 'UPCOMING' | 'ENDED'>('ALL');
    const [registrationStatuses, setRegistrationStatuses] = useState<Map<number, RegistrationStatus>>(new Map());
    const [canCancelMap, setCanCancelMap] = useState<Map<number, boolean>>(new Map());
    const [cancelledIds, setCancelledIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await eventAPI.getEvents();
            if (response.status) {
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

    const loadRegistrationStatuses = async (eventList: ActivityResponse[]) => {
        const statusMap = new Map<number, RegistrationStatus>();
        const cancelMap = new Map<number, boolean>();

        try {
            const myRegs = await registrationAPI.getMyRegistrations();
            setCancelledIds(findCancelledActivityIds(myRegs));
        } catch (err) {
            console.error('Error loading my registrations:', err);
        }

        for (const event of eventList) {
            try {
                const regStatus = await registrationAPI.getActivityRegistrationStatus(event.id);
                if (regStatus?.isRegistered && regStatus?.status) {
                    statusMap.set(event.id, regStatus.status);
                }
                if (regStatus?.canCancel === true) {
                    cancelMap.set(event.id, true);
                }
            } catch (err) {
                console.error(`Error checking registration status for event ${event.id}:`, err);
            }
        }

        setRegistrationStatuses(statusMap);
        setCanCancelMap(cancelMap);
    };

    const handleRegister = async (eventId: number) => {
        try {
            const event = events.find(e => e.id === eventId);
            const response = await registrationAPI.registerForActivity({ activityId: eventId });
            if (response) {
                const newStatus = event && event.requiresApproval === false
                    ? RegistrationStatus.APPROVED
                    : RegistrationStatus.PENDING;
                setRegistrationStatuses(prev => new Map(prev.set(eventId, newStatus)));
                setCancelledIds(prev => { const n = new Set(prev); n.delete(eventId); return n; });
            } else {
                alert('Đăng ký thất bại');
            }
        } catch (err: unknown) {
            try {
                const myRegs = await registrationAPI.getMyRegistrations();
                setCancelledIds(findCancelledActivityIds(myRegs));
            } catch { /* ignore */ }
            const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
                || (err as Error).message;
            alert('Có lỗi xảy ra khi đăng ký: ' + msg);
        }
    };

    const handleCancelRegistration = async (eventId: number) => {
        if (!window.confirm('Bạn có chắc muốn hủy đăng ký? Sau khi hủy, bạn sẽ không thể đăng ký lại sự kiện này.')) {
            return;
        }
        try {
            await registrationAPI.cancelRegistration(eventId);
            setRegistrationStatuses(prev => new Map(prev.set(eventId, RegistrationStatus.CANCELLED)));
            setCanCancelMap(prev => { const n = new Map(prev); n.delete(eventId); return n; });
            const myRegs = await registrationAPI.getMyRegistrations();
            setCancelledIds(findCancelledActivityIds(myRegs));
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
                || (err as Error).message;
            alert('Có lỗi xảy ra khi hủy đăng ký: ' + msg);
        }
    };

    const getRegistrationLabel = (status: RegistrationStatus) => {
        const labels: Record<RegistrationStatus, string> = {
            [RegistrationStatus.PENDING]: 'Chờ duyệt',
            [RegistrationStatus.APPROVED]: 'Đã duyệt',
            [RegistrationStatus.REJECTED]: 'Từ chối',
            [RegistrationStatus.CANCELLED]: 'Đã hủy',
            [RegistrationStatus.ATTENDED]: 'Đã tham dự',
            [RegistrationStatus.WAITLIST]: 'Danh sách chờ',
        };
        return labels[status] || status;
    };

    const getRegistrationColor = (status: RegistrationStatus) => {
        const colors: Record<RegistrationStatus, string> = {
            [RegistrationStatus.PENDING]: 'bg-amber-50 text-amber-800 border-amber-200',
            [RegistrationStatus.APPROVED]: 'bg-emerald-50 text-emerald-800 border-emerald-200',
            [RegistrationStatus.REJECTED]: 'bg-red-50 text-red-700 border-red-200',
            [RegistrationStatus.CANCELLED]: 'bg-gray-50 text-gray-600 border-gray-200',
            [RegistrationStatus.ATTENDED]: 'bg-sky-50 text-sky-800 border-sky-200',
            [RegistrationStatus.WAITLIST]: 'bg-violet-50 text-violet-800 border-violet-200',
        };
        return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
    };

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'ALL' || event.type === typeFilter;
        const matchesScoreType = scoreTypeFilter === 'ALL' || (event.scoreRules && event.scoreRules.some(r => r.scoreType === scoreTypeFilter));
        const matchesStatus = statusFilter === 'ALL' || getEventTimeStatus(event) === statusFilter;
        return matchesSearch && matchesType && matchesScoreType && matchesStatus;
    });

    const categorizeEvents = () => {
        const ended: ActivityResponse[] = [];
        const ongoing: ActivityResponse[] = [];
        const upcoming: ActivityResponse[] = [];
        filteredEvents.forEach(event => {
            const status = getEventTimeStatus(event);
            if (status === 'ENDED') ended.push(event);
            else if (status === 'ONGOING') ongoing.push(event);
            else upcoming.push(event);
        });
        return {
            ended: sortEventsByEndDateDesc(ended),
            ongoing: sortEventsByStartDateAsc(ongoing),
            upcoming: sortEventsByStartDateAsc(upcoming),
        };
    };

    const { ended, ongoing, upcoming } = categorizeEvents();

    const renderEventCard = (event: ActivityResponse) => {
        const registrationStatus = registrationStatuses.get(event.id);
        const eventStatus = getEventTimeStatus(event);
        const timeMeta = EVENT_TIME_STATUS_META[eventStatus];
        const isRegistered = registrationStatus === RegistrationStatus.APPROVED ||
            registrationStatus === RegistrationStatus.PENDING ||
            registrationStatus === RegistrationStatus.ATTENDED;

        const canRegister = (() => {
            if (isRegistered || cancelledIds.has(event.id)) return false;
            const now = new Date();
            const registrationStartDate = event.registrationStartDate ? new Date(event.registrationStartDate) : null;
            const registrationDeadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;
            if (registrationStartDate && now < registrationStartDate) return false;
            if (registrationDeadline && now > registrationDeadline) return false;
            return eventStatus === 'UPCOMING' || eventStatus === 'ONGOING';
        })();

        const canCancel = canCancelMap.get(event.id) === true && event.seriesId == null;
        const alreadyCancelled = cancelledIds.has(event.id);

        return (
            <EventListCard
                key={event.id}
                event={event}
                statusBadge={
                    <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium ${timeMeta.className}`}>
                        {timeMeta.label}
                    </span>
                }
                extraTags={event.seriesId ? (
                    <Link
                        to={`/student/series/${event.seriesId}`}
                        className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100 transition-colors"
                    >
                        Thuộc chuỗi
                    </Link>
                ) : undefined}
                registrationBadge={registrationStatus ? (
                    <div className="mb-4">
                        <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${getRegistrationColor(registrationStatus)}`}>
                            {getRegistrationLabel(registrationStatus)}
                        </span>
                    </div>
                ) : undefined}
                footer={
                    <>
                        <Link to={`/student/events/${event.id}`} className={btnPrimary}>
                            Chi tiết
                        </Link>
                        {canRegister && (
                            <button type="button" onClick={() => handleRegister(event.id)} className={btnAccent}>
                                Đăng ký
                            </button>
                        )}
                        {!canRegister && alreadyCancelled && !isRegistered && (
                            <span className="flex-1 text-center py-2.5 text-xs text-gray-500">
                                Đã hủy — không đăng ký lại
                            </span>
                        )}
                        {canCancel && (
                            <button type="button" onClick={() => handleCancelRegistration(event.id)} className={btnDanger}>
                                Hủy đăng ký
                            </button>
                        )}
                        {isRegistered && eventStatus === 'ONGOING' && event.type !== ActivityType.MINIGAME && (
                            <Link to={`/student/events/${event.id}`} className={btnAccent}>
                                Ghi nhận tham gia
                            </Link>
                        )}
                    </>
                }
            />
        );
    };

    const statusOptions = [
        { value: 'ALL', label: 'Tất cả' },
        { value: 'ONGOING', label: 'Đang diễn ra' },
        { value: 'UPCOMING', label: 'Sắp diễn ra' },
        { value: 'ENDED', label: 'Đã kết thúc' },
    ];

    return (
        <StudentLayout>
            <div className="max-w-7xl mx-auto space-y-8 pb-12">
                <header className="rounded-2xl bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 p-6 sm:p-8 text-white shadow-premium">
                    <p className="text-sm font-medium text-white/60 uppercase tracking-wide">Hoạt động</p>
                    <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">Danh sách sự kiện</h1>
                    <p className="mt-2 text-white/70 max-w-prose leading-relaxed">
                        Khám phá, đăng ký và tích lũy điểm qua các hoạt động trong trường.
                    </p>
                </header>

                <EventListFilters
                    showSearch
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    typeFilter={typeFilter}
                    onTypeFilterChange={setTypeFilter}
                    scoreTypeFilter={scoreTypeFilter}
                    onScoreTypeFilterChange={setScoreTypeFilter}
                    statusFilter={statusFilter}
                    onStatusFilterChange={(v) => setStatusFilter(v as typeof statusFilter)}
                    statusOptions={statusOptions}
                />

                {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-pulse">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-96 rounded-2xl bg-gray-200" />
                        ))}
                    </div>
                )}

                {error && !loading && (
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-10 text-center">
                        <p className="text-red-800 font-medium">{error}</p>
                        <button type="button" onClick={loadEvents} className={`${btnPrimary} inline-flex mt-4 px-6`}>
                            Thử lại
                        </button>
                    </div>
                )}

                {!loading && !error && filteredEvents.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-gray-200 py-20 text-center">
                        <p className="text-gray-600 text-lg">Không tìm thấy sự kiện phù hợp.</p>
                        <p className="text-sm text-gray-400 mt-2">Thử đổi bộ lọc hoặc tìm kiếm khác.</p>
                    </div>
                )}

                {!loading && !error && filteredEvents.length > 0 && (
                    <div className="space-y-10">
                        {ongoing.length > 0 && (statusFilter === 'ALL' || statusFilter === 'ONGOING') && (
                            <EventListSection title="Đang diễn ra" count={ongoing.length} accent="green">
                                {ongoing.map(renderEventCard)}
                            </EventListSection>
                        )}
                        {upcoming.length > 0 && (statusFilter === 'ALL' || statusFilter === 'UPCOMING') && (
                            <EventListSection title="Sắp diễn ra" count={upcoming.length} accent="blue">
                                {upcoming.map(renderEventCard)}
                            </EventListSection>
                        )}
                        {ended.length > 0 && (statusFilter === 'ALL' || statusFilter === 'ENDED') && (
                            <EventListSection title="Đã kết thúc" count={ended.length} accent="gray">
                                {ended.map(renderEventCard)}
                            </EventListSection>
                        )}
                        {statusFilter !== 'ALL' && ongoing.length === 0 && upcoming.length === 0 && ended.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center">
                                <p className="text-gray-600">Không có sự kiện trong nhóm này.</p>
                                <button type="button" onClick={() => setStatusFilter('ALL')} className={`${btnPrimary} inline-flex mt-4 px-6`}>
                                    Xem tất cả
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};

export default StudentEvents;
