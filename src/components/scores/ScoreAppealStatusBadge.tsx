import React from 'react';
import {
    ScoreAppealStatus,
    getScoreAppealStatusLabel,
    getScoreAppealStatusClass,
} from '../../types/score';

interface ScoreAppealStatusBadgeProps {
    status: ScoreAppealStatus | string;
}

const ScoreAppealStatusBadge: React.FC<ScoreAppealStatusBadgeProps> = ({ status }) => (
    <span
        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${getScoreAppealStatusClass(status)}`}
    >
        {getScoreAppealStatusLabel(status)}
    </span>
);

export default ScoreAppealStatusBadge;
