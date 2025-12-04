import React, { useState } from 'react';
import { SubmitAttemptResponse, MiniGame, AttemptDetailResponse } from '../../types/minigame';
import { getImageUrl } from '../../utils/imageUtils';

interface QuizResultsProps {
    result: SubmitAttemptResponse;
    minigame: MiniGame;
    attemptDetail?: AttemptDetailResponse; // Optional: detailed attempt with correct answers
    onClose?: () => void;
    onRetry?: () => void;
    attemptCount?: number; // Số lần đã làm
}

const QuizResults: React.FC<QuizResultsProps> = ({ result, minigame, attemptDetail, onClose, onRetry, attemptCount = 0 }) => {
    const percentage = (result.correctCount / result.totalQuestions) * 100;
    // Status is now a string from backend, check for 'PASSED'
    const passed = result.status === 'PASSED' || result.passed === true;
    const [showDetails, setShowDetails] = useState(false);
    
    // Check if can retry (has attempts remaining)
    const canRetry = () => {
        if (minigame.maxAttempts === null || minigame.maxAttempts === undefined) {
            return true; // Unlimited attempts
        }
        return attemptCount < minigame.maxAttempts;
    };
    
    const handleRetryClick = () => {
        if (passed && onRetry) {
            const confirmed = window.confirm('Làm lại sẽ ghi đè điểm cũ. Bạn có chắc muốn tiếp tục?');
            if (confirmed && onRetry) {
                onRetry();
            }
        } else if (onRetry) {
            onRetry();
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className={`relative bg-white rounded-lg shadow-xl ${attemptDetail ? 'max-w-4xl' : 'max-w-md'} w-full mx-4 ${attemptDetail ? 'max-h-[90vh]' : ''} flex flex-col`}>
                <div className={`${attemptDetail && showDetails ? 'hidden' : ''} p-6`}>
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
                        {(result.requiredCorrectAnswers !== undefined || minigame.requiredCorrectAnswers) && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">Yêu cầu tối thiểu:</span>
                                <span className="font-semibold">
                                    {(() => {
                                        const required = result.requiredCorrectAnswers ?? minigame.requiredCorrectAnswers ?? 0;
                                        const achieved = result.correctCount >= required;
                                        return achieved ? (
                                            <span className="text-green-600">✓ Đạt ({required} câu)</span>
                                        ) : (
                                            <span className="text-red-600">
                                                Cần {required} câu (hiện tại: {result.correctCount})
                                            </span>
                                        );
                                    })()}
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
                        {result.participation && passed && (
                            <div className="flex justify-between pt-2 border-t">
                                <span className="text-gray-600">Trạng thái:</span>
                                <span className="font-semibold text-green-600">
                                    {result.participation.isCompleted ? '✓ Hoàn thành' : 'Đang xử lý'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3">
                        {attemptDetail && (
                            <button
                                onClick={() => setShowDetails(true)}
                                className="flex-1 btn-primary px-4 py-2 rounded-lg text-sm font-medium"
                            >
                                Xem chi tiết
                            </button>
                        )}
                        {onRetry && canRetry() && (
                            <button
                                onClick={handleRetryClick}
                                disabled={!canRetry()}
                                className="flex-1 btn-yellow px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Làm lại
                            </button>
                        )}
                        {onRetry && !canRetry() && (
                            <div className="flex-1 text-center text-sm text-gray-500 py-2">
                                Đã đạt số lần làm tối đa
                            </div>
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

                {/* Detailed Results */}
                {attemptDetail && showDetails && (
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-[#001C44]">Chi tiết câu trả lời</h3>
                            <button
                                onClick={() => setShowDetails(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="space-y-4">
                            {attemptDetail.questions
                                .sort((a, b) => a.displayOrder - b.displayOrder)
                                .map((question, index) => (
                                    <div
                                        key={question.id}
                                        className={`border-2 rounded-lg p-4 ${
                                            question.isCorrect
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-red-500 bg-red-50'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <h4 className="font-semibold text-gray-900 flex-1">
                                                Câu {index + 1}: {question.questionText}
                                            </h4>
                                            <div className="ml-4">
                                                {question.isCorrect ? (
                                                    <span className="text-green-600 text-2xl">✓</span>
                                                ) : (
                                                    <span className="text-red-600 text-2xl">✗</span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Question Image */}
                                        {question.imageUrl && (
                                            <div className="mb-3">
                                                <img
                                                    src={getImageUrl(question.imageUrl) || ''}
                                                    alt="Question illustration"
                                                    className="max-w-full h-auto max-h-48 rounded-lg border border-gray-300"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            {question.options.map((option) => {
                                                const isCorrect = option.isCorrect;
                                                const isSelected = option.isSelected;
                                                let bgColor = 'bg-white';
                                                let borderColor = 'border-gray-200';
                                                let textColor = 'text-gray-900';

                                                if (isCorrect) {
                                                    bgColor = 'bg-green-100';
                                                    borderColor = 'border-green-500';
                                                    textColor = 'text-green-900';
                                                } else if (isSelected) {
                                                    bgColor = 'bg-red-100';
                                                    borderColor = 'border-red-500';
                                                    textColor = 'text-red-900';
                                                }

                                                return (
                                                    <div
                                                        key={option.id}
                                                        className={`p-3 rounded-lg border-2 ${bgColor} ${borderColor} ${textColor} flex items-center space-x-2`}
                                                    >
                                                        {isCorrect && (
                                                            <span className="text-green-600 font-bold">✓ Đúng</span>
                                                        )}
                                                        {isSelected && !isCorrect && (
                                                            <span className="text-red-600 font-bold">✗ Bạn chọn</span>
                                                        )}
                                                        <span className="flex-1">{option.text}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {!question.isCorrect && question.selectedOptionId && (
                                            <div className="mt-2 text-sm text-gray-600">
                                                Đáp án đúng: Câu {question.options.findIndex(o => o.id === question.correctOptionId) + 1}
                                            </div>
                                        )}
                                    </div>
                                ))}
                        </div>
                        <div className="mt-6 flex space-x-3">
                            <button
                                onClick={() => setShowDetails(false)}
                                className="flex-1 btn-primary px-4 py-2 rounded-lg text-sm font-medium"
                            >
                                Quay lại
                            </button>
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
                )}
            </div>
        </div>
    );
};

export default QuizResults;

