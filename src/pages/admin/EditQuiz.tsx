import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { minigameAPI } from '../../services/minigameAPI';
import { eventAPI } from '../../services/eventAPI';
import { MiniGame, UpdateMiniGameRequest, CreateQuestionRequest, CreateOptionRequest } from '../../types/minigame';
import { ActivityResponse } from '../../types/activity';
import { QuizForm } from '../../components/minigame';
import { LoadingSpinner } from '../../components/common';
import { toast } from 'react-toastify';
import { WarningCircle, CaretLeft, Info, PencilSimple } from '@phosphor-icons/react';

const EditQuiz: React.FC = () => {
    const navigate = useNavigate();
    const { miniGameId } = useParams<{ miniGameId: string }>();
    const [minigame, setMinigame] = useState<MiniGame | null>(null);
    const [activity, setActivity] = useState<ActivityResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [initialQuestions, setInitialQuestions] = useState<CreateQuestionRequest[]>([]);

    useEffect(() => {
        if (miniGameId) {
            loadMinigameData();
        }
    }, [miniGameId]);

    const loadMinigameData = async () => {
        if (!miniGameId) return;

        try {
            setLoading(true);
            // Use the new API to get questions with correct answers for editing
            const questionsEditResponse = await minigameAPI.getQuestionsForEdit(parseInt(miniGameId));
            if (!questionsEditResponse.status || !questionsEditResponse.data) {
                setError(questionsEditResponse.message || 'Không thể tải thông tin minigame');
                return;
            }

            const editData = questionsEditResponse.data;

            // Convert to MiniGame format for state
            const minigameData: MiniGame = {
                id: editData.miniGameId,
                title: editData.title,
                description: editData.description,
                questionCount: editData.questionCount,
                timeLimit: editData.timeLimit,
                isActive: true, // We don't have this info from edit API, assume true
                type: 'QUIZ' as any,
                activityId: 0, // We'll get this from activity
                requiredCorrectAnswers: editData.requiredCorrectAnswers,
                maxAttempts: editData.maxAttempts ?? null, // Include maxAttempts from API response
                showAnswers: editData.showAnswers ?? false
            };
            setMinigame(minigameData);

            // Load activity - we need to get activityId from minigame list
            // Also get maxAttempts from getAllMiniGames if not in editData
            const minigamesResponse = await minigameAPI.getAllMiniGames();
            if (minigamesResponse.status && minigamesResponse.data) {
                const foundMinigame = minigamesResponse.data.find(m => m.id === parseInt(miniGameId));
                if (foundMinigame) {
                    minigameData.activityId = foundMinigame.activityId;
                    // Always use maxAttempts from getAllMiniGames (more reliable source)
                    // editData.maxAttempts might not be included in the API response
                    minigameData.maxAttempts = foundMinigame.maxAttempts ?? null;
                    // Update minigame state with maxAttempts
                    setMinigame({ ...minigameData });
                    
                    // Load activity
                    const eventsResponse = await eventAPI.getEvents();
                    if (eventsResponse.status && eventsResponse.data) {
                        const foundActivity = eventsResponse.data.find(a => a.id === foundMinigame.activityId);
                        if (foundActivity) {
                            setActivity(foundActivity);
                        } else {
                            setError('Không tìm thấy activity');
                            return;
                        }
                    } else {
                        setError('Không thể tải danh sách activities');
                        return;
                    }
                } else {
                    setError('Không tìm thấy minigame trong danh sách');
                    return;
                }
            } else {
                setError('Không thể tải danh sách minigames');
                return;
            }

            // Convert questions from edit format to CreateQuestionRequest format
            const convertedQuestions: CreateQuestionRequest[] = editData.questions.map(q => ({
                questionText: q.questionText,
                imageUrl: q.imageUrl ?? null, // Include imageUrl if available
                options: q.options.map(opt => ({
                    text: opt.text,
                    isCorrect: opt.isCorrect
                } as CreateOptionRequest))
            }));

            // Store converted questions for initialData
            setInitialQuestions(convertedQuestions);
        } catch (err) {
            setError('Có lỗi xảy ra khi tải dữ liệu');
            console.error('Error loading minigame data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data: UpdateMiniGameRequest) => {
        if (!miniGameId || !activity) return;

        setSaving(true);
        try {
            const updateData: UpdateMiniGameRequest = data;
            
            const response = await minigameAPI.updateMiniGame(parseInt(miniGameId), updateData);
            if (response.status && response.data) {
                toast.success('Cập nhật quiz thành công!');
                navigate('/manager/minigames');
            } else {
                toast.error(response.message || 'Cập nhật quiz thất bại');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật quiz');
            console.error('Error updating quiz:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        navigate('/manager/minigames');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner />
            </div>
        );
    }

    if (error || !minigame || !activity) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <WarningCircle weight="duotone" className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Có lỗi xảy ra</h2>
                <p className="text-gray-500 mb-6 max-w-md">{error || 'Không tìm thấy dữ liệu'}</p>
                <button
                    onClick={handleCancel}
                    className="bg-[#001C44] hover:bg-[#002A66] text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
                >
                    Quay lại
                </button>
            </div>
        );
    }

    // Convert minigame to initial data format for QuizForm
    const initialData: Partial<UpdateMiniGameRequest> = {
        title: minigame.title,
        description: minigame.description,
        questionCount: minigame.questionCount,
        timeLimit: minigame.timeLimit,
        requiredCorrectAnswers: minigame.requiredCorrectAnswers,

        maxAttempts: minigame.maxAttempts !== undefined ? minigame.maxAttempts : null,
        showAnswers: minigame.showAnswers,
        // Use loaded questions with correct answers
        questions: initialQuestions
    };
    
    // Debug log to check maxAttempts value
    console.log('EditQuiz - Debug maxAttempts:', {
        'minigame.maxAttempts': minigame.maxAttempts,
        'initialData.maxAttempts': initialData.maxAttempts,
        'hasMaxAttempts': 'maxAttempts' in minigame,
        'minigame object': minigame
    });

    return (
        <div className="min-h-screen pb-12">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
                    <div>
                        <div className="inline-flex items-center px-3 py-1 mb-3 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold tracking-wide">
                            <PencilSimple weight="bold" className="w-4 h-4 mr-1.5" />
                            Cập nhật thông tin
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Chỉnh sửa Quiz</h1>
                        <p className="text-gray-500 mt-1">Sự kiện: <span className="font-medium text-gray-900">{activity.name}</span></p>
                    </div>
                    <button
                        onClick={handleCancel}
                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-200 rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 font-medium transition-all shadow-sm"
                    >
                        <CaretLeft className="w-4 h-4 mr-1.5" />
                        Quay lại
                    </button>
                </div>
                
                {/* Alerts */}
                {initialQuestions.length > 0 && (
                    <div className="flex items-start gap-3 bg-blue-50/80 border border-blue-200 rounded-2xl p-5 shadow-sm">
                        <Info weight="fill" className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-blue-900 mb-1">Đã tải {initialQuestions.length} câu hỏi</h4>
                            <p className="text-sm text-blue-800/80 leading-relaxed">
                                Bạn có thể chỉnh sửa các câu hỏi này. Khi lưu, hệ thống sẽ cập nhật toàn bộ quiz.
                            </p>
                        </div>
                    </div>
                )}
                {initialQuestions.length === 0 && (
                    <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl p-5 shadow-sm">
                        <WarningCircle weight="fill" className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-yellow-900 mb-1">Quiz chưa có nội dung</h4>
                            <p className="text-sm text-yellow-800/80 leading-relaxed">
                                Quiz này hiện tại chưa có câu hỏi nào. Vui lòng thêm các câu hỏi mới để hoàn thiện.
                            </p>
                        </div>
                    </div>
                )}
                
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mt-6">
                    <QuizForm
                        activity={activity}
                        onSubmit={handleSubmit as any}
                        loading={saving}
                        initialData={initialData as any}
                        title="Cấu hình bộ câu hỏi"
                        onCancel={handleCancel}
                        isInSeries={!!activity.seriesId}
                    />
                </div>
            </div>
        </div>
    );
};

export default EditQuiz;

