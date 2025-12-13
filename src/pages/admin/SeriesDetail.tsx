import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { seriesAPI } from '../../services/seriesAPI';
import { eventAPI } from '../../services/eventAPI';
import { SeriesResponse, CreateActivityInSeriesRequest, SeriesOverviewResponse, SeriesProgressListResponse } from '../../types/series';
import { ActivityResponse } from '../../types/activity';
import { LoadingSpinner } from '../../components/common';
import { SeriesActivityList } from '../../components/series';
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

    // Overview and Progress states
    const [overview, setOverview] = useState<SeriesOverviewResponse | null>(null);
    const [progress, setProgress] = useState<SeriesProgressListResponse | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'progress'>('overview');
    const [progressPage, setProgressPage] = useState(0);
    const [progressSize] = useState(20);
    const [progressKeyword, setProgressKeyword] = useState('');
    const [debouncedKeyword, setDebouncedKeyword] = useState('');
    const [loadingOverview, setLoadingOverview] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(false);
    const searchDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (id) {
            loadSeries();
            loadOverview();
        }
    }, [id]);

    // Debounce search keyword
    useEffect(() => {
        if (searchDebounceTimerRef.current) {
            clearTimeout(searchDebounceTimerRef.current);
        }

        searchDebounceTimerRef.current = setTimeout(() => {
            setDebouncedKeyword(progressKeyword);
        }, 400);

        return () => {
            if (searchDebounceTimerRef.current) {
                clearTimeout(searchDebounceTimerRef.current);
            }
        };
    }, [progressKeyword]);

    useEffect(() => {
        if (id && activeTab === 'progress') {
            loadProgress();
        }
    }, [id, activeTab, progressPage, debouncedKeyword]);

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

    const loadOverview = async () => {
        if (!id) return;

        try {
            setLoadingOverview(true);
            const seriesId = parseInt(id);
            const response = await seriesAPI.getSeriesOverview(seriesId);

            if (response.status && response.data) {
                setOverview(response.data);
            } else {
                console.warn('Could not load overview:', response.message);
            }
        } catch (err) {
            console.error('Error loading overview:', err);
        } finally {
            setLoadingOverview(false);
        }
    };

    const loadProgress = async () => {
        if (!id) return;

        try {
            setLoadingProgress(true);
            const seriesId = parseInt(id);
            const response = await seriesAPI.getSeriesProgress(seriesId, {
                page: progressPage,
                size: progressSize,
                keyword: debouncedKeyword || undefined
            });

            if (response.status && response.data) {
                setProgress(response.data);
            } else {
                console.warn('Could not load progress:', response.message);
            }
        } catch (err) {
            console.error('Error loading progress:', err);
        } finally {
            setLoadingProgress(false);
        }
    };

    const handleSearchChange = (value: string) => {
        setProgressKeyword(value);
        setProgressPage(0); // Reset to first page when searching
        // Debounced keyword will be set by useEffect, which will trigger loadProgress
    };

    const handlePageChange = (newPage: number) => {
        setProgressPage(newPage);
    };

    // Helper functions
    const formatPercentage = (value: number): string => {
        return (value * 100).toFixed(1) + '%';
    };

    const formatBigDecimal = (value: string): string => {
        return parseFloat(value).toFixed(2);
    };

    const formatDate = (date: string): string => {
        return new Date(date).toLocaleString('vi-VN');
    };

    const getCompletionRateColor = (rate: number): string => {
        if (rate >= 0.8) return 'text-green-600';
        if (rate >= 0.5) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getMilestoneColor = (milestoneKey: string): string => {
        const colors: Record<string, string> = {
            '3': 'bg-blue-100 text-blue-800',
            '4': 'bg-purple-100 text-purple-800',
            '5': 'bg-green-100 text-green-800'
        };
        return colors[milestoneKey] || 'bg-gray-100 text-gray-800';
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
            <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center mb-2">
                            <span className="mr-3 text-4xl">📋</span>
                            <h1 className="text-3xl font-bold">{series.name}</h1>
                        </div>
                        {series.description && (
                            <p className="text-gray-200 text-lg ml-12">{series.description}</p>
                        )}
                    </div>
                    <div className="flex space-x-3 ml-4">
                        <Link
                            to={`/manager/series/${id}/edit`}
                            className="px-5 py-2.5 bg-[#FFD66D] text-[#001C44] rounded-lg hover:bg-[#FFC947] font-semibold shadow-lg hover:shadow-xl transition-all"
                        >
                            ✏️ Chỉnh sửa
                        </Link>
                        <button
                            onClick={() => navigate('/manager/series')}
                            className="px-5 py-2.5 bg-white/20 text-white rounded-lg hover:bg-white/30 font-semibold transition-all backdrop-blur-sm"
                        >
                            ← Quay lại
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Series Info */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                        <h3 className="text-xl font-bold text-[#001C44] mb-6 flex items-center">
                            <span className="mr-2 text-2xl">ℹ️</span>
                            Thông tin chuỗi sự kiện
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start p-4 bg-blue-50 rounded-lg">
                                <span className="text-2xl mr-3">📋</span>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Số sự kiện</div>
                                    <div className="text-lg font-semibold text-[#001C44]">
                                        {activities.length || series.totalActivities || 0} sự kiện
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-start p-4 bg-purple-50 rounded-lg">
                                <span className="text-2xl mr-3">⭐</span>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Loại điểm</div>
                                    <div className="text-lg font-semibold text-[#001C44]">
                                        {getScoreTypeLabel(series.scoreType)}
                                    </div>
                                </div>
                            </div>
                            {series.registrationStartDate && (
                                <div className="flex items-start p-4 bg-green-50 rounded-lg">
                                    <span className="text-2xl mr-3">🚀</span>
                                    <div>
                                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Mở đăng ký</div>
                                        <div className="text-sm font-medium text-gray-700">
                                            {new Date(series.registrationStartDate).toLocaleString('vi-VN')}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {series.registrationDeadline && (
                                <div className="flex items-start p-4 bg-yellow-50 rounded-lg">
                                    <span className="text-2xl mr-3">⏰</span>
                                    <div>
                                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Hạn đăng ký</div>
                                        <div className="text-sm font-medium text-gray-700">
                                            {new Date(series.registrationDeadline).toLocaleString('vi-VN')}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-start p-4 bg-gray-50 rounded-lg md:col-span-2">
                                <span className="text-2xl mr-3">📝</span>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Trạng thái duyệt</div>
                                    <div className="text-sm font-medium text-gray-700">
                                        {series.requiresApproval ? 'Đăng ký cần duyệt' : 'Đăng ký tự duyệt'}
                                    </div>
                                </div>
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
                    {/* Tab Navigation */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="flex border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`flex-1 px-4 py-3 text-sm font-semibold transition-all ${activeTab === 'overview'
                                        ? 'bg-[#001C44] text-white shadow-md'
                                        : 'text-gray-600 hover:bg-white hover:text-[#001C44]'
                                    }`}
                            >
                                📊 Tổng quan
                            </button>
                            <button
                                onClick={() => setActiveTab('progress')}
                                className={`flex-1 px-4 py-3 text-sm font-semibold transition-all ${activeTab === 'progress'
                                        ? 'bg-[#001C44] text-white shadow-md'
                                        : 'text-gray-600 hover:bg-white hover:text-[#001C44]'
                                    }`}
                            >
                                👥 Tiến độ
                            </button>
                        </div>

                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="p-6">
                                {loadingOverview ? (
                                    <div className="flex items-center justify-center py-8">
                                        <LoadingSpinner />
                                    </div>
                                ) : overview ? (
                                    <div className="space-y-6">
                                        {/* Statistics Cards */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                                                <div className="text-2xl font-bold text-[#001C44]">
                                                    {overview.totalActivities}
                                                </div>
                                                <div className="text-sm text-gray-600 mt-1">Sự kiện</div>
                                            </div>
                                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                                                <div className="text-2xl font-bold text-[#001C44]">
                                                    {overview.totalRegisteredStudents}
                                                </div>
                                                <div className="text-sm text-gray-600 mt-1">Đã đăng ký</div>
                                            </div>
                                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                                                <div className="text-2xl font-bold text-[#001C44]">
                                                    {overview.totalCompletedStudents}
                                                </div>
                                                <div className="text-sm text-gray-600 mt-1">
                                                    Đã hoàn thành
                                                    <span className={`ml-2 font-semibold ${getCompletionRateColor(overview.completionRate)}`}>
                                                        {formatPercentage(overview.completionRate)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
                                                <div className="text-2xl font-bold text-[#001C44]">
                                                    {formatBigDecimal(overview.totalMilestonePointsAwarded)}
                                                </div>
                                                <div className="text-sm text-gray-600 mt-1">Điểm đã trao</div>
                                            </div>
                                        </div>

                                        {/* Milestone Progress */}
                                        {overview.milestoneProgress && overview.milestoneProgress.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                                    Phân bố theo Milestone
                                                </h4>
                                                <div className="space-y-3">
                                                    {overview.milestoneProgress.map((milestone) => (
                                                        <div key={milestone.milestoneKey} className="space-y-1">
                                                            <div className="flex items-center justify-between text-sm">
                                                                <span className="font-medium">
                                                                    Milestone {milestone.milestoneKey} ({milestone.milestoneCount} sự kiện)
                                                                </span>
                                                                <span className="text-gray-600">
                                                                    {milestone.studentCount} SV ({formatPercentage(milestone.percentage / 100)})
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className="bg-[#001C44] h-2 rounded-full transition-all"
                                                                    style={{ width: `${milestone.percentage}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Activity Stats */}
                                        {overview.activityStats && overview.activityStats.length > 0 && (
                                            <div>
                                                <h4 className="text-base font-bold text-[#001C44] mb-4 flex items-center">
                                                    <span className="mr-2 text-xl">📊</span>
                                                    Thống kê từng Activity
                                                </h4>
                                                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                                                    {overview.activityStats.map((activity, index) => {
                                                        const participationColor = activity.participationRate >= 0.8 
                                                            ? 'bg-green-500' 
                                                            : activity.participationRate >= 0.5 
                                                            ? 'bg-yellow-500' 
                                                            : 'bg-red-500';
                                                        
                                                        return (
                                                            <div 
                                                                key={activity.activityId} 
                                                                className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all hover:border-[#001C44]"
                                                            >
                                                                <div className="flex items-start justify-between mb-3">
                                                                    <div className="flex items-start flex-1">
                                                                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-[#001C44] to-[#002A66] rounded-lg flex items-center justify-center text-white font-bold text-sm mr-3">
                                                                            {activity.order || index + 1}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="font-semibold text-sm text-[#001C44] mb-1 line-clamp-2">
                                                                                {activity.activityName}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="grid grid-cols-2 gap-3 mb-3">
                                                                    <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-100">
                                                                        <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Đăng ký</div>
                                                                        <div className="text-lg font-bold text-[#001C44]">
                                                                            {activity.registrationCount}
                                                                        </div>
                                                                    </div>
                                                                    <div className="bg-green-50 rounded-lg p-2.5 border border-green-100">
                                                                        <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Tham gia</div>
                                                                        <div className="text-lg font-bold text-[#001C44]">
                                                                            {activity.participationCount}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <div className="flex items-center justify-between text-xs">
                                                                        <span className="text-gray-600 font-medium">Tỷ lệ tham gia</span>
                                                                        <span className={`font-bold ${
                                                                            activity.participationRate >= 0.8 
                                                ? 'text-green-600' 
                                                : activity.participationRate >= 0.5 
                                                ? 'text-yellow-600' 
                                                : 'text-red-600'
                                                                        }`}>
                                                                            {formatPercentage(activity.participationRate)}
                                                                        </span>
                                                                    </div>
                                                                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                                                        <div
                                                                            className={`${participationColor} h-2.5 rounded-full transition-all duration-500`}
                                                                            style={{ width: `${activity.participationRate * 100}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500 text-sm">
                                        Không có dữ liệu tổng quan
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Progress Tab */}
                        {activeTab === 'progress' && (
                            <div className="p-6">
                                {loadingProgress ? (
                                    <div className="flex items-center justify-center py-8">
                                        <LoadingSpinner />
                                    </div>
                                ) : progress ? (
                                    <div className="space-y-4">
                                        {/* Search Bar */}
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Tìm kiếm theo tên hoặc mã sinh viên..."
                                                value={progressKeyword}
                                                onChange={(e) => handleSearchChange(e.target.value)}
                                                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-all bg-gray-50 focus:bg-white"
                                            />
                                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">
                                                🔍
                                            </span>
                                        </div>

                                        {/* Progress Info */}
                                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Tổng số sinh viên</div>
                                                    <div className="text-2xl font-bold text-[#001C44]">{progress.totalRegistered}</div>
                                                </div>
                                                <div className="text-4xl opacity-20">👥</div>
                                            </div>
                                        </div>

                                        {/* Progress Table */}
                                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Mã SV</th>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Tên SV</th>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Lớp</th>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Khoa</th>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Hoàn thành</th>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Điểm</th>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Milestone</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {progress.progressList.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={7} className="px-3 py-12 text-center">
                                                                <div className="text-gray-400 text-5xl mb-3">📭</div>
                                                                <p className="text-gray-500 font-medium">Không có dữ liệu</p>
                                                                {progressKeyword && (
                                                                    <p className="text-gray-400 text-sm mt-1">Thử tìm kiếm với từ khóa khác</p>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        progress.progressList.map((item) => (
                                                            <tr key={item.studentId} className="hover:bg-blue-50 transition-colors">
                                                                <td className="px-3 py-3 text-gray-900 font-semibold">{item.studentCode}</td>
                                                                <td className="px-3 py-3 text-gray-900 font-medium">{item.studentName}</td>
                                                                <td className="px-3 py-3 text-gray-600">{item.className || '-'}</td>
                                                                <td className="px-3 py-3 text-gray-600">{item.departmentName || '-'}</td>
                                                                <td className="px-3 py-2">
                                                                    <div className="flex items-center space-x-2">
                                                                        <span className="text-gray-900">
                                                                            {item.completedCount}/{item.totalActivities}
                                                                        </span>
                                                                        <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-[60px]">
                                                                            <div
                                                                                className={`h-1.5 rounded-full ${item.completedCount === item.totalActivities
                                                                                        ? 'bg-green-500'
                                                                                        : 'bg-blue-500'
                                                                                    }`}
                                                                                style={{ width: `${(item.completedCount / item.totalActivities) * 100}%` }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-2 text-gray-900 font-medium">
                                                                    {formatBigDecimal(item.pointsEarned)}
                                                                </td>
                                                                <td className="px-3 py-2">
                                                                    {item.currentMilestone ? (
                                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getMilestoneColor(item.currentMilestone)}`}>
                                                                            Mốc {item.currentMilestone}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-gray-400 text-xs">Chưa đạt</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination */}
                                        {progress.totalPages > 1 && (
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                                <div className="text-sm text-gray-600">
                                                    Trang {progress.page + 1} / {progress.totalPages}
                                                    {progress.totalElements > 0 && (
                                                        <span className="ml-2">
                                                            (Hiển thị {progress.page * progress.size + 1} - {Math.min((progress.page + 1) * progress.size, progress.totalElements)} / {progress.totalElements})
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handlePageChange(progressPage - 1)}
                                                        disabled={progressPage === 0}
                                                        className={`px-3 py-1 text-sm rounded-lg border ${progressPage === 0
                                                                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        Trước
                                                    </button>
                                                    <button
                                                        onClick={() => handlePageChange(progressPage + 1)}
                                                        disabled={progressPage >= progress.totalPages - 1}
                                                        className={`px-3 py-1 text-sm rounded-lg border ${progressPage >= progress.totalPages - 1
                                                                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        Sau
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500 text-sm">
                                        Không có dữ liệu tiến độ
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
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
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${showQuizForm ? 'bg-gray-200' : 'bg-[#001C44] text-white'
                                            }`}>
                                            1
                                        </div>
                                        <span className="ml-2 text-sm">Thông tin activity</span>
                                    </div>
                                    <div className="flex-1 h-0.5 bg-gray-200">
                                        <div className={`h-full transition-all ${showQuizForm ? 'bg-[#001C44] w-full' : 'w-0'}`}></div>
                                    </div>
                                    <div className={`flex items-center ${showQuizForm ? 'text-[#001C44]' : 'text-gray-400'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${showQuizForm ? 'bg-[#001C44] text-white' : 'bg-gray-200'
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

