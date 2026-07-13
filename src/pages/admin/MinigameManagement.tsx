import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { eventAPI } from '../../services/eventAPI';
import { minigameAPI } from '../../services/minigameAPI';
import { ActivityResponse, ActivityType } from '../../types/activity';
import { MiniGame } from '../../types/minigame';
import { LoadingSpinner } from '../../components/common';
import { toast } from 'react-toastify';
import { GameController, WarningCircle, Plus, Copy, MagnifyingGlass, CalendarBlank, Stack, ChartBar, Clock, CheckCircle, ArrowsClockwise, Infinity as InfinityIcon, PencilSimple, Eye, Trash } from '@phosphor-icons/react';

const MinigameManagement: React.FC = () => {
    const navigate = useNavigate();
    const [minigames, setMinigames] = useState<Array<{ minigame: MiniGame; activity: ActivityResponse }>>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'ONGOING' | 'UPCOMING' | 'ENDED'>('ONGOING');

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
            
        if (!matchesSearch) return false;
        
        const now = new Date();
        const start = new Date(activity.startDate);
        const end = new Date(activity.endDate);
        
        if (activeTab === 'ONGOING') {
            return now >= start && now <= end;
        }
        if (activeTab === 'UPCOMING') {
            return now < start;
        }
        if (activeTab === 'ENDED') {
            return now > end;
        }
        return true;
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
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <WarningCircle weight="duotone" className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Có lỗi xảy ra</h2>
                <p className="text-gray-500 mb-6 max-w-md">{error}</p>
                <button
                    onClick={loadMinigames}
                    className="bg-[#001C44] hover:bg-[#002A66] text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
                >
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-12">
            {/* Premium Header */}
            <div className="relative overflow-hidden bg-[#001C44] rounded-2xl p-8 text-white shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-x-1/2 -translate-y-1/2 animate-blob"></div>
                <div className="absolute bottom-0 right-32 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-y-1/2 animate-blob animation-delay-2000"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                            <GameController weight="duotone" className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1 tracking-tight">Quản lý Mini Game</h1>
                            <p className="text-blue-100 text-lg">Thiết lập và quản lý các bài quiz tương tác</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        <Link
                            to="/manager/minigames/create-quiz"
                            className="px-5 py-2.5 bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 font-medium transition-all flex items-center backdrop-blur-sm"
                        >
                            <Copy className="w-4 h-4 mr-2" />
                            Tạo từ Activity
                        </Link>
                        <Link
                            to="/manager/minigames/create"
                            className="px-5 py-2.5 bg-white text-[#001C44] rounded-xl hover:bg-gray-50 active:scale-[0.98] font-bold transition-all flex items-center shadow-lg shadow-white/10"
                        >
                            <Plus weight="bold" className="w-4 h-4 mr-2" />
                            Tạo Mini Game mới
                        </Link>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex p-1 space-x-1 bg-gray-100/80 rounded-xl border border-gray-200/50 w-full md:w-auto overflow-x-auto hide-scrollbar">
                    {(['ONGOING', 'UPCOMING', 'ENDED'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 md:flex-none whitespace-nowrap px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                                activeTab === tab
                                    ? 'bg-white text-[#001C44] shadow-sm border border-gray-200/50'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                            }`}
                        >
                            {tab === 'ONGOING' ? 'Đang diễn ra' : tab === 'UPCOMING' ? 'Sắp diễn ra' : 'Đã kết thúc'}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-80 shrink-0">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <MagnifyingGlass weight="bold" className="w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm kiếm minigame..."
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001C44]/20 focus:border-[#001C44] transition-all shadow-sm text-sm"
                    />
                </div>
            </div>

            {/* Minigames List */}
            {filteredMinigames.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 bg-gray-50 rounded-2xl border border-gray-200 border-dashed text-center">
                    <GameController weight="duotone" className="w-16 h-16 text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Chưa có minigame {activeTab === 'ONGOING' ? 'đang diễn ra' : activeTab === 'UPCOMING' ? 'sắp diễn ra' : 'nào'}</h3>
                    <p className="text-gray-500 max-w-md mb-6">
                        Bạn chưa tạo minigame nào hoặc không có kết quả phù hợp với tìm kiếm.
                    </p>
                    <Link
                        to="/manager/minigames/create"
                        className="inline-flex items-center px-5 py-2.5 bg-[#001C44] text-white rounded-xl hover:bg-[#002A66] font-medium transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Tạo minigame đầu tiên
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredMinigames.map(({ minigame, activity }) => (
                        <div
                            key={minigame.id}
                            className="group flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                            <div className="flex items-start gap-4 flex-1">
                                <div className="w-12 h-12 rounded-xl bg-[#001C44]/5 flex items-center justify-center flex-shrink-0 text-[#001C44]">
                                    <GameController weight="fill" className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight">
                                        {minigame.title}
                                    </h3>
                                    
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-gray-500">
                                        <Link
                                            to={`/manager/events/${activity.id}`}
                                            className="flex items-center text-blue-600 hover:text-blue-700 font-medium hover:underline"
                                        >
                                            <CalendarBlank className="w-4 h-4 mr-1.5" />
                                            {activity.name}
                                        </Link>
                                        
                                        {activity.seriesId && (
                                            <Link
                                                to={`/manager/series/${activity.seriesId}`}
                                                className="flex items-center text-purple-600 hover:text-purple-700 font-medium hover:underline"
                                            >
                                                <Stack className="w-4 h-4 mr-1.5" />
                                                Chuỗi sự kiện
                                            </Link>
                                        )}
                                        
                                        <span className="flex items-center">
                                            <ChartBar className="w-4 h-4 mr-1.5 text-gray-400" />
                                            {minigame.questionCount} câu hỏi
                                        </span>
                                        
                                        {minigame.timeLimit && (
                                            <span className="flex items-center">
                                                <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                                                {Math.floor(minigame.timeLimit / 60)} phút
                                            </span>
                                        )}
                                        
                                        <span className="flex items-center">
                                            {minigame.maxAttempts ? <ArrowsClockwise className="w-4 h-4 mr-1.5 text-gray-400" /> : <InfinityIcon className="w-4 h-4 mr-1.5 text-gray-400" />}
                                            {minigame.maxAttempts ? `${minigame.maxAttempts} lần thử` : 'Không giới hạn'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions - visible on hover for desktop, always on mobile */}
                            <div className="flex items-center gap-2 mt-4 md:mt-0 ml-0 md:ml-6 md:opacity-0 md:group-hover:opacity-100 transition-opacity w-full md:w-auto">
                                <Link
                                    to={`/manager/events/${activity.id}`}
                                    className="flex-1 md:flex-none flex items-center justify-center p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip"
                                    title="Xem Activity"
                                >
                                    <Eye className="w-5 h-5" />
                                </Link>
                                <Link
                                    to={`/manager/minigames/edit/${minigame.id}`}
                                    className="flex-1 md:flex-none flex items-center justify-center p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors tooltip"
                                    title="Chỉnh sửa"
                                >
                                    <PencilSimple className="w-5 h-5" />
                                </Link>
                                <button
                                    onClick={() => handleDelete(minigame.id, minigame.title)}
                                    className="flex-1 md:flex-none flex items-center justify-center p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip"
                                    title="Xóa"
                                >
                                    <Trash className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MinigameManagement;


