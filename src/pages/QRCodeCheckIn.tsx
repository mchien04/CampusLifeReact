import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { QRCodeScanner } from '../components/qr';
import { registrationAPI } from '../services/registrationAPI';
import { ActivityParticipationResponse } from '../types/registration';
import StudentLayout from '../components/layout/StudentLayout';

const QRCodeCheckIn: React.FC = () => {
    const navigate = useNavigate();
    const [showScanner, setShowScanner] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkInResult, setCheckInResult] = useState<ActivityParticipationResponse | null>(null);

    const handleScan = async (code: string) => {
        if (loading) return;
        
        setLoading(true);
        try {
            const response = await registrationAPI.checkInByQrCode(code);
            if (response.status && response.body) {
                setCheckInResult(response.body);
                toast.success('Điểm danh thành công!');
                setShowScanner(false);
            } else {
                const errorMessage = response.message || 'Có lỗi xảy ra khi điểm danh';
                handleError(errorMessage);
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi điểm danh';
            handleError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleError = (message: string) => {
        if (message.includes('Không tìm thấy activity')) {
            toast.error('Mã QR code không hợp lệ');
        } else if (message.includes('chưa đăng ký') || message.includes('chưa được duyệt')) {
            toast.error('Bạn chưa đăng ký hoặc chưa được duyệt tham gia sự kiện này');
        } else if (message.includes('đã điểm danh')) {
            toast.error('Bạn đã điểm danh sự kiện này rồi');
        } else if (message.includes('chưa được công bố')) {
            toast.error('Sự kiện chưa được công bố');
        } else {
            toast.error(message);
        }
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualCode.trim()) {
            toast.error('Vui lòng nhập mã QR code');
            return;
        }
        await handleScan(manualCode.trim());
    };

    const handleRetry = () => {
        setCheckInResult(null);
        setManualCode('');
        setShowScanner(false);
    };

    const handleViewActivity = () => {
        if (checkInResult) {
            navigate(`/student/events/${checkInResult.activityId}`);
        }
    };

    return (
        <StudentLayout>
            <div className="p-6 max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="bg-[#FFD66D] p-3 rounded-lg">
                            <svg className="w-8 h-8 text-[#001C44]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Điểm danh bằng QR Code</h1>
                            <p className="text-gray-200 mt-1">Quét mã QR hoặc nhập mã thủ công để điểm danh sự kiện</p>
                        </div>
                    </div>
                </div>

                {checkInResult ? (
                    /* Success Result */
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <div className="text-center">
                            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Điểm danh thành công!</h2>
                            <p className="text-gray-600 mb-6">Bạn đã điểm danh sự kiện thành công</p>

                            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                                <h3 className="font-semibold text-gray-900 mb-3">Thông tin điểm danh:</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Sự kiện:</span>
                                        <span className="font-medium text-gray-900">{checkInResult.activityName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Thời gian:</span>
                                        <span className="font-medium text-gray-900">
                                            {new Date(checkInResult.date).toLocaleString('vi-VN')}
                                        </span>
                                    </div>
                                    {checkInResult.pointsEarned !== undefined && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Điểm nhận được:</span>
                                            <span className="font-medium text-green-600">{checkInResult.pointsEarned} điểm</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex space-x-4 justify-center">
                                <button
                                    onClick={handleRetry}
                                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                    Điểm danh lại
                                </button>
                                <button
                                    onClick={handleViewActivity}
                                    className="px-6 py-2 bg-gradient-to-r from-[#001C44] to-[#002A66] text-white rounded-lg hover:from-[#002A66] hover:to-[#003A88] transition-colors font-medium shadow-md"
                                >
                                    Xem chi tiết sự kiện
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Check-in Form */
                    <div className="space-y-6">
                        {/* Instructions */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-semibold text-blue-900 mb-2">Hướng dẫn sử dụng:</h3>
                            <ul className="text-blue-800 space-y-1 text-sm">
                                <li>• Chọn "Quét QR Code" để sử dụng camera quét mã QR</li>
                                <li>• Hoặc nhập mã QR code thủ công vào ô bên dưới</li>
                                <li>• Đảm bảo bạn đã đăng ký và được duyệt tham gia sự kiện</li>
                            </ul>
                        </div>

                        {/* QR Scanner Section */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">Quét QR Code</h2>
                                <button
                                    onClick={() => setShowScanner(!showScanner)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                        showScanner
                                            ? 'bg-red-600 text-white hover:bg-red-700'
                                            : 'bg-[#001C44] text-white hover:bg-[#002A66]'
                                    }`}
                                >
                                    {showScanner ? 'Đóng Camera' : '📷 Quét QR Code'}
                                </button>
                            </div>

                            {showScanner && (
                                <div className="mt-4">
                                    <QRCodeScanner
                                        onScan={handleScan}
                                        onError={(error) => {
                                            console.error('QR Scanner error:', error);
                                            // Chỉ hiển thị lỗi cho các lỗi nghiêm trọng
                                            if (error.name === 'NotAllowedError') {
                                                toast.error('Không có quyền truy cập camera. Vui lòng cấp quyền camera trong trình duyệt.');
                                            } else if (error.name === 'NotFoundError') {
                                                toast.error('Không tìm thấy camera. Vui lòng kiểm tra thiết bị của bạn.');
                                            } else if (error.name === 'NotReadableError') {
                                                toast.error('Camera đang được sử dụng bởi ứng dụng khác. Vui lòng đóng ứng dụng khác và thử lại.');
                                            } else {
                                                // Chỉ hiển thị lỗi cho các lỗi nghiêm trọng khác
                                                toast.error('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập camera.');
                                            }
                                        }}
                                        onClose={() => setShowScanner(false)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Manual Input Section */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Nhập mã QR thủ công</h2>
                            <form onSubmit={handleManualSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="manualCode" className="block text-sm font-medium text-gray-700 mb-2">
                                        Mã QR Code
                                    </label>
                                    <input
                                        type="text"
                                        id="manualCode"
                                        value={manualCode}
                                        onChange={(e) => setManualCode(e.target.value)}
                                        placeholder="Nhập mã QR code..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-transparent"
                                        disabled={loading}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || !manualCode.trim()}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-[#001C44] to-[#002A66] text-white rounded-lg hover:from-[#002A66] hover:to-[#003A88] transition-colors font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Đang xử lý...' : 'Điểm danh'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};

export default QRCodeCheckIn;

