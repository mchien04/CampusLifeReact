import React from 'react';
import { 
    ActivityScoreRuleResponse, 
    ScoreType, 
    ScoreRuleTrigger, 
    ScoreRuleCalculation, 
    ScoreRuleAudience, 
    ScoreSemesterPolicy 
} from '../../types/activity';

interface ScoreRulesDisplayProps {
    rules?: ActivityScoreRuleResponse[];
}

const getScoreTypeLabel = (type: ScoreType) => {
    switch (type) {
        case ScoreType.REN_LUYEN: return 'Điểm rèn luyện';
        case ScoreType.CONG_TAC_XA_HOI: return 'Điểm CTXH';
        case ScoreType.CHUYEN_DE: return 'Điểm chuyên đề';
        default: return type;
    }
};

const getTriggerLabel = (trigger: ScoreRuleTrigger) => {
    switch (trigger) {
        case ScoreRuleTrigger.PARTICIPATION_COMPLETED: return 'Hoàn thành tham gia';
        case ScoreRuleTrigger.SUBMISSION_GRADED: return 'Nộp bài và được chấm';
        case ScoreRuleTrigger.MINIGAME_PASSED: return 'Đạt Minigame';
        case ScoreRuleTrigger.SERIES_MILESTONE_REACHED: return 'Đạt mốc chuỗi sự kiện';
        default: return trigger;
    }
};

const getAudienceLabel = (audience: ScoreRuleAudience) => {
    switch (audience) {
        case ScoreRuleAudience.ALL_PARTICIPANTS: return 'Tất cả';
        case ScoreRuleAudience.DEPARTMENT_ONLY: return 'Khoa/Ngành nội bộ';
        case ScoreRuleAudience.OUTSIDE_DEPARTMENTS_ONLY: return 'Sinh viên ngoài khoa';
        default: return audience;
    }
};

export const ScoreRulesDisplay: React.FC<ScoreRulesDisplayProps> = ({ rules }) => {
    if (!rules || rules.length === 0) {
        return <div className="text-sm text-gray-500 italic">Không có cấu hình điểm.</div>;
    }

    return (
        <div className="space-y-3 mt-2">
            <h4 className="text-sm font-medium text-gray-700">Luật tính điểm:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {rules.map(rule => (
                    <div key={rule.id} className="bg-white border rounded-lg p-3 shadow-sm text-sm flex flex-col space-y-1 relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-1 h-full ${
                            rule.scoreType === ScoreType.REN_LUYEN ? 'bg-green-500' :
                            rule.scoreType === ScoreType.CONG_TAC_XA_HOI ? 'bg-blue-500' : 'bg-purple-500'
                        }`} />
                        <div className="flex justify-between items-start pl-2">
                            <span className="font-semibold text-gray-800">
                                {getScoreTypeLabel(rule.scoreType)}
                            </span>
                            <span className="font-bold text-green-600">
                                {rule.calculation === ScoreRuleCalculation.PENALTY_POINTS ? '-' : '+'}{rule.points}
                            </span>
                        </div>
                        <div className="text-gray-600 pl-2">
                            <span className="font-medium">Khi:</span> {getTriggerLabel(rule.triggerType)}
                        </div>
                        {rule.failPoints && (
                            <div className="text-red-500 pl-2 text-xs">
                                <span className="font-medium">Trượt:</span> {rule.failPoints}
                            </div>
                        )}
                        <div className="flex justify-between items-center pl-2 pt-1 mt-1 border-t border-gray-100 text-xs text-gray-500">
                            <span>Đối tượng: {getAudienceLabel(rule.audience)}</span>
                            {rule.targetDepartmentIds && rule.targetDepartmentIds.length > 0 && (
                                <span title="Số lượng khoa áp dụng" className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                                    {rule.targetDepartmentIds.length} khoa
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
