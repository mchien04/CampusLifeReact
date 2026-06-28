import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { minigameActivityAPI } from '../../services/minigameActivityAPI';
import { MinigameActivityCreateRequest, ActivityResponse } from '../../types/activity';
import { CreateMiniGameRequest, UpdateMiniGameRequest, QuizConfigRequest } from '../../types/minigame';
import MinigameActivityForm from '../../components/events/MinigameActivityForm';
import { QuizForm } from '../../components/minigame';
import { LoadingSpinner } from '../../components/common';
import { toast } from 'react-toastify';

type WizardStep = 'activity' | 'quiz';

const CreateMinigameWizard: React.FC = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState<WizardStep>('activity');
    const [activityData, setActivityData] = useState<MinigameActivityCreateRequest | null>(null);
    const [saving, setSaving] = useState(false);

    // Step 1: collect activity data (NO API call — quiz will be sent together in 1-step)
    const handleActivitySubmit = (data: MinigameActivityCreateRequest) => {
        setActivityData(data);
        setCurrentStep('quiz');
        toast.info('Đã lưu thông tin activity. Giờ hãy cấu hình quiz.');
    };

    // Step 2: combine activity + quiz → single POST /api/activities/minigame (1-step creation)
    const handleQuizSubmit = async (data: CreateMiniGameRequest | UpdateMiniGameRequest) => {
        if (!activityData) return;

        setSaving(true);
        try {
            const quizConfig: QuizConfigRequest = {
                title: (data as CreateMiniGameRequest).title,
                description: (data as CreateMiniGameRequest).description ?? null,
                questionCount: (data as CreateMiniGameRequest).questionCount,
                timeLimit: (data as CreateMiniGameRequest).timeLimit,
                requiredCorrectAnswers: (data as CreateMiniGameRequest).requiredCorrectAnswers,
                maxAttempts: (data as CreateMiniGameRequest).maxAttempts,
                showAnswers: (data as CreateMiniGameRequest).showAnswers ?? false,
                questions: (data as CreateMiniGameRequest).questions || []
            };

            const createRequest: MinigameActivityCreateRequest = {
                ...activityData,
                quiz: quizConfig
            };

            const response = await minigameActivityAPI.createMinigameActivity(createRequest);
            if (response.status && response.data) {
                toast.success('Tạo minigame thành công!');
                navigate('/manager/minigames');
            } else {
                toast.error(response.message || 'Tạo minigame thất bại');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo minigame');
            console.error('Error creating minigame:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (currentStep === 'quiz' && activityData) {
            setCurrentStep('activity');
        } else {
            navigate('/manager/minigames');
        }
    };

    const handleBackToActivity = () => {
        setCurrentStep('activity');
    };

    const hasActivity = !!activityData;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#001C44]">Tạo Mini Game</h1>
                    <p className="text-gray-600 mt-1">
                        {currentStep === 'activity'
                            ? 'Bước 1: Thông tin Activity cho Mini Game'
                            : 'Bước 2: Cấu hình Quiz cho Mini Game'}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/manager/minigames')}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Hủy
                </button>
            </div>

            {/* Progress Indicator */}
            <div className="card p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                        {/* Step 1 */}
                        <div className="flex items-center space-x-2 flex-1">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                    currentStep === 'activity'
                                        ? 'bg-[#001C44] text-white'
                                        : hasActivity
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-200 text-gray-600'
                                }`}
                            >
                                {hasActivity ? '✓' : '1'}
                            </div>
                            <div className="flex-1">
                                <div className="font-medium text-gray-900">Thông tin Activity</div>
                                <div className="text-sm text-gray-500">Tên, ngày, loại điểm</div>
                            </div>
                        </div>

                        {/* Connector */}
                        <div className={`h-1 flex-1 ${hasActivity ? 'bg-green-500' : 'bg-gray-200'}`} />

                        {/* Step 2 */}
                        <div className="flex items-center space-x-2 flex-1">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                    currentStep === 'quiz'
                                        ? 'bg-[#001C44] text-white'
                                        : hasActivity
                                        ? 'bg-gray-200 text-gray-600'
                                        : 'bg-gray-100 text-gray-400'
                                }`}
                            >
                                2
                            </div>
                            <div className="flex-1">
                                <div className="font-medium text-gray-900">Cấu hình Quiz</div>
                                <div className="text-sm text-gray-500">Câu hỏi và đáp án</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Content */}
            {currentStep === 'activity' ? (
                <div className="card p-6">
                    <MinigameActivityForm
                        onSubmit={handleActivitySubmit}
                        loading={false}
                        title="Thông tin Activity"
                        onCancel={handleCancel}
                    />
                </div>
            ) : hasActivity ? (
                <div className="space-y-4">
                    {/* Activity Summary */}
                    <div className="card p-4 bg-blue-50 border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-gray-600">Activity sẽ tạo:</div>
                                <div className="font-semibold text-[#001C44]">{activityData.name}</div>
                            </div>
                            <button
                                onClick={handleBackToActivity}
                                className="text-sm text-blue-600 hover:text-blue-800 underline"
                            >
                                Chỉnh sửa
                            </button>
                        </div>
                    </div>

                    {/* Quiz Form */}
                    <div className="card p-6">
                        <QuizForm
                            onSubmit={handleQuizSubmit}
                            loading={saving}
                            title="Thông tin Quiz"
                            onCancel={handleCancel}
                        />
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <LoadingSpinner />
                </div>
            )}
        </div>
    );
};

export default CreateMinigameWizard;
