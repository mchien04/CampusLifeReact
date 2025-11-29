import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventAPI } from '../../services/eventAPI';
import { minigameAPI } from '../../services/minigameAPI';
import { CreateActivityRequest, ActivityResponse } from '../../types/activity';
import { CreateMiniGameRequest } from '../../types/minigame';
import MinigameActivityForm from '../../components/events/MinigameActivityForm';
import { QuizForm } from '../../components/minigame';
import { LoadingSpinner } from '../../components/common';
import { toast } from 'react-toastify';

type WizardStep = 'activity' | 'quiz';

const CreateMinigameWizard: React.FC = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState<WizardStep>('activity');
    const [createdActivity, setCreatedActivity] = useState<ActivityResponse | null>(null);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleActivitySubmit = async (data: CreateActivityRequest) => {
        setSaving(true);
        try {
            const response = await eventAPI.createEvent(data);
            if (response.status && response.data) {
                setCreatedActivity(response.data);
                setCurrentStep('quiz');
                toast.success('Tạo activity thành công! Bây giờ hãy tạo quiz.');
            } else {
                toast.error(response.message || 'Tạo activity thất bại');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo activity');
            console.error('Error creating activity:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleQuizSubmit = async (data: CreateMiniGameRequest) => {
        if (!createdActivity) return;

        setSaving(true);
        try {
            const response = await minigameAPI.createMiniGame({
                ...data,
                activityId: createdActivity.id
            });
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
        if (currentStep === 'quiz' && createdActivity) {
            // Go back to activity step
            setCurrentStep('activity');
        } else {
            // Cancel completely
            navigate('/manager/minigames');
        }
    };

    const handleBackToActivity = () => {
        setCurrentStep('activity');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#001C44]">Tạo Mini Game</h1>
                    <p className="text-gray-600 mt-1">
                        {currentStep === 'activity' 
                            ? 'Bước 1: Tạo Activity cho Mini Game'
                            : 'Bước 2: Tạo Quiz cho Mini Game'}
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
                                        : createdActivity
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-200 text-gray-600'
                                }`}
                            >
                                {createdActivity ? '✓' : '1'}
                            </div>
                            <div className="flex-1">
                                <div className="font-medium text-gray-900">Tạo Activity</div>
                                <div className="text-sm text-gray-500">Thông tin cơ bản</div>
                            </div>
                        </div>

                        {/* Connector */}
                        <div className={`h-1 flex-1 ${createdActivity ? 'bg-green-500' : 'bg-gray-200'}`} />

                        {/* Step 2 */}
                        <div className="flex items-center space-x-2 flex-1">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                    currentStep === 'quiz'
                                        ? 'bg-[#001C44] text-white'
                                        : createdActivity
                                        ? 'bg-gray-200 text-gray-600'
                                        : 'bg-gray-100 text-gray-400'
                                }`}
                            >
                                2
                            </div>
                            <div className="flex-1">
                                <div className="font-medium text-gray-900">Tạo Quiz</div>
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
                        loading={saving}
                        title="Thông tin Activity"
                        onCancel={handleCancel}
                    />
                </div>
            ) : createdActivity ? (
                <div className="space-y-4">
                    {/* Activity Summary */}
                    <div className="card p-4 bg-blue-50 border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-gray-600">Activity đã tạo:</div>
                                <div className="font-semibold text-[#001C44]">{createdActivity.name}</div>
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
                            activity={createdActivity}
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

