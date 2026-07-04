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
    getRegistrationStatusLabel,
    getParticipationTypeLabel,
} from '../types/registration';

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
    upcoming: 'bg-[#FFD66D] text-[#001C44]',
    ongoing: 'bg-green-500 text-white',
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
                className={`${buttonClass} rounded-lg border border-gray-300 text-gray-700 hover:border-[#001C44] hover:text-[#001C44] disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
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
                className={`${buttonClass} rounded-lg border border-gray-300 text-gray-700 hover:border-[#001C44] hover:text-[#001C44] disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
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
    const primaryCheckInActionLabel = validatedInfo?.canCheckIn
        ? 'Xác nhận Check-in'
        : validatedInfo?.canCheckOut
            ? 'Xác nhận Check-out'
            : 'Không thể check-in';

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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="w-full max-w-none">
                <div className="grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] 2xl:grid-cols-[460px_minmax(0,1fr)] gap-6 items-start">
                    <aside className="xl:sticky xl:top-6">
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                            <div className="p-6">
                                <h2 className="text-2xl font-bold text-[#001C44] mb-6 flex items-center">
                                    <span className="mr-3 text-3xl">📋</span>
                                    Chọn sự kiện
                                </h2>

                                <div className="grid grid-cols-3 gap-2 mb-6">
                                    {TAB_ORDER.map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => handleTabChange(tab)}
                                            className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-all ${
                                                eventTab === tab
                                                    ? 'border-[#001C44] bg-[#001C44] text-white shadow-md'
                                                    : 'border-gray-200 text-gray-600 hover:border-[#001C44] hover:text-[#001C44]'
                                            }`}
                                        >
                                            <div>{TAB_LABELS[tab]}</div>
                                            <div
                                                className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
                                                    eventTab === tab ? 'bg-white/20 text-white' : TAB_BADGE_STYLES[tab]
                                                }`}
                                            >
                                                {categorizedEvents[tab].length}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                                    {eventsInTab.length === 0 ? (
                                        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-gray-500">
                                            <p className="text-sm">Không có sự kiện nào trong mục này</p>
                                        </div>
                                    ) : (
                                        paginatedEvents.map((event) => {
                                            const currentTab = getEventTab(event, now);

                                            return (
                                                <button
                                                    key={event.id}
                                                    onClick={() => setSelectedEventId(event.id)}
                                                    className={`w-full p-4 text-left border-2 rounded-xl transition-all ${
                                                        selectedEventId === event.id
                                                            ? 'border-[#001C44] bg-gradient-to-br from-[#001C44] to-[#002A66] text-white shadow-xl'
                                                            : 'border-gray-200 hover:border-[#001C44] hover:shadow-md bg-white'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-3 mb-3">
                                                        <h3
                                                            className={`font-bold text-base leading-6 ${
                                                                selectedEventId === event.id ? 'text-white' : 'text-[#001C44]'
                                                            }`}
                                                        >
                                                            {event.name}
                                                        </h3>
                                                        <span
                                                            className={`shrink-0 px-2 py-1 rounded-full text-[11px] font-semibold ${TAB_BADGE_STYLES[currentTab]}`}
                                                        >
                                                            {TAB_LABELS[currentTab]}
                                                        </span>
                                                    </div>

                                                    <div
                                                        className={`space-y-2 text-sm ${
                                                            selectedEventId === event.id ? 'text-gray-100' : 'text-gray-600'
                                                        }`}
                                                    >
                                                        <p className="flex items-center">
                                                            <span className="mr-2">📅</span>
                                                            {formatEventDate(event.startDate)}
                                                        </p>
                                                        <p className="flex items-center">
                                                            <span className="mr-2">📍</span>
                                                            <span className="line-clamp-2">{event.location}</span>
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
                                <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-xl shadow-lg text-white overflow-hidden">
                                    <div className="p-6">
                                        <h2 className="text-2xl font-bold mb-4 flex items-center">
                                            <span className="mr-3 text-3xl">ℹ️</span>
                                            Thông tin sự kiện đã chọn
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                                <span className="text-sm font-medium text-gray-200 block mb-2">Tên sự kiện</span>
                                                <p className="text-lg font-semibold">{selectedEvent.name}</p>
                                            </div>
                                            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                                <span className="text-sm font-medium text-gray-200 block mb-2">Thời gian</span>
                                                <p className="text-lg font-semibold">{formatEventDate(selectedEvent.startDate)}</p>
                                            </div>
                                            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                                <span className="text-sm font-medium text-gray-200 block mb-2">Địa điểm</span>
                                                <p className="text-lg font-semibold">{selectedEvent.location}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg shadow-lg border border-gray-100">
                                    <div className="p-6">
                                        <h3 className="text-xl font-semibold text-[#001C44] mb-4 flex items-center">
                                            <span className="mr-2">✅</span>
                                            Check-in sinh viên
                                        </h3>

                                        <div className="flex flex-col md:flex-row gap-4 items-center">
                                            <input
                                                type="text"
                                                placeholder="Nhập ticket code hoặc quét QR"
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
                                                className="px-4 py-2.5 border-2 border-gray-300 rounded-lg w-full md:flex-1 focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-all"
                                            />
                                            <button
                                                onClick={() => void handleValidateTicketCode(ticketCode)}
                                                disabled={isValidating || !ticketCode.trim()}
                                                className="w-full md:w-auto px-5 py-2.5 bg-[#001C44] text-white rounded-lg hover:bg-[#002A66] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md font-medium"
                                            >
                                                {isValidating ? 'Đang kiểm tra...' : 'Kiểm tra mã vé'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const nextShowScanner = !showScanner;
                                                    setShowScanner(nextShowScanner);

                                                    if (!nextShowScanner) {
                                                        setTicketCode('');
                                                        setValidatedInfo(null);
                                                    }
                                                }}
                                                className="w-full md:w-auto px-5 py-2.5 bg-[#FFD66D] text-[#001C44] rounded-lg hover:bg-[#FFC947] transition-all shadow-sm hover:shadow-md font-medium"
                                            >
                                                {showScanner ? 'Đóng camera' : '📷 Quét QR'}
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
                                            <div className="mt-6 bg-white shadow-xl rounded-xl border-2 border-[#001C44] overflow-hidden">
                                                <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] px-6 py-4">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex items-center">
                                                            <div className="w-10 h-10 bg-[#FFD66D] rounded-lg flex items-center justify-center mr-3">
                                                                <span className="text-2xl">🎫</span>
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-white text-xl">Thông tin mã vé</h4>
                                                                <p className="text-sm text-gray-200 mt-0.5">Chi tiết đăng ký sự kiện</p>
                                                            </div>
                                                        </div>
                                                        <div className="px-3 py-1 bg-[#FFD66D] rounded-full">
                                                            <span className="text-xs font-semibold text-[#001C44] font-mono">
                                                                {validatedInfo.ticketCode}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                            <h5 className="font-semibold text-gray-900 mb-3">Thông tin sinh viên</h5>
                                                            <div className="space-y-2">
                                                                <div>
                                                                    <span className="text-xs font-medium text-gray-600">Mã sinh viên:</span>
                                                                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                                                                        {validatedInfo.studentCode}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-xs font-medium text-gray-600">Tên sinh viên:</span>
                                                                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                                                                        {validatedInfo.studentName}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                            <h5 className="font-semibold text-gray-900 mb-3">Thông tin sự kiện</h5>
                                                            <span className="text-xs font-medium text-gray-600">Tên sự kiện:</span>
                                                            <p className="text-sm font-semibold text-gray-900 mt-0.5 line-clamp-2">
                                                                {validatedInfo.activityName}
                                                            </p>
                                                        </div>

                                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                            <h5 className="font-semibold text-gray-900 mb-3">Trạng thái</h5>
                                                            <span className="text-xs font-medium text-gray-600">Trạng thái hiện tại:</span>
                                                            <p className="text-sm font-semibold text-gray-900 mt-0.5">
                                                                {getParticipationTypeLabel(validatedInfo.currentStatus)}
                                                            </p>
                                                            <div className="mt-3 space-y-2 text-xs text-gray-600">
                                                                <p>Mở check-in: {formatCheckInWindow(validatedInfo.checkInOpenAt)}</p>
                                                                <p>Đóng check-in: {formatCheckInWindow(validatedInfo.checkInClosedAt)}</p>
                                                            </div>
                                                        </div>

                                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                            <h5 className="font-semibold text-gray-900 mb-3">Thao tác có thể</h5>
                                                            <div className="flex flex-wrap gap-2">
                                                                {validatedInfo.canCheckIn && (
                                                                    <span className="inline-flex items-center px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold">
                                                                        Check-in
                                                                    </span>
                                                                )}
                                                                {validatedInfo.canCheckOut && (
                                                                    <span className="inline-flex items-center px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-semibold">
                                                                        Check-out
                                                                    </span>
                                                                )}
                                                                {!validatedInfo.canCheckIn && !validatedInfo.canCheckOut && (
                                                                    <span className="inline-flex items-center px-3 py-1.5 bg-gray-400 text-white rounded-lg text-xs font-semibold">
                                                                        Không thể thao tác
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                                                        <button
                                                            onClick={() => setShowConfirmDialog(true)}
                                                            disabled={!validatedInfo.canCheckIn && !validatedInfo.canCheckOut}
                                                            className="flex-1 px-6 py-3 bg-gradient-to-r from-[#001C44] to-[#002A66] text-white rounded-lg hover:from-[#002A66] hover:to-[#001C44] disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                                                        >
                                                            {primaryCheckInActionLabel}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setValidatedInfo(null);
                                                                setTicketCode('');
                                                                setShowConfirmDialog(false);
                                                            }}
                                                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-all duration-200"
                                                        >
                                                            Hủy
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                                    <div className="p-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                            <h3 className="text-2xl font-bold text-[#001C44] flex items-center">
                                                <span className="mr-3 text-3xl">📝</span>
                                                Danh sách đăng ký
                                            </h3>
                                            <span className="px-4 py-2 bg-[#FFD66D] text-[#001C44] rounded-lg font-semibold">
                                                {registrations.length} đăng ký
                                            </span>
                                        </div>

                                        <ManagerRegistrationTabs
                                            registrations={registrations}
                                            eventName={selectedEvent?.name}
                                            onUpdateStatus={handleUpdateStatus}
                                            onBulkUpdateStatus={handleBulkUpdateStatus}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-10 text-center text-gray-500">
                                Chọn một sự kiện ở cột bên trái để xem và quản lý đăng ký.
                            </div>
                        )}
                    </section>
                </div>
            </div>

            {showConfirmDialog && validatedInfo && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">{primaryCheckInActionLabel}</h3>
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">Bạn có chắc chắn muốn thực hiện thao tác này?</p>
                            <div className="bg-gray-50 p-3 rounded space-y-1">
                                <p className="text-sm">
                                    <span className="font-medium">Sinh viên:</span> {validatedInfo.studentName} ({validatedInfo.studentCode})
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium">Sự kiện:</span> {validatedInfo.activityName}
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium">Mã vé:</span> <span className="font-mono">{validatedInfo.ticketCode}</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowConfirmDialog(false)}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => void handleConfirmCheckIn()}
                                disabled={!validatedInfo.canCheckIn && !validatedInfo.canCheckOut}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {validatedInfo.canCheckIn ? 'Check-in' : validatedInfo.canCheckOut ? 'Check-out' : 'Không thể thao tác'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerRegistrationsSplit;
