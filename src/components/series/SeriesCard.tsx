import React from 'react';
import { Link } from 'react-router-dom';
import { SeriesResponse } from '../../types/series';
import { ScoreType } from '../../types/activity';
import ProgressBar from '../common/ProgressBar';

interface SeriesCardProps {
    series: SeriesResponse;
    progress?: {
        completedCount: number;
        pointsEarned: string;
    };
    onRegister?: (seriesId: number) => void;
    isRegistered?: boolean;
}

const SeriesCard: React.FC<SeriesCardProps> = ({
    series,
    progress,
    onRegister,
    isRegistered
}) => {
    const milestones = series.milestonePoints || {};
    const totalActivities = series.activities?.length || series.totalActivities || 0;
    const completedCount = progress?.completedCount || 0;

    const getScoreTypeLabel = (type: ScoreType) => {
        const labels: Record<ScoreType, string> = {
            [ScoreType.REN_LUYEN]: 'Rèn luyện',
            [ScoreType.CONG_TAC_XA_HOI]: 'Công tác xã hội',
            [ScoreType.CHUYEN_DE]: 'Chuyên đề'
        };
        return labels[type] || type;
    };

    const canRegister = () => {
        if (isRegistered) return false;
        const now = new Date();
        if (series.registrationStartDate && new Date(series.registrationStartDate) > now) {
            return false;
        }
        if (series.registrationDeadline && new Date(series.registrationDeadline) < now) {
            return false;
        }
        return true;
    };

    return (
        <div className="card overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col h-full border-2 border-transparent hover:border-[#FFD66D]">
            <div className="p-6 flex flex-col flex-grow">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                            {series.name}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                Chuỗi sự kiện
                            </span>
                            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                {getScoreTypeLabel(series.scoreType)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Description */}
                {series.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
                        {series.description}
                    </p>
                )}

                {/* Series Info */}
                <div className="space-y-2 text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                        <span className="w-4 h-4 mr-2">📋</span>
                        <span className="truncate">
                            {totalActivities} sự kiện trong chuỗi
                        </span>
                    </div>
                    {series.registrationStartDate && (
                        <div className="flex items-center">
                            <span className="w-4 h-4 mr-2">🚀</span>
                            <span className="truncate">
                                Mở đăng ký: {new Date(series.registrationStartDate).toLocaleString('vi-VN', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                    )}
                    {series.registrationDeadline && (
                        <div className="flex items-center">
                            <span className="w-4 h-4 mr-2">⏰</span>
                            <span className="truncate">
                                Hạn đăng ký: {new Date(series.registrationDeadline).toLocaleString('vi-VN', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center">
                        <span className="w-4 h-4 mr-2">📝</span>
                        <span className="truncate">
                            {series.requiresApproval ? 'Đăng ký cần duyệt' : 'Đăng ký tự duyệt'}
                        </span>
                    </div>
                </div>

                {/* Progress */}
                {progress && (
                    <div className="mb-4">
                        <ProgressBar
                            current={completedCount}
                            total={totalActivities}
                            showLabel={true}
                            size="medium"
                            color="primary"
                        />
                    </div>
                )}

                {/* Milestone Preview */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs font-medium text-gray-700 mb-1">Điểm milestone:</div>
                    <div className="flex flex-wrap gap-1">
                        {Object.entries(milestones)
                            .slice(0, 3)
                            .map(([count, points]) => (
                                <span
                                    key={count}
                                    className="text-xs px-2 py-1 bg-white rounded border border-gray-200"
                                >
                                    {count} sự kiện → {points} điểm
                                </span>
                            ))}
                        {Object.keys(milestones).length > 3 && (
                            <span className="text-xs px-2 py-1 text-gray-500">
                                +{Object.keys(milestones).length - 3} mốc khác
                            </span>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-2 mt-auto">
                    <Link
                        to={`/student/series/${series.id}`}
                        className="w-full btn-primary px-4 py-2 rounded-lg text-sm font-medium text-center"
                    >
                        Xem chi tiết
                    </Link>

                    {canRegister() && onRegister && (
                        <button
                            onClick={() => onRegister(series.id)}
                            className="w-full btn-yellow px-4 py-2 rounded-lg text-sm font-medium"
                        >
                            Đăng ký chuỗi
                        </button>
                    )}

                    {isRegistered && (
                        <div className="text-center">
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                ✅ Đã đăng ký
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SeriesCard;

