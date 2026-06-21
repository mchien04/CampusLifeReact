import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { eventAPI } from '../../services/eventAPI';
import { minigameAPI } from '../../services/minigameAPI';
import { ActivityResponse, ActivityType } from '../../types/activity';
import { MiniGame } from '../../types/minigame';
import { LoadingSpinner } from '../../components/common';
import { toast } from 'react-toastify';

const MinigameManagement: React.FC = () => {
    const navigate = useNavigate();
    const [minigames, setMinigames] = useState<Array<{ minigame: MiniGame; activity: ActivityResponse }>>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadMinigames();
    }, []);

    const loadMinigames = async () => {
        try {
            setLoading(true);
            // Get all activities with type MINIGAME
            const eventsResponse = await eventAPI.getEvents();
            if (eventsResponse.status && eventsResponse.data) {
                const minigameActivities = eventsResponse.data.filter(
                    a => a.type === ActivityType.MINIGAME
                );

                const minigameData: Array<{ minigame: MiniGame; activity: ActivityResponse }> = [];

                for (const activity of minigameActivities) {
                    try {
                        const minigameResponse = await minigameAPI.getMiniGameByActivity(activity.id);
                        if (minigameResponse.status && minigameResponse.data) {
                            minigameData.push({
                                minigame: minigameResponse.data,
                                activity
                            });
                        }
                    } catch (err) {
                        // Activity doesn't have minigame yet
                    }
                }

                setMinigames(minigameData);
            } else {
                setError(eventsResponse.message || 'Không thể tải danh sách minigame');
            }
        } catch (err) {
            setError('Có lỗi xảy ra khi tải danh sách minigame');
            console.error('Error loading minigames:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number, title: string) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa minigame "${title}"?`)) {
            return;
        }

        try {
            const response = await minigameAPI.deleteMiniGame(id);
            if (response.status) {
                toast.success('Xóa minigame thành công');
                await loadMinigames();
            } else {
                toast.error(response.message || 'Xóa thất bại');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi xóa');
            console.error('Error deleting minigame:', err);
        }
    };

    const filteredMinigames = minigames.filter(({ minigame, activity }) => {
        const matchesSearch =
            minigame.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            minigame.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            activity.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="text-red-600 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-[#001C44] mb-2">Có lỗi xảy ra</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={loadMinigames}
                        className="btn-primary px-6 py-3 rounded-lg font-medium"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center">
                            <span className="mr-3 text-4xl">🎮</span>
                            Quản lý Mini Game
                        </h1>
                        <p className="text-gray-200 text-lg">Quản lý các quiz và minigame trong hệ thống</p>
                    </div>
                    <div className="flex space-x-3">
                        <Link
                            to="/manager/minigames/create"
                            className="px-5 py-2.5 bg-[#FFD66D] text-[#001C44] rounded-lg hover:bg-[#FFC947] font-semibold shadow-lg hover:shadow-xl transition-all flex items-center"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Tạo Mini Game mới
                        </Link>
                        <Link
                            to="/manager/minigames/create-quiz"
                            className="px-5 py-2.5 bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 font-semibold transition-all"
                        >
                            Tạo Quiz từ Activity có sẵn
                        </Link>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <div className="relative">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm kiếm minigame theo tiêu đề, mô tả hoặc tên activity..."
                        className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-all"
                    />
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">
                        🔍
                    </span>
                </div>
            </div>

            {/* Minigames List */}
            {filteredMinigames.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
                    <div className="text-6xl mb-4">🎯</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Chưa có minigame nào</h3>
                    <p className="text-gray-500 mb-6">
                        Tạo activity với type MINIGAME trước, sau đó tạo minigame cho activity đó.
                    </p>
                    <Link
                        to="/manager/minigames/create"
                        className="btn-primary inline-flex items-center px-5 py-2.5 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Tạo Mini Game đầu tiên
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredMinigames.map(({ minigame, activity }) => (
                        <div
                            key={minigame.id}
                            className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200 border-l-4 border-l-[#001C44]"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    {/* Quiz Title */}
                                    <div className="flex items-center mb-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-[#001C44] to-[#002A66] rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                                            <span className="text-white text-lg">🎮</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                                                {minigame.title}
                                            </h3>
                                            {minigame.description && (
                                                <p className="text-sm text-gray-600 line-clamp-2">
                                                    {minigame.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Activity Info */}
                                    <div className="pl-12 mb-3">
                                        <div className="flex items-center text-sm">
                                            <span className="text-gray-500 mr-2 flex items-center">
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                                Thuộc Activity:
                                            </span>
                                            <Link
                                                to={`/manager/events/${activity.id}`}
                                                className="font-semibold text-[#001C44] hover:text-[#002A66] hover:underline flex items-center"
                                            >
                                                {activity.name}
                                                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </Link>
                                        </div>

                                        {/* Series Info (if belongs to series) */}
                                        {activity.seriesId && (
                                            <div className="mt-2 flex items-center text-sm">
                                                <span className="text-gray-500 mr-2 flex items-center">
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                    </svg>
                                                    Thuộc chuỗi sự kiện:
                                                </span>
                                                <Link
                                                    to={`/manager/series/${activity.seriesId}`}
                                                    className="font-semibold text-purple-600 hover:text-purple-700 hover:underline flex items-center"
                                                >
                                                    Xem chuỗi sự kiện
                                                    {activity.seriesOrder && (
                                                        <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                                            Thứ tự: {activity.seriesOrder}
                                                        </span>
                                                    )}
                                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </Link>
                                            </div>
                                        )}
                                    </div>

                                    {/* Quiz Stats */}
                                    <div className="pl-12 flex flex-wrap gap-4 text-sm">
                                        <div className="flex items-center text-gray-600">
                                            <svg className="w-4 h-4 mr-1.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="font-medium">{minigame.questionCount}</span>
                                            <span className="ml-1 text-gray-500">câu hỏi</span>
                                        </div>
                                        <div className="flex items-center text-gray-600">
                                            <svg className="w-4 h-4 mr-1.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="font-medium">
                                                
                                            </span>
                                            <span className="ml-1 text-gray-500">điểm</span>
                                        </div>
                                        {minigame.timeLimit && (
                                            <div className="flex items-center text-gray-600">
                                                <svg className="w-4 h-4 mr-1.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="font-medium">{Math.floor(minigame.timeLimit / 60)}</span>
                                                <span className="ml-1 text-gray-500">phút</span>
                                            </div>
                                        )}
                                        {minigame.maxAttempts !== null && minigame.maxAttempts !== undefined ? (
                                            <div className="flex items-center text-gray-600">
                                                <svg className="w-4 h-4 mr-1.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="font-medium">{minigame.maxAttempts}</span>
                                                <span className="ml-1 text-gray-500">lần thử</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center text-gray-600">
                                                <svg className="w-4 h-4 mr-1.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="font-medium">Không giới hạn</span>
                                                <span className="ml-1 text-gray-500">lần thử</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col space-y-2 ml-4 flex-shrink-0">
                                    <Link
                                        to={`/manager/minigames/edit/${minigame.id}`}
                                        className="px-4 py-2 bg-[#001C44] text-white rounded-lg hover:bg-[#002A66] transition-colors text-sm font-medium text-center flex items-center justify-center"
                                    >
                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Chỉnh sửa
                                    </Link>
                                    <Link
                                        to={`/manager/events/${activity.id}`}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-center flex items-center justify-center"
                                    >
                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        Xem Activity
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(minigame.id, minigame.title)}
                                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium flex items-center justify-center"
                                    >
                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Xóa
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MinigameManagement;


