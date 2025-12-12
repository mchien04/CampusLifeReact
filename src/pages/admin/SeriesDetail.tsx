import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { seriesAPI } from '../../services/seriesAPI';
import { eventAPI } from '../../services/eventAPI';
import { SeriesResponse, CreateActivityInSeriesRequest } from '../../types/series';
import { ActivityResponse } from '../../types/activity';
import { LoadingSpinner } from '../../components/common';
import { SeriesActivityList, MilestoneDisplay } from '../../components/series';
import { toast } from 'react-toastify';
import { ScoreType } from '../../types/activity';
import SeriesActivityForm from '../../components/events/SeriesActivityForm';
import QuizForm from '../../components/minigame/QuizForm';
import { minigameAPI } from '../../services/minigameAPI';
import { CreateMiniGameRequest, UpdateMiniGameRequest } from '../../types/minigame';

const SeriesDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [series, setSeries] = useState<SeriesResponse | null>(null);
    const [activities, setActivities] = useState<ActivityResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddActivityModal, setShowAddActivityModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [activityType, setActivityType] = useState<'normal' | 'minigame' | null>(null);
    const [createdActivityId, setCreatedActivityId] = useState<number | null>(null);
    const [showQuizForm, setShowQuizForm] = useState(false);
    const [createdActivity, setCreatedActivity] = useState<ActivityResponse | null>(null);
    const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);

    useEffect(() => {
        if (id) {
            loadSeries();
        }
    }, [id]);

    const loadSeries = async () => {
        if (!id) return;

        try {
            setLoading(true);
            const seriesId = parseInt(id);
            
            // Load series info and activities in parallel
            const [seriesResponse, activitiesResponse] = await Promise.all([
                seriesAPI.getSeriesById(seriesId),
                seriesAPI.getSeriesActivities(seriesId)
            ]);

            if (seriesResponse.status && seriesResponse.data) {
                setSeries(seriesResponse.data);
            } else {
                setError(seriesResponse.message || 'Không thể tải thông tin chuỗi sự kiện');
            }

            if (activitiesResponse.status && activitiesResponse.data) {
                setActivities(activitiesResponse.data);
            } else {
                console.warn('Could not load activities:', activitiesResponse.message);
                setActivities([]);
            }
        } catch (err) {
            setError('Có lỗi xảy ra khi tải thông tin chuỗi sự kiện');
            console.error('Error loading series:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateActivity = async (data: CreateActivityInSeriesRequest) => {
        if (!id) return;

        try {
            setIsCreating(true);
            // If creating minigame, ensure type field is set to MINIGAME
            const requestData: CreateActivityInSeriesRequest = activityType === 'minigame' 
                ? { ...data, type: "MINIGAME" as const }
                : data;
            
            const response = await seriesAPI.createActivityInSeries(parseInt(id), requestData);
            if (response.status && response.data) {
                if (activityType === 'minigame') {
                    // Save activity ID and show quiz form
                    setCreatedActivityId(response.data.id);
                    setCreatedActivity(response.data);
                    setShowQuizForm(true);
                    toast.success('Tạo sự kiện minigame thành công! Bây giờ hãy tạo quiz.');
                } else {
                    toast.success('Tạo sự kiện trong chuỗi thành công!');
                    setShowAddActivityModal(false);
                    setActivityType(null);
                    // Reload both series and activities
                    await loadSeries();
                }
            } else {
                toast.error(response.message || 'Tạo sự kiện thất bại');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo sự kiện');
            console.error('Error creating activity:', err);
        } finally {
            setIsCreating(false);
        }
    };

    const handleCreateQuiz = async (data: CreateMiniGameRequest | UpdateMiniGameRequest) => {
        if (!createdActivityId) return;

        try {
            setIsCreatingQuiz(true);
            // Since we're creating a new quiz, we need CreateMiniGameRequest
            // Ensure all required fields are present and rewardPoints is not included when in series
            const createData = data as CreateMiniGameRequest;
            const quizData: CreateMiniGameRequest = {
                activityId: createdActivityId,
                title: createData.title || createdActivity?.name || '',
                description: createData.description,
                questionCount: createData.questionCount || 0,
                timeLimit: createData.timeLimit,
                requiredCorrectAnswers: createData.requiredCorrectAnswers,
                maxAttempts: createData.maxAttempts ?? null,
                questions: createData.questions || []
                // rewardPoints is intentionally omitted for series activities
            };
            
            const response = await minigameAPI.createMiniGame(quizData);
            if (response.status && response.data) {
                toast.success('Tạo quiz thành công!');
                setShowAddActivityModal(false);
                setShowQuizForm(false);
                setActivityType(null);
                setCreatedActivityId(null);
                setCreatedActivity(null);
                // Reload both series and activities
                await loadSeries();
            } else {
                toast.error(response.message || 'Tạo quiz thất bại');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo quiz');
            console.error('Error creating quiz:', err);
        } finally {
            setIsCreatingQuiz(false);
        }
    };

    const handleCloseModal = () => {
        setShowAddActivityModal(false);
        setShowQuizForm(false);
        setActivityType(null);
        setCreatedActivityId(null);
        setCreatedActivity(null);
    };

    const getScoreTypeLabel = (type: ScoreType) => {
        const labels: Record<ScoreType, string> = {
            [ScoreType.REN_LUYEN]: 'Rèn luyện',
            [ScoreType.CONG_TAC_XA_HOI]: 'Công tác xã hội',
            [ScoreType.CHUYEN_DE]: 'Chuyên đề'
        };
        return labels[type] || type;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner />
            </div>
        );
    }

    if (error || !series) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="text-red-600 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-[#001C44] mb-2">Có lỗi xảy ra</h2>
                    <p className="text-gray-600 mb-6">{error || 'Không tìm thấy chuỗi sự kiện'}</p>
                    <button
                        onClick={() => navigate('/manager/series')}
                        className="btn-primary px-6 py-3 rounded-lg font-medium"
                    >
                        Quay lại danh sách
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
                    <h1 className="text-3xl font-bold text-[#001C44]">{series.name}</h1>
                    <p className="text-gray-600 mt-1">{series.description}</p>
                </div>
                <div className="flex space-x-3">
                    <Link
                        to={`/manager/series/${id}/edit`}
                        className="btn-primary px-4 py-2 rounded-lg text-sm font-medium"
                    >
                        Chỉnh sửa
                    </Link>
                    <button
                        onClick={() => navigate('/manager/series')}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Quay lại
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Series Info */}
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold text-[#001C44] mb-4">Thông tin chuỗi sự kiện</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center">
                                <span className="w-4 h-4 mr-2">📋</span>
                                <span className="text-gray-600">
                                    {activities.length || series.totalActivities || 0} sự kiện trong chuỗi
                                </span>
                            </div>
                            <div className="flex items-center">
                                <span className="w-4 h-4 mr-2">⭐</span>
                                <span className="text-gray-600">
                                    Loại điểm: {getScoreTypeLabel(series.scoreType)}
                                </span>
                            </div>
                            {series.registrationStartDate && (
                                <div className="flex items-center">
                                    <span className="w-4 h-4 mr-2">🚀</span>
                                    <span className="text-gray-600">
                                        Mở đăng ký: {new Date(series.registrationStartDate).toLocaleString('vi-VN')}
                                    </span>
                                </div>
                            )}
                            {series.registrationDeadline && (
                                <div className="flex items-center">
                                    <span className="w-4 h-4 mr-2">⏰</span>
                                    <span className="text-gray-600">
                                        Hạn đăng ký: {new Date(series.registrationDeadline).toLocaleString('vi-VN')}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center">
                                <span className="w-4 h-4 mr-2">📝</span>
                                <span className="text-gray-600">
                                    {series.requiresApproval ? 'Đăng ký cần duyệt' : 'Đăng ký tự duyệt'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Activities List */}
                    <SeriesActivityList
                        series={{
                            ...series,
                            activities: activities
                        }}
                        onAddActivity={() => setShowAddActivityModal(true)}
                        canManage={true}
                    />
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Milestone Display */}
                    <MilestoneDisplay
                        milestonePoints={series.milestonePoints}
                        scoreType={series.scoreType}
                        completedCount={0}
                    />
                </div>
            </div>

            {/* Add Activity Modal */}
            {showAddActivityModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-[#001C44]">
                                    {showQuizForm ? 'Tạo Quiz' : 'Thêm sự kiện vào chuỗi'}
                                </h3>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                            
                            {/* Step Indicator */}
                            {activityType === 'minigame' && (
                                <div className="flex items-center space-x-2 mb-4">
                                    <div className={`flex items-center ${showQuizForm ? 'text-gray-400' : 'text-[#001C44]'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                                            showQuizForm ? 'bg-gray-200' : 'bg-[#001C44] text-white'
                                        }`}>
                                            1
                                        </div>
                                        <span className="ml-2 text-sm">Thông tin activity</span>
                                    </div>
                                    <div className="flex-1 h-0.5 bg-gray-200">
                                        <div className={`h-full transition-all ${showQuizForm ? 'bg-[#001C44] w-full' : 'w-0'}`}></div>
                                    </div>
                                    <div className={`flex items-center ${showQuizForm ? 'text-[#001C44]' : 'text-gray-400'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                                            showQuizForm ? 'bg-[#001C44] text-white' : 'bg-gray-200'
                                        }`}>
                                            2
                                        </div>
                                        <span className="ml-2 text-sm">Tạo quiz</span>
                                    </div>
                                </div>
                            )}

                            {/* Activity Type Selection */}
                            {!activityType && !showQuizForm && (
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setActivityType('normal')}
                                        className="p-6 border-2 border-gray-300 rounded-lg hover:border-[#001C44] hover:bg-[#001C44] hover:text-white transition-all text-left group"
                                    >
                                        <div className="text-4xl mb-2">📅</div>
                                        <h4 className="font-semibold text-lg mb-1">Tạo sự kiện thường</h4>
                                        <p className="text-sm text-gray-600 group-hover:text-gray-200">
                                            Tạo sự kiện hoạt động thông thường trong chuỗi
                                        </p>
                                    </button>
                                    <button
                                        onClick={() => setActivityType('minigame')}
                                        className="p-6 border-2 border-gray-300 rounded-lg hover:border-[#001C44] hover:bg-[#001C44] hover:text-white transition-all text-left group"
                                    >
                                        <div className="text-4xl mb-2">🎮</div>
                                        <h4 className="font-semibold text-lg mb-1">Tạo minigame</h4>
                                        <p className="text-sm text-gray-600 group-hover:text-gray-200">
                                            Tạo quiz/minigame với câu hỏi và đáp án
                                        </p>
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="p-6">
                            {showQuizForm && createdActivity ? (
                                <QuizForm
                                    activity={createdActivity}
                                    onSubmit={handleCreateQuiz}
                                    loading={isCreatingQuiz}
                                    isInSeries={true}
                                    title=""
                                    onCancel={() => {
                                        setShowQuizForm(false);
                                        setCreatedActivityId(null);
                                        setCreatedActivity(null);
                                    }}
                                />
                            ) : activityType && (
                                <SeriesActivityForm
                                    onSubmit={handleCreateActivity}
                                    loading={isCreating}
                                    isMinigame={activityType === 'minigame'}
                                    initialData={{
                                        order: activities.length > 0 ? Math.max(...activities.map(a => a.seriesOrder || 0), 0) + 1 : 1
                                    }}
                                    title=""
                                    onCancel={() => {
                                        setActivityType(null);
                                        if (!showQuizForm) {
                                            handleCloseModal();
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SeriesDetail;

