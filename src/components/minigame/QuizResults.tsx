import React, { useState } from 'react';
import { SubmitAttemptResponse, MiniGame, AttemptDetailResponse } from '../../types/minigame';
import { getImageUrl } from '../../utils/imageUtils';
import { Trophy, XCircle, ArrowCounterClockwise, ListMagnifyingGlass, X, Check, Medal, CheckCircle, Info, ArrowLeft } from '@phosphor-icons/react';

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
    const passed = result.status === 'PASSED';
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
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
            <div className={`relative bg-white rounded-[2rem] shadow-premium ${attemptDetail ? 'max-w-4xl' : 'max-w-md'} w-full mx-auto ${attemptDetail ? 'max-h-[90vh]' : ''} flex flex-col overflow-hidden transform scale-in duration-300`}>
                <div className={`${attemptDetail && showDetails ? 'hidden' : ''} p-8 sm:p-10`}>
                    <div className="text-center relative">
                    {/* Decorative confeti-like elements could go here */}
                    
                    {/* Result Icon */}
                    <div className="mb-6 relative inline-block">
                        <div className={`absolute inset-0 rounded-full blur-xl opacity-50 ${passed ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        {passed ? (
                            <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 border-4 border-white">
                                <Trophy weight="fill" className="w-12 h-12 text-white" />
                            </div>
                        ) : (
                            <div className="relative w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 border-4 border-white">
                                <XCircle weight="fill" className="w-12 h-12 text-white" />
                            </div>
                        )}
                    </div>

                    {/* Result Title */}
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
                        {passed ? 'Chúc mừng!' : 'Chưa đạt yêu cầu'}
                    </h2>

                    {/* Score */}
                    <div className="mb-8">
                        <div className="flex items-baseline justify-center gap-1 mb-2">
                            <span className="text-5xl font-black text-gray-900 tabular-nums tracking-tighter">
                                {result.correctCount}
                            </span>
                            <span className="text-2xl font-bold text-gray-400">
                                /{result.totalQuestions}
                            </span>
                        </div>
                        <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-gray-100 text-gray-700 font-semibold text-sm">
                            {percentage.toFixed(1)}% chính xác
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 rounded-full h-3 mb-8 overflow-hidden shadow-inner">
                        <div
                            className={`h-full transition-all duration-1000 ease-out rounded-full ${
                                passed ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>

                    {/* Details */}
                    <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-5 mb-8 space-y-3 text-left border border-gray-100">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-500">Số câu đúng</span>
                            <span className="font-bold text-gray-900">{result.correctCount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-500">Tổng số câu</span>
                            <span className="font-bold text-gray-900">{result.totalQuestions}</span>
                        </div>
                        {(result.requiredCorrectAnswers !== undefined || minigame.requiredCorrectAnswers) && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-500">Yêu cầu tối thiểu</span>
                                <span className="font-semibold text-sm">
                                    {(() => {
                                        const required = result.requiredCorrectAnswers ?? minigame.requiredCorrectAnswers ?? 0;
                                        const achieved = result.correctCount >= required;
                                        return achieved ? (
                                            <span className="inline-flex items-center text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                                                <Check weight="bold" className="w-3.5 h-3.5 mr-1" /> Đạt ({required} câu)
                                            </span>
                                        ) : (
                                            <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                                                Cần {required} câu
                                            </span>
                                        );
                                    })()}
                                </span>
                            </div>
                        )}
                        {result.pointsEarned && passed && (
                            <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-200">
                                <span className="text-sm font-medium text-gray-500">Điểm nhận được</span>
                                <span className="font-black text-primary-600 flex items-center bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-100">
                                    <Medal weight="fill" className="w-4 h-4 mr-1 text-yellow-500" />
                                    +{parseFloat(result.pointsEarned).toFixed(1)} điểm
                                </span>
                            </div>
                        )}
                        {result.participation && passed && (
                            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                                <span className="text-sm font-medium text-gray-500">Trạng thái</span>
                                <span className="font-semibold text-green-700 flex items-center">
                                    {result.participation.isCompleted ? (
                                        <><CheckCircle weight="fill" className="w-4 h-4 mr-1" /> Hoàn thành</>
                                    ) : 'Đang xử lý'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {attemptDetail && (
                            <button
                                onClick={() => setShowDetails(true)}
                                className="flex-1 flex items-center justify-center bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 px-6 py-3.5 rounded-xl font-bold transition-all shadow-sm"
                            >
                                <ListMagnifyingGlass weight="bold" className="w-5 h-5 mr-2" />
                                Xem chi tiết
                            </button>
                        )}
                        {onRetry && canRetry() && (
                            <button
                                onClick={handleRetryClick}
                                disabled={!canRetry()}
                                className="flex-1 flex items-center justify-center bg-primary-900 text-white hover:bg-primary-800 hover:-translate-y-0.5 px-6 py-3.5 rounded-xl font-bold transition-all shadow-md shadow-primary-900/20 disabled:opacity-50 disabled:transform-none"
                            >
                                <ArrowCounterClockwise weight="bold" className="w-5 h-5 mr-2" />
                                Làm lại
                            </button>
                        )}
                        {onRetry && !canRetry() && (
                            <div className="flex-1 flex items-center justify-center text-sm font-medium text-gray-500 bg-gray-100 rounded-xl px-6 py-3.5">
                                Đã đạt số lần làm tối đa
                            </div>
                        )}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="flex-1 flex items-center justify-center bg-gray-100 text-gray-700 hover:bg-gray-200 px-6 py-3.5 rounded-xl font-bold transition-colors"
                            >
                                Đóng
                            </button>
                        )}
                    </div>
                    </div>
                </div>

                {/* Detailed Results */}
                {attemptDetail && showDetails && (
                    <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-gray-50/50">
                        <div className="sticky top-0 bg-gray-50/90 backdrop-blur-md z-10 -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 px-6 sm:px-8 py-4 mb-6 border-b border-gray-200 flex items-center justify-between">
                            <div className="flex items-center">
                                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Chi tiết bài làm</h3>
                            </div>
                            <button
                                onClick={() => setShowDetails(false)}
                                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
                            >
                                <X weight="bold" className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-6 max-w-3xl mx-auto">
                            {attemptDetail.questions
                                .sort((a, b) => a.displayOrder - b.displayOrder)
                                .map((question, index) => (
                                    <div
                                        key={question.id}
                                        className={`bg-white rounded-2xl p-5 sm:p-6 shadow-sm border ${
                                            attemptDetail.showAnswers === false
                                                ? 'border-gray-200'
                                                : question.isCorrect
                                                    ? 'border-green-200'
                                                    : 'border-red-200'
                                        }`}
                                    >
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                                                attemptDetail.showAnswers === false
                                                    ? 'bg-gray-100 text-gray-600'
                                                    : question.isCorrect
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                            }`}>
                                                {index + 1}
                                            </div>
                                            <h4 className="font-semibold text-gray-900 text-lg flex-1 pt-0.5 leading-snug">
                                                {question.questionText}
                                            </h4>
                                            {attemptDetail.showAnswers !== false && (
                                                <div className="shrink-0 mt-0.5">
                                                    {question.isCorrect ? (
                                                        <CheckCircle weight="fill" className="text-green-500 w-7 h-7" />
                                                    ) : (
                                                        <XCircle weight="fill" className="text-red-500 w-7 h-7" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Question Image */}
                                        {question.imageUrl && (
                                            <div className="mb-5 bg-gray-50 rounded-xl p-2 border border-gray-100">
                                                <img
                                                    src={getImageUrl(question.imageUrl) || ''}
                                                    alt="Question illustration"
                                                    className="max-w-full h-auto max-h-[300px] object-contain mx-auto rounded-lg"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                        )}
                                        <div className="space-y-2.5 pl-0 sm:pl-12">
                                            {question.options.map((option) => {
                                                const isCorrect = option.isCorrect;
                                                const isSelected = option.isSelected;
                                                
                                                let stateClasses = 'bg-white border-gray-200 text-gray-700';
                                                
                                                if (attemptDetail.showAnswers === false) {
                                                    if (isSelected) {
                                                        stateClasses = 'bg-primary-50 border-primary-200 text-primary-900 font-medium';
                                                    }
                                                } else {
                                                    if (isCorrect && isSelected) {
                                                        stateClasses = 'bg-green-50 border-green-300 text-green-900 font-medium shadow-sm';
                                                    } else if (isCorrect && !isSelected) {
                                                        stateClasses = 'bg-green-50/50 border-green-200 text-green-800 border-dashed';
                                                    } else if (!isCorrect && isSelected) {
                                                        stateClasses = 'bg-red-50 border-red-300 text-red-900 font-medium shadow-sm';
                                                    } else {
                                                        stateClasses = 'bg-gray-50 border-gray-200 text-gray-500 opacity-60';
                                                    }
                                                }

                                                return (
                                                    <div
                                                        key={option.id}
                                                        className={`p-3.5 rounded-xl border-2 flex items-center gap-3 transition-all ${stateClasses}`}
                                                    >
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                                            isSelected ? 'border-current bg-current' : 'border-gray-300'
                                                        }`}>
                                                            {isSelected && <Check weight="bold" className="w-3 h-3 text-white" />}
                                                        </div>
                                                        <span className="flex-1 text-[15px]">{option.text}</span>
                                                        
                                                        {attemptDetail.showAnswers !== false && isCorrect && (
                                                            <span className="shrink-0 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded flex items-center">
                                                                <Check weight="bold" className="w-3 h-3 mr-1" /> ĐÁP ÁN
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {!question.isCorrect && question.selectedOptionId && attemptDetail.showAnswers !== false && (
                                            <div className="mt-4 pl-0 sm:pl-12 text-sm font-medium text-gray-500 flex items-center">
                                                <Info weight="duotone" className="w-4 h-4 mr-1.5" />
                                                Bạn đã chọn sai đáp án.
                                            </div>
                                        )}
                                    </div>
                                ))}
                        </div>
                        <div className="mt-8 flex justify-center sticky bottom-0 bg-gray-50/90 backdrop-blur-md p-4 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 border-t border-gray-200">
                            <button
                                onClick={() => setShowDetails(false)}
                                className="btn-primary px-8 py-3 rounded-xl font-bold flex items-center shadow-sm hover:shadow"
                            >
                                <ArrowLeft className="w-5 h-5 mr-2" /> Quay lại kết quả
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizResults;

