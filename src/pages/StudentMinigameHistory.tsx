import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { minigameAPI } from '../services/minigameAPI';
import { eventAPI } from '../services/eventAPI';
import { MiniGame, MiniGameAttempt, AttemptDetailResponse } from '../types/minigame';
import { ActivityResponse } from '../types/activity';
import { LoadingSpinner } from '../components/common';
import StudentLayout from '../components/layout/StudentLayout';
import { toast } from 'react-toastify';

const StudentMinigameHistory: React.FC = () => {
    const { activityId } = useParams<{ activityId: string }>();
    const navigate = useNavigate();
    const [activity, setActivity] = useState<ActivityResponse | null>(null);
    const [minigame, setMinigame] = useState<MiniGame | null>(null);
    const [attempts, setAttempts] = useState<MiniGameAttempt[]>([]);
    const [selectedAttempt, setSelectedAttempt] = useState<AttemptDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (activityId) {
            loadData();
        }
    }, [activityId]);

    const loadData = async () => {
        if (!activityId) return;

        try {
            setLoading(true);
            setError(null);

            // Load activity
            const activityResponse = await eventAPI.getEvent(parseInt(activityId));
            if (!activityResponse.status || !activityResponse.data) {
                setError('Không tìm thấy sự kiện này');
                return;
            }
            setActivity(activityResponse.data);

            // Load minigame
            const minigameResponse = await minigameAPI.getMiniGameByActivity(parseInt(activityId));
            if (!minigameResponse.status || !minigameResponse.data) {
                setError('Không tìm thấy minigame cho sự kiện này');
                return;
            }
            setMinigame(minigameResponse.data);

            // Load attempts
            const attemptsResponse = await minigameAPI.getMyAttempts(minigameResponse.data.id);
            if (attemptsResponse.status && attemptsResponse.data) {
                setAttempts(attemptsResponse.data);
            }
        } catch (err: any) {
            console.error('Error loading history:', err);
            setError('Có lỗi xảy ra khi tải lịch sử');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetail = async (attemptId: number) => {
        try {
            setLoadingDetail(true);
            const detailResponse = await minigameAPI.getAttemptDetail(attemptId);
            if (detailResponse.status && detailResponse.data) {
                setSelectedAttempt(detailResponse.data);
            } else {
                toast.error(detailResponse.message || 'Không thể tải chi tiết attempt');
            }
        } catch (err: any) {
            console.error('Error loading attempt detail:', err);
            toast.error('Có lỗi xảy ra khi tải chi tiết attempt');
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleCloseDetail = () => {
        setSelectedAttempt(null);
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'IN_PROGRESS': 'Đang làm',
            'PASSED': 'Đạt',
            'FAILED': 'Không đạt'
        };
        return labels[status] || status;
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
            'PASSED': 'bg-green-100 text-green-800',
            'FAILED': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
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

    if (error) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="text-red-600 text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-[#001C44] mb-2">Có lỗi xảy ra</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={loadData}
                                className="btn-primary px-6 py-3 rounded-lg font-medium"
                            >
                                Thử lại
                            </button>
                            <Link
                                to="/student/minigames"
                                className="btn-secondary px-6 py-3 rounded-lg font-medium"
                            >
                                Quay lại
                            </Link>
                        </div>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            to="/student/minigames"
                            className="text-[#001C44] hover:text-[#002A66] mb-2 inline-flex items-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Quay lại danh sách quiz
                        </Link>
                        <h1 className="text-3xl font-bold text-[#001C44]">
                            Lịch sử làm quiz
                        </h1>
                        {minigame && (
                            <p className="text-gray-600 mt-2">{minigame.title}</p>
                        )}
                    </div>
                </div>

                {/* Attempts List */}
                <div className="card p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Danh sách lần làm bài ({attempts.length})
                    </h2>

                    {attempts.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-gray-400 text-6xl mb-4">📝</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có lần làm bài nào</h3>
                            <p className="text-gray-500 mb-6">
                                Bạn chưa làm quiz này. Hãy bắt đầu làm quiz để xem lịch sử.
                            </p>
                            {activity && (
                                <Link
                                    to={`/student/minigames/${activity.id}/play`}
                                    className="btn-primary px-6 py-3 rounded-lg font-medium inline-block"
                                >
                                    Bắt đầu làm quiz
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {attempts
                                .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
                                .map((attempt) => (
                                    <div
                                        key={attempt.id}
                                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4 flex-1">
                                                <span
                                                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                                                        attempt.status
                                                    )}`}
                                                >
                                                    {getStatusLabel(attempt.status)}
                                                </span>
                                                <div className="flex-1">
                                                    <div className="text-sm text-gray-600">
                                                        <span className="font-medium">
                                                            {attempt.correctCount}/{attempt.totalQuestions} câu đúng
                                                        </span>
                                                        {attempt.pointsEarned && parseFloat(attempt.pointsEarned) > 0 && (
                                                            <span className="ml-3 text-green-600 font-semibold">
                                                                +{parseFloat(attempt.pointsEarned).toFixed(1)} điểm
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Bắt đầu: {new Date(attempt.startedAt).toLocaleString('vi-VN')}
                                                        {attempt.submittedAt && (
                                                            <span className="ml-3">
                                                                Nộp: {new Date(attempt.submittedAt).toLocaleString('vi-VN')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {attempt.status !== 'IN_PROGRESS' && (
                                                <button
                                                    onClick={() => handleViewDetail(attempt.id)}
                                                    disabled={loadingDetail}
                                                    className="btn-primary px-4 py-2 rounded-lg text-sm font-medium ml-4"
                                                >
                                                    {loadingDetail ? 'Đang tải...' : 'Xem chi tiết'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>

                {/* Attempt Detail Modal */}
                {selectedAttempt && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-[#001C44]">
                                    Chi tiết kết quả
                                </h2>
                                <button
                                    onClick={handleCloseDetail}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-6">
                                {/* Summary */}
                                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <div className="text-sm text-gray-600">Trạng thái</div>
                                            <div className={`text-lg font-semibold ${getStatusColor(selectedAttempt.status)} inline-block px-3 py-1 rounded-full mt-1`}>
                                                {getStatusLabel(selectedAttempt.status)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600">Số câu đúng</div>
                                            <div className="text-lg font-semibold text-gray-900 mt-1">
                                                {selectedAttempt.correctCount}/{selectedAttempt.totalQuestions}
                                            </div>
                                        </div>
                                        {selectedAttempt.pointsEarned && parseFloat(selectedAttempt.pointsEarned) > 0 && (
                                            <div>
                                                <div className="text-sm text-gray-600">Điểm nhận được</div>
                                                <div className="text-lg font-semibold text-green-600 mt-1">
                                                    +{parseFloat(selectedAttempt.pointsEarned).toFixed(1)}
                                                </div>
                                            </div>
                                        )}
                                        {selectedAttempt.requiredCorrectAnswers && (
                                            <div>
                                                <div className="text-sm text-gray-600">Yêu cầu</div>
                                                <div className="text-lg font-semibold text-gray-900 mt-1">
                                                    {selectedAttempt.requiredCorrectAnswers}/{selectedAttempt.totalQuestions} câu đúng
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Questions */}
                                <div className="space-y-4">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                        Chi tiết từng câu hỏi
                                    </h3>
                                    {selectedAttempt.questions
                                        .sort((a, b) => a.displayOrder - b.displayOrder)
                                        .map((question, index) => (
                                            <div
                                                key={question.id}
                                                className={`p-4 border-2 rounded-lg ${
                                                    question.isCorrect
                                                        ? 'border-green-200 bg-green-50'
                                                        : 'border-red-200 bg-red-50'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <h4 className="font-semibold text-gray-900 flex-1">
                                                        Câu {index + 1}: {question.questionText}
                                                    </h4>
                                                    {question.isCorrect ? (
                                                        <span className="ml-2 text-green-600 font-semibold">✓ Đúng</span>
                                                    ) : (
                                                        <span className="ml-2 text-red-600 font-semibold">✗ Sai</span>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    {question.options.map((option) => (
                                                        <div
                                                            key={option.id}
                                                            className={`p-3 rounded-lg border-2 ${
                                                                option.isCorrect
                                                                    ? 'border-green-400 bg-green-100'
                                                                    : option.isSelected
                                                                    ? 'border-red-400 bg-red-100'
                                                                    : 'border-gray-200 bg-white'
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-gray-900">{option.text}</span>
                                                                <div className="flex items-center space-x-2">
                                                                    {option.isCorrect && (
                                                                        <span className="text-green-600 font-semibold text-sm">Đáp án đúng</span>
                                                                    )}
                                                                    {option.isSelected && !option.isCorrect && (
                                                                        <span className="text-red-600 font-semibold text-sm">Bạn đã chọn</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};

export default StudentMinigameHistory;

