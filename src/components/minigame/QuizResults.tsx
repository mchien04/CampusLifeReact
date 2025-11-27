import React from 'react';
import { SubmitAttemptResponse, MiniGame } from '../../types/minigame';
import { AttemptStatus } from '../../types/minigame';

interface QuizResultsProps {
    result: SubmitAttemptResponse;
    minigame: MiniGame;
    onClose?: () => void;
    onRetry?: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({ result, minigame, onClose, onRetry }) => {
    const percentage = (result.correctCount / result.totalQuestions) * 100;
    const passed = result.status === AttemptStatus.PASSED;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                <div className="text-center">
                    {/* Result Icon */}
                    <div className="mb-4">
                        {passed ? (
                            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-4xl text-green-600">✓</span>
                            </div>
                        ) : (
                            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                                <span className="text-4xl text-red-600">✗</span>
                            </div>
                        )}
                    </div>

                    {/* Result Title */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {passed ? 'Chúc mừng!' : 'Chưa đạt yêu cầu'}
                    </h2>

                    {/* Score */}
                    <div className="mb-6">
                        <div className="text-4xl font-bold text-[#001C44] mb-2">
                            {result.correctCount}/{result.totalQuestions}
                        </div>
                        <div className="text-lg text-gray-600">
                            {percentage.toFixed(1)}% đúng
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
                        <div
                            className={`h-4 rounded-full transition-all duration-500 ${
                                passed ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>

                    {/* Details */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-left">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Số câu đúng:</span>
                            <span className="font-semibold">{result.correctCount}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Tổng số câu:</span>
                            <span className="font-semibold">{result.totalQuestions}</span>
                        </div>
                        {minigame.requiredCorrectAnswers && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">Yêu cầu tối thiểu:</span>
                                <span className="font-semibold">
                                    {result.correctCount >= minigame.requiredCorrectAnswers ? (
                                        <span className="text-green-600">✓ Đạt</span>
                                    ) : (
                                        <span className="text-red-600">
                                            Cần {minigame.requiredCorrectAnswers} câu
                                        </span>
                                    )}
                                </span>
                            </div>
                        )}
                        {result.pointsEarned && passed && (
                            <div className="flex justify-between pt-2 border-t">
                                <span className="text-gray-600">Điểm nhận được:</span>
                                <span className="font-bold text-[#001C44]">
                                    +{parseFloat(result.pointsEarned).toFixed(1)} điểm
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3">
                        {onRetry && !passed && (
                            <button
                                onClick={onRetry}
                                className="flex-1 btn-yellow px-4 py-2 rounded-lg text-sm font-medium"
                            >
                                Làm lại
                            </button>
                        )}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="flex-1 btn-primary px-4 py-2 rounded-lg text-sm font-medium"
                            >
                                Đóng
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizResults;

