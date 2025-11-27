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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddActivityModal, setShowAddActivityModal] = useState(false);
    const [newActivityData, setNewActivityData] = useState<CreateActivityInSeriesRequest>({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        location: '',
        order: 1
    });

    useEffect(() => {
        if (id) {
            loadSeries();
        }
    }, [id]);

    const loadSeries = async () => {
        if (!id) return;

        try {
            setLoading(true);
            const response = await seriesAPI.getSeriesById(parseInt(id));
            if (response.status && response.data) {
                setSeries(response.data);
                if (response.data.activities) {
                    const maxOrder = Math.max(
                        ...response.data.activities.map(a => a.seriesOrder || 0),
                        0
                    );
                    setNewActivityData(prev => ({ ...prev, order: maxOrder + 1 }));
                }
            } else {
                setError(response.message || 'Không thể tải thông tin chuỗi sự kiện');
            }
        } catch (err) {
            setError('Có lỗi xảy ra khi tải thông tin chuỗi sự kiện');
            console.error('Error loading series:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateActivity = async () => {
        if (!id || !series) return;

        try {
            const response = await seriesAPI.createActivityInSeries(parseInt(id), newActivityData);
            if (response.status && response.data) {
                toast.success('Tạo sự kiện trong chuỗi thành công!');
                setShowAddActivityModal(false);
                setNewActivityData({
                    name: '',
                    description: '',
                    startDate: '',
                    endDate: '',
                    location: '',
                    order: (series.activities?.length || 0) + 1
                });
                await loadSeries();
            } else {
                toast.error(response.message || 'Tạo sự kiện thất bại');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo sự kiện');
            console.error('Error creating activity:', err);
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
                                    {series.activities?.length || series.totalActivities || 0} sự kiện trong chuỗi
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
                        series={series}
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
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Thêm sự kiện vào chuỗi</h3>
                            <button
                                onClick={() => setShowAddActivityModal(false)}
                                className="text-gray-400 hover:text-gray-600"
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

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tên sự kiện *
                                </label>
                                <input
                                    type="text"
                                    value={newActivityData.name}
                                    onChange={(e) =>
                                        setNewActivityData(prev => ({ ...prev, name: e.target.value }))
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mô tả
                                </label>
                                <textarea
                                    value={newActivityData.description || ''}
                                    onChange={(e) =>
                                        setNewActivityData(prev => ({ ...prev, description: e.target.value }))
                                    }
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ngày bắt đầu *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={newActivityData.startDate}
                                        onChange={(e) =>
                                            setNewActivityData(prev => ({ ...prev, startDate: e.target.value }))
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ngày kết thúc *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={newActivityData.endDate}
                                        onChange={(e) =>
                                            setNewActivityData(prev => ({ ...prev, endDate: e.target.value }))
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Địa điểm *
                                </label>
                                <input
                                    type="text"
                                    value={newActivityData.location}
                                    onChange={(e) =>
                                        setNewActivityData(prev => ({ ...prev, location: e.target.value }))
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Thứ tự trong chuỗi *
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={newActivityData.order}
                                    onChange={(e) =>
                                        setNewActivityData(prev => ({
                                            ...prev,
                                            order: parseInt(e.target.value) || 1
                                        }))
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowAddActivityModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleCreateActivity}
                                className="px-4 py-2 bg-[#001C44] text-white rounded-lg hover:bg-[#002A66] transition-colors"
                            >
                                Tạo sự kiện
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SeriesDetail;

