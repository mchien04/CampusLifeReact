import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ActivityRegistrationResponse, RegistrationStatus } from '../types/registration';
import { registrationAPI } from '../services/registrationAPI';
import { eventAPI } from '../services/eventAPI';
import { ActivityResponse } from '../types/activity';
import { RegistrationList } from '../components/registration';
import QrScanner from "react-qr-barcode-scanner";
import ApproveScoresForm from "../components/registration/ApproveScoresForm";
import jsQR from 'jsqr';


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
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [isScanningImage, setIsScanningImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

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
            // Backend determines next state, but we still need to send participationType
            const payload: any = {
                participationType: "CHECKED_IN"  // Keep this, backend uses it
            };
            if (ticketCode) payload.ticketCode = ticketCode;
            if (studentId) payload.studentId = Number(studentId);

            const response = await registrationAPI.checkIn(payload);
            if (response.status) {
                // Check response participationType to show appropriate message
                const data = response.body;
                if (data?.participationType === 'CHECKED_IN') {
                    alert("✅ Check-in thành công. Vui lòng check-out khi sinh viên rời khỏi sự kiện.");
                } else if (data?.participationType === 'ATTENDED') {
                    alert("✅ Check-out thành công. Đã hoàn thành tham gia sự kiện.");
                } else {
                    alert("✅ " + (response.message || "Thành công"));
                }
                if (selectedEventId) await loadRegistrations(selectedEventId);
                setTicketCode("");
                setStudentId("");
            } else {
                alert(response.message || "Thao tác thất bại");
            }
        } catch (error) {
            console.error("Error check-in:", error);
            alert("Có lỗi xảy ra");
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
                    // Check response participationType to show appropriate message
                    const data = response.body;
                    if (data?.participationType === 'CHECKED_IN') {
                        alert(`✅ Check-in thành công cho ticketCode: ${scannedCode}.\nVui lòng check-out khi sinh viên rời khỏi sự kiện.`);
                    } else if (data?.participationType === 'ATTENDED') {
                        alert(`✅ Check-out thành công cho ticketCode: ${scannedCode}.\nĐã hoàn thành tham gia sự kiện.`);
                    } else {
                        alert(`✅ ${response.message || "Thành công"}`);
                    }
                    if (selectedEventId) await loadRegistrations(selectedEventId);
                    setTicketCode("");
                } else {
                    alert(response.message || "❌ Thao tác thất bại");
                }
            } catch (error) {
                console.error("Error check-in:", error);
                alert("Có lỗi xảy ra khi check-in bằng QR");
            }
        }
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Vui lòng chọn file ảnh hợp lệ');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target?.result as string;
            setUploadedImage(imageUrl);
            setIsScanningImage(true);
            scanQRFromImage(imageUrl);
        };
        reader.onerror = () => {
            alert('Lỗi khi đọc file ảnh');
            setIsScanningImage(false);
        };
        reader.readAsDataURL(file);
    };

    const scanQRFromImage = async (imageUrl: string) => {
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                const canvas = canvasRef.current;
                if (!canvas) {
                    setIsScanningImage(false);
                    return;
                }

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    setIsScanningImage(false);
                    return;
                }

                // Set canvas size to match image
                canvas.width = img.width;
                canvas.height = img.height;

                // Draw image on canvas
                ctx.drawImage(img, 0, 0);

                // Get image data
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                // Scan for QR code
                const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

                if (qrCode) {
                    const scannedCode = qrCode.data;
                    setTicketCode(scannedCode);
                    setIsScanningImage(false);
                    // Automatically perform check-in
                    performCheckInFromQR(scannedCode);
                } else {
                    setIsScanningImage(false);
                    alert('Không tìm thấy mã QR trong ảnh. Vui lòng thử lại với ảnh khác.');
                }
            };

            img.onerror = () => {
                setIsScanningImage(false);
                alert('Lỗi khi tải ảnh');
            };

            img.src = imageUrl;
        } catch (error) {
            console.error('Error scanning QR from image:', error);
            setIsScanningImage(false);
            alert('Có lỗi xảy ra khi quét mã QR từ ảnh');
        }
    };

    const performCheckInFromQR = async (scannedCode: string) => {
        try {
            const payload: any = { participationType: "CHECKED_IN", ticketCode: scannedCode };
            const response = await registrationAPI.checkIn(payload);
            if (response.status) {
                const data = response.body;
                if (data?.participationType === 'CHECKED_IN') {
                    alert(`✅ Check-in thành công cho ticketCode: ${scannedCode}.\nVui lòng check-out khi sinh viên rời khỏi sự kiện.`);
                } else if (data?.participationType === 'ATTENDED') {
                    alert(`✅ Check-out thành công cho ticketCode: ${scannedCode}.\nĐã hoàn thành tham gia sự kiện.`);
                } else {
                    alert(`✅ ${response.message || "Thành công"}`);
                }
                if (selectedEventId) await loadRegistrations(selectedEventId);
                setTicketCode("");
                setUploadedImage(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            } else {
                alert(response.message || "❌ Thao tác thất bại");
            }
        } catch (error) {
            console.error("Error check-in:", error);
            alert("Có lỗi xảy ra khi check-in bằng QR");
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
                                {showScanner ? "Đóng QR" : "Quét QR Camera"}
                            </button>
                            <label className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 cursor-pointer">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                                {isScanningImage ? "Đang quét..." : "Quét QR từ ảnh"}
                            </label>
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

                        {uploadedImage && (
                            <div className="mt-4">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <img
                                            src={uploadedImage}
                                            alt="Uploaded QR code"
                                            className="max-w-xs max-h-64 border-2 border-gray-300 rounded-lg"
                                        />
                                        {isScanningImage && (
                                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                                                <div className="text-white text-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                                                    <p>Đang quét mã QR...</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            setUploadedImage(null);
                                            if (fileInputRef.current) {
                                                fileInputRef.current.value = '';
                                            }
                                        }}
                                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                                    >
                                        Xóa ảnh
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Hidden canvas for QR code scanning */}
                        <canvas ref={canvasRef} className="hidden" />
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
