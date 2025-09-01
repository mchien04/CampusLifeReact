import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ActivityResponse, ActivityType } from '../types/activity';
import { eventAPI } from '../services/eventAPI';
import { getImageUrl } from '../utils/imageUtils';

const EventDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [event, setEvent] = useState<ActivityResponse | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEvent = async () => {
            if (!id) {
                setError('ID sự kiện không hợp lệ');
                setLoading(false);
                return;
            }

            try {
                const response = await eventAPI.getEvent(parseInt(id));
                if (response.status && response.data) {
                    setEvent(response.data);
                } else {
                    setError('Không tìm thấy sự kiện');
                }
            } catch (err: any) {
                console.error('Error fetching event:', err);
                setError('Có lỗi xảy ra khi tải thông tin sự kiện');
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [id]);

    const getTypeLabel = (type: ActivityType): string => {
        const typeLabels: Record<ActivityType, string> = {
            [ActivityType.SUKIEN]: 'Sự kiện',
            [ActivityType.MINIGAME]: 'Mini Game',
            [ActivityType.CONG_TAC_XA_HOI]: 'Công tác xã hội',
            [ActivityType.CHUYEN_DE_DOANH_NGHIEP]: 'Chuyên đề doanh nghiệp'
        };
        return typeLabels[type] || type;
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải thông tin sự kiện...</p>
                </div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">❌</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Lỗi</h3>
                    <p className="text-gray-600 mb-4">{error || 'Không tìm thấy sự kiện'}</p>
                    <button
                        onClick={() => navigate('/manager/events')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                        Quay lại danh sách
                    </button>
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
                            <h1 className="text-2xl font-bold text-gray-900">Chi tiết sự kiện</h1>
                            <p className="text-gray-600 mt-1">Thông tin chi tiết về sự kiện</p>
                        </div>
                        <div className="flex space-x-3">
                            <Link
                                to={`/manager/events/${event.id}/edit`}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                            >
                                Chỉnh sửa
                            </Link>
                            <button
                                onClick={() => navigate('/manager/events')}
                                className="px-4 py-2 text-gray-600 hover:text-gray-900"
                            >
                                ← Quay lại danh sách
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Event Details */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                    {/* Banner */}
                    {event.bannerUrl && (
                        <div className="h-64 bg-gray-200 bg-cover bg-center"
                            style={{ backgroundImage: `url(${getImageUrl(event.bannerUrl)})` }}>
                        </div>
                    )}

                    <div className="p-8">
                        {/* Header Info */}
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                    <h2 className="text-3xl font-bold text-gray-900">{event.name}</h2>
                                    {event.isImportant && (
                                        <span className="text-yellow-500 text-2xl">⭐</span>
                                    )}
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                                        {getTypeLabel(event.type)}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        ID: {event.id}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {event.description && (
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Mô tả</h3>
                                <p className="text-gray-700 leading-relaxed">{event.description}</p>
                            </div>
                        )}

                        {/* Event Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            {/* Date & Time */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Thời gian & Địa điểm</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center">
                                        <span className="w-5 h-5 mr-3 text-blue-600">📅</span>
                                        <div>
                                            <p className="text-sm text-gray-500">Ngày bắt đầu</p>
                                            <p className="font-medium">{formatDate(event.startDate)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-5 h-5 mr-3 text-blue-600">📅</span>
                                        <div>
                                            <p className="text-sm text-gray-500">Ngày kết thúc</p>
                                            <p className="font-medium">{formatDate(event.endDate)}</p>
                                        </div>
                                    </div>
                                    {event.registrationDeadline && (
                                        <div className="flex items-center">
                                            <span className="w-5 h-5 mr-3 text-orange-600">⏰</span>
                                            <div>
                                                <p className="text-sm text-gray-500">Hạn đăng ký</p>
                                                <p className="font-medium">{formatDate(event.registrationDeadline)}</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center">
                                        <span className="w-5 h-5 mr-3 text-green-600">📍</span>
                                        <div>
                                            <p className="text-sm text-gray-500">Địa điểm</p>
                                            <p className="font-medium">{event.location}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Event Info */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin sự kiện</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center">
                                        <span className="w-5 h-5 mr-3 text-purple-600">🏢</span>
                                        <div>
                                            <p className="text-sm text-gray-500">Khoa/Phòng ban</p>
                                            <p className="font-medium">ID: {event.departmentId}</p>
                                        </div>
                                    </div>
                                    {event.maxPoints && event.maxPoints > 0 && (
                                        <div className="flex items-center">
                                            <span className="w-5 h-5 mr-3 text-yellow-600">🏆</span>
                                            <div>
                                                <p className="text-sm text-gray-500">Điểm tối đa</p>
                                                <p className="font-medium">{event.maxPoints} điểm</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center">
                                        <span className="w-5 h-5 mr-3 text-indigo-600">📝</span>
                                        <div>
                                            <p className="text-sm text-gray-500">Yêu cầu nộp bài</p>
                                            <p className="font-medium">
                                                {event.requiresSubmission ? 'Có' : 'Không'}
                                            </p>
                                        </div>
                                    </div>
                                    {event.shareLink && (
                                        <div className="flex items-center">
                                            <span className="w-5 h-5 mr-3 text-blue-600">🔗</span>
                                            <div>
                                                <p className="text-sm text-gray-500">Link chia sẻ</p>
                                                <a
                                                    href={event.shareLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-medium text-blue-600 hover:text-blue-800"
                                                >
                                                    Xem link
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin hệ thống</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                <div>
                                    <p><span className="font-medium">Ngày tạo:</span> {formatDate(event.createdAt)}</p>
                                    {event.createdBy && (
                                        <p><span className="font-medium">Người tạo:</span> {event.createdBy}</p>
                                    )}
                                </div>
                                <div>
                                    <p><span className="font-medium">Cập nhật lần cuối:</span> {formatDate(event.updatedAt)}</p>
                                    {event.lastModifiedBy && (
                                        <p><span className="font-medium">Người cập nhật:</span> {event.lastModifiedBy}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetail;
