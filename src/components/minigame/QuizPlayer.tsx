import React, { useState, useEffect } from 'react';
import { MiniGame, QuestionWithoutAnswer } from '../../types/minigame';
import { getImageUrl } from '../../utils/imageUtils';

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
            <div className="max-w-4xl mx-auto p-6">
                <div className="card">
                    <div className="p-6 text-center">
                        <p className="text-red-600">Không có câu hỏi nào để hiển thị.</p>
                    </div>
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
        <div className="max-w-4xl mx-auto p-6">
            <div className="card">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-[#001C44]">{minigame.title}</h2>
                        {timeRemaining !== null && (
                            <div
                                className={`px-4 py-2 rounded-lg font-bold ${
                                    timeRemaining < 60
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-blue-100 text-blue-800'
                                }`}
                            >
                                ⏱️ {formatTime(timeRemaining)}
                            </div>
                        )}
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>
                                Câu {currentQuestionIndex + 1} / {questions.length}
                            </span>
                            <span>Đã trả lời: {answeredCount} / {questions.length}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-[#001C44] h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Question */}
                {currentQuestion && (
                    <div className="p-6">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                {currentQuestion.questionText}
                            </h3>
                            
                            {/* Question Image */}
                            {currentQuestion.imageUrl && (
                                <div className="mb-4">
                                    <img
                                        src={getImageUrl(currentQuestion.imageUrl) || ''}
                                        alt="Question illustration"
                                        className="max-w-full h-auto max-h-64 rounded-lg border border-gray-300 mx-auto"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}

                            <div className="space-y-3">
                                {sortedOptions.map((option) => {
                                    const isSelected = answers[currentQuestion.id] === option.id;
                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => handleAnswerSelect(option.id)}
                                            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                                                isSelected
                                                    ? 'border-[#001C44] bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div
                                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                        isSelected
                                                            ? 'border-[#001C44] bg-[#001C44]'
                                                            : 'border-gray-300'
                                                    }`}
                                                >
                                                    {isSelected && (
                                                        <span className="text-white text-xs">✓</span>
                                                    )}
                                                </div>
                                                <span className="text-gray-900">{option.text}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex justify-between items-center pt-4 border-t">
                            <button
                                onClick={handlePrevious}
                                disabled={currentQuestionIndex === 0}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                ← Câu trước
                            </button>

                            <div className="flex space-x-2">
                                {questions.map((_, index) => {
                                    const isAnswered = answers[questions[index].id] !== undefined;
                                    const isCurrent = index === currentQuestionIndex;
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentQuestionIndex(index)}
                                            className={`w-8 h-8 rounded ${
                                                isCurrent
                                                    ? 'bg-[#001C44] text-white'
                                                    : isAnswered
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-200 text-gray-600'
                                            } text-sm font-medium hover:opacity-80 transition-opacity`}
                                        >
                                            {index + 1}
                                        </button>
                                    );
                                })}
                            </div>

                            {currentQuestionIndex < questions.length - 1 ? (
                                <button
                                    onClick={handleNext}
                                    className="px-4 py-2 bg-[#001C44] text-white rounded-lg hover:bg-[#002A66] transition-colors"
                                >
                                    Câu sau →
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizPlayer;

