import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { minigameActivityAPI } from '../../services/minigameActivityAPI';
import { MinigameActivityCreateRequest, ActivityResponse } from '../../types/activity';
import { CreateMiniGameRequest, UpdateMiniGameRequest, QuizConfigRequest } from '../../types/minigame';
import MinigameActivityForm from '../../components/events/MinigameActivityForm';
import { QuizForm } from '../../components/minigame';
import { LoadingSpinner } from '../../components/common';
import { toast } from 'react-toastify';
import { CaretLeft, Check, ListChecks, Exam, PencilSimple } from '@phosphor-icons/react';

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
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Tạo Mini Game</h1>
                    <p className="text-gray-500 mt-1 text-base">
                        {currentStep === 'activity'
                            ? 'Bước 1: Thiết lập thông tin cơ bản cho sự kiện'
                            : 'Bước 2: Cấu hình bộ câu hỏi và luật chơi'}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/manager/minigames')}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-200 rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 font-medium transition-all shadow-sm"
                >
                    <CaretLeft className="w-4 h-4 mr-1.5" />
                    Quay lại
                </button>
            </div>

            {/* Premium Progress Indicator */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between relative max-w-2xl mx-auto">
                    {/* Background track */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 rounded-full"></div>
                    {/* Active track */}
                    <div 
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#001C44] rounded-full transition-all duration-500 ease-out" 
                        style={{ width: hasActivity ? '100%' : '50%' }}
                    ></div>

                    {/* Step 1 */}
                    <div className="relative flex flex-col items-center group z-10 w-1/2">
                        <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-colors duration-300 ${
                                currentStep === 'activity'
                                    ? 'bg-[#001C44] text-white'
                                    : hasActivity
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-100 text-gray-400'
                            }`}
                        >
                            {hasActivity ? <Check weight="bold" className="w-5 h-5" /> : <ListChecks weight={currentStep === 'activity' ? "fill" : "regular"} className="w-5 h-5" />}
                        </div>
                        <div className="absolute top-14 mt-2 text-center w-32">
                            <div className={`font-semibold text-sm ${currentStep === 'activity' || hasActivity ? 'text-gray-900' : 'text-gray-400'}`}>
                                Thông tin Activity
                            </div>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="relative flex flex-col items-center group z-10 w-1/2">
                        <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-colors duration-300 ${
                                currentStep === 'quiz'
                                    ? 'bg-[#001C44] text-white'
                                    : hasActivity
                                    ? 'bg-gray-100 text-gray-400'
                                    : 'bg-gray-50 text-gray-300'
                            }`}
                        >
                            <Exam weight={currentStep === 'quiz' ? "fill" : "regular"} className="w-5 h-5" />
                        </div>
                        <div className="absolute top-14 mt-2 text-center w-32">
                            <div className={`font-semibold text-sm ${currentStep === 'quiz' ? 'text-gray-900' : 'text-gray-400'}`}>
                                Cấu hình Quiz
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Content */}
            <div className="mt-12 pt-6">
                {currentStep === 'activity' ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <MinigameActivityForm
                            onSubmit={handleActivitySubmit}
                            loading={false}
                            title="Thông tin Activity"
                            onCancel={handleCancel}
                        />
                    </div>
                ) : hasActivity ? (
                    <div className="space-y-6">
                        {/* Activity Summary Bar */}
                        <div className="flex items-center justify-between p-4 bg-[#001C44]/5 border border-[#001C44]/10 rounded-xl">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm mr-4">
                                    <ListChecks className="w-5 h-5 text-[#001C44]" />
                                </div>
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-0.5">Sự kiện đang tạo</div>
                                    <div className="font-bold text-gray-900">{activityData.name}</div>
                                </div>
                            </div>
                            <button
                                onClick={handleBackToActivity}
                                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors bg-white px-3 py-1.5 rounded-md shadow-sm border border-gray-200 hover:border-blue-200"
                            >
                                <PencilSimple className="w-4 h-4 mr-1.5" />
                                Chỉnh sửa
                            </button>
                        </div>

                        {/* Quiz Form */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                            <QuizForm
                                onSubmit={handleQuizSubmit}
                                loading={saving}
                                title="Cấu hình bộ câu hỏi"
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
        </div>
    );
};

export default CreateMinigameWizard;
