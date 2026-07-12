import React from 'react';
import { AppliedScoreAward } from '../../types/registration';
import { ScoreType } from '../../types/activity';
import { getCodeLabel, localizeVi } from '../../utils/vietnameseLabels';

interface ScoreAwardListProps {
    awards: AppliedScoreAward[];
    emptyText?: string;
    showIcons?: boolean;
}

const getScoreTypeIcon = (scoreType: ScoreType): string => {
    switch (scoreType) {
        case ScoreType.REN_LUYEN:
            return '📚';
        case ScoreType.CHUYEN_DE:
            return '🏢';
        case ScoreType.CONG_TAC_XA_HOI:
            return '🤝';
        default:
            return '🏅';
    }
};

const getScoreTypeColorClass = (scoreType: ScoreType): string => {
    switch (scoreType) {
        case ScoreType.REN_LUYEN:
            return 'bg-green-50 text-green-800 border-green-200';
        case ScoreType.CHUYEN_DE:
            return 'bg-blue-50 text-blue-800 border-blue-200';
        case ScoreType.CONG_TAC_XA_HOI:
            return 'bg-orange-50 text-orange-800 border-orange-200';
        default:
            return 'bg-gray-50 text-gray-800 border-gray-200';
    }
};

const getScoreTypeBadgeClass = (scoreType: ScoreType): string => {
    switch (scoreType) {
        case ScoreType.REN_LUYEN:
            return 'bg-green-100 text-green-700';
        case ScoreType.CHUYEN_DE:
            return 'bg-blue-100 text-blue-700';
        case ScoreType.CONG_TAC_XA_HOI:
            return 'bg-orange-100 text-orange-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
};

const ScoreAwardList: React.FC<ScoreAwardListProps> = ({
    awards,
    emptyText = 'Không có điểm thưởng cho hoạt động này.',
    showIcons = true
}) => {
    if (!awards || awards.length === 0) {
        return (
            <div className="text-center py-4 text-gray-500 text-sm">
                {emptyText}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {awards.map((award, index) => {
                const pointsNum = typeof award.points === 'string' ? parseFloat(award.points) : award.points;
                const isNegative = pointsNum < 0;

                return (
                    <div
                        key={index}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${getScoreTypeColorClass(award.scoreType)}`}
                    >
                        {showIcons && (
                            <span className="text-lg" role="img" aria-label={award.scoreTypeLabel}>
                                {getScoreTypeIcon(award.scoreType)}
                            </span>
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${getScoreTypeBadgeClass(award.scoreType)}`}>
                                    {localizeVi(award.scoreTypeLabel) || getCodeLabel(award.scoreType)}
                                </span>
                                {award.triggerType && (
                                    <span className="text-xs text-gray-500">
                                        {getCodeLabel(award.triggerType)}
                                    </span>
                                )}
                            </div>
                            <p className={`text-sm font-semibold mt-1 ${isNegative ? 'text-red-600' : 'text-gray-900'}`}>
                                {localizeVi(award.displayText) || award.displayText}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ScoreAwardList;
