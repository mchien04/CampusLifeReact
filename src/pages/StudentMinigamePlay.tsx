import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { minigameAPI } from '../services/minigameAPI';
import { eventAPI } from '../services/eventAPI';
import { MiniGame, StartAttemptResponse, SubmitAttemptResponse } from '../types/minigame';
import { ActivityResponse } from '../types/activity';
import { LoadingSpinner } from '../components/common';
import { QuizPlayer, QuizResults } from '../components/minigame';
import StudentLayout from '../components/layout/StudentLayout';
import { toast } from 'react-toastify';

const StudentMinigamePlay: React.FC = () => {
    const { activityId } = useParams<{ activityId: string }>();
    const navigate = useNavigate();
    const [minigame, setMinigame] = useState<MiniGame | null>(null);
    const [activity, setActivity] = useState<ActivityResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [attemptId, setAttemptId] = useState<number | null>(null);
    const [startedAt, setStartedAt] = useState<string>('');
    const [showResults, setShowResults] = useState(false);
    const [result, setResult] = useState<SubmitAttemptResponse | null>(null);
    const [timeUp, setTimeUp] = useState(false);

    useEffect(() => {
        if (activityId) {
            loadMinigame();
        }
    }, [activityId]);

    const loadMinigame = async () => {
        if (!activityId) return;

        try {
            setLoading(true);
            const activityResponse = await eventAPI.getEvent(parseInt(activityId));
            if (activityResponse.status && activityResponse.data) {
                setActivity(activityResponse.data);

                const minigameResponse = await minigameAPI.getMiniGameByActivity(parseInt(activityId));
                if (minigameResponse.status && minigameResponse.data) {
                    setMinigame(minigameResponse.data);
                } else {
                    setError('Không tìm thấy quiz cho activity này');
                }
            } else {
                setError('Không tìm thấy activity');
            }
        } catch (err) {
            setError('Có lỗi xảy ra khi tải thông tin quiz');
            console.error('Error loading minigame:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStart = async () => {
        if (!minigame) return;

        try {
            const response = await minigameAPI.startAttempt(minigame.id);
            if (response.status && response.data) {
                setAttemptId(response.data.attemptId);
                setStartedAt(response.data.startedAt);
            } else {
                toast.error(response.message || 'Không thể bắt đầu quiz');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi bắt đầu quiz');
            console.error('Error starting attempt:', err);
        }
    };

    const handleSubmit = async (answers: Record<number, number>) => {
        if (!attemptId) return;

        try {
            const response = await minigameAPI.submitAttempt(attemptId, { answers });
            if (response.status && response.data) {
                setResult(response.data);
                setShowResults(true);
            } else {
                toast.error(response.message || 'Không thể nộp bài');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi nộp bài');
            console.error('Error submitting attempt:', err);
        }
    };

    const handleTimeUp = () => {
        setTimeUp(true);
        if (attemptId) {
            // Auto-submit with current answers (empty if none)
            handleSubmit({});
        }
    };

    const handleCloseResults = () => {
        setShowResults(false);
        navigate('/student/minigames');
    };

    const handleRetry = () => {
        setAttemptId(null);
        setStartedAt('');
        setResult(null);
        setShowResults(false);
        setTimeUp(false);
        handleStart();
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

    if (error || !minigame || !activity) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="text-red-600 text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-[#001C44] mb-2">Có lỗi xảy ra</h2>
                        <p className="text-gray-600 mb-6">{error || 'Không tìm thấy quiz'}</p>
                        <button
                            onClick={() => navigate('/student/minigames')}
                            className="btn-primary px-6 py-3 rounded-lg font-medium"
                        >
                            Quay lại danh sách
                        </button>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    // Check if quiz is available
    const now = new Date();
    const startDate = new Date(activity.startDate);
    const endDate = new Date(activity.endDate);
    const isAvailable = now >= startDate && now <= endDate;

    if (!attemptId && !isAvailable) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="text-gray-400 text-6xl mb-4">⏰</div>
                        <h2 className="text-2xl font-bold text-[#001C44] mb-2">Quiz chưa mở</h2>
                        <p className="text-gray-600 mb-6">
                            {now < startDate
                                ? `Quiz sẽ mở vào: ${startDate.toLocaleString('vi-VN')}`
                                : `Quiz đã kết thúc vào: ${endDate.toLocaleString('vi-VN')}`}
                        </p>
                        <button
                            onClick={() => navigate('/student/minigames')}
                            className="btn-primary px-6 py-3 rounded-lg font-medium"
                        >
                            Quay lại danh sách
                        </button>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    if (!attemptId) {
        return (
            <StudentLayout>
                <div className="max-w-2xl mx-auto p-6">
                    <div className="card p-8 text-center">
                        <h2 className="text-2xl font-bold text-[#001C44] mb-4">{minigame.title}</h2>
                        {minigame.description && (
                            <p className="text-gray-600 mb-6">{minigame.description}</p>
                        )}
                        <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-2 text-left">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Số câu hỏi:</span>
                                <span className="font-semibold">{minigame.questionCount}</span>
                            </div>
                            {minigame.timeLimit && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Thời gian:</span>
                                    <span className="font-semibold">
                                        {Math.floor(minigame.timeLimit / 60)} phút
                                    </span>
                                </div>
                            )}
                            {minigame.requiredCorrectAnswers && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Yêu cầu tối thiểu:</span>
                                    <span className="font-semibold">
                                        {minigame.requiredCorrectAnswers}/{minigame.questionCount} câu đúng
                                    </span>
                                </div>
                            )}
                            {minigame.rewardPoints && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Điểm thưởng:</span>
                                    <span className="font-semibold text-[#001C44]">
                                        {parseFloat(minigame.rewardPoints).toFixed(1)} điểm
                                    </span>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleStart}
                            className="btn-yellow px-8 py-3 rounded-lg text-lg font-medium"
                        >
                            Bắt đầu làm quiz
                        </button>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            {showResults && result ? (
                <QuizResults
                    result={result}
                    minigame={minigame}
                    onClose={handleCloseResults}
                    onRetry={handleRetry}
                />
            ) : (
                <QuizPlayer
                    minigame={minigame}
                    attemptId={attemptId}
                    timeLimit={minigame.timeLimit || undefined}
                    startedAt={startedAt}
                    onSubmit={handleSubmit}
                    onTimeUp={handleTimeUp}
                />
            )}
        </StudentLayout>
    );
};

export default StudentMinigamePlay;

