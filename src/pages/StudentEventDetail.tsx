import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { eventAPI } from '../services/eventAPI';
import { registrationAPI } from '../services/registrationAPI';
import { ActivityResponse, ActivityType, ScoreType } from '../types';
import { RegistrationStatus, ParticipationType } from '../types/registration';
import { LoadingSpinner } from '../components/common';

const StudentEventDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [event, setEvent] = useState<ActivityResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus | null>(null);
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);
    const [showParticipationForm, setShowParticipationForm] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [participationType, setParticipationType] = useState<ParticipationType>(ParticipationType.ATTENDED);
    const [pointsEarned, setPointsEarned] = useState<number>(0);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (id) {
            loadEvent();
        }
    }, [id]);

    const loadEvent = async () => {
        try {
            setLoading(true);
            const response = await eventAPI.getEvent(parseInt(id!));
            if (response.status && response.data) {
                setEvent(response.data);
                await checkRegistrationStatus(response.data.id);
            } else {
                setError(response.message || 'Không thể tải thông tin sự kiện');
            }
        } catch (err) {
            setError('Có lỗi xảy ra khi tải thông tin sự kiện');
            console.error('Error loading event:', err);
        } finally {
            setLoading(false);
        }
    };

    const checkRegistrationStatus = async (eventId: number) => {
        try {
            const status = await registrationAPI.checkRegistrationStatus(eventId);
            setRegistrationStatus(status.status);
        } catch (err) {
            console.error('Error checking registration status:', err);
        }
    };

    const handleRegister = async () => {
        if (!event) return;

        const requestData = {
            activityId: event.id,
            feedback: feedback || undefined
        };

        console.log('Registration request data:', requestData);
        console.log('Event data:', event);

        try {
            const response = await registrationAPI.registerForActivity(requestData);
            console.log('Registration response:', response);

            if (response) {
                setRegistrationStatus(RegistrationStatus.PENDING);
                setShowRegistrationForm(false);
                alert('Đăng ký thành công! Vui lòng chờ phê duyệt.');
            }
        } catch (err: any) {
            console.error('Registration error details:', err);
            console.error('Error response:', err.response?.data);
            alert('Có lỗi xảy ra khi đăng ký: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleCancelRegistration = async () => {
        if (!event) return;

        // Hiển thị thông báo xác nhận
        const confirmed = window.confirm(
            'Bạn có chắc chắn muốn hủy đăng ký sự kiện này?\n\n' +
            '⚠️ Lưu ý: Sau khi hủy, bạn sẽ không thể đăng ký lại sự kiện này.'
        );

        if (!confirmed) {
            return; // Người dùng không xác nhận, không làm gì
        }

        try {
            await registrationAPI.cancelRegistration(event.id);
            setRegistrationStatus(RegistrationStatus.CANCELLED);
            alert('Hủy đăng ký thành công!');
        } catch (err: any) {
            alert('Có lỗi xảy ra khi hủy đăng ký: ' + (err.response?.data?.message || err.message));
            console.error('Error canceling registration:', err);
        }
    };

    const handleRecordParticipation = async () => {
        if (!event) return;

        try {
            const response = await registrationAPI.recordParticipation({
                activityId: event.id,
                participationType: participationType,
                pointsEarned: pointsEarned || undefined,
                notes: notes
            });

            if (response) {
                setShowParticipationForm(false);
                alert('Ghi nhận tham gia thành công!');
            }
        } catch (err) {
            alert('Có lỗi xảy ra khi ghi nhận tham gia');
            console.error('Error recording participation:', err);
        }
    };

    const getTypeLabel = (type: ActivityType) => {
        const labels: Record<ActivityType, string> = {
            [ActivityType.SUKIEN]: 'Sự kiện',
            [ActivityType.MINIGAME]: 'Mini Game',
            [ActivityType.CONG_TAC_XA_HOI]: 'Công tác xã hội',
            [ActivityType.CHUYEN_DE_DOANH_NGHIEP]: 'Chuyên đề doanh nghiệp'
        };
        return labels[type] || type;
    };

    const getScoreTypeLabel = (scoreType: ScoreType) => {
        const labels: Record<ScoreType, string> = {
            [ScoreType.REN_LUYEN]: 'Rèn luyện',
            [ScoreType.CONG_TAC_XA_HOI]: 'Công tác xã hội',
            [ScoreType.CHUYEN_DE]: 'Chuyên đề',
            [ScoreType.KHAC]: 'Khác'
        };
        return labels[scoreType] || scoreType;
    };

    const getStatusLabel = (status: RegistrationStatus) => {
        const labels: Record<RegistrationStatus, string> = {
            [RegistrationStatus.PENDING]: 'Chờ duyệt',
            [RegistrationStatus.APPROVED]: 'Đã duyệt',
            [RegistrationStatus.REJECTED]: 'Từ chối',
            [RegistrationStatus.CANCELLED]: 'Đã hủy'
        };
        return labels[status] || status;
    };

    const getStatusColor = (status: RegistrationStatus) => {
        const colors: Record<RegistrationStatus, string> = {
            [RegistrationStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
            [RegistrationStatus.APPROVED]: 'bg-green-100 text-green-800',
            [RegistrationStatus.REJECTED]: 'bg-red-100 text-red-800',
            [RegistrationStatus.CANCELLED]: 'bg-gray-100 text-gray-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getEventStatus = () => {
        if (!event) return 'UNKNOWN';
        const now = new Date();
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);

        if (now < startDate) return 'UPCOMING';
        if (now >= startDate && now <= endDate) return 'ONGOING';
        return 'ENDED';
    };

    const canRegister = () => {
        if (!event) return false;
        const eventStatus = getEventStatus();
        return eventStatus === 'UPCOMING' && !registrationStatus;
    };

    const canCancel = () => {
        if (!event) return false;
        const eventStatus = getEventStatus();
        return eventStatus === 'UPCOMING' &&
            registrationStatus === RegistrationStatus.PENDING;
    };

    const canRecordParticipation = () => {
        if (!event) return false;
        const eventStatus = getEventStatus();
        return eventStatus === 'ONGOING' && registrationStatus === RegistrationStatus.APPROVED;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 text-xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Có lỗi xảy ra</h2>
                    <p className="text-gray-600 mb-4">{error || 'Không tìm thấy sự kiện'}</p>
                    <button
                        onClick={() => navigate('/student/events')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    const eventStatus = getEventStatus();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
                                <p className="mt-1 text-sm text-gray-500">
                                    Chi tiết sự kiện hoạt động
                                </p>
                            </div>
                            <div className="flex space-x-3">
                                <Link
                                    to="/student/events"
                                    className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
                                >
                                    ← Quay lại danh sách
                                </Link>
                                <Link
                                    to="/dashboard"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                                >
                                    Dashboard
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Event Info */}
                        <div className="bg-white shadow rounded-lg mb-6">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${eventStatus === 'UPCOMING' ? 'bg-blue-100 text-blue-800' :
                                            eventStatus === 'ONGOING' ? 'bg-green-100 text-green-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                            {eventStatus === 'UPCOMING' ? 'Sắp diễn ra' :
                                                eventStatus === 'ONGOING' ? 'Đang diễn ra' : 'Đã kết thúc'}
                                        </span>
                                        {registrationStatus && (
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(registrationStatus)}`}>
                                                {getStatusLabel(registrationStatus)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <h2 className="text-2xl font-bold text-gray-900 mb-4">{event.name}</h2>

                                {event.description && (
                                    <p className="text-gray-600 mb-6">{event.description}</p>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="flex items-center text-sm text-gray-500">
                                        <span className="mr-2">📅</span>
                                        <span>
                                            {new Date(event.startDate).toLocaleDateString('vi-VN')} - {new Date(event.endDate).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <span className="mr-2">📍</span>
                                        <span>{event.location}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <span className="mr-2">🏷️</span>
                                        <span>{getTypeLabel(event.type)}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <span className="mr-2">⭐</span>
                                        <span>{getScoreTypeLabel(event.scoreType)}</span>
                                    </div>
                                </div>

                                {event.ticketQuantity && (
                                    <div className="text-sm text-gray-500 mb-2">
                                        <span className="mr-2">🎫</span>
                                        <span>Số lượng vé: {event.ticketQuantity}</span>
                                    </div>
                                )}

                                {event.mandatoryForFacultyStudents && (
                                    <div className="text-sm text-orange-600 mb-2">
                                        <span className="mr-2">⚠️</span>
                                        <span>Bắt buộc cho sinh viên khoa</span>
                                    </div>
                                )}

                                {event.benefits && (
                                    <div className="mb-4">
                                        <h3 className="text-sm font-medium text-gray-900 mb-2">Lợi ích:</h3>
                                        <p className="text-sm text-gray-600">{event.benefits}</p>
                                    </div>
                                )}

                                {event.requirements && (
                                    <div className="mb-4">
                                        <h3 className="text-sm font-medium text-gray-900 mb-2">Yêu cầu:</h3>
                                        <p className="text-sm text-gray-600">{event.requirements}</p>
                                    </div>
                                )}

                                {event.contactInfo && (
                                    <div className="mb-4">
                                        <h3 className="text-sm font-medium text-gray-900 mb-2">Thông tin liên hệ:</h3>
                                        <p className="text-sm text-gray-600">{event.contactInfo}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="bg-white shadow rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Thao tác</h3>
                                <div className="flex flex-wrap gap-3">
                                    {canRegister() && (
                                        <button
                                            onClick={() => setShowRegistrationForm(true)}
                                            className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                                        >
                                            Đăng ký tham gia
                                        </button>
                                    )}

                                    {canCancel() && (
                                        <button
                                            onClick={handleCancelRegistration}
                                            className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                                        >
                                            Hủy đăng ký
                                        </button>
                                    )}

                                    {registrationStatus === RegistrationStatus.APPROVED && getEventStatus() === 'UPCOMING' && (
                                        <div className="text-center">
                                            <span className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium bg-green-100 text-green-800">
                                                ✅ Đã được duyệt - Không thể hủy
                                            </span>
                                        </div>
                                    )}

                                    {canRecordParticipation() && (
                                        <button
                                            onClick={() => setShowParticipationForm(true)}
                                            className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700"
                                        >
                                            Ghi nhận tham gia
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Event Stats */}
                        <div className="bg-white shadow rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin sự kiện</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Loại sự kiện:</span>
                                        <span className="text-sm font-medium">{getTypeLabel(event.type)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Loại điểm:</span>
                                        <span className="text-sm font-medium">{getScoreTypeLabel(event.scoreType)}</span>
                                    </div>
                                    {event.maxPoints && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-500">Điểm tối đa:</span>
                                            <span className="text-sm font-medium">{event.maxPoints}</span>
                                        </div>
                                    )}
                                    {event.penaltyPointsIncomplete && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-500">Điểm phạt:</span>
                                            <span className="text-sm font-medium text-red-600">{event.penaltyPointsIncomplete}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Registration Info */}
                        {registrationStatus && (
                            <div className="bg-white shadow rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Trạng thái đăng ký</h3>
                                    <div className="text-center">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(registrationStatus)}`}>
                                            {getStatusLabel(registrationStatus)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Registration Modal */}
            {showRegistrationForm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Đăng ký tham gia sự kiện</h3>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Lời nhắn (tùy chọn)
                                </label>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Nhập lời nhắn cho ban tổ chức..."
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowRegistrationForm(false)}
                                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleRegister}
                                    className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                                >
                                    Đăng ký
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Participation Modal */}
            {showParticipationForm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Ghi nhận tham gia</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Loại tham gia
                                    </label>
                                    <select
                                        value={participationType}
                                        onChange={(e) => setParticipationType(e.target.value as ParticipationType)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value={ParticipationType.REGISTERED}>Đã đăng ký</option>
                                        <option value={ParticipationType.ATTENDED}>Đã tham gia</option>
                                        <option value={ParticipationType.CHECKED_IN}>Đã check-in</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Điểm đạt được (tùy chọn)
                                    </label>
                                    <input
                                        type="number"
                                        value={pointsEarned}
                                        onChange={(e) => setPointsEarned(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nhập điểm đạt được..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ghi chú (tùy chọn)
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nhập ghi chú..."
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => setShowParticipationForm(false)}
                                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleRecordParticipation}
                                    className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700"
                                >
                                    Ghi nhận
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentEventDetail;
