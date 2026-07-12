import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CaretLeft, CaretRight, MapPin, Ticket, WarningCircle } from '@phosphor-icons/react';
import StudentLayout from '../components/layout/StudentLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { registrationAPI } from '../services/registrationAPI';
import type { PersonalCalendarEventItem, PersonalCalendarResponse } from '../types/registration';
import { EventTimeStatus } from '../types/registration';
import { getImageUrl } from '../utils/imageUtils';

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const pad2 = (n: number) => String(n).padStart(2, '0');

const toYmd = (date: Date) =>
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

const addMonths = (date: Date, delta: number) =>
    new Date(date.getFullYear(), date.getMonth() + delta, 1);

const formatMonthLabel = (date: Date) =>
    date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

const formatTimeRange = (start: string, end: string | null) => {
    const startDate = new Date(start);
    const startLabel = startDate.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
    });
    if (!end) return startLabel;
    const endDate = new Date(end);
    const endLabel = endDate.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
    });
    return `${startLabel} - ${endLabel}`;
};

const statusLabel = (status: EventTimeStatus) => {
    switch (status) {
        case EventTimeStatus.UPCOMING:
            return 'Sắp diễn ra';
        case EventTimeStatus.ONGOING:
            return 'Đang diễn ra';
        case EventTimeStatus.PAST:
            return 'Đã kết thúc';
        default:
            return status;
    }
};

const statusClass = (status: EventTimeStatus) => {
    switch (status) {
        case EventTimeStatus.UPCOMING:
            return 'bg-sky-50 text-sky-800 border-sky-100';
        case EventTimeStatus.ONGOING:
            return 'bg-emerald-50 text-emerald-800 border-emerald-100';
        case EventTimeStatus.PAST:
            return 'bg-gray-50 text-gray-600 border-gray-100';
        default:
            return 'bg-gray-50 text-gray-600 border-gray-100';
    }
};

const StudentPersonalCalendar: React.FC = () => {
    const today = useMemo(() => toYmd(new Date()), []);
    const [month, setMonth] = useState(() => startOfMonth(new Date()));
    const [selectedDate, setSelectedDate] = useState<string>(today);
    const [calendar, setCalendar] = useState<PersonalCalendarResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const from = toYmd(startOfMonth(month));
    const to = toYmd(endOfMonth(month));

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await registrationAPI.getPersonalCalendar({
                    from,
                    to,
                    date: selectedDate,
                });
                if (cancelled) return;
                if (response.status && response.body) {
                    setCalendar(response.body);
                } else {
                    setCalendar(null);
                    setError(response.message || 'Không tải được lịch cá nhân');
                }
            } catch (err: any) {
                if (cancelled) return;
                setCalendar(null);
                setError(err?.response?.data?.message || 'Không tải được lịch cá nhân');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void load();
        return () => {
            cancelled = true;
        };
    }, [from, to, selectedDate]);

    const markers = useMemo(() => {
        const map = new Map<string, number>();
        (calendar?.markedDates || []).forEach((d) => map.set(d.date, d.eventCount));
        return map;
    }, [calendar]);

    const dayEvents: PersonalCalendarEventItem[] = calendar?.events || [];

    const calendarCells = useMemo(() => {
        const first = startOfMonth(month);
        const last = endOfMonth(month);
        const startPad = first.getDay(); // 0 = Sunday
        const daysInMonth = last.getDate();
        const cells: Array<{ date: string | null; day: number | null }> = [];

        for (let i = 0; i < startPad; i++) {
            cells.push({ date: null, day: null });
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const date = `${first.getFullYear()}-${pad2(first.getMonth() + 1)}-${pad2(day)}`;
            cells.push({ date, day });
        }
        while (cells.length % 7 !== 0) {
            cells.push({ date: null, day: null });
        }
        return cells;
    }, [month]);

    return (
        <StudentLayout>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#001C44]">
                        Lịch của tôi
                    </h1>
                    <p className="mt-2 text-gray-500 font-medium max-w-2xl">
                        Các sự kiện bạn đã được duyệt hoặc đã tham gia. Chọn ngày để xem chi tiết.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
                    <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-6">
                        <div className="flex items-center justify-between mb-5">
                            <button
                                type="button"
                                onClick={() => {
                                    const next = addMonths(month, -1);
                                    setMonth(next);
                                    const nextFrom = toYmd(startOfMonth(next));
                                    const nextTo = toYmd(endOfMonth(next));
                                    if (selectedDate < nextFrom || selectedDate > nextTo) {
                                        setSelectedDate(nextFrom);
                                    }
                                }}
                                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 text-[#001C44] hover:bg-gray-100 active:scale-95 transition-all"
                                aria-label="Tháng trước"
                            >
                                <CaretLeft weight="bold" size={18} />
                            </button>
                            <h2 className="text-lg font-extrabold text-[#001C44] capitalize">
                                {formatMonthLabel(month)}
                            </h2>
                            <button
                                type="button"
                                onClick={() => {
                                    const next = addMonths(month, 1);
                                    setMonth(next);
                                    const nextFrom = toYmd(startOfMonth(next));
                                    const nextTo = toYmd(endOfMonth(next));
                                    if (selectedDate < nextFrom || selectedDate > nextTo) {
                                        setSelectedDate(nextFrom);
                                    }
                                }}
                                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 text-[#001C44] hover:bg-gray-100 active:scale-95 transition-all"
                                aria-label="Tháng sau"
                            >
                                <CaretRight weight="bold" size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {WEEKDAYS.map((label) => (
                                <div
                                    key={label}
                                    className="text-center text-[11px] font-bold tracking-wide text-gray-400 py-2"
                                >
                                    {label}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {calendarCells.map((cell, idx) => {
                                if (!cell.date || cell.day == null) {
                                    return <div key={`empty-${idx}`} className="aspect-square" />;
                                }
                                const count = markers.get(cell.date) || 0;
                                const isSelected = cell.date === selectedDate;
                                const isToday = cell.date === today;

                                return (
                                    <button
                                        key={cell.date}
                                        type="button"
                                        onClick={() => setSelectedDate(cell.date!)}
                                        className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                                            isSelected
                                                ? 'bg-[#001C44] text-white shadow-md'
                                                : isToday
                                                    ? 'bg-[#FFD66D]/40 text-[#001C44] font-bold'
                                                    : 'hover:bg-gray-50 text-gray-700'
                                        }`}
                                    >
                                        <span className="text-sm font-bold tabular-nums">{cell.day}</span>
                                        {count > 0 && (
                                            <span
                                                className={`flex items-center gap-0.5 ${
                                                    isSelected ? 'text-[#FFD66D]' : 'text-[#0B5FFF]'
                                                }`}
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                                {count > 1 && (
                                                    <span className="text-[9px] font-bold tabular-nums">
                                                        {count}
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-6 min-h-[420px]">
                        <div className="flex items-start justify-between gap-3 mb-5">
                            <div>
                                <h2 className="text-lg font-extrabold text-[#001C44]">
                                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('vi-VN', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1 font-medium">
                                    {dayEvents.length} sự kiện trong ngày
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setMonth(startOfMonth(new Date()));
                                    setSelectedDate(today);
                                }}
                                className="text-xs font-bold text-[#001C44] px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                Hôm nay
                            </button>
                        </div>

                        {loading ? (
                            <div className="min-h-[240px] flex items-center justify-center">
                                <LoadingSpinner />
                            </div>
                        ) : error ? (
                            <div className="rounded-2xl bg-red-50 border border-red-100 p-5 text-red-700 flex gap-3">
                                <WarningCircle size={22} weight="fill" className="shrink-0 mt-0.5" />
                                <div>
                                    <div className="font-bold">Không tải được lịch</div>
                                    <p className="text-sm mt-1">{error}</p>
                                </div>
                            </div>
                        ) : dayEvents.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-16 text-center">
                                <h3 className="text-base font-semibold text-gray-800">Không có sự kiện</h3>
                                <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
                                    Ngày này chưa có hoạt động đã duyệt. Chọn ngày có chấm xanh trên lịch.
                                </p>
                                <Link
                                    to="/student/events"
                                    className="mt-6 inline-flex px-5 py-3 rounded-xl bg-[#001C44] text-[#FFD66D] text-sm font-bold hover:bg-blue-900 transition-colors"
                                >
                                    Khám phá sự kiện
                                </Link>
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {dayEvents.map((event) => {
                                    const href = `/student/events/${event.activityId}`;
                                    const banner = getImageUrl(event.bannerUrl || undefined);

                                    return (
                                        <li key={event.registrationId}>
                                            <Link
                                                to={href}
                                                className="group flex gap-3 rounded-2xl border border-gray-100 p-3 hover:border-[#001C44]/20 hover:bg-blue-50/30 transition-all"
                                            >
                                                <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                                                    {banner ? (
                                                        <img
                                                            src={banner}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-[#001C44]/10 to-[#FFD66D]/20" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h3 className="font-bold text-[#001C44] group-hover:text-blue-700 line-clamp-2 leading-snug">
                                                            {event.title}
                                                            {event.important && (
                                                                <span className="ml-2 inline-flex align-middle text-[10px] uppercase tracking-wide font-extrabold text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">
                                                                    Quan trọng
                                                                </span>
                                                            )}
                                                        </h3>
                                                        <span
                                                            className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg border ${statusClass(
                                                                event.eventTimeStatus
                                                            )}`}
                                                        >
                                                            {statusLabel(event.eventTimeStatus)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1.5 font-medium">
                                                        {formatTimeRange(event.startTime, event.endTime)}
                                                    </p>
                                                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                                                        {event.location && (
                                                            <span className="inline-flex items-center gap-1">
                                                                <MapPin size={12} weight="bold" />
                                                                {event.location}
                                                            </span>
                                                        )}
                                                        {event.ticketCode && (
                                                            <span className="inline-flex items-center gap-1 font-mono">
                                                                <Ticket size={12} weight="bold" />
                                                                {event.ticketCode}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>
                </div>
            </div>
        </StudentLayout>
    );
};

export default StudentPersonalCalendar;
