import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { minigameAPI } from '../services/minigameAPI';
import { eventAPI } from '../services/eventAPI';
import { registrationAPI } from '../services/registrationAPI';
import { MiniGame, StartAttemptResponse, SubmitAttemptResponse, QuestionWithoutAnswer, AttemptDetailResponse } from '../types/minigame';
import { ActivityResponse } from '../types/activity';
import { RegistrationStatus } from '../types/registration';
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
    const [questions, setQuestions] = useState<QuestionWithoutAnswer[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [attemptDetail, setAttemptDetail] = useState<AttemptDetailResponse | null>(null);
    const [attemptCount, setAttemptCount] = useState<number>(0);
    const [isRegistered, setIsRegistered] = useState<boolean>(false);

    useEffect(() => {
        if (activityId) {
            loadMinigame();
        }
    }, [activityId]);

    const loadAttemptCount = async () => {
        if (!minigame) return;
        try {
            const attemptsResponse = await minigameAPI.getMyAttempts(minigame.id);
            if (attemptsResponse.status && attemptsResponse.data) {
                setAttemptCount(attemptsResponse.data.length);
            }
        } catch (err) {
            console.error('Error loading attempt count:', err);
        }
    };

    const loadMinigame = async () => {
        if (!activityId) {
            console.error('loadMinigame: activityId is missing');
            return;
        }

        console.log('loadMinigame: Starting to load minigame for activityId:', activityId);
        try {
            setLoading(true);
            console.log('loadMinigame: Loading activity...');
            const activityResponse = await eventAPI.getEvent(parseInt(activityId));
            console.log('loadMinigame: Activity response:', activityResponse);
            
            if (activityResponse.status && activityResponse.data) {
                setActivity(activityResponse.data);
                console.log('loadMinigame: Activity loaded:', activityResponse.data.id);

                // Check registration status
                try {
                    const activityId = activityResponse.data.id;
                    const registrationData = await registrationAPI.checkRegistrationStatus(activityId);
                    if (registrationData) {
                        // Với MINIGAME, ATTENDED cũng được coi là đã đăng ký (cho phép làm quiz lại)
                        const registered = registrationData.status === RegistrationStatus.APPROVED || 
                                         registrationData.status === RegistrationStatus.PENDING ||
                                         registrationData.status === RegistrationStatus.ATTENDED;
                        setIsRegistered(registered);
                        if (!registered) {
                            toast.error('Bạn cần đăng ký sự kiện trước khi làm quiz');
                            setTimeout(() => {
                                navigate(`/student/events/${activityId}`);
                            }, 2000);
                            return;
                        }
                    } else {
                        setIsRegistered(false);
                        toast.error('Bạn cần đăng ký sự kiện trước khi làm quiz');
                        setTimeout(() => {
                            navigate(`/student/events/${activityId}`);
                        }, 2000);
                        return;
                    }
                } catch (regErr) {
                    console.error('Error checking registration:', regErr);
                    setIsRegistered(false);
                    toast.error('Không thể kiểm tra trạng thái đăng ký');
                    setTimeout(() => {
                        navigate('/student/minigames');
                    }, 2000);
                    return;
                }

                console.log('loadMinigame: Loading minigame by activity...');
                const minigameResponse = await minigameAPI.getMiniGameByActivity(parseInt(activityId));
                console.log('loadMinigame: Minigame response:', minigameResponse);
                
                if (minigameResponse.status && minigameResponse.data) {
                    setMinigame(minigameResponse.data);
                    console.log('loadMinigame: Minigame loaded successfully:', minigameResponse.data.id);
                    // Load attempt count after minigame is loaded
                    const attemptsResponse = await minigameAPI.getMyAttempts(minigameResponse.data.id);
                    if (attemptsResponse.status && attemptsResponse.data) {
                        setAttemptCount(attemptsResponse.data.length);
                    }
                } else {
                    console.error('loadMinigame: Failed to load minigame:', minigameResponse);
                    setError(minigameResponse.message || 'Không tìm thấy quiz cho activity này. Vui lòng liên hệ quản trị viên để tạo quiz.');
                }
            } else {
                console.error('loadMinigame: Failed to load activity:', activityResponse);
                setError('Không tìm thấy activity');
            }
        } catch (err) {
            console.error('loadMinigame: Exception loading minigame:', err);
            setError('Có lỗi xảy ra khi tải thông tin quiz');
        } finally {
            setLoading(false);
            console.log('loadMinigame: Loading completed');
        }
    };

    const handleStart = async () => {
        if (!minigame) {
            console.error('handleStart: minigame is null');
            toast.error('Không tìm thấy thông tin quiz');
            return;
        }

        // Kiểm tra lại registration status trước khi start
        if (!isRegistered) {
            toast.error('Bạn cần đăng ký sự kiện trước khi làm quiz');
            if (activity) {
                navigate(`/student/events/${activity.id}`);
            } else {
                navigate('/student/minigames');
            }
            return;
        }

        console.log('handleStart: Starting flow for minigame', minigame.id);
        setLoadingQuestions(true);
        
        try {
            // Step 1: Load questions first (without correct answers)
            console.log('handleStart: Step 1 - Loading questions for minigame', minigame.id);
            const questionsResponse = await minigameAPI.getQuestions(minigame.id);
            console.log('handleStart: getQuestions response', questionsResponse);
            
            if (!questionsResponse.status || !questionsResponse.data) {
                console.error('handleStart: Failed to load questions', questionsResponse);
                toast.error(questionsResponse.message || 'Không thể tải câu hỏi');
                setError('Không thể tải câu hỏi');
                setLoadingQuestions(false);
                return;
            }
            
            setQuestions(questionsResponse.data.questions);
            console.log('handleStart: Questions loaded, count:', questionsResponse.data.questions.length);
            
            // Step 2: Start attempt after questions are loaded
            console.log('handleStart: Step 2 - Starting attempt for minigame', minigame.id);
            const response = await minigameAPI.startAttempt(minigame.id);
            console.log('handleStart: startAttempt response', response);
            
            if (response.status && response.data) {
                // Use id if available, otherwise fallback to attemptId for backward compatibility
                const newAttemptId = response.data.id || response.data.attemptId || 0;
                setAttemptId(newAttemptId);
                setStartedAt(response.data.startedAt);
                console.log('handleStart: Attempt started successfully, attemptId:', newAttemptId);
            } else {
                console.error('handleStart: Failed to start attempt', response);
                const errorMessage = response.message || 'Không thể bắt đầu quiz';
                // Check if error is about maxAttempts
                if (errorMessage.includes('đạt số lần làm quiz tối đa') || errorMessage.includes('maxAttempts')) {
                    toast.error(errorMessage);
                    setError(errorMessage);
                } else {
                    toast.error(errorMessage);
                    setError('Không thể bắt đầu quiz');
                }
            }
        } catch (err: any) {
            console.error('handleStart: Exception in flow', err);
            const errorMessage = err.response?.data?.message || 'Có lỗi xảy ra khi bắt đầu quiz';
            // Check if error is about maxAttempts
            if (errorMessage.includes('đạt số lần làm quiz tối đa') || errorMessage.includes('maxAttempts')) {
                toast.error(errorMessage);
                setError(errorMessage);
            } else {
                toast.error(errorMessage);
                setError('Có lỗi xảy ra khi bắt đầu quiz');
            }
        } finally {
            setLoadingQuestions(false);
        }
    };

    const handleSubmit = async (answers: Record<string, number>) => {
        console.log('handleSubmit: Called with attemptId:', attemptId, 'answers:', answers);
        if (!attemptId) {
            console.error('handleSubmit: attemptId is null, cannot submit');
            toast.error('Không tìm thấy attempt ID');
            return;
        }

        try {
            console.log('handleSubmit: Calling submitAttempt API...');
            const response = await minigameAPI.submitAttempt(attemptId, { answers });
            console.log('handleSubmit: submitAttempt response:', response);
            
            if (response.status && response.data) {
                setResult(response.data);
                console.log('handleSubmit: Result set, loading attempt detail...');
                
                // Load attempt detail after submitting (with correct answers)
                try {
                    const detailResponse = await minigameAPI.getAttemptDetail(attemptId);
                    console.log('handleSubmit: getAttemptDetail response:', detailResponse);
                    if (detailResponse.status && detailResponse.data) {
                        setAttemptDetail(detailResponse.data);
                        console.log('handleSubmit: Attempt detail loaded');
                    } else {
                        console.warn('handleSubmit: Could not load attempt detail:', detailResponse.message);
                        // Continue without detail - backward compatible
                    }
                } catch (err: any) {
                    console.error('handleSubmit: Error loading attempt detail:', err);
                    // Continue without detail - backward compatible
                }
                
                setShowResults(true);
                console.log('handleSubmit: Show results set to true');
                
                // Reload attempt count after submission
                if (minigame) {
                    const attemptsResponse = await minigameAPI.getMyAttempts(minigame.id);
                    if (attemptsResponse.status && attemptsResponse.data) {
                        setAttemptCount(attemptsResponse.data.length);
                    }
                }
                
                // Show success message if passed (status is now a string)
                if (response.data.status === 'PASSED' && response.data.pointsEarned) {
                    toast.success(`Chúc mừng! Bạn đã nhận được ${parseFloat(response.data.pointsEarned).toFixed(1)} điểm`);
                }
            } else {
                console.error('handleSubmit: Failed to submit:', response);
                toast.error(response.message || 'Không thể nộp bài');
            }
        } catch (err: any) {
            console.error('handleSubmit: Exception submitting attempt:', err);
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi nộp bài');
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
        setQuestions([]);
        setAttemptDetail(null);
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
        console.log('Rendering error screen:', { error, hasMinigame: !!minigame, hasActivity: !!activity });
        return (
            <StudentLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center max-w-md">
                        <div className="text-red-600 text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-[#001C44] mb-2">Không tìm thấy Quiz</h2>
                        <p className="text-gray-600 mb-4">
                            {error || 'Không tìm thấy quiz cho activity này'}
                        </p>
                        {activity && (
                            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                                <p className="text-sm text-gray-500 mb-1">Activity ID:</p>
                                <p className="text-sm font-semibold text-gray-900">{activity.id}</p>
                                <p className="text-sm text-gray-500 mb-1 mt-2">Tên Activity:</p>
                                <p className="text-sm font-semibold text-gray-900">{activity.name}</p>
                            </div>
                        )}
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => navigate('/student/minigames')}
                                className="btn-primary px-6 py-3 rounded-lg font-medium"
                            >
                                Quay lại danh sách
                            </button>
                            <button
                                onClick={() => {
                                    setError(null);
                                    loadMinigame();
                                }}
                                className="btn-yellow px-6 py-3 rounded-lg font-medium"
                            >
                                Thử lại
                            </button>
                        </div>
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
        console.log('=== RENDERING START SCREEN ===');
        console.log('minigame:', minigame);
        console.log('minigame?.id:', minigame?.id);
        console.log('minigame is null?', minigame === null);
        console.log('Button will be disabled?', !minigame);
        return (
            <StudentLayout>
                <div className="max-w-2xl mx-auto p-6">
                    <div className="card p-8 text-center">
                        <h2 className="text-2xl font-bold text-[#001C44] mb-4">{minigame?.title || 'Loading...'}</h2>
                        {minigame?.description && (
                            <p className="text-gray-600 mb-6">{minigame.description}</p>
                        )}
                        <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-2 text-left">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Số câu hỏi:</span>
                                <span className="font-semibold">{minigame?.questionCount || 0}</span>
                            </div>
                            {minigame?.timeLimit && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Thời gian:</span>
                                    <span className="font-semibold">
                                        {Math.floor(minigame.timeLimit / 60)} phút
                                    </span>
                                </div>
                            )}
                            {minigame?.requiredCorrectAnswers && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Yêu cầu tối thiểu:</span>
                                    <span className="font-semibold">
                                        {minigame.requiredCorrectAnswers}/{minigame.questionCount} câu đúng
                                    </span>
                                </div>
                            )}
                            {minigame?.rewardPoints && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Điểm thưởng:</span>
                                    <span className="font-semibold text-[#001C44]">
                                        {parseFloat(minigame.rewardPoints).toFixed(1)} điểm
                                    </span>
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            disabled={!minigame}
                            onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('=== BUTTON CLICKED ===');
                                console.log('minigame:', minigame);
                                console.log('minigame.id:', minigame?.id);
                                console.log('minigame object keys:', minigame ? Object.keys(minigame) : 'null');
                                
                                if (!minigame) {
                                    console.error('Cannot start: minigame is null');
                                    alert('Lỗi: Không tìm thấy thông tin quiz');
                                    return;
                                }
                                
                                if (!minigame.id) {
                                    console.error('Cannot start: minigame.id is missing');
                                    alert('Lỗi: Minigame ID không hợp lệ');
                                    return;
                                }
                                
                                console.log('Calling handleStart with minigame.id:', minigame.id);
                                try {
                                    await handleStart();
                                    console.log('handleStart completed successfully');
                                } catch (error) {
                                    console.error('handleStart threw an error:', error);
                                }
                            }}
                            className={`btn-yellow px-8 py-3 rounded-lg text-lg font-medium ${
                                !minigame ? 'opacity-50 cursor-not-allowed' : 'hover:bg-yellow-500 active:bg-yellow-600'
                            }`}
                            style={{
                                pointerEvents: !minigame ? 'none' : 'auto'
                            }}
                        >
                            {!minigame ? 'Đang tải...' : 'Bắt đầu làm quiz'}
                        </button>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    // Debug logging
    console.log('StudentMinigamePlay render:', {
        showResults,
        hasResult: !!result,
        loadingQuestions,
        attemptId,
        questionsCount: questions.length,
        hasStartedAt: !!startedAt
    });

    return (
        <StudentLayout>
            {showResults && result ? (
                <QuizResults
                    result={result}
                    minigame={minigame}
                    attemptDetail={attemptDetail || undefined}
                    onClose={handleCloseResults}
                    onRetry={handleRetry}
                    attemptCount={attemptCount}
                />
            ) : loadingQuestions ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                    <LoadingSpinner />
                </div>
            ) : attemptId && questions.length > 0 ? (
                <QuizPlayer
                    minigame={minigame}
                    questions={questions}
                    attemptId={attemptId}
                    timeLimit={minigame.timeLimit || undefined}
                    startedAt={startedAt}
                    onSubmit={handleSubmit}
                    onTimeUp={handleTimeUp}
                />
            ) : attemptId && questions.length === 0 ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="text-red-600 text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-[#001C44] mb-2">Lỗi tải câu hỏi</h2>
                        <p className="text-gray-600 mb-6">Không thể tải câu hỏi cho quiz này</p>
                        <button
                            onClick={() => {
                                setAttemptId(null);
                                setStartedAt('');
                                setQuestions([]);
                            }}
                            className="btn-primary px-6 py-3 rounded-lg font-medium"
                        >
                            Thử lại
                        </button>
                    </div>
                </div>
            ) : null}
        </StudentLayout>
    );
};

export default StudentMinigamePlay;

