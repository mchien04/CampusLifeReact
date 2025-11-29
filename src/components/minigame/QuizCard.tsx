import React from 'react';
import { Link } from 'react-router-dom';
import { MiniGame } from '../../types/minigame';
import { ActivityResponse } from '../../types/activity';

interface QuizCardProps {
    minigame: MiniGame;
    activity?: ActivityResponse;
    onStart?: (activityId: number) => void; // Changed to activityId
    hasAttempts?: boolean;
}

const QuizCard: React.FC<QuizCardProps> = ({ minigame, activity, onStart, hasAttempts }) => {
    const canStart = () => {
        if (!activity) return false;
        const now = new Date();
        const startDate = new Date(activity.startDate);
        const endDate = new Date(activity.endDate);
        return now >= startDate && now <= endDate;
    };

    return (
        <div className="card overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col h-full border-2 border-transparent hover:border-[#FFD66D]">
            <div className="p-6 flex flex-col flex-grow">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                            {minigame.title}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                Mini Game
                            </span>
                            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                Quiz
                            </span>
                        </div>
                    </div>
                </div>

                {/* Description */}
                {minigame.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
                        {minigame.description}
                    </p>
                )}

                {/* Quiz Info */}
                <div className="space-y-2 text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                        <span className="w-4 h-4 mr-2">❓</span>
                        <span className="truncate">{minigame.questionCount} câu hỏi</span>
                    </div>
                    {minigame.timeLimit && (
                        <div className="flex items-center">
                            <span className="w-4 h-4 mr-2">⏱️</span>
                            <span className="truncate">
                                Thời gian: {Math.floor(minigame.timeLimit / 60)} phút
                            </span>
                        </div>
                    )}
                    {minigame.requiredCorrectAnswers && (
                        <div className="flex items-center">
                            <span className="w-4 h-4 mr-2">✅</span>
                            <span className="truncate">
                                Cần đúng: {minigame.requiredCorrectAnswers}/{minigame.questionCount} câu
                            </span>
                        </div>
                    )}
                    {minigame.rewardPoints && (
                        <div className="flex items-center">
                            <span className="w-4 h-4 mr-2">🏆</span>
                            <span className="truncate">
                                Điểm thưởng: {parseFloat(minigame.rewardPoints).toFixed(1)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-2 mt-auto">
                    {canStart() && onStart && activity ? (
                        <button
                            onClick={() => {
                                console.log('QuizCard: Button clicked, activity.id:', activity.id);
                                onStart(activity.id);
                            }}
                            className="w-full btn-yellow px-4 py-2 rounded-lg text-sm font-medium"
                        >
                            Bắt đầu làm quiz
                        </button>
                    ) : (
                        <div className="text-center text-sm text-gray-500 py-2">
                            {activity && (
                                <p>
                                    {new Date(activity.startDate) > new Date()
                                        ? 'Chưa đến thời gian làm quiz'
                                        : 'Đã hết thời gian làm quiz'}
                                </p>
                            )}
                        </div>
                    )}

                    {hasAttempts && (
                        <Link
                            to={`/student/minigames/${activity?.id}/history`}
                            className="w-full btn-primary px-4 py-2 rounded-lg text-sm font-medium text-center"
                        >
                            Xem lịch sử
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuizCard;

