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
        case ScoreRuleTrigger.NO_SHOW: return 'Không tham gia (Vắng)';
        case ScoreRuleTrigger.SUBMISSION_GRADED: return 'Nộp bài và được chấm';
        case ScoreRuleTrigger.MINIGAME_PASSED: return 'Đạt Minigame';
        case ScoreRuleTrigger.SERIES_MILESTONE_REACHED: return 'Đạt mốc chuỗi sự kiện';
        case ScoreRuleTrigger.TASK_OVERDUE: return 'Quá hạn nhiệm vụ';
        case ScoreRuleTrigger.MINIGAME_EXHAUSTED_ATTEMPTS: return 'Hết lượt Minigame';
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
                            <span className="font-semibold text-gray-800 flex items-center gap-2">
                                {getScoreTypeLabel(rule.scoreType)}
                                {rule.isPresetGenerated === true && (
                                    <span
                                        title="Luật này được sinh ra từ mẫu cấu hình (preset)"
                                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700 uppercase tracking-wide"
                                    >
                                        Mẫu
                                    </span>
                                )}
                            </span>
                            {(() => {
                                const isPenaltyOnly = [ScoreRuleTrigger.NO_SHOW, ScoreRuleTrigger.TASK_OVERDUE, ScoreRuleTrigger.MINIGAME_EXHAUSTED_ATTEMPTS].includes(rule.triggerType);
                                const isPassFail = rule.calculation === ScoreRuleCalculation.PASS_FAIL_POINTS;
                                
                                if (isPassFail) {
                                    return (
                                        <div className="flex flex-col text-right">
                                            <span className="font-bold text-green-600">+{rule.points || 0}</span>
                                            {rule.failPoints && (
                                                <span className="text-red-500 text-xs">Trượt: -{rule.failPoints}</span>
                                            )}
                                        </div>
                                    );
                                }
                                
                                if (isPenaltyOnly) {
                                    return <span className="font-bold text-red-600">-{rule.failPoints || 0}</span>;
                                }
                                
                                return <span className="font-bold text-green-600">+{rule.points || 0}</span>;
                            })()}
                        </div>
                        <div className="text-gray-600 pl-2">
                            <span className="font-medium">Khi:</span> {getTriggerLabel(rule.triggerType)}
                        </div>
                        <div className="flex justify-between items-center pl-2 pt-1 mt-1 border-t border-gray-100 text-xs text-gray-500">
                            <span>Đối tượng: {getAudienceLabel(rule.audience)}</span>
                            {(() => {
                                const deptIds = rule.targetDepartmentIds || (rule as any).departmentIds;
                                return deptIds && deptIds.length > 0 ? (
                                    <span title="Số lượng khoa áp dụng" className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                                        {deptIds.length} khoa
                                    </span>
                                ) : null;
                            })()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
