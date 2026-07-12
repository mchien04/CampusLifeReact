import React from 'react';
import { CheckCircle, ArrowRight, Circle, Medal } from '@phosphor-icons/react';
import { ScoreType } from '../../types/activity';
import { getScoreTypeLabel } from '../../types/score';

interface MilestoneDisplayProps {
    milestonePoints: Record<string, number> | Record<number, number>;
    scoreType: ScoreType;
    completedCount: number;
    currentPoints?: string;
    currentMilestone?: number;
    nextMilestoneCount?: number;
    nextMilestonePoints?: string;
}

const MilestoneDisplay: React.FC<MilestoneDisplayProps> = ({
    milestonePoints,
    scoreType,
    completedCount,
    currentPoints,
    currentMilestone: apiCurrentMilestone,
    nextMilestoneCount: apiNextMilestoneCount,
    nextMilestonePoints: apiNextMilestonePoints,
}) => {
    void apiNextMilestonePoints;

    const milestones = milestonePoints || {};

    const milestoneEntries = Object.entries(milestones)
        .map(([count, points]) => ({ count: parseInt(count), points: points as number }))
        .sort((a, b) => a.count - b.count);

    const getNextMilestone = () => {
        if (apiNextMilestoneCount !== undefined) {
            return milestoneEntries.find((m) => m.count === apiNextMilestoneCount);
        }
        return milestoneEntries.find((m) => m.count > completedCount);
    };

    const getCurrentMilestone = () => {
        if (apiCurrentMilestone !== undefined) {
            return milestoneEntries.find((m) => m.count === apiCurrentMilestone);
        }
        return milestoneEntries
            .filter((m) => m.count <= completedCount)
            .sort((a, b) => b.count - a.count)[0];
    };

    const nextMilestone = getNextMilestone();
    const currentMilestone = getCurrentMilestone();

    return (
        <div className="space-y-4">
            <div className="relative overflow-hidden rounded-xl border border-primary-900/10 bg-primary-900 p-4 text-white">
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.1]"
                    style={{
                        backgroundImage:
                            'radial-gradient(ellipse at 100% 0%, #FFD66D 0%, transparent 60%)',
                    }}
                />
                <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-base font-semibold">Điểm milestone</h3>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-white/15 px-2 py-1 rounded-lg ring-1 ring-white/10">
                            <Medal size={14} weight="duotone" />
                            {getScoreTypeLabel(scoreType)}
                        </span>
                    </div>
                    {currentPoints && (
                        <p className="text-2xl font-bold tabular-nums">
                            {parseFloat(currentPoints).toFixed(1)} điểm
                        </p>
                    )}
                    <p className="text-sm text-primary-100/80 mt-1 tabular-nums">
                        Đã hoàn thành: {completedCount} sự kiện
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Các mốc điểm
                </h4>
                {milestoneEntries.map((milestone) => {
                    const isAchieved = completedCount >= milestone.count;
                    const isNext = nextMilestone?.count === milestone.count;
                    const isCurrent = currentMilestone?.count === milestone.count && isAchieved;

                    return (
                        <div
                            key={milestone.count}
                            className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
                                isAchieved
                                    ? 'bg-emerald-50/80 border-emerald-100'
                                    : isNext
                                    ? 'bg-amber-50/80 border-amber-100'
                                    : 'bg-gray-50/60 border-gray-100'
                            }`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                {isAchieved ? (
                                    <CheckCircle size={20} weight="fill" className="text-emerald-600 shrink-0" />
                                ) : isNext ? (
                                    <ArrowRight size={20} weight="bold" className="text-amber-600 shrink-0" />
                                ) : (
                                    <Circle size={20} className="text-gray-300 shrink-0" />
                                )}
                                <div className="min-w-0">
                                    <p className="font-medium text-gray-900 tabular-nums">
                                        {milestone.count} sự kiện
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {milestone.points} điểm {getScoreTypeLabel(scoreType)}
                                    </p>
                                </div>
                            </div>
                            {isAchieved && (
                                <span className="text-emerald-700 text-xs font-semibold shrink-0">
                                    {isCurrent ? 'Mốc hiện tại' : 'Đã đạt'}
                                </span>
                            )}
                            {isNext && (
                                <span className="text-amber-700 text-xs font-semibold shrink-0 tabular-nums">
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
