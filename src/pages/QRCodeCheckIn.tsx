import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { QRCodeScanner } from '../components/qr';
import { registrationAPI } from '../services/registrationAPI';
import { ActivityParticipationResponse } from '../types/registration';
import StudentLayout from '../components/layout/StudentLayout';
import ScoreAwardList from '../components/presets/ScoreAwardList';
import { QrCode, CheckCircle, WarningCircle, Camera, Keyboard, Info, Scan, X, ArrowClockwise, ArrowRight, XCircle } from '@phosphor-icons/react';

const QRCodeCheckIn: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [showScanner, setShowScanner] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkInResult, setCheckInResult] = useState<ActivityParticipationResponse | null>(null);
    const initialCheckDone = useRef(false);

    const handleScan = async (code: string) => {
        if (loading) return;
        
        setLoading(true);
        try {
            let finalCode = code.trim();
            try {
                const url = new URL(finalCode);
                const codeParam = url.searchParams.get('code') || url.searchParams.get('checkInCode');
                if (codeParam) {
                    finalCode = codeParam;
                }
            } catch (e) {
                // Not a valid URL, use original code
            }

            const response = await registrationAPI.checkInByQrCode(finalCode);
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

    useEffect(() => {
        if (initialCheckDone.current) return;
        
        const code = searchParams.get('code') || searchParams.get('checkInCode');
        if (code) {
            initialCheckDone.current = true;
            handleScan(code);
        }
    }, [searchParams]);

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
            <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="bg-primary-900 rounded-3xl shadow-premium p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-400 opacity-10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shrink-0 shadow-inner">
                            <QrCode weight="duotone" className="w-8 h-8 text-secondary-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Điểm danh sự kiện</h1>
                            <p className="text-primary-100 text-lg font-medium">Quét mã QR hoặc nhập mã thủ công để ghi nhận tham gia</p>
                        </div>
                    </div>
                </div>

                {checkInResult ? (
                    /* Success Result */
                    <div className="bg-white rounded-3xl shadow-premium p-8 md:p-12 border border-gray-100 text-center animate-fade-in">
                        <div className="mx-auto w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-green-100">
                            <CheckCircle weight="fill" className="w-10 h-10 text-green-500" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Điểm danh thành công!</h2>
                        <p className="text-gray-500 font-medium mb-8 text-lg">Hệ thống đã ghi nhận sự tham gia của bạn</p>

                        <div className="bg-gray-50/80 rounded-2xl p-6 mb-8 text-left border border-gray-100 shadow-sm mx-auto max-w-2xl">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Info weight="fill" className="w-5 h-5 text-primary-500" />
                                Thông tin điểm danh
                            </h3>
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                                    <span className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1 sm:mb-0">Sự kiện</span>
                                    <span className="font-bold text-gray-900 text-right">{checkInResult.activityName}</span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                                    <span className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1 sm:mb-0">Thời gian</span>
                                    <span className="font-bold text-gray-900 text-right">
                                        {new Date(checkInResult.date).toLocaleString('vi-VN')}
                                    </span>
                                </div>
                                
                                <div className="pt-2 mt-4 border-t border-gray-200/60">
                                    <span className="block text-gray-500 text-sm font-semibold uppercase tracking-wider mb-3">Điểm nhận được</span>
                                    {checkInResult.scoreAwards && checkInResult.scoreAwards.length > 0 ? (
                                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                            <ScoreAwardList
                                                awards={checkInResult.scoreAwards}
                                                showIcons={true}
                                            />
                                        </div>
                                    ) : (
                                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-sm text-gray-600 font-medium flex items-center gap-2">
                                            <Info weight="duotone" className="w-5 h-5 text-blue-500" />
                                            Không có điểm thưởng cho hoạt động này.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
                            <button
                                onClick={handleRetry}
                                className="px-6 py-3.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-bold flex items-center justify-center gap-2 w-full sm:w-auto shadow-sm"
                            >
                                <ArrowClockwise weight="bold" className="w-5 h-5" />
                                Điểm danh sự kiện khác
                            </button>
                            <button
                                onClick={handleViewActivity}
                                className="px-6 py-3.5 bg-primary-900 text-white rounded-xl hover:bg-primary-800 transition-all font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 w-full sm:w-auto"
                            >
                                Xem chi tiết sự kiện
                                <ArrowRight weight="bold" className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Check-in Form */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left column: Manual Input & Instructions */}
                        <div className="lg:col-span-5 space-y-6">
                            {/* Manual Input Section */}
                            <div className="bg-white rounded-3xl shadow-premium p-6 md:p-8 border border-gray-100 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary-100 transition-colors duration-500"></div>
                                <h2 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-3 relative z-10">
                                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                                        <Keyboard weight="duotone" className="w-6 h-6" />
                                    </div>
                                    Nhập mã thủ công
                                </h2>
                                <form onSubmit={handleManualSubmit} className="space-y-5 relative z-10">
                                    <div>
                                        <label htmlFor="manualCode" className="block text-sm font-bold text-gray-700 mb-2">
                                            Mã QR Code
                                        </label>
                                        <input
                                            type="text"
                                            id="manualCode"
                                            value={manualCode}
                                            onChange={(e) => setManualCode(e.target.value)}
                                            placeholder="Nhập mã check-in..."
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all font-medium"
                                            disabled={loading}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading || !manualCode.trim()}
                                        className="w-full px-6 py-3.5 bg-primary-900 text-white rounded-xl hover:bg-primary-800 transition-all font-bold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            'Đang xử lý...'
                                        ) : (
                                            <>
                                                <Scan weight="bold" className="w-5 h-5" />
                                                Gửi mã điểm danh
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>

                            {/* Instructions */}
                            <div className="bg-secondary-50/50 border border-secondary-100 rounded-3xl p-6">
                                <h3 className="font-bold text-secondary-900 mb-4 flex items-center gap-2">
                                    <Info weight="fill" className="w-5 h-5 text-secondary-600" />
                                    Hướng dẫn sử dụng
                                </h3>
                                <ul className="text-secondary-800 space-y-3 text-sm font-medium">
                                    <li className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-secondary-400 mt-1.5 shrink-0"></div>
                                        <span>Chọn <strong>"Mở Camera Quét QR"</strong> để sử dụng camera của thiết bị.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-secondary-400 mt-1.5 shrink-0"></div>
                                        <span>Nếu không quét được, hãy nhập mã thủ công vào ô bên trên.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-secondary-400 mt-1.5 shrink-0"></div>
                                        <span>Đảm bảo bạn đã đăng ký và được duyệt tham gia sự kiện trước khi điểm danh.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Right column: QR Scanner Section */}
                        <div className="lg:col-span-7">
                            <div className="bg-white rounded-3xl shadow-premium overflow-hidden border border-gray-100 h-full flex flex-col">
                                <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                    <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                                            <Camera weight="duotone" className="w-6 h-6" />
                                        </div>
                                        Quét bằng Camera
                                    </h2>
                                    <button
                                        onClick={() => setShowScanner(!showScanner)}
                                        className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm hover:shadow-md ${
                                            showScanner
                                                ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'
                                                : 'bg-primary-900 text-white hover:bg-primary-800'
                                        }`}
                                    >
                                        {showScanner ? (
                                            <>
                                                <X weight="bold" className="w-5 h-5" />
                                                Đóng Camera
                                            </>
                                        ) : (
                                            <>
                                                <Scan weight="bold" className="w-5 h-5" />
                                                Mở Camera Quét QR
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="flex-1 p-6 md:p-8 bg-gray-50 flex items-center justify-center min-h-[400px]">
                                    {showScanner ? (
                                        <div className="w-full max-w-md mx-auto relative rounded-2xl overflow-hidden shadow-lg border-4 border-gray-800 bg-black">
                                            <QRCodeScanner
                                                onScan={handleScan}
                                                onError={(error) => {
                                                    console.error('QR Scanner error:', error);
                                                    if (error.name === 'NotAllowedError') {
                                                        toast.error('Không có quyền truy cập camera. Vui lòng cấp quyền camera trong trình duyệt.');
                                                    } else if (error.name === 'NotFoundError') {
                                                        toast.error('Không tìm thấy camera. Vui lòng kiểm tra thiết bị của bạn.');
                                                    } else if (error.name === 'NotReadableError') {
                                                        toast.error('Camera đang được sử dụng bởi ứng dụng khác. Vui lòng đóng ứng dụng khác và thử lại.');
                                                    } else {
                                                        toast.error('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập camera.');
                                                    }
                                                }}
                                                onClose={() => setShowScanner(false)}
                                            />
                                        </div>
                                    ) : (
                                        <div className="text-center w-full max-w-sm mx-auto">
                                            <div className="w-24 h-24 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-6 text-gray-300">
                                                <Scan weight="duotone" className="w-12 h-12" />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">Camera đang tắt</h3>
                                            <p className="text-gray-500 font-medium">
                                                Nhấn nút "Mở Camera Quét QR" phía trên để bắt đầu quét mã.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};

export default QRCodeCheckIn;

