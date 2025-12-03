import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { minigameAPI } from '../../services/minigameAPI';
import { eventAPI } from '../../services/eventAPI';
import { MiniGame, UpdateMiniGameRequest, CreateQuestionRequest, CreateOptionRequest } from '../../types/minigame';
import { ActivityResponse } from '../../types/activity';
import { QuizForm } from '../../components/minigame';
import { LoadingSpinner } from '../../components/common';
import { toast } from 'react-toastify';

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
                rewardPoints: editData.rewardPoints
            };
            setMinigame(minigameData);

            // Load activity - we need to get activityId from minigame list
            const minigamesResponse = await minigameAPI.getAllMiniGames();
            if (minigamesResponse.status && minigamesResponse.data) {
                const foundMinigame = minigamesResponse.data.find(m => m.id === parseInt(miniGameId));
                if (foundMinigame) {
                    minigameData.activityId = foundMinigame.activityId;
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
        if (!miniGameId) return;

        setSaving(true);
        try {
            const response = await minigameAPI.updateMiniGame(parseInt(miniGameId), data);
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
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="text-red-600 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-[#001C44] mb-2">Có lỗi xảy ra</h2>
                    <p className="text-gray-600 mb-6">{error || 'Không tìm thấy dữ liệu'}</p>
                    <button
                        onClick={handleCancel}
                        className="btn-primary px-6 py-3 rounded-lg font-medium"
                    >
                        Quay lại
                    </button>
                </div>
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
        rewardPoints: minigame.rewardPoints,
        // Use loaded questions with correct answers
        questions: initialQuestions
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#001C44]">Chỉnh sửa Quiz</h1>
                        <p className="text-gray-600 mt-1">Activity: {activity.name}</p>
                    </div>
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Quay lại
                    </button>
                </div>
                {initialQuestions.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-blue-800">
                            <strong>Thông tin:</strong> Đã tải {initialQuestions.length} câu hỏi với đáp án đúng. 
                            Bạn có thể chỉnh sửa các câu hỏi này. Khi lưu, hệ thống sẽ cập nhật toàn bộ quiz.
                        </p>
                    </div>
                )}
                {initialQuestions.length === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-yellow-800">
                            <strong>Lưu ý:</strong> Quiz này chưa có câu hỏi. Vui lòng thêm các câu hỏi mới.
                        </p>
                    </div>
                )}
            </div>
            <QuizForm
                activity={activity}
                onSubmit={handleSubmit as any}
                loading={saving}
                initialData={initialData as any}
                title="Chỉnh sửa Quiz"
                onCancel={handleCancel}
            />
        </div>
    );
};

export default EditQuiz;

