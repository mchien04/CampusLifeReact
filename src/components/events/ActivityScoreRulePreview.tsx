import React from 'react';
import { ActivityPresetPreviewResponse } from '../../types/presets';
import { ScoreType, ScoreRuleTrigger, ScoreRuleCalculation } from '../../types/activity';

interface ActivityScoreRulePreviewProps {
    preview: ActivityPresetPreviewResponse | null;
}

const ActivityScoreRulePreview: React.FC<ActivityScoreRulePreviewProps> = ({ preview }) => {
    if (!preview) return null;

    const getScoreTypeLabel = (type: ScoreType) => {
        const labels: Record<ScoreType, string> = {
            [ScoreType.REN_LUYEN]: 'Rèn luyện',
            [ScoreType.CONG_TAC_XA_HOI]: 'Công tác xã hội',
            [ScoreType.CHUYEN_DE]: 'Chuyên đề'
        };
        return labels[type] || type;
    };

    const getTriggerLabel = (trigger: ScoreRuleTrigger) => {
        const labels: Record<ScoreRuleTrigger, string> = {
            [ScoreRuleTrigger.PARTICIPATION_COMPLETED]: 'Tham gia hoàn tất',
            [ScoreRuleTrigger.NO_SHOW]: 'Vắng mặt không phép (No-show)',
            [ScoreRuleTrigger.SUBMISSION_GRADED]: 'Chấm điểm bài thu hoạch',
            [ScoreRuleTrigger.MINIGAME_PASSED]: 'Vượt qua minigame',
            [ScoreRuleTrigger.SERIES_MILESTONE_REACHED]: 'Đạt mốc chuỗi sự kiện',
            [ScoreRuleTrigger.TASK_OVERDUE]: 'Quá hạn nhiệm vụ',
            [ScoreRuleTrigger.MINIGAME_EXHAUSTED_ATTEMPTS]: 'Hết lượt minigame'
        };
        return labels[trigger] || trigger;
    };

    const getCalculationLabel = (calc: ScoreRuleCalculation) => {
        const labels: Record<ScoreRuleCalculation, string> = {
            [ScoreRuleCalculation.FIXED_POINTS]: 'Điểm cố định',
            [ScoreRuleCalculation.COUNT_COMPLETION]: 'Đếm số lượng hoàn thành',
            [ScoreRuleCalculation.PASS_FAIL_POINTS]: 'Đạt/Trượt',
            [ScoreRuleCalculation.PENALTY_POINTS]: 'Trừ điểm (Phạt)',
            [ScoreRuleCalculation.SERIES_MILESTONE]: 'Mốc điểm chuỗi sự kiện'
        };
        return labels[calc] || calc;
    };

    const hasAnyFailPoints = preview.scoreRules.some(
        r => r.failPoints !== null && r.failPoints !== undefined
    );

    return (
        <div className="mt-4 border border-blue-200 rounded-lg overflow-hidden bg-blue-50">
            <div className="bg-blue-100 px-4 py-3 border-b border-blue-200">
                <h4 className="font-semibold text-blue-900">Xem trước cấu hình ({preview.presetCode})</h4>
            </div>
            
            <div className="p-4 space-y-4">
                {preview.notes && preview.notes.length > 0 && (
                    <div className="space-y-1 text-sm text-blue-800">
                        <p className="font-medium">Lưu ý:</p>
                        <ul className="list-disc list-inside pl-2">
                            {preview.notes.map((note, idx) => (
                                <li key={idx}>{note}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {preview.scoreRules && preview.scoreRules.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 bg-gray-100 uppercase">
                                <tr>
                                    <th className="px-3 py-2">Loại điểm</th>
                                    <th className="px-3 py-2">Điều kiện (Trigger)</th>
                                    <th className="px-3 py-2">Cách tính</th>
                                    <th className="px-3 py-2 text-right">Số điểm</th>
                                    {hasAnyFailPoints && (
                                        <th className="px-3 py-2 text-right">Điểm trừ khi không đạt</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {preview.scoreRules.map((rule, idx) => (
                                    <tr key={idx} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-3 py-2 font-medium">{getScoreTypeLabel(rule.scoreType)}</td>
                                        <td className="px-3 py-2">{getTriggerLabel(rule.triggerType)}</td>
                                        <td className="px-3 py-2">{getCalculationLabel(rule.calculation)}</td>
                                        <td className="px-3 py-2 text-right text-green-600 font-semibold">{rule.points}</td>
                                        {hasAnyFailPoints && (
                                            <td className="px-3 py-2 text-right text-red-600">
                                                {rule.failPoints != null ? rule.failPoints : '-'}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );

};

export default ActivityScoreRulePreview;
