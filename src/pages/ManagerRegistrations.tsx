import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ActivityRegistrationResponse, RegistrationStatus } from '../types/registration';
import { registrationAPI } from '../services/registrationAPI';
import { eventAPI } from '../services/eventAPI';
import { ActivityResponse } from '../types/activity';
import { RegistrationList } from '../components/registration';
import QrScanner from "react-qr-barcode-scanner";
import ApproveScoresForm from "../components/registration/ApproveScoresForm";


const ManagerRegistrations: React.FC = () => {
    const [events, setEvents] = useState<ActivityResponse[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
    const [registrations, setRegistrations] = useState<ActivityRegistrationResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<RegistrationStatus | 'ALL'>('ALL');
    const [ticketCode, setTicketCode] = useState("");
    const [studentId, setStudentId] = useState("");
    const [showScanner, setShowScanner] = useState(false);
    const [showApproveForm, setShowApproveForm] = useState(false);
    useEffect(() => {
        loadEvents();
    }, []);

    useEffect(() => {
        if (selectedEventId) {
            loadRegistrations(selectedEventId);
        }
    }, [selectedEventId]);

    const handleCheckIn = async () => {
        try {
            if (!ticketCode && !studentId) {
                alert("Vui lòng nhập ticketCode hoặc studentId");
                return;
            }
            const payload: any = { participationType: "CHECKED_IN" };
            if (ticketCode) payload.ticketCode = ticketCode;
            if (studentId) payload.studentId = Number(studentId);

            const response = await registrationAPI.checkIn(payload);
            if (response.status) {
                alert("Check-in thành công!");
                if (selectedEventId) await loadRegistrations(selectedEventId);
                setTicketCode("");
                setStudentId("");
            } else {
                alert(response.message || "Check-in thất bại");
            }
        } catch (error) {
            console.error("Error check-in:", error);
            alert("Có lỗi xảy ra khi check-in");
        }
    };

    const handleScan = async (result: any) => {
        if (result?.text) {
            const scannedCode = result.text;
            setTicketCode(scannedCode);
            setShowScanner(false);

            try {
                const payload: any = { participationType: "CHECKED_IN", ticketCode: scannedCode };
                const response = await registrationAPI.checkIn(payload);
                if (response.status) {
                    alert(`✅ Check-in thành công cho ticketCode: ${scannedCode}`);
                    if (selectedEventId) await loadRegistrations(selectedEventId);
                    setTicketCode("");
                } else {
                    alert(response.message || "❌ Check-in thất bại");
                }
            } catch (error) {
                console.error("Error check-in:", error);
                alert("Có lỗi xảy ra khi check-in bằng QR");
            }
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
            await registrationAPI.updateRegistrationStatus(registrationId, status as RegistrationStatus);
            if (selectedEventId) await loadRegistrations(selectedEventId);
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Có lỗi xảy ra khi cập nhật trạng thái');
        }
    };

    const filteredRegistrations = registrations.filter(reg =>
        statusFilter === 'ALL' || reg.status === statusFilter
    );

    const selectedEvent = events.find(e => e.id === selectedEventId);

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
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Quản lý đăng ký sự kiện</h1>
                            <p className="text-gray-600 mt-1">Duyệt và quản lý đăng ký sự kiện</p>
                        </div>
                        <Link to="/dashboard" className="px-4 py-2 text-gray-600 hover:text-gray-900">
                            ← Quay lại Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* Event Selection */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Chọn sự kiện</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {events.map((event) => (
                                <button
                                    key={event.id}
                                    onClick={() => setSelectedEventId(event.id)}
                                    className={`p-4 text-left border rounded-lg transition-all ${selectedEventId === event.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <h3 className="font-medium text-gray-900">{event.name}</h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {new Date(event.startDate).toLocaleDateString('vi-VN')} - {new Date(event.endDate).toLocaleDateString('vi-VN')}
                                    </p>
                                    <p className="text-sm text-gray-500">{event.location}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Selected Event Info */}
                {selectedEvent && (
                    <div className="bg-white rounded-lg shadow mb-6">
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin sự kiện đã chọn</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="font-medium text-gray-500">Tên sự kiện:</span>
                                    <p className="text-gray-900">{selectedEvent.name}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-500">Ngày bắt đầu:</span>
                                    <p className="text-gray-900">
                                        {new Date(selectedEvent.startDate).toLocaleDateString('vi-VN')}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-500">Địa điểm:</span>
                                    <p className="text-gray-900">{selectedEvent.location}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Check-in Box */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Check-in sinh viên
                        </h3>
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            <input
                                type="text"
                                placeholder="Nhập ticketCode"
                                value={ticketCode}
                                onChange={(e) => setTicketCode(e.target.value)}
                                className="px-3 py-2 border rounded-md w-full md:w-1/3"
                            />
                            <button
                                onClick={handleCheckIn}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Check-in
                            </button>
                            <button
                                onClick={() => setShowScanner(!showScanner)}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                                {showScanner ? "Đóng QR" : "Quét QR"}
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
                    </div>
                </div>

                {/* Registrations List */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Danh sách đăng ký ({filteredRegistrations.length})
                        </h3>
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
