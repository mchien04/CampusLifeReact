import React, { useState, useEffect } from 'react';
import { MiniGame, QuestionWithoutAnswer } from '../../types/minigame';
import { getImageUrl } from '../../utils/imageUtils';
import { Timer, CaretLeft, CaretRight, CheckCircle, WarningCircle, Check } from '@phosphor-icons/react';

interface QuizPlayerProps {
    minigame: MiniGame;
    questions: QuestionWithoutAnswer[]; // Questions from API (required, no fallback to minigame.quiz)
    attemptId: number;
    timeLimit?: number;
    startedAt: string;
    onSubmit: (answers: Record<string, number>) => void; // Updated to use string keys
    onTimeUp?: () => void;
}

const QuizPlayer: React.FC<QuizPlayerProps> = ({
    minigame,
    questions,
    attemptId,
    timeLimit,
    startedAt,
    onSubmit,
    onTimeUp
}) => {
    // All hooks must be called before any conditional returns
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (timeLimit) {
            const startTime = new Date(startedAt).getTime();
            const updateTimer = () => {
                const now = Date.now();
                const elapsed = Math.floor((now - startTime) / 1000);
                const remaining = timeLimit - elapsed;

                if (remaining <= 0) {
                    setTimeRemaining(0);
                    if (onTimeUp) {
                        onTimeUp();
                    }
                } else {
                    setTimeRemaining(remaining);
                }
            };

            updateTimer();
            const interval = setInterval(updateTimer, 1000);

            return () => clearInterval(interval);
        }
    }, [timeLimit, startedAt, onTimeUp]);

    // Validate questions are provided (after all hooks)
    if (!questions || questions.length === 0) {
        return (
            <div className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-[60vh]">
                <div className="bg-white rounded-3xl p-8 text-center shadow-premium border border-gray-100 max-w-md w-full">
                    <WarningCircle weight="duotone" className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-900 font-bold text-xl mb-2">Lỗi tải câu hỏi</p>
                    <p className="text-gray-500">Không có câu hỏi nào để hiển thị.</p>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    // Sort options by displayOrder if available, otherwise keep original order
    const sortedOptions = currentQuestion
        ? [...currentQuestion.options].sort((a, b) => {
            // For QuestionWithoutAnswer, options don't have displayOrder, so just keep order
            const aOrder: number = 'displayOrder' in a && typeof (a as any).displayOrder === 'number' 
                ? ((a as any).displayOrder as number) 
                : 0;
            const bOrder: number = 'displayOrder' in b && typeof (b as any).displayOrder === 'number' 
                ? ((b as any).displayOrder as number) 
                : 0;
            return aOrder - bOrder;
        })
        : [];

    const handleAnswerSelect = (optionId: number) => {
        setAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: optionId
        }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length < questions.length) {
            const confirmed = window.confirm(
                `Bạn chưa trả lời ${questions.length - Object.keys(answers).length} câu hỏi. Bạn có chắc muốn nộp bài?`
            );
            if (!confirmed) return;
        }

        setIsSubmitting(true);
        try {
            // Convert answers from Record<number, number> to Record<string, number>
            // API expects questionId as string
            const answersForSubmit: Record<string, number> = {};
            Object.entries(answers).forEach(([questionId, optionId]) => {
                answersForSubmit[questionId.toString()] = optionId;
            });
            await onSubmit(answersForSubmit);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const answeredCount = Object.keys(answers).length;

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Main Content (Left) */}
                <div className="flex-1 w-full order-2 lg:order-1">
                    <div className="bg-white rounded-[2rem] shadow-premium border border-gray-100 overflow-hidden flex flex-col min-h-[600px]">
                        {/* Header Mobile / Title */}
                        <div className="p-6 sm:p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight leading-tight">{minigame.title}</h2>
                            <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm text-sm font-semibold text-gray-500">
                                Câu {currentQuestionIndex + 1}/{questions.length}
                            </div>
                        </div>

                        {/* Progress Bar (Top of question) */}
                        <div className="w-full bg-gray-100 h-1.5 relative overflow-hidden">
                            <div
                                className="absolute top-0 left-0 h-full bg-primary-600 transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        {/* Question Area */}
                        {currentQuestion && (
                            <div className="p-6 sm:p-8 flex-1 flex flex-col relative z-10">
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-8 leading-snug">
                                    {currentQuestion.questionText}
                                </h3>
                                
                                {/* Question Image */}
                                {currentQuestion.imageUrl && (
                                    <div className="mb-8 rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50 flex items-center justify-center p-2">
                                        <img
                                            src={getImageUrl(currentQuestion.imageUrl) || ''}
                                            alt="Question illustration"
                                            className="max-w-full h-auto max-h-[400px] object-contain rounded-xl"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}

                                <div className="space-y-4 mt-auto">
                                    {sortedOptions.map((option) => {
                                        const isSelected = answers[currentQuestion.id] === option.id;
                                        return (
                                            <button
                                                key={option.id}
                                                onClick={() => handleAnswerSelect(option.id)}
                                                className={`group relative w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 overflow-hidden flex items-center gap-4 ${
                                                    isSelected
                                                        ? 'border-primary-600 bg-primary-50/50 shadow-sm transform scale-[1.01]'
                                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                {/* Selection Indicator */}
                                                <div
                                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                                        isSelected
                                                            ? 'border-primary-600 bg-primary-600 text-white'
                                                            : 'border-gray-300 bg-white group-hover:border-gray-400'
                                                    }`}
                                                >
                                                    {isSelected && <Check weight="bold" className="w-3.5 h-3.5" />}
                                                </div>
                                                <span className={`flex-1 text-base sm:text-lg transition-colors ${isSelected ? 'text-primary-900 font-semibold' : 'text-gray-700 font-medium'}`}>
                                                    {option.text}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sticky Sidebar (Right) */}
                <div className="w-full lg:w-80 shrink-0 order-1 lg:order-2 flex flex-col gap-4 lg:sticky lg:top-24">
                    {/* Timer Card */}
                    {timeRemaining !== null && (
                        <div className={`bg-white rounded-2xl p-5 border shadow-sm flex items-center justify-between transition-colors ${
                            timeRemaining < 60 ? 'border-red-200 bg-red-50/50' : 'border-gray-100'
                        }`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${timeRemaining < 60 ? 'bg-red-100 text-red-600' : 'bg-primary-50 text-primary-600'}`}>
                                    <Timer weight="duotone" className="w-6 h-6" />
                                </div>
                                <span className="font-semibold text-gray-500 uppercase tracking-wider text-xs">Thời gian còn lại</span>
                            </div>
                            <span className={`text-2xl font-bold tabular-nums tracking-tight ${timeRemaining < 60 ? 'text-red-600 animate-pulse' : 'text-gray-900'}`}>
                                {formatTime(timeRemaining)}
                            </span>
                        </div>
                    )}

                    {/* Navigation Card */}
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <span className="font-semibold text-gray-900">Danh sách câu hỏi</span>
                            <span className="text-xs font-bold bg-green-50 text-green-700 px-2 py-1 rounded-md border border-green-200">
                                {answeredCount}/{questions.length} đã làm
                            </span>
                        </div>
                        
                        {/* Question Grid */}
                        <div className="grid grid-cols-5 gap-2 mb-6">
                            {questions.map((_, index) => {
                                const isAnswered = answers[questions[index].id] !== undefined;
                                const isCurrent = index === currentQuestionIndex;
                                return (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentQuestionIndex(index)}
                                        className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                                            isCurrent
                                                ? 'bg-gray-900 text-white shadow-md transform scale-110 border-2 border-gray-900 z-10'
                                                : isAnswered
                                                ? 'bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100'
                                                : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        {index + 1}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Prev/Next/Submit Controls */}
                        <div className="grid grid-cols-2 gap-2 mt-auto">
                            <button
                                onClick={handlePrevious}
                                disabled={currentQuestionIndex === 0}
                                className="flex items-center justify-center py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
                            >
                                <CaretLeft weight="bold" className="w-4 h-4 mr-1" /> Trước
                            </button>
                            
                            {currentQuestionIndex < questions.length - 1 ? (
                                <button
                                    onClick={handleNext}
                                    className="flex items-center justify-center py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-900 hover:bg-gray-200 transition-all font-medium text-sm"
                                >
                                    Sau <CaretRight weight="bold" className="w-4 h-4 ml-1" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="flex items-center justify-center py-3 bg-green-600 border border-green-600 rounded-xl text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-sm shadow-sm"
                                >
                                    {isSubmitting ? 'Đang nộp...' : (
                                        <>
                                            <CheckCircle weight="bold" className="w-4 h-4 mr-1" /> Nộp bài
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizPlayer;

