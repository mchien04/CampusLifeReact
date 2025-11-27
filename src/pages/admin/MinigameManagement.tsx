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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#001C44]">Quản lý Mini Game</h1>
                    <p className="text-gray-600 mt-1">Quản lý các quiz và minigame</p>
                </div>
                <Link
                    to="/manager/minigames/create"
                    className="btn-primary px-6 py-2 rounded-lg font-medium"
                >
                    + Tạo minigame mới
                </Link>
            </div>

            {/* Search */}
            <div className="card p-6">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm minigame..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                />
            </div>

            {/* Minigames List */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tiêu đề
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Activity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Số câu hỏi
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Điểm thưởng
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredMinigames.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        Không có minigame nào. Tạo activity với type MINIGAME trước, sau đó tạo minigame.
                                    </td>
                                </tr>
                            ) : (
                                filteredMinigames.map(({ minigame, activity }) => (
                                    <tr key={minigame.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {minigame.title}
                                            </div>
                                            {minigame.description && (
                                                <div className="text-sm text-gray-500 line-clamp-1">
                                                    {minigame.description}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Link
                                                to={`/manager/events/${activity.id}`}
                                                className="text-sm text-[#001C44] hover:underline"
                                            >
                                                {activity.name}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {minigame.questionCount}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {minigame.rewardPoints
                                                ? parseFloat(minigame.rewardPoints).toFixed(1)
                                                : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <Link
                                                    to={`/manager/events/${activity.id}`}
                                                    className="text-[#001C44] hover:text-[#002A66]"
                                                >
                                                    Xem
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(minigame.id, minigame.title)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MinigameManagement;

