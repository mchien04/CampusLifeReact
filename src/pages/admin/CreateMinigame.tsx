import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { eventAPI } from '../../services/eventAPI';
import { minigameAPI } from '../../services/minigameAPI';
import { ActivityResponse, ActivityType } from '../../types/activity';
import { CreateMiniGameRequest } from '../../types/minigame';
import { QuizForm } from '../../components/minigame';
import { LoadingSpinner } from '../../components/common';
import { toast } from 'react-toastify';

const CreateMinigame: React.FC = () => {
    const navigate = useNavigate();
    const [activities, setActivities] = useState<ActivityResponse[]>([]);
    const [selectedActivity, setSelectedActivity] = useState<ActivityResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadActivities();
    }, []);

    const loadActivities = async () => {
        try {
            setLoading(true);
            const response = await eventAPI.getEvents();
            if (response.status && response.data) {
                // Filter activities with type MINIGAME that don't have a minigame yet
                const minigameActivities = response.data.filter(a => a.type === ActivityType.MINIGAME);
                
                // Check which ones already have minigames
                const activitiesWithoutMinigame: ActivityResponse[] = [];
                for (const activity of minigameActivities) {
                    try {
                        const minigameResponse = await minigameAPI.getMiniGameByActivity(activity.id);
                        // If status is true and has data, it has a minigame, skip it
                        if (!minigameResponse.status || !minigameResponse.data) {
                            // No minigame, add to list
                            activitiesWithoutMinigame.push(activity);
                        }
                        // If status is true and has data, skip (already has minigame)
                    } catch {
                        // Error occurred, assume no minigame, add to list
                        activitiesWithoutMinigame.push(activity);
                    }
                }

                setActivities(activitiesWithoutMinigame);
                
                if (activitiesWithoutMinigame.length === 0) {
                    setError('Không có activity nào với type MINIGAME chưa có quiz. Vui lòng tạo activity với type MINIGAME trước.');
                }
            } else {
                setError('Không thể tải danh sách activities');
            }
        } catch (err) {
            setError('Có lỗi xảy ra khi tải danh sách activities');
            console.error('Error loading activities:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleActivitySelect = (activityId: number) => {
        const activity = activities.find(a => a.id === activityId);
        setSelectedActivity(activity || null);
    };

    const handleSubmit = async (data: CreateMiniGameRequest) => {
        setSaving(true);
        try {
            const response = await minigameAPI.createMiniGame(data);
            if (response.status && response.data) {
                toast.success('Tạo minigame thành công!');
                navigate('/manager/minigames');
            } else {
                toast.error(response.message || 'Tạo minigame thất bại');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo minigame');
            console.error('Error creating minigame:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        navigate('/manager/minigames');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner />
            </div>
        );
    }

    if (error && activities.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="text-red-600 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-[#001C44] mb-2">Có lỗi xảy ra</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/manager/minigames')}
                        className="btn-primary px-6 py-3 rounded-lg font-medium"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    if (!selectedActivity) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-[#001C44]">Tạo Mini Game</h1>
                        <p className="text-gray-600 mt-1">Chọn activity để tạo quiz hoặc tạo mới hoàn toàn</p>
                    </div>
                    <div className="flex space-x-3">
                        <Link
                            to="/manager/minigames/create"
                            className="px-4 py-2 bg-[#001C44] text-white rounded-lg hover:bg-[#002A66] transition-colors"
                        >
                            Tạo mới hoàn toàn
                        </Link>
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Quay lại
                        </button>
                    </div>
                </div>

                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-[#001C44] mb-4">Chọn Activity</h3>
                    {activities.length === 0 ? (
                        <p className="text-gray-500">
                            Không có activity nào với type MINIGAME chưa có quiz. Vui lòng tạo activity với type MINIGAME trước.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {activities.map((activity) => (
                                <button
                                    key={activity.id}
                                    onClick={() => handleActivitySelect(activity.id)}
                                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#001C44] transition-colors"
                                >
                                    <div className="font-medium text-gray-900">{activity.name}</div>
                                    {activity.description && (
                                        <div className="text-sm text-gray-500 mt-1">{activity.description}</div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <QuizForm
                activity={selectedActivity}
                onSubmit={handleSubmit}
                loading={saving}
                title="Tạo Quiz"
                onCancel={handleCancel}
            />
        </div>
    );
};

export default CreateMinigame;

