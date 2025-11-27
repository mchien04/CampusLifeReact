import React, { useState, useEffect } from 'react';
import { eventAPI } from '../services/eventAPI';
import { minigameAPI } from '../services/minigameAPI';
import { ActivityResponse, ActivityType } from '../types/activity';
import { MiniGame } from '../types/minigame';
import { LoadingSpinner } from '../components/common';
import { QuizCard } from '../components/minigame';
import StudentLayout from '../components/layout/StudentLayout';
import { useNavigate } from 'react-router-dom';

const StudentMinigame: React.FC = () => {
    const navigate = useNavigate();
    const [minigames, setMinigames] = useState<Array<{ minigame: MiniGame; activity: ActivityResponse }>>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [attemptsMap, setAttemptsMap] = useState<Map<number, boolean>>(new Map());

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

                            // Check if student has attempts
                            const attemptsResponse = await minigameAPI.getMyAttempts(minigameResponse.data.id);
                            if (attemptsResponse.status && attemptsResponse.data && attemptsResponse.data.length > 0) {
                                setAttemptsMap(prev => new Map(prev.set(activity.id, true)));
                            }
                        }
                    } catch (err) {
                        console.error(`Error loading minigame for activity ${activity.id}:`, err);
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

    const handleStart = (activityId: number) => {
        navigate(`/student/minigames/${activityId}/play`);
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
            <StudentLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <LoadingSpinner />
                </div>
            </StudentLayout>
        );
    }

    if (error) {
        return (
            <StudentLayout>
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
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-xl p-6 text-white mb-6">
                    <h1 className="text-3xl font-bold mb-2">Mini Game Quiz</h1>
                    <p className="text-gray-200">
                        Thử thách bản thân với các bài quiz kiến thức và nhận điểm thưởng
                    </p>
                </div>

                {/* Search */}
                <div className="card p-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tìm kiếm
                        </label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm kiếm quiz..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                        />
                    </div>
                </div>

                {/* Minigames List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMinigames.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <div className="text-gray-400 text-6xl mb-4">🎮</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có quiz nào</h3>
                            <p className="text-gray-500">
                                Không tìm thấy quiz phù hợp với bộ lọc của bạn.
                            </p>
                        </div>
                    ) : (
                        filteredMinigames.map(({ minigame, activity }) => (
                            <QuizCard
                                key={minigame.id}
                                minigame={minigame}
                                activity={activity}
                                onStart={handleStart}
                                hasAttempts={attemptsMap.get(activity.id) || false}
                            />
                        ))
                    )}
                </div>
            </div>
        </StudentLayout>
    );
};

export default StudentMinigame;

