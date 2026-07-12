import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { minigameAPI } from '../services/minigameAPI';
import { eventAPI } from '../services/eventAPI';
import { MiniGame, MiniGameAttempt, AttemptDetailResponse } from '../types/minigame';
import { ActivityResponse } from '../types/activity';
import { LoadingSpinner } from '../components/common';
import StudentLayout from '../components/layout/StudentLayout';
import { toast } from 'react-toastify';
import { CaretLeft, Clock, CheckCircle, Trophy, ChartBar, WarningCircle, ListChecks, FileText, XCircle, GameController, Eye } from '@phosphor-icons/react';

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
            <div className="mx-auto max-w-5xl space-y-6 pb-12">
                {/* Header matching StudentSeries style */}
                <header className="relative overflow-hidden rounded-2xl border border-primary-900/10 bg-primary-900 px-6 py-7 sm:px-8 text-white shadow-premium">
                    <div
                        className="pointer-events-none absolute inset-0 opacity-[0.12]"
                        style={{
                            backgroundImage:
                                'radial-gradient(ellipse at 0% 0%, #FFD66D 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, #4b88b6 0%, transparent 50%)',
                        }}
                    />
                    <div className="relative">
                        <Link
                            to="/student/minigames"
                            className="inline-flex items-center text-sm font-semibold tracking-wide text-primary-100 hover:text-white transition-colors mb-4"
                        >
                            <CaretLeft weight="bold" className="w-4 h-4 mr-1" />
                            Quay lại Mini Game
                        </Link>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance">
                            Lịch sử làm bài
                        </h1>
                        {minigame && (
                            <p className="mt-2 text-sm text-primary-100/90 max-w-2xl leading-relaxed flex items-center">
                                <GameController weight="fill" className="w-4 h-4 mr-2 text-accent" />
                                {minigame.title}
                            </p>
                        )}
                    </div>
                </header>

                {/* Attempts List */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-premium">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                        <h2 className="text-xl font-bold text-gray-900">
                            Các lần làm bài
                        </h2>
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-semibold">
                            {attempts.length} lần
                        </span>
                    </div>

                    {attempts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50 rounded-xl border border-gray-100 border-dashed text-center">
                            <FileText weight="duotone" className="w-16 h-16 text-gray-300 mb-4" />
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Chưa có lần làm bài nào</h3>
                            <p className="text-gray-500 max-w-sm mb-6">
                                Bạn chưa làm quiz này. Hãy bắt đầu làm bài để xem lịch sử.
                            </p>
                            {activity && (
                                <Link
                                    to={`/student/minigames/${activity.id}/play`}
                                    className="bg-primary-900 hover:bg-primary-800 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm inline-flex items-center"
                                >
                                    <GameController weight="bold" className="w-5 h-5 mr-2" />
                                    Bắt đầu làm bài
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {attempts
                                .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
                                .map((attempt, index) => (
                                    <div
                                        key={attempt.id}
                                        className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="hidden sm:flex w-10 h-10 rounded-full bg-gray-50 border border-gray-100 items-center justify-center text-gray-400 font-bold">
                                                #{attempts.length - index}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider ${getStatusColor(attempt.status)}`}>
                                                        {getStatusLabel(attempt.status)}
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {attempt.correctCount}/{attempt.totalQuestions} đúng
                                                    </span>
                                                    {attempt.pointsEarned && parseFloat(attempt.pointsEarned) > 0 && (
                                                        <span className="inline-flex items-center text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
                                                            +{parseFloat(attempt.pointsEarned).toFixed(1)} đ
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-xs text-gray-500">
                                                    <span className="flex items-center">
                                                        <Clock className="w-3.5 h-3.5 mr-1" />
                                                        Bắt đầu: {new Date(attempt.startedAt).toLocaleString('vi-VN')}
                                                    </span>
                                                    {attempt.submittedAt && (
                                                        <span className="flex items-center">
                                                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
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
                                                className="mt-4 sm:mt-0 inline-flex items-center justify-center px-4 py-2 border border-gray-200 bg-gray-50 text-gray-700 rounded-lg hover:bg-white hover:border-primary-900/30 hover:text-primary-900 transition-colors text-sm font-medium disabled:opacity-50"
                                            >
                                                {loadingDetail ? <LoadingSpinner size="small" /> : (
                                                    <>
                                                        <Eye className="w-4 h-4 mr-1.5" />
                                                        Xem chi tiết
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                ))}
                        </div>
                    )}
                </div>

                {/* Attempt Detail Modal */}
                {selectedAttempt && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={handleCloseDetail}></div>
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            {/* Modal Header */}
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Chi tiết kết quả</h2>
                                    <p className="text-sm text-gray-500 mt-1">Xem lại câu trả lời và đáp án</p>
                                </div>
                                <button
                                    onClick={handleCloseDetail}
                                    className="p-2 rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                                >
                                    <XCircle weight="fill" className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Trạng thái</div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-semibold uppercase tracking-wider ${getStatusColor(selectedAttempt.status)}`}>
                                            {getStatusLabel(selectedAttempt.status)}
                                        </span>
                                    </div>
                                    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Câu đúng</div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {selectedAttempt.correctCount}<span className="text-gray-400 text-base font-medium">/{selectedAttempt.totalQuestions}</span>
                                        </div>
                                    </div>
                                    {selectedAttempt.pointsEarned && parseFloat(selectedAttempt.pointsEarned) > 0 && (
                                        <div className="bg-green-50 border border-green-100 rounded-xl p-4 shadow-sm">
                                            <div className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">Điểm nhận</div>
                                            <div className="text-2xl font-bold text-green-600">
                                                +{parseFloat(selectedAttempt.pointsEarned).toFixed(1)}
                                            </div>
                                        </div>
                                    )}
                                    {selectedAttempt.requiredCorrectAnswers && (
                                        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Yêu cầu qua</div>
                                            <div className="text-2xl font-bold text-gray-900">
                                                {selectedAttempt.requiredCorrectAnswers} <span className="text-gray-500 text-sm font-medium">câu</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Questions */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
                                        Chi tiết câu hỏi
                                    </h3>
                                    {selectedAttempt.questions
                                        .sort((a, b) => a.displayOrder - b.displayOrder)
                                        .map((question, index) => (
                                            <div
                                                key={question.id}
                                                className={`rounded-xl border ${
                                                    selectedAttempt.showAnswers === false
                                                        ? 'border-gray-200'
                                                        : question.isCorrect
                                                        ? 'border-green-200 bg-green-50/30'
                                                        : 'border-red-200 bg-red-50/30'
                                                } overflow-hidden`}
                                            >
                                                <div className={`px-5 py-4 ${
                                                    selectedAttempt.showAnswers === false
                                                        ? 'bg-gray-50'
                                                        : question.isCorrect
                                                        ? 'bg-green-100/50'
                                                        : 'bg-red-100/50'
                                                }`}>
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                                                            {index + 1}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold text-gray-900 text-base leading-snug">
                                                                {question.questionText}
                                                            </h4>
                                                        </div>
                                                        {selectedAttempt.showAnswers !== false && (
                                                            <div className="shrink-0 ml-4">
                                                                {question.isCorrect ? (
                                                                    <span className="inline-flex items-center text-green-700 bg-green-100 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border border-green-200">
                                                                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Đúng
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center text-red-700 bg-red-100 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border border-red-200">
                                                                        <XCircle className="w-3.5 h-3.5 mr-1" /> Sai
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="p-5 space-y-2.5 bg-white">
                                                    {question.options.map((option) => {
                                                        let optionStyle = 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700';
                                                        let badge = null;

                                                        if (selectedAttempt.showAnswers === false) {
                                                            if (option.isSelected) {
                                                                optionStyle = 'border-blue-300 bg-blue-50 text-blue-900 font-medium shadow-sm';
                                                                badge = <span className="text-blue-600 font-semibold text-xs tracking-wide">Bạn đã chọn</span>;
                                                            }
                                                        } else {
                                                            if (option.isCorrect) {
                                                                optionStyle = 'border-green-400 bg-green-50 text-green-900 font-medium shadow-sm';
                                                                badge = <span className="text-green-700 font-bold text-xs tracking-wide flex items-center"><CheckCircle className="w-3.5 h-3.5 mr-1" /> ĐÁP ÁN ĐÚNG</span>;
                                                            } else if (option.isSelected) {
                                                                optionStyle = 'border-red-300 bg-red-50 text-red-900 font-medium';
                                                                badge = <span className="text-red-600 font-semibold text-xs tracking-wide">Bạn đã chọn (Sai)</span>;
                                                            }
                                                        }

                                                        return (
                                                            <div key={option.id} className={`p-4 rounded-lg border transition-colors ${optionStyle}`}>
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <span className="leading-relaxed">{option.text}</span>
                                                                    {badge && <div className="shrink-0">{badge}</div>}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
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

