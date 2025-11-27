import React from 'react';
import { parseMilestonePoints } from '../../types/series';
import { ScoreType } from '../../types/activity';

interface MilestoneDisplayProps {
    milestonePoints: string;
    scoreType: ScoreType;
    completedCount: number;
    currentPoints?: string;
}

const MilestoneDisplay: React.FC<MilestoneDisplayProps> = ({
    milestonePoints,
    scoreType,
    completedCount,
    currentPoints
}) => {
    const milestones = parseMilestonePoints(milestonePoints);
    const milestoneEntries = Object.entries(milestones)
        .map(([count, points]) => ({ count: parseInt(count), points: points as number }))
        .sort((a, b) => a.count - b.count);

    const getScoreTypeLabel = (type: ScoreType) => {
        const labels: Record<ScoreType, string> = {
            [ScoreType.REN_LUYEN]: 'Rèn luyện',
            [ScoreType.CONG_TAC_XA_HOI]: 'Công tác xã hội',
            [ScoreType.CHUYEN_DE]: 'Chuyên đề'
        };
        return labels[type] || type;
    };

    const getNextMilestone = () => {
        return milestoneEntries.find(m => m.count > completedCount);
    };

    const getCurrentMilestone = () => {
        return milestoneEntries
            .filter(m => m.count <= completedCount)
            .sort((a, b) => b.count - a.count)[0];
    };

    const nextMilestone = getNextMilestone();
    const currentMilestone = getCurrentMilestone();

    return (
        <div className="space-y-4">
            <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-lg p-4 text-white">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Điểm Milestone</h3>
                    <span className="text-sm bg-white/20 px-2 py-1 rounded">
                        {getScoreTypeLabel(scoreType)}
                    </span>
                </div>
                {currentPoints && (
                    <div className="text-2xl font-bold">
                        {parseFloat(currentPoints).toFixed(1)} điểm
                    </div>
                )}
                <div className="text-sm opacity-90 mt-1">
                    Đã hoàn thành: {completedCount} sự kiện
                </div>
            </div>

            <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Các mốc điểm:</h4>
                {milestoneEntries.map((milestone) => {
                    const isAchieved = completedCount >= milestone.count;
                    const isNext = nextMilestone?.count === milestone.count;

                    return (
                        <div
                            key={milestone.count}
                            className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                                isAchieved
                                    ? 'bg-green-50 border-green-200'
                                    : isNext
                                    ? 'bg-yellow-50 border-yellow-200'
                                    : 'bg-gray-50 border-gray-200'
                            }`}
                        >
                            <div className="flex items-center space-x-3">
                                {isAchieved ? (
                                    <span className="text-green-600 text-xl">✓</span>
                                ) : isNext ? (
                                    <span className="text-yellow-600 text-xl">→</span>
                                ) : (
                                    <span className="text-gray-400 text-xl">○</span>
                                )}
                                <div>
                                    <div className="font-medium text-gray-900">
                                        {milestone.count} sự kiện
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {milestone.points} điểm {getScoreTypeLabel(scoreType)}
                                    </div>
                                </div>
                            </div>
                            {isAchieved && (
                                <span className="text-green-600 font-semibold">Đã đạt</span>
                            )}
                            {isNext && (
                                <span className="text-yellow-600 font-semibold">
                                    Còn {milestone.count - completedCount} sự kiện
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MilestoneDisplay;

