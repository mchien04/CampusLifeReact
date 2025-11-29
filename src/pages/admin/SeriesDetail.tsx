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

const SeriesDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [series, setSeries] = useState<SeriesResponse | null>(null);
    const [activities, setActivities] = useState<ActivityResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddActivityModal, setShowAddActivityModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

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
            const response = await seriesAPI.createActivityInSeries(parseInt(id), data);
            if (response.status && response.data) {
                toast.success('Tạo sự kiện trong chuỗi thành công!');
                setShowAddActivityModal(false);
                // Reload both series and activities
                await loadSeries();
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
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-[#001C44]">Thêm sự kiện vào chuỗi</h3>
                                <button
                                    onClick={() => setShowAddActivityModal(false)}
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
                        </div>
                        <div className="p-6">
                            <SeriesActivityForm
                                onSubmit={handleCreateActivity}
                                loading={isCreating}
                                initialData={{
                                    order: activities.length > 0 ? Math.max(...activities.map(a => a.seriesOrder || 0), 0) + 1 : 1
                                }}
                                title=""
                                onCancel={() => setShowAddActivityModal(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SeriesDetail;

