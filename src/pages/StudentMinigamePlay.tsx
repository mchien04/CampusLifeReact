import React, { useState, useEffect, useCallback } from 'react';
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
import { 
    GameController, 
    Clock, 
    CheckCircle, 
    WarningCircle, 
    Question,
    Timer,
    Info,
    PlayCircle,
    ArrowLeft
} from '@phosphor-icons/react';

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

    const loadMinigame = useCallback(async () => {
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
    }, [activityId, navigate, isRegistered]);

    useEffect(() => {
        if (activityId) {
            loadMinigame();
        }
    }, [activityId, loadMinigame]);

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
                const newAttemptId = response.data.id || 0;
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
                
                // Show success message when the attempt is passed
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
                <div className="flex items-center justify-center min-h-[70vh] p-4">
                    <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-premium border border-gray-100">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <WarningCircle weight="duotone" className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Không tìm thấy Quiz</h2>
                        <p className="text-gray-500 mb-8 leading-relaxed">
                            {error || 'Không tìm thấy quiz cho activity này. Vui lòng thử lại sau.'}
                        </p>
                        
                        {activity && (
                            <div className="bg-gray-50/80 rounded-2xl p-5 mb-8 text-left border border-gray-100">
                                <div className="flex items-center text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                    <Info weight="bold" className="w-4 h-4 mr-1.5" />
                                    Thông tin sự kiện
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Mã sự kiện</p>
                                        <p className="text-sm font-semibold text-gray-900 bg-white px-3 py-1.5 rounded-lg border border-gray-200 inline-block">#{activity.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Tên sự kiện</p>
                                        <p className="text-sm font-medium text-gray-900 leading-snug">{activity.name}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => navigate('/student/minigames')}
                                className="w-full sm:w-auto px-6 py-3 rounded-xl font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all flex items-center justify-center"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Quay lại
                            </button>
                            <button
                                onClick={() => {
                                    setError(null);
                                    loadMinigame();
                                }}
                                className="w-full sm:w-auto btn-primary px-6 py-3 rounded-xl font-medium shadow-sm flex items-center justify-center"
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
                <div className="flex items-center justify-center min-h-[70vh] p-4">
                    <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-premium border border-gray-100">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <Clock weight="duotone" className="w-10 h-10 text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Quiz chưa mở</h2>
                        <p className="text-gray-500 mb-8 leading-relaxed max-w-xs mx-auto">
                            {now < startDate
                                ? `Quiz sẽ mở vào lúc ${startDate.toLocaleTimeString('vi-VN')} ngày ${startDate.toLocaleDateString('vi-VN')}. Bạn vui lòng quay lại sau.`
                                : `Quiz đã kết thúc vào lúc ${endDate.toLocaleTimeString('vi-VN')} ngày ${endDate.toLocaleDateString('vi-VN')}. Bạn không thể làm bài nữa.`}
                        </p>
                        <button
                            onClick={() => navigate('/student/minigames')}
                            className="btn-primary px-6 py-3 rounded-xl font-medium inline-flex items-center justify-center w-full sm:w-auto shadow-sm"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Quay lại danh sách
                        </button>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    if (!attemptId) {
        console.log('=== RENDERING START SCREEN ===');
        return (
            <StudentLayout>
                <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white rounded-[2rem] p-6 sm:p-10 shadow-premium border border-gray-100 overflow-hidden relative">
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-yellow-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
                        
                        <div className="relative z-10 text-center mb-10">
                            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-900 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-900/20 mb-6 transform -rotate-3">
                                <GameController weight="fill" className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight text-balance">
                                {minigame?.title || 'Đang tải...'}
                            </h2>
                            {minigame?.description && (
                                <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
                                    {minigame.description}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 relative z-10">
                            <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]">
                                <Question weight="duotone" className="w-7 h-7 text-primary-500 mb-2" />
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Số câu hỏi</span>
                                <span className="text-xl font-bold text-gray-900">{minigame?.questionCount || 0}</span>
                            </div>
                            
                            {minigame?.timeLimit ? (
                                <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]">
                                    <Timer weight="duotone" className="w-7 h-7 text-blue-500 mb-2" />
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Thời gian</span>
                                    <span className="text-xl font-bold text-gray-900">{Math.floor(minigame.timeLimit / 60)} <span className="text-sm font-medium text-gray-500 lowercase">phút</span></span>
                                </div>
                            ) : (
                                <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 flex flex-col items-center justify-center text-center">
                                    <Timer weight="duotone" className="w-7 h-7 text-gray-400 mb-2" />
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Thời gian</span>
                                    <span className="text-sm font-medium text-gray-600">Không giới hạn</span>
                                </div>
                            )}

                            {minigame?.requiredCorrectAnswers ? (
                                <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]">
                                    <CheckCircle weight="duotone" className="w-7 h-7 text-green-500 mb-2" />
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Điều kiện qua</span>
                                    <span className="text-xl font-bold text-gray-900">
                                        {minigame.requiredCorrectAnswers}<span className="text-sm font-medium text-gray-500">/{minigame.questionCount}</span>
                                    </span>
                                </div>
                            ) : (
                                <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 flex flex-col items-center justify-center text-center">
                                    <CheckCircle weight="duotone" className="w-7 h-7 text-gray-400 mb-2" />
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Điều kiện qua</span>
                                    <span className="text-sm font-medium text-gray-600">Không yêu cầu</span>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-center relative z-10">
                            <button
                                type="button"
                                disabled={!minigame}
                                onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (!minigame || !minigame.id) return;
                                    await handleStart();
                                }}
                                className={`group relative inline-flex items-center justify-center px-10 py-4 text-lg font-bold rounded-2xl transition-all duration-300 overflow-hidden ${
                                    !minigame 
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                        : 'bg-primary-900 text-white shadow-xl shadow-primary-900/20 hover:bg-primary-800 hover:-translate-y-1 active:translate-y-0'
                                }`}
                                style={{ pointerEvents: !minigame ? 'none' : 'auto' }}
                            >
                                {minigame && (
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out pointer-events-none rounded-2xl"></div>
                                )}
                                <span className="relative z-10 flex items-center">
                                    {minigame ? (
                                        <>
                                            <PlayCircle weight="fill" className="w-6 h-6 mr-2" />
                                            Bắt đầu làm quiz
                                        </>
                                    ) : 'Đang tải...'}
                                </span>
                            </button>
                        </div>
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
                <div className="flex items-center justify-center min-h-[70vh] p-4">
                    <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-premium border border-gray-100">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <WarningCircle weight="duotone" className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Lỗi tải câu hỏi</h2>
                        <p className="text-gray-500 mb-8 leading-relaxed">Không thể tải câu hỏi cho quiz này. Vui lòng thử lại.</p>
                        <button
                            onClick={() => {
                                setAttemptId(null);
                                setStartedAt('');
                                setQuestions([]);
                            }}
                            className="btn-primary px-6 py-3 rounded-xl font-medium shadow-sm w-full sm:w-auto"
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

