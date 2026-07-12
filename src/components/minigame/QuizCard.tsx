import React from 'react';
import { Link } from 'react-router-dom';
import { MiniGame } from '../../types/minigame';
import { ActivityResponse } from '../../types/activity';
import { CalendarBlank, GameController, Clock, CheckCircle, ArrowsClockwise, Infinity as InfinityIcon, ChartBar, WarningCircle } from '@phosphor-icons/react';

interface QuizCardProps {
    minigame: MiniGame;
    activity?: ActivityResponse;
    onStart?: (activityId: number) => void;
    hasAttempts?: boolean;
    attemptCount?: number;
    isRegistered?: boolean;
}

const QuizCard: React.FC<QuizCardProps> = ({ minigame, activity, onStart, hasAttempts, attemptCount = 0, isRegistered = false }) => {
    const canStart = () => {
        if (!activity) return false;
        
        if (!isRegistered) {
            return false;
        }
        
        const now = new Date();
        const startDate = new Date(activity.startDate);
        const endDate = new Date(activity.endDate);
        const withinTimeRange = now >= startDate && now <= endDate;
        
        if (minigame.maxAttempts !== null && minigame.maxAttempts !== undefined) {
            if (attemptCount >= minigame.maxAttempts) {
                return false;
            }
        }
        
        return withinTimeRange;
    };
    
    const isMaxAttemptsReached = () => {
        if (minigame.maxAttempts === null || minigame.maxAttempts === undefined) {
            return false;
        }
        return attemptCount >= minigame.maxAttempts;
    };

    return (
        <div className="relative group flex flex-col h-full bg-white/70 backdrop-blur-xl rounded-[24px] overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,28,68,0.1)] border border-white/40 shadow-sm">
            {/* Background noise/grain overlay */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
            
            <div className="relative p-6 sm:p-8 flex flex-col flex-grow z-10">
                {/* Header Section */}
                <div className="mb-6">
                    <div className="flex flex-wrap gap-2 mb-4">
                        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold tracking-wide uppercase rounded-full bg-[#001C44]/5 text-[#001C44]">
                            <GameController weight="fill" className="w-3.5 h-3.5 mr-1.5" />
                            Mini Game
                        </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 leading-tight line-clamp-2">
                        {minigame.title}
                    </h3>
                    
                    {activity && (
                        <Link
                            to={`/student/events/${activity.id}`}
                            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors group/link"
                        >
                            <CalendarBlank weight="duotone" className="w-4 h-4 mr-1.5 transition-transform group-hover/link:-translate-y-0.5" />
                            <span className="border-b border-transparent group-hover/link:border-blue-600/30">{activity.name}</span>
                        </Link>
                    )}
                </div>

                {/* Description */}
                {minigame.description && (
                    <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-3 flex-grow">
                        {minigame.description}
                    </p>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm mb-8 p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                    <div className="flex flex-col">
                        <span className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1 flex items-center">
                            <ChartBar className="w-3.5 h-3.5 mr-1" /> Câu hỏi
                        </span>
                        <span className="font-semibold text-gray-900">{minigame.questionCount}</span>
                    </div>
                    
                    {minigame.timeLimit && (
                        <div className="flex flex-col">
                            <span className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1 flex items-center">
                                <Clock className="w-3.5 h-3.5 mr-1" /> Thời gian
                            </span>
                            <span className="font-semibold text-gray-900">{Math.floor(minigame.timeLimit / 60)} phút</span>
                        </div>
                    )}
                    
                    {minigame.requiredCorrectAnswers && (
                        <div className="flex flex-col">
                            <span className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1 flex items-center">
                                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Cần đúng
                            </span>
                            <span className="font-semibold text-gray-900">{minigame.requiredCorrectAnswers}/{minigame.questionCount}</span>
                        </div>
                    )}

                    <div className="flex flex-col">
                        <span className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1 flex items-center">
                            {minigame.maxAttempts ? <ArrowsClockwise className="w-3.5 h-3.5 mr-1" /> : <InfinityIcon className="w-3.5 h-3.5 mr-1" />}
                            Lần thử
                        </span>
                        <span className="font-semibold text-gray-900">
                            {minigame.maxAttempts ? `${attemptCount}/${minigame.maxAttempts}` : 'Không giới hạn'}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 mt-auto">
                    {canStart() && onStart && activity && !isMaxAttemptsReached() ? (
                        <button
                            onClick={() => onStart(activity.id)}
                            className="w-full bg-[#001C44] text-white hover:bg-[#002A66] active:scale-[0.98] transition-all duration-200 px-6 py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center shadow-md hover:shadow-lg shadow-[#001C44]/10"
                        >
                            Bắt đầu làm bài
                        </button>
                    ) : (
                        <div className="flex items-center justify-center p-3 bg-gray-50 rounded-xl text-sm text-gray-500 border border-gray-100">
                            {activity && (
                                <>
                                    {!isRegistered ? (
                                        <span className="flex items-center text-orange-600 font-medium">
                                            <WarningCircle className="w-4 h-4 mr-1.5" />
                                            Cần đăng ký sự kiện
                                        </span>
                                    ) : isMaxAttemptsReached() ? (
                                        <span className="flex items-center text-red-600 font-medium">
                                            <WarningCircle className="w-4 h-4 mr-1.5" />
                                            Đã hết lượt làm bài
                                        </span>
                                    ) : new Date(activity.startDate) > new Date() ? (
                                        <span className="flex items-center">
                                            <Clock className="w-4 h-4 mr-1.5" />
                                            Chưa mở
                                        </span>
                                    ) : (
                                        <span className="flex items-center text-gray-400">
                                            <Clock className="w-4 h-4 mr-1.5" />
                                            Đã đóng
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {hasAttempts && (
                        <Link
                            to={`/student/minigames/${activity?.id}/history`}
                            className="w-full bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 active:scale-[0.98] transition-all duration-200 px-6 py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center"
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

