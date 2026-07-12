import React, { useEffect, useMemo, useState } from 'react';
import QrScanner from 'react-qr-barcode-scanner';
import { toast } from 'react-toastify';
import ManagerRegistrationTabs from '../components/registration/ManagerRegistrationTabs';
import { eventAPI } from '../services/eventAPI';
import { registrationAPI } from '../services/registrationAPI';
import { ActivityResponse } from '../types/activity';
import {
    ActivityRegistrationResponse,
    RegistrationStatus,
    TicketCodeValidateResponse,
    getParticipationTypeLabel,
} from '../types/registration';
import { 
    WarningCircle,
    CheckCircle,
    X,
    Ticket,
    User,
    CalendarBlank,
    Info,
    SignIn,
    SignOut,
    XCircle,
    ClipboardText,
    MapPin,
    ListChecks,
    QrCode,
    MagnifyingGlass,
} from '@phosphor-icons/react';

type EventTab = 'upcoming' | 'ongoing' | 'past';

type PaginationProps = {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    compact?: boolean;
};

const TAB_ORDER: EventTab[] = ['upcoming', 'ongoing', 'past'];

const TAB_LABELS: Record<EventTab, string> = {
    upcoming: 'Chưa diễn ra',
    ongoing: 'Đang diễn ra',
    past: 'Đã diễn ra',
};

const TAB_BADGE_STYLES: Record<EventTab, string> = {
    upcoming: 'bg-accent text-primary-900',
    ongoing: 'bg-emerald-500 text-white',
    past: 'bg-gray-400 text-white',
};

const EVENTS_PER_PAGE = 5;

const getEventTab = (event: ActivityResponse, now: Date): EventTab => {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    if (startDate > now) return 'upcoming';
    if (endDate < now) return 'past';
    return 'ongoing';
};

const formatEventDate = (date: string) =>
    new Date(date).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

const formatCheckInWindow = (date?: string | null) => {
    if (!date) return 'Chưa có';
    return new Date(date).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const PaginationControls: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    compact = false,
}) => {
    if (totalPages <= 1) return null;

    const buttonClass = compact
        ? 'px-3 py-1.5 text-xs'
        : 'px-4 py-2 text-sm';

    return (
        <div className="flex items-center justify-between gap-3 pt-4">
            <button
                type="button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`${buttonClass} rounded-xl border border-gray-200 text-gray-700 transition-all hover:border-primary-900 hover:text-primary-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/20`}
            >
                Trang trước
            </button>
            <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>
                Trang {currentPage}/{totalPages}
            </span>
            <button
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`${buttonClass} rounded-xl border border-gray-200 text-gray-700 transition-all hover:border-primary-900 hover:text-primary-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/20`}
            >
                Trang sau
            </button>
        </div>
    );
};

const ManagerRegistrationsSplit: React.FC = () => {
    const [events, setEvents] = useState<ActivityResponse[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
    const [registrations, setRegistrations] = useState<ActivityRegistrationResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [ticketCode, setTicketCode] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [validatedInfo, setValidatedInfo] = useState<TicketCodeValidateResponse | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [eventTab, setEventTab] = useState<EventTab>('upcoming');
    const [eventPage, setEventPage] = useState(1);

    const now = useMemo(() => new Date(), [events]);

    const categorizedEvents = useMemo<Record<EventTab, ActivityResponse[]>>(
        () => ({
            upcoming: events.filter((event) => getEventTab(event, now) === 'upcoming'),
            ongoing: events.filter((event) => getEventTab(event, now) === 'ongoing'),
            past: events.filter((event) => getEventTab(event, now) === 'past'),
        }),
        [events, now]
    );

    const eventsInTab = categorizedEvents[eventTab];
    const totalEventPages = Math.max(1, Math.ceil(eventsInTab.length / EVENTS_PER_PAGE));
    const paginatedEvents = eventsInTab.slice((eventPage - 1) * EVENTS_PER_PAGE, eventPage * EVENTS_PER_PAGE);
    const selectedEvent = events.find((event) => event.id === selectedEventId) ?? null;

    useEffect(() => {
        void loadEvents();
    }, []);

    useEffect(() => {
        if (selectedEventId) {
            void loadRegistrations(selectedEventId);
            return;
        }

        setRegistrations([]);
    }, [selectedEventId]);

    useEffect(() => {
        setEventPage(1);
    }, [eventTab]);

    useEffect(() => {
        if (eventPage > totalEventPages) {
            setEventPage(totalEventPages);
        }
    }, [eventPage, totalEventPages]);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const response = await eventAPI.getEvents();

            if (!response.status || !response.data) {
                setEvents([]);
                setSelectedEventId(null);
                return;
            }

            const nextEvents = response.data;
            const currentTime = new Date();
            const firstAvailableTab = TAB_ORDER.find((tab) =>
                nextEvents.some((event) => getEventTab(event, currentTime) === tab)
            ) ?? 'upcoming';
            const firstEventInTab = nextEvents.find((event) => getEventTab(event, currentTime) === firstAvailableTab) ?? null;

            setEvents(nextEvents);
            setEventTab(firstAvailableTab);
            setSelectedEventId(firstEventInTab?.id ?? null);
        } catch (error) {
            console.error('Error loading events:', error);
            setEvents([]);
            setSelectedEventId(null);
        } finally {
            setLoading(false);
        }
    };

    const loadRegistrations = async (eventId: number) => {
        try {
            const registrationsData = await registrationAPI.getActivityRegistrations(eventId);
            setRegistrations(registrationsData);
        } catch (error) {
            console.error('Error loading registrations:', error);
            setRegistrations([]);
        }
    };

    const handleTabChange = (tab: EventTab) => {
        setEventTab(tab);
        setEventPage(1);

        const nextEvents = categorizedEvents[tab];
        if (nextEvents.length === 0) {
            setSelectedEventId(null);
            return;
        }

        if (!nextEvents.some((event) => event.id === selectedEventId)) {
            setSelectedEventId(nextEvents[0].id);
        }
    };

    const handleValidateTicketCode = async (code: string) => {
        if (!code.trim()) {
            toast.error('Vui lòng nhập ticket code');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Không tìm thấy token. Vui lòng đăng nhập lại.');
                return;
            }

            setIsValidating(true);
            const response = await registrationAPI.validateTicketCode(code.trim());

            if (response.status && response.body) {
                setValidatedInfo(response.body);
                setShowConfirmDialog(false);
                return;
            }

            setValidatedInfo(null);
            toast.error(response.message || 'Mã vé không hợp lệ');
        } catch (error: any) {
            console.error('Error validating ticket code:', error);

            if (error.response?.status === 403) {
                toast.error('Không có quyền thực hiện thao tác này. Vui lòng kiểm tra quyền MANAGER.');
            } else if (error.response?.status === 401) {
                toast.error('Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
            } else {
                toast.error(error.response?.data?.message || error.message || 'Có lỗi xảy ra khi kiểm tra mã vé');
            }

            setValidatedInfo(null);
        } finally {
            setIsValidating(false);
        }
    };

    const handleConfirmCheckIn = async () => {
        if (!validatedInfo) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Không tìm thấy token. Vui lòng đăng nhập lại.');
                return;
            }

            if (!validatedInfo.canCheckIn && !validatedInfo.canCheckOut) {
                toast.error('Hiện không thể check-in cho vé này.');
                return;
            }

            const response = await registrationAPI.checkIn({
                ticketCode: validatedInfo.ticketCode,
                studentId: validatedInfo.studentId,
                participationType: null,
            });

            if (!response.status) {
                toast.error(response.message || 'Thao tác thất bại');
                return;
            }

            const participationType = response.body?.participationType;
            if (participationType === 'CHECKED_IN') {
                toast.success(`Check-in thành công cho sinh viên ${validatedInfo.studentName} (${validatedInfo.studentCode}).`);
            } else if (participationType === 'ATTENDED') {
                toast.success(`Check-out thành công cho sinh viên ${validatedInfo.studentName} (${validatedInfo.studentCode}).`);
            } else {
                toast.success(response.message || 'Thành công');
            }

            if (selectedEventId) {
                await loadRegistrations(selectedEventId);
            }

            setTicketCode('');
            setValidatedInfo(null);
            setShowConfirmDialog(false);
        } catch (error: any) {
            console.error('Error check-in:', error);

            if (error.response?.status === 403) {
                toast.error('Không có quyền thực hiện thao tác này. Vui lòng kiểm tra quyền MANAGER.');
            } else if (error.response?.status === 401) {
                toast.error('Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
            } else {
                toast.error(error.response?.data?.message || error.message || 'Có lỗi xảy ra khi check-in');
            }
        }
    };

    const handleScan = async (result: any) => {
        if (!result?.text) return;

        const scannedCode = result.text;
        setTicketCode(scannedCode);
        setShowScanner(false);
        await handleValidateTicketCode(scannedCode);
    };

    const handleUpdateStatus = async (registrationId: number, status: string) => {
        try {
            const response = await registrationAPI.updateRegistrationStatus(registrationId, status as RegistrationStatus);

            if (!response.status) {
                toast.error(response.message || 'Cập nhật trạng thái thất bại');
                return false;
            }

            toast.success('Cập nhật trạng thái thành công!');
            if (selectedEventId) {
                await loadRegistrations(selectedEventId);
            }
            return true;
        } catch (error: any) {
            console.error('Error updating status:', error);

            if (error.response?.status === 403) {
                toast.error('Không có quyền thực hiện thao tác này. Vui lòng kiểm tra quyền MANAGER.');
            } else {
                toast.error(error.response?.data?.message || error.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
            }
            return false;
        }
    };

    const handleBulkUpdateStatus = async (registrationIds: number[], status: string) => {
        const results = await Promise.all(
            registrationIds.map(async (registrationId) => {
                try {
                    const response = await registrationAPI.updateRegistrationStatus(registrationId, status as RegistrationStatus);
                    return response.status;
                } catch (error) {
                    console.error('Error updating status:', error);
                    return false;
                }
            })
        );

        if (selectedEventId) {
            await loadRegistrations(selectedEventId);
        }

        return {
            successCount: results.filter(Boolean).length,
            failedCount: results.filter((result) => !result).length,
        };
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-[1600px] space-y-6 animate-pulse">
                <div className="h-28 rounded-2xl bg-gray-200/80" />
                <div className="grid grid-cols-1 xl:grid-cols-[400px_minmax(0,1fr)] gap-6">
                    <div className="h-[560px] rounded-2xl bg-gray-200/80" />
                    <div className="space-y-6">
                        <div className="h-36 rounded-2xl bg-gray-200/80" />
                        <div className="h-48 rounded-2xl bg-gray-200/80" />
                        <div className="h-72 rounded-2xl bg-gray-200/80" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[1600px] space-y-6">
            <header className="relative overflow-hidden rounded-2xl border border-primary-900/10 bg-primary-900 px-6 py-7 sm:px-8 text-white shadow-premium">
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.12]"
                    style={{
                        backgroundImage:
                            'radial-gradient(ellipse at 0% 0%, #FFD66D 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, #4b88b6 0%, transparent 50%)',
                    }}
                />
                <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent/90">
                            Quản lý sự kiện
                        </p>
                        <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
                            Quản lý đăng ký
                        </h1>
                        <p className="mt-2 text-sm text-primary-100/90 max-w-xl leading-relaxed">
                            Duyệt đăng ký, check-in sinh viên và xuất danh sách tham gia theo từng sự kiện.
                        </p>
                    </div>
                    {selectedEvent && (
                        <div className="shrink-0 rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm border border-white/10">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-100/80">Đang chọn</p>
                            <p className="mt-0.5 text-sm font-semibold line-clamp-2 max-w-xs">{selectedEvent.name}</p>
                            <p className="mt-1 text-xs text-accent tabular-nums">{registrations.length} đăng ký</p>
                        </div>
                    )}
                </div>
            </header>

            <div className="w-full max-w-none">
                <div className="grid grid-cols-1 xl:grid-cols-[400px_minmax(0,1fr)] 2xl:grid-cols-[420px_minmax(0,1fr)] gap-6 items-start">
                    <aside className="xl:sticky xl:top-6">
                        <div className="rounded-2xl border border-gray-100 bg-white shadow-premium overflow-hidden">
                            <div className="border-b border-gray-100 px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-900">
                                        <ClipboardText size={22} weight="duotone" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-semibold tracking-tight text-primary-900">Chọn sự kiện</h2>
                                        <p className="text-xs text-gray-500 mt-0.5">Theo trạng thái thời gian</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="grid grid-cols-3 gap-2 mb-5">
                                    {TAB_ORDER.map((tab) => (
                                        <button
                                            key={tab}
                                            type="button"
                                            onClick={() => handleTabChange(tab)}
                                            className={`rounded-xl border px-2 py-2.5 text-xs font-semibold transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/25 ${
                                                eventTab === tab
                                                    ? 'border-primary-900 bg-primary-900 text-white shadow-sm'
                                                    : 'border-gray-200 text-gray-600 hover:border-primary-900/30 hover:text-primary-900'
                                            }`}
                                        >
                                            <div className="leading-tight">{TAB_LABELS[tab]}</div>
                                            <div
                                                className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${
                                                    eventTab === tab ? 'bg-white/20 text-white' : TAB_BADGE_STYLES[tab]
                                                }`}
                                            >
                                                {categorizedEvents[tab].length}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-2.5 max-h-[58vh] overflow-y-auto pr-1">
                                    {eventsInTab.length === 0 ? (
                                        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-10 text-center">
                                            <p className="text-sm text-gray-500">Không có sự kiện trong mục này</p>
                                        </div>
                                    ) : (
                                        paginatedEvents.map((event) => {
                                            const currentTab = getEventTab(event, now);
                                            const isSelected = selectedEventId === event.id;

                                            return (
                                                <button
                                                    key={event.id}
                                                    type="button"
                                                    onClick={() => setSelectedEventId(event.id)}
                                                    className={`w-full p-4 text-left rounded-xl border transition-all active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/25 ${
                                                        isSelected
                                                            ? 'border-primary-900 bg-primary-900 text-white shadow-premium'
                                                            : 'border-gray-100 bg-white hover:border-primary-900/20 hover:shadow-sm'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <h3
                                                            className={`font-semibold text-sm leading-snug line-clamp-2 ${
                                                                isSelected ? 'text-white' : 'text-primary-900'
                                                            }`}
                                                        >
                                                            {event.name}
                                                        </h3>
                                                        <span
                                                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${TAB_BADGE_STYLES[currentTab]}`}
                                                        >
                                                            {TAB_LABELS[currentTab]}
                                                        </span>
                                                    </div>

                                                    <div
                                                        className={`space-y-1.5 text-xs ${
                                                            isSelected ? 'text-primary-100' : 'text-gray-500'
                                                        }`}
                                                    >
                                                        <p className="flex items-center gap-2">
                                                            <CalendarBlank size={14} weight={isSelected ? 'fill' : 'regular'} className="shrink-0 opacity-80" />
                                                            <span className="tabular-nums">{formatEventDate(event.startDate)}</span>
                                                        </p>
                                                        <p className="flex items-start gap-2">
                                                            <MapPin size={14} weight={isSelected ? 'fill' : 'regular'} className="shrink-0 mt-0.5 opacity-80" />
                                                            <span className="line-clamp-2">{event.location || 'Chưa cập nhật'}</span>
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                                <PaginationControls
                                    currentPage={eventPage}
                                    totalPages={totalEventPages}
                                    onPageChange={setEventPage}
                                    compact
                                />
                            </div>
                        </div>
                    </aside>

                    <section className="space-y-6 min-w-0">
                        {selectedEvent ? (
                            <>
                                <div className="rounded-2xl border border-gray-100 bg-white shadow-premium overflow-hidden">
                                    <div className="border-b border-gray-100 bg-primary-900 px-5 py-4 text-white">
                                        <div className="flex items-center gap-2">
                                            <Info size={20} weight="duotone" className="text-accent" />
                                            <h2 className="text-base font-semibold tracking-tight">Thông tin sự kiện</h2>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="rounded-xl bg-gray-50/80 border border-gray-100 p-4">
                                                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Tên sự kiện</span>
                                                <p className="mt-1.5 text-sm font-semibold text-primary-900 leading-snug">{selectedEvent.name}</p>
                                            </div>
                                            <div className="rounded-xl bg-gray-50/80 border border-gray-100 p-4">
                                                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Thời gian</span>
                                                <p className="mt-1.5 text-sm font-semibold text-primary-900 tabular-nums">{formatEventDate(selectedEvent.startDate)}</p>
                                            </div>
                                            <div className="rounded-xl bg-gray-50/80 border border-gray-100 p-4">
                                                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Địa điểm</span>
                                                <p className="mt-1.5 text-sm font-semibold text-primary-900 leading-snug">{selectedEvent.location || 'Chưa cập nhật'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-gray-100 bg-white shadow-premium overflow-hidden">
                                    <div className="border-b border-gray-100 px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <QrCode size={20} weight="duotone" className="text-primary-900" />
                                            <h3 className="text-base font-semibold tracking-tight text-primary-900">Check-in sinh viên</h3>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <div className="flex flex-col md:flex-row gap-3">
                                            <div className="relative flex-1">
                                                <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Nhập mã vé hoặc quét QR"
                                                    value={ticketCode}
                                                    onChange={(e) => {
                                                        setTicketCode(e.target.value);
                                                        setValidatedInfo(null);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && ticketCode.trim()) {
                                                            void handleValidateTicketCode(ticketCode);
                                                        }
                                                    }}
                                                    className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-900/15 transition-all"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => void handleValidateTicketCode(ticketCode)}
                                                disabled={isValidating || !ticketCode.trim()}
                                                className="rounded-xl bg-primary-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-800 active:scale-[0.98] disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900"
                                            >
                                                {isValidating ? 'Đang kiểm tra...' : 'Kiểm tra mã vé'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const nextShowScanner = !showScanner;
                                                    setShowScanner(nextShowScanner);

                                                    if (!nextShowScanner) {
                                                        setTicketCode('');
                                                        setValidatedInfo(null);
                                                    }
                                                }}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-primary-900 transition-all hover:bg-accent-hover active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                                            >
                                                <QrCode size={18} weight="bold" />
                                                {showScanner ? 'Đóng camera' : 'Quét QR'}
                                            </button>
                                        </div>

                                        {showScanner && (
                                            <div className="mt-4 w-full max-w-xl">
                                                <QrScanner
                                                    onUpdate={(_err: any, result: any) => {
                                                        void handleScan(result);
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {validatedInfo && !showConfirmDialog && (
                                            <div className="mt-8 bg-white shadow-premium rounded-3xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                {/* Header */}
                                                <div className="bg-gradient-to-r from-[#001C44] via-[#002A66] to-[#001C44] px-8 py-5">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-[#FFD66D] shadow-inner">
                                                                <Ticket size={28} weight="duotone" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-extrabold text-white text-xl tracking-wide">Thông tin mã vé</h4>
                                                                <p className="text-sm text-blue-200 mt-1 font-medium">Chi tiết đăng ký sự kiện</p>
                                                            </div>
                                                        </div>
                                                        <div className="px-4 py-2 bg-[#FFD66D] rounded-xl shadow-sm border border-[#FFC947]">
                                                            <span className="text-sm font-extrabold text-[#001C44] font-mono tracking-wider">{validatedInfo.ticketCode}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="p-8">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                                        {/* Student Info */}
                                                        <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 shadow-inner-light hover:shadow-md transition-shadow">
                                                            <div className="flex items-center gap-2 mb-4 text-[#001C44]">
                                                                <User size={20} weight="fill" />
                                                                <h5 className="font-bold text-gray-900">Thông tin sinh viên</h5>
                                                            </div>
                                                            <div className="space-y-3 pl-7 border-l-2 border-indigo-100 ml-2">
                                                                <div>
                                                                    <span className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">Mã sinh viên</span>
                                                                    <p className="text-sm font-bold text-gray-900 mt-0.5">{validatedInfo.studentCode}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">Tên sinh viên</span>
                                                                    <p className="text-sm font-bold text-gray-900 mt-0.5">{validatedInfo.studentName}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Event Info */}
                                                        <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 shadow-inner-light hover:shadow-md transition-shadow">
                                                            <div className="flex items-center gap-2 mb-4 text-[#001C44]">
                                                                <CalendarBlank size={20} weight="fill" />
                                                                <h5 className="font-bold text-gray-900">Thông tin sự kiện</h5>
                                                            </div>
                                                            <div className="pl-7 border-l-2 border-emerald-100 ml-2">
                                                                <span className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">Tên sự kiện</span>
                                                                <p className="text-sm font-bold text-gray-900 mt-0.5 line-clamp-2 leading-relaxed">{validatedInfo.activityName}</p>
                                                            </div>
                                                        </div>

                                                        {/* Status Info */}
                                                        <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 shadow-inner-light hover:shadow-md transition-shadow">
                                                            <div className="flex items-center gap-2 mb-4 text-[#001C44]">
                                                                <Info size={20} weight="fill" />
                                                                <h5 className="font-bold text-gray-900">Trạng thái</h5>
                                                            </div>
                                                            <div className="pl-7 border-l-2 border-amber-100 ml-2">
                                                                <span className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">Trạng thái hiện tại</span>
                                                                <p className="text-sm font-extrabold text-[#001C44] mt-1 bg-white inline-block px-3 py-1 rounded-lg border border-gray-200">
                                                                    {getParticipationTypeLabel(validatedInfo.currentStatus)}
                                                                </p>
                                                                <div className="mt-3 space-y-2 text-xs text-gray-600">
                                                                    <p>Mở check-in: {formatCheckInWindow(validatedInfo.checkInOpenAt)}</p>
                                                                    <p>Đóng check-in: {formatCheckInWindow(validatedInfo.checkInClosedAt)}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Actions Available */}
                                                        <div className="bg-[#001C44]/5 p-5 rounded-2xl border border-[#001C44]/10 shadow-inner-light hover:shadow-md transition-shadow">
                                                            <div className="flex items-center gap-2 mb-4 text-[#001C44]">
                                                                <CheckCircle size={20} weight="fill" />
                                                                <h5 className="font-bold text-[#001C44]">Thao tác có thể thực hiện</h5>
                                                            </div>
                                                            <div className="flex flex-wrap gap-3 pl-7">
                                                                {validatedInfo.canCheckIn && (
                                                                    <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-sm">
                                                                        <SignIn size={16} weight="bold" />
                                                                        Điểm danh (Check-in)
                                                                    </span>
                                                                )}
                                                                {validatedInfo.canCheckOut && (
                                                                    <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-extrabold shadow-sm">
                                                                        <SignOut size={16} weight="bold" />
                                                                        Ra về (Check-out)
                                                                    </span>
                                                                )}
                                                                {!validatedInfo.canCheckIn && !validatedInfo.canCheckOut && (
                                                                    <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-200 text-gray-600 rounded-xl text-xs font-bold">
                                                                        <XCircle size={16} weight="bold" />
                                                                        Không có thao tác khả dụng
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex gap-4 pt-6 border-t border-gray-100">
                                                        <button
                                                            onClick={() => setShowConfirmDialog(true)}
                                                            disabled={!validatedInfo.canCheckIn && !validatedInfo.canCheckOut}
                                                            className="flex-[2] px-8 py-4 bg-[#001C44] text-white rounded-2xl hover:bg-blue-900 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed font-extrabold shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
                                                        >
                                                            <CheckCircle size={20} weight="bold" />
                                                            Xác nhận điểm danh
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setValidatedInfo(null);
                                                                setTicketCode("");
                                                                setShowConfirmDialog(false);
                                                            }}
                                                            className="flex-1 px-8 py-4 bg-gray-50 text-gray-600 border border-gray-200 rounded-2xl hover:bg-gray-100 hover:text-gray-900 font-extrabold transition-all duration-300 text-sm uppercase tracking-wider flex items-center justify-center gap-2"
                                                        >
                                                            <X size={20} weight="bold" />
                                                            Hủy bỏ
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-gray-100 bg-white shadow-premium overflow-hidden">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <ListChecks size={20} weight="duotone" className="text-primary-900" />
                                            <h3 className="text-base font-semibold tracking-tight text-primary-900">Danh sách đăng ký</h3>
                                        </div>
                                        <span className="inline-flex items-center rounded-full bg-accent/90 px-3 py-1 text-xs font-semibold text-primary-900 tabular-nums">
                                            {registrations.length} đăng ký
                                        </span>
                                    </div>
                                    <div className="p-5">
                                        <ManagerRegistrationTabs
                                            registrations={registrations}
                                            activityId={selectedEventId}
                                            eventName={selectedEvent?.name}
                                            onUpdateStatus={handleUpdateStatus}
                                            onBulkUpdateStatus={handleBulkUpdateStatus}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-8 py-16 text-center">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-900">
                                    <ClipboardText size={28} weight="duotone" />
                                </div>
                                <h3 className="text-base font-semibold text-gray-800">Chưa chọn sự kiện</h3>
                                <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                                    Chọn một sự kiện ở cột bên trái để duyệt đăng ký, check-in và xuất danh sách tham gia.
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            </div>

            {showConfirmDialog && validatedInfo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-premium relative animate-in fade-in zoom-in duration-300">
                        {/* Close button */}
                        <button 
                            onClick={() => setShowConfirmDialog(false)}
                            className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 p-2 rounded-full"
                        >
                            <X size={20} weight="bold" />
                        </button>

                        {/* Icon & Title */}
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="w-16 h-16 bg-primary-50 text-primary-900 rounded-2xl flex items-center justify-center mb-4">
                                <WarningCircle size={32} weight="duotone" />
                            </div>
                            <h3 className="text-xl font-bold text-primary-900 tracking-tight">Xác nhận thao tác</h3>
                            <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                                Bạn có chắc muốn thực hiện <strong className="text-primary-900">check-in / check-out</strong> cho sinh viên này?
                            </p>
                        </div>
                        
                        {/* Details Card */}
                        <div className="bg-gray-50/80 border border-gray-100 p-5 rounded-2xl mb-8 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                    <User size={18} weight="fill" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">Sinh viên</p>
                                    <p className="text-sm font-bold text-gray-900 mt-0.5">{validatedInfo.studentName}</p>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5">{validatedInfo.studentCode}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-3 pt-3 border-t border-gray-200/60">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                    <CalendarBlank size={18} weight="fill" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">Sự kiện</p>
                                    <p className="text-sm font-bold text-gray-900 mt-0.5 line-clamp-2">{validatedInfo.activityName}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-3 pt-3 border-t border-gray-200/60">
                                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                    <Ticket size={18} weight="fill" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">Mã vé</p>
                                    <p className="text-sm font-bold text-[#001C44] mt-0.5 font-mono bg-white px-2 py-0.5 rounded border border-gray-200 inline-block">
                                        {validatedInfo.ticketCode}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmDialog(false)}
                                className="flex-1 px-5 py-3.5 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 font-bold transition-all"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleConfirmCheckIn}
                                disabled={!validatedInfo.canCheckIn && !validatedInfo.canCheckOut}
                                className="flex-[2] flex items-center justify-center gap-2 px-5 py-3.5 bg-primary-900 text-white rounded-2xl hover:bg-primary-800 font-semibold shadow-premium transition-all active:scale-[0.98] disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900"
                            >
                                <CheckCircle size={20} weight="bold" />
                                Xác nhận ngay
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerRegistrationsSplit;
