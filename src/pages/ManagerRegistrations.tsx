import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ActivityRegistrationResponse, RegistrationStatus, TicketCodeValidateResponse, getRegistrationStatusLabel } from '../types/registration';
import { registrationAPI } from '../services/registrationAPI';
import { eventAPI } from '../services/eventAPI';
import { ActivityResponse } from '../types/activity';
import { RegistrationList } from '../components/registration';
import QrScanner from "react-qr-barcode-scanner";
import ApproveScoresForm from "../components/registration/ApproveScoresForm";


type EventTab = 'upcoming' | 'ongoing' | 'past';

const ManagerRegistrations: React.FC = () => {
    const [events, setEvents] = useState<ActivityResponse[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
    const [registrations, setRegistrations] = useState<ActivityRegistrationResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<RegistrationStatus | 'ALL'>('ALL');
    const [ticketCode, setTicketCode] = useState("");
    const [showScanner, setShowScanner] = useState(false);
    const [showApproveForm, setShowApproveForm] = useState(false);
    const [validatedInfo, setValidatedInfo] = useState<TicketCodeValidateResponse | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [eventTab, setEventTab] = useState<EventTab>('upcoming');

    useEffect(() => {
        loadEvents();
    }, []);

    useEffect(() => {
        if (selectedEventId) {
            loadRegistrations(selectedEventId);
        }
    }, [selectedEventId]);

    const handleValidateTicketCode = async (code: string) => {
        if (!code || code.trim() === '') {
            alert("Vui lòng nhập ticketCode");
            return;
        }

        try {
            // Check if token exists
            const token = localStorage.getItem('token');
            if (!token) {
                alert('❌ Lỗi: Không tìm thấy token. Vui lòng đăng nhập lại.');
                return;
            }

            setIsValidating(true);
            const response = await registrationAPI.validateTicketCode(code.trim());
            if (response.status && response.body) {
                setValidatedInfo(response.body);
                setShowConfirmDialog(false); // Don't show dialog immediately, show info first
            } else {
                alert(response.message || "Mã vé không hợp lệ");
                setValidatedInfo(null);
            }
        } catch (error: any) {
            console.error("Error validating ticket code:", error);
            console.error("Error response:", error.response);
            
            if (error.response?.status === 403) {
                alert('❌ Lỗi 403: Không có quyền thực hiện thao tác này.\nVui lòng kiểm tra:\n- Bạn đã đăng nhập với tài khoản MANAGER chưa?\n- Token có hợp lệ không?');
            } else if (error.response?.status === 401) {
                alert('❌ Lỗi 401: Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
            } else {
                const errorMessage = error.response?.data?.message || error.message || "Có lỗi xảy ra khi kiểm tra mã vé";
                alert(`❌ Lỗi: ${errorMessage}`);
            }
            setValidatedInfo(null);
        } finally {
            setIsValidating(false);
        }
    };

    const handleConfirmCheckIn = async () => {
        if (!validatedInfo) return;

        try {
            // Check if token exists
            const token = localStorage.getItem('token');
            if (!token) {
                alert('❌ Lỗi: Không tìm thấy token. Vui lòng đăng nhập lại.');
                return;
            }

            const response = await registrationAPI.checkIn({
                ticketCode: validatedInfo.ticketCode
            });

            if (response.status) {
                const data = response.body;
                let message = "";
                if (data?.participationType === 'CHECKED_IN') {
                    message = `✅ Check-in thành công cho sinh viên ${validatedInfo.studentName} (${validatedInfo.studentCode}).\nVui lòng check-out khi sinh viên rời khỏi sự kiện.`;
                } else if (data?.participationType === 'ATTENDED') {
                    message = `✅ Check-out thành công cho sinh viên ${validatedInfo.studentName} (${validatedInfo.studentCode}).\nĐã hoàn thành tham gia sự kiện.`;
                } else {
                    message = `✅ ${response.message || "Thành công"}`;
                }
                alert(message);
                
                if (selectedEventId) await loadRegistrations(selectedEventId);
                setTicketCode("");
                setValidatedInfo(null);
                setShowConfirmDialog(false);
            } else {
                alert(response.message || "Thao tác thất bại");
            }
        } catch (error: any) {
            console.error("Error check-in:", error);
            console.error("Error response:", error.response);
            
            if (error.response?.status === 403) {
                alert('❌ Lỗi 403: Không có quyền thực hiện thao tác này.\nVui lòng kiểm tra:\n- Bạn đã đăng nhập với tài khoản MANAGER chưa?\n- Token có hợp lệ không?\n- Bạn có quyền check-in cho sự kiện này không?');
            } else if (error.response?.status === 401) {
                alert('❌ Lỗi 401: Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
            } else {
                const errorMessage = error.response?.data?.message || error.message || "Có lỗi xảy ra khi check-in";
                alert(`❌ Lỗi: ${errorMessage}`);
            }
        }
    };

    const handleCheckIn = async () => {
        await handleValidateTicketCode(ticketCode);
    };

    const handleScan = async (result: any) => {
        if (result?.text) {
            const scannedCode = result.text;
            setTicketCode(scannedCode);
            setShowScanner(false);
            await handleValidateTicketCode(scannedCode);
        }
    };


    const loadEvents = async () => {
        try {
            setLoading(true);
            const response = await eventAPI.getEvents();
            if (response.status && response.data) {
                setEvents(response.data);
                if (response.data.length > 0) setSelectedEventId(response.data[0].id);
            }
        } catch (error) {
            console.error('Error loading events:', error);
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
        }
    };

    const handleUpdateStatus = async (registrationId: number, status: string) => {
        try {
            const response = await registrationAPI.updateRegistrationStatus(registrationId, status as RegistrationStatus);
            if (response.status) {
                alert('Cập nhật trạng thái thành công!');
                if (selectedEventId) await loadRegistrations(selectedEventId);
            } else {
                alert(response.message || 'Cập nhật trạng thái thất bại');
            }
        } catch (error: any) {
            console.error('Error updating status:', error);
            if (error.response?.status === 403) {
                alert('Không có quyền thực hiện thao tác này. Vui lòng kiểm tra quyền MANAGER.');
            } else {
                alert('Có lỗi xảy ra khi cập nhật trạng thái: ' + (error.response?.data?.message || error.message));
            }
        }
    };

    const filteredRegistrations = registrations.filter(reg =>
        statusFilter === 'ALL' || reg.status === statusFilter
    );

    const selectedEvent = events.find(e => e.id === selectedEventId);

    // Phân loại events theo thời gian
    const now = new Date();
    const categorizedEvents = {
        upcoming: events.filter(event => new Date(event.startDate) > now),
        ongoing: events.filter(event => 
            new Date(event.startDate) <= now && new Date(event.endDate) >= now
        ),
        past: events.filter(event => new Date(event.endDate) < now)
    };

    const getEventStatus = (event: ActivityResponse): EventTab => {
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);
        if (startDate > now) return 'upcoming';
        if (endDate < now) return 'past';
        return 'ongoing';
    };

    const getEventsByTab = (): ActivityResponse[] => {
        return categorizedEvents[eventTab];
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
            <div className="max-w-7xl mx-auto">

                {/* Event Selection with Tabs */}
                <div className="bg-white rounded-xl shadow-lg mb-6 border border-gray-100 overflow-hidden">
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-[#001C44] mb-6 flex items-center">
                            <span className="mr-3 text-3xl">📋</span>
                            Chọn sự kiện
                        </h2>
                        
                        {/* Tabs */}
                        <div className="flex space-x-2 mb-6 border-b border-gray-200">
                            <button
                                onClick={() => {
                                    setEventTab('upcoming');
                                    const upcomingEvents = categorizedEvents.upcoming;
                                    if (upcomingEvents.length > 0 && !upcomingEvents.find(e => e.id === selectedEventId)) {
                                        setSelectedEventId(upcomingEvents[0].id);
                                    }
                                }}
                                className={`px-6 py-3 font-semibold transition-all relative ${
                                    eventTab === 'upcoming'
                                        ? 'text-[#001C44] border-b-2 border-[#001C44]'
                                        : 'text-gray-600 hover:text-[#001C44]'
                                }`}
                            >
                                Chưa diễn ra
                                <span className="ml-2 px-2 py-0.5 bg-[#FFD66D] text-[#001C44] rounded-full text-xs font-bold">
                                    {categorizedEvents.upcoming.length}
                                </span>
                            </button>
                            <button
                                onClick={() => {
                                    setEventTab('ongoing');
                                    const ongoingEvents = categorizedEvents.ongoing;
                                    if (ongoingEvents.length > 0 && !ongoingEvents.find(e => e.id === selectedEventId)) {
                                        setSelectedEventId(ongoingEvents[0].id);
                                    }
                                }}
                                className={`px-6 py-3 font-semibold transition-all relative ${
                                    eventTab === 'ongoing'
                                        ? 'text-[#001C44] border-b-2 border-[#001C44]'
                                        : 'text-gray-600 hover:text-[#001C44]'
                                }`}
                            >
                                Đang diễn ra
                                <span className="ml-2 px-2 py-0.5 bg-green-500 text-white rounded-full text-xs font-bold">
                                    {categorizedEvents.ongoing.length}
                                </span>
                            </button>
                            <button
                                onClick={() => {
                                    setEventTab('past');
                                    const pastEvents = categorizedEvents.past;
                                    if (pastEvents.length > 0 && !pastEvents.find(e => e.id === selectedEventId)) {
                                        setSelectedEventId(pastEvents[0].id);
                                    }
                                }}
                                className={`px-6 py-3 font-semibold transition-all relative ${
                                    eventTab === 'past'
                                        ? 'text-[#001C44] border-b-2 border-[#001C44]'
                                        : 'text-gray-600 hover:text-[#001C44]'
                                }`}
                            >
                                Đã diễn ra
                                <span className="ml-2 px-2 py-0.5 bg-gray-400 text-white rounded-full text-xs font-bold">
                                    {categorizedEvents.past.length}
                                </span>
                            </button>
                        </div>

                        {/* Events Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {getEventsByTab().length === 0 ? (
                                <div className="col-span-full text-center py-8 text-gray-500">
                                    <p className="text-lg">Không có sự kiện nào trong danh mục này</p>
                                </div>
                            ) : (
                                getEventsByTab().map((event) => {
                                    const eventStatus = getEventStatus(event);
                                    const statusBadge = {
                                        upcoming: { text: 'Chưa diễn ra', color: 'bg-[#FFD66D] text-[#001C44]' },
                                        ongoing: { text: 'Đang diễn ra', color: 'bg-green-500 text-white' },
                                        past: { text: 'Đã diễn ra', color: 'bg-gray-400 text-white' }
                                    }[eventStatus];

                                    return (
                                        <button
                                            key={event.id}
                                            onClick={() => setSelectedEventId(event.id)}
                                            className={`p-5 text-left border-2 rounded-xl transition-all transform hover:scale-[1.02] ${
                                                selectedEventId === event.id
                                                    ? 'border-[#001C44] bg-gradient-to-br from-[#001C44] to-[#002A66] text-white shadow-xl'
                                                    : 'border-gray-200 hover:border-[#001C44] hover:shadow-md bg-white'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <h3 className={`font-bold text-lg flex-1 ${selectedEventId === event.id ? 'text-white' : 'text-[#001C44]'}`}>
                                                    {event.name}
                                                </h3>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ml-2 ${statusBadge.color}`}>
                                                    {statusBadge.text}
                                                </span>
                                            </div>
                                            <div className={`space-y-2 text-sm ${selectedEventId === event.id ? 'text-gray-100' : 'text-gray-600'}`}>
                                                <p className="flex items-center">
                                                    <span className="mr-2">📅</span>
                                                    {new Date(event.startDate).toLocaleDateString('vi-VN', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                                <p className="flex items-center">
                                                    <span className="mr-2">📍</span>
                                                    <span className="line-clamp-1">{event.location}</span>
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Selected Event Info */}
                {selectedEvent && (
                    <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-xl shadow-lg mb-6 text-white overflow-hidden">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-4 flex items-center">
                                <span className="mr-3 text-3xl">ℹ️</span>
                                Thông tin sự kiện đã chọn
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
                                    <span className="text-sm font-medium text-gray-200 block mb-2">Tên sự kiện</span>
                                    <p className="text-lg font-semibold">{selectedEvent.name}</p>
                                </div>
                                <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
                                    <span className="text-sm font-medium text-gray-200 block mb-2">Thời gian</span>
                                    <p className="text-lg font-semibold">
                                        {new Date(selectedEvent.startDate).toLocaleDateString('vi-VN', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                                <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
                                    <span className="text-sm font-medium text-gray-200 block mb-2">Địa điểm</span>
                                    <p className="text-lg font-semibold">{selectedEvent.location}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Check-in Box */}
                <div className="bg-white rounded-lg shadow-lg mb-6 border border-gray-100">
                    <div className="p-6">
                        <h3 className="text-xl font-semibold text-[#001C44] mb-4 flex items-center">
                            <span className="mr-2">✅</span>
                            Check-in sinh viên
                        </h3>

                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            <input
                                type="text"
                                placeholder="Nhập ticketCode hoặc quét QR"
                                value={ticketCode}
                                onChange={(e) => {
                                    setTicketCode(e.target.value);
                                    setValidatedInfo(null);
                                }}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && ticketCode.trim()) {
                                        handleValidateTicketCode(ticketCode);
                                    }
                                }}
                                className="px-4 py-2.5 border-2 border-gray-300 rounded-lg w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-all"
                            />
                            <button
                                onClick={handleCheckIn}
                                disabled={isValidating || !ticketCode.trim()}
                                className="px-5 py-2.5 bg-[#001C44] text-white rounded-lg hover:bg-[#002A66] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md font-medium"
                            >
                                {isValidating ? "Đang kiểm tra..." : "Kiểm tra mã vé"}
                            </button>
                            <button
                                onClick={() => {
                                    setShowScanner(!showScanner);
                                    if (showScanner) {
                                        setTicketCode("");
                                        setValidatedInfo(null);
                                    }
                                }}
                                className="px-5 py-2.5 bg-[#FFD66D] text-[#001C44] rounded-lg hover:bg-[#FFC947] transition-all shadow-sm hover:shadow-md font-medium"
                            >
                                {showScanner ? "Đóng Camera" : "📷 Quét QR"}
                            </button>
                        </div>

                        {showScanner && (
                            <div className="mt-4 w-full md:w-1/2">
                                <QrScanner
                                    onUpdate={(err: any, result?: any) => {
                                        if (result) handleScan(result);
                                    }}
                                />
                            </div>
                        )}

                        {validatedInfo && !showConfirmDialog && (
                            <div className="mt-6 bg-white shadow-xl rounded-xl border-2 border-[#001C44] overflow-hidden">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] px-6 py-4">
                                    <div className="flex items-center justify-between">
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
                                            <span className="text-xs font-semibold text-[#001C44] font-mono">{validatedInfo.ticketCode}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        {/* Student Info */}
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <div className="flex items-center mb-3">
                                                <h5 className="font-semibold text-gray-900">Thông tin sinh viên</h5>
                                            </div>
                                            <div className="space-y-2">
                                                <div>
                                                    <span className="text-xs font-medium text-gray-600">Mã sinh viên:</span>
                                                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{validatedInfo.studentCode}</p>
                                                </div>
                                                <div>
                                                    <span className="text-xs font-medium text-gray-600">Tên sinh viên:</span>
                                                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{validatedInfo.studentName}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Event Info */}
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <div className="flex items-center mb-3">
                                                <h5 className="font-semibold text-gray-900">Thông tin sự kiện</h5>
                                            </div>
                                            <div>
                                                <span className="text-xs font-medium text-gray-600">Tên sự kiện:</span>
                                                <p className="text-sm font-semibold text-gray-900 mt-0.5 line-clamp-2">{validatedInfo.activityName}</p>
                                            </div>
                                        </div>

                                        {/* Status Info */}
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <div className="flex items-center mb-3">
                                                <h5 className="font-semibold text-gray-900">Trạng thái</h5>
                                            </div>
                                            <div>
                                                <span className="text-xs font-medium text-gray-600">Trạng thái hiện tại:</span>
                                                <p className="text-sm font-semibold text-gray-900 mt-0.5">{getRegistrationStatusLabel(validatedInfo.currentStatus)}</p>
                                            </div>
                                        </div>

                                        {/* Actions Available */}
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <div className="flex items-center mb-3">
                                                <h5 className="font-semibold text-gray-900">Thao tác có thể</h5>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {validatedInfo.canCheckIn && (
                                                    <span className="inline-flex items-center px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold">
                                                        <span className="mr-1">✓</span>
                                                        Check-in
                                                    </span>
                                                )}
                                                {validatedInfo.canCheckOut && (
                                                    <span className="inline-flex items-center px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-semibold">
                                                        <span className="mr-1">✓</span>
                                                        Check-out
                                                    </span>
                                                )}
                                                {!validatedInfo.canCheckIn && !validatedInfo.canCheckOut && (
                                                    <span className="inline-flex items-center px-3 py-1.5 bg-gray-400 text-white rounded-lg text-xs font-semibold">
                                                        <span className="mr-1">✗</span>
                                                        Không thể thao tác
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                                        <button
                                            onClick={() => setShowConfirmDialog(true)}
                                            disabled={!validatedInfo.canCheckIn && !validatedInfo.canCheckOut}
                                            className="flex-1 px-6 py-3 bg-gradient-to-r from-[#001C44] to-[#002A66] text-white rounded-lg hover:from-[#002A66] hover:to-[#001C44] disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                                        >
                                            <span className="mr-2">✓</span>
                                            Xác nhận Check-in/Check-out
                                        </button>
                                        <button
                                            onClick={() => {
                                                setValidatedInfo(null);
                                                setTicketCode("");
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

                        {showConfirmDialog && validatedInfo && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Xác nhận Check-in/Check-out</h3>
                                    <div className="mb-4">
                                        <p className="text-sm text-gray-600 mb-2">Bạn có chắc chắn muốn thực hiện thao tác này?</p>
                                        <div className="bg-gray-50 p-3 rounded">
                                            <p className="text-sm"><span className="font-medium">Sinh viên:</span> {validatedInfo.studentName} ({validatedInfo.studentCode})</p>
                                            <p className="text-sm"><span className="font-medium">Sự kiện:</span> {validatedInfo.activityName}</p>
                                            <p className="text-sm"><span className="font-medium">Mã vé:</span> <span className="font-mono">{validatedInfo.ticketCode}</span></p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={() => {
                                                setShowConfirmDialog(false);
                                            }}
                                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            onClick={handleConfirmCheckIn}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                        >
                                            Xác nhận
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Registrations List */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-[#001C44] flex items-center">
                                <span className="mr-3 text-3xl">📝</span>
                                Danh sách đăng ký
                            </h3>
                            <div className="flex items-center space-x-4">
                                <span className="px-4 py-2 bg-[#FFD66D] text-[#001C44] rounded-lg font-semibold">
                                    {filteredRegistrations.length} đăng ký
                                </span>
                            </div>
                        </div>
                        <RegistrationList
                            registrations={filteredRegistrations}
                            onUpdateStatus={handleUpdateStatus}
                            showActions={true}
                            isAdmin={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerRegistrations;
