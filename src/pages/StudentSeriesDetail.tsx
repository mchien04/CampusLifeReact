import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { seriesAPI } from '../services/seriesAPI';
import { SeriesResponse, StudentSeriesProgress } from '../types/series';
import { ActivityResponse } from '../types/activity';
import { LoadingSpinner } from '../components/common';
import { SeriesProgress, MilestoneDisplay, SeriesProgressBanner } from '../components/series';
import { SeriesActivityList } from '../components/series';
import StudentLayout from '../components/layout/StudentLayout';
import { toast } from 'react-toastify';
import { ScoreType } from '../types/activity';

const StudentSeriesDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [series, setSeries] = useState<SeriesResponse | null>(null);
    const [activities, setActivities] = useState<ActivityResponse[]>([]);
    const [progress, setProgress] = useState<StudentSeriesProgress | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRegistered, setIsRegistered] = useState(false);

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
                await loadRegistrationAndProgress(seriesResponse.data.id);
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

    const loadRegistrationAndProgress = async (seriesId: number) => {
        try {
            const [registrationResponse, progressResponse] = await Promise.all([
                seriesAPI.getMySeriesRegistrationStatus(seriesId),
                seriesAPI.getMySeriesProgress(seriesId)
            ]);

            // Update registration flag based on new API
            if (registrationResponse.status && registrationResponse.data) {
                setIsRegistered(registrationResponse.data.isRegistered);
            } else {
                setIsRegistered(false);
            }

            // Update progress info (may be undefined if chưa có)
            if (progressResponse.status && progressResponse.data) {
                setProgress(progressResponse.data);
            } else {
                setProgress(null);
            }
        } catch (err) {
            console.error('Error loading registration/progress:', err);
            setIsRegistered(false);
            setProgress(null);
        }
    };

    const handleRegister = async () => {
        if (!series) return;

        try {
            const response = await seriesAPI.registerForSeries(series.id);
            if (response.status) {
                toast.success(response.message || 'Đăng ký thành công!');
                await loadRegistrationAndProgress(series.id);
            } else {
                toast.error(response.message || 'Đăng ký thất bại');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi đăng ký');
            console.error('Error registering for series:', err);
        }
    };

    const canRegister = () => {
        if (!series || isRegistered) return false;
        const now = new Date();
        if (series.registrationStartDate && new Date(series.registrationStartDate) > now) {
            return false;
        }
        if (series.registrationDeadline && new Date(series.registrationDeadline) < now) {
            return false;
        }
        return true;
    };

    if (loading) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <LoadingSpinner />
                </div>
            </StudentLayout>
        );
    }

    if (error || !series) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="text-red-600 text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-[#001C44] mb-2">Có lỗi xảy ra</h2>
                        <p className="text-gray-600 mb-6">{error || 'Không tìm thấy chuỗi sự kiện'}</p>
                        <button
                            onClick={() => navigate('/student/series')}
                            className="btn-primary px-6 py-3 rounded-lg font-medium"
                        >
                            Quay lại danh sách
                        </button>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    const getScoreTypeLabel = (type: ScoreType) => {
        const labels: Record<ScoreType, string> = {
            [ScoreType.REN_LUYEN]: 'Rèn luyện',
            [ScoreType.CONG_TAC_XA_HOI]: 'Công tác xã hội',
            [ScoreType.CHUYEN_DE]: 'Chuyên đề'
        };
        return labels[type] || type;
    };

    return (
        <StudentLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-xl p-6 text-white mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{series.name}</h1>
                            <p className="text-gray-200">{series.description}</p>
                        </div>
                        <button
                            onClick={() => navigate('/student/series')}
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                        >
                            ← Quay lại
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Progress Banner */}
                        {isRegistered && progress && (
                            <SeriesProgressBanner progress={progress} />
                        )}

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
                                            Mở đăng ký:{' '}
                                            {new Date(series.registrationStartDate).toLocaleString('vi-VN')}
                                        </span>
                                    </div>
                                )}
                                {series.registrationDeadline && (
                                    <div className="flex items-center">
                                        <span className="w-4 h-4 mr-2">⏰</span>
                                        <span className="text-gray-600">
                                            Hạn đăng ký:{' '}
                                            {new Date(series.registrationDeadline).toLocaleString('vi-VN')}
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
                            canManage={false} 
                        />
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Progress */}
                        {isRegistered && progress && (
                            <SeriesProgress series={series} progress={progress} />
                        )}

                        {/* Milestone Display */}
                        {isRegistered && progress && (
                            <MilestoneDisplay
                                milestonePoints={progress.milestonePoints || series.milestonePoints}
                                scoreType={progress.scoreType || series.scoreType}
                                completedCount={progress.completedCount}
                                currentPoints={progress.pointsEarned}
                                currentMilestone={progress.currentMilestone}
                                nextMilestoneCount={progress.nextMilestoneCount}
                                nextMilestonePoints={progress.nextMilestonePoints}
                            />
                        )}

                        {/* Registration */}
                        {!isRegistered && canRegister() && (
                            <div className="card p-6">
                                <h3 className="text-lg font-semibold text-[#001C44] mb-4">Đăng ký</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Đăng ký để tham gia tất cả các sự kiện trong chuỗi này và nhận điểm milestone
                                </p>
                                <button
                                    onClick={handleRegister}
                                    className="w-full btn-yellow px-4 py-2 rounded-lg text-sm font-medium"
                                >
                                    Đăng ký chuỗi sự kiện
                                </button>
                            </div>
                        )}

                        {isRegistered && (
                            <div className="card p-6">
                                <div className="text-center">
                                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                                        ✅ Đã đăng ký
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
};

export default StudentSeriesDetail;

