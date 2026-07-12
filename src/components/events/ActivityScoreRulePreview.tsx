import React from 'react';
import { ActivityPresetPreviewResponse } from '../../types/presets';
import { ScoreRuleCalculation } from '../../types/activity';
import {
    getCodeLabel,
    getPresetDisplayName,
    localizeNotes,
} from '../../utils/vietnameseLabels';

interface ActivityScoreRulePreviewProps {
    preview: ActivityPresetPreviewResponse | null;
}

const ActivityScoreRulePreview: React.FC<ActivityScoreRulePreviewProps> = ({ preview }) => {
    if (!preview) return null;

    const getCalculationLabel = (calc: ScoreRuleCalculation) =>
        getCodeLabel(calc, calc);

    const hasAnyFailPoints = preview.scoreRules.some(
        (r) => r.failPoints !== null && r.failPoints !== undefined
    );

    return (
        <div className="mt-4 border border-primary-100 rounded-2xl overflow-hidden bg-primary-50/40">
            <div className="bg-primary-900 px-4 py-3">
                <h4 className="font-semibold text-white">
                    Xem trước cấu hình ({getPresetDisplayName(preview.presetCode)})
                </h4>
            </div>

            <div className="p-4 space-y-4">
                {preview.notes && preview.notes.length > 0 && (
                    <div className="space-y-1 text-sm text-primary-900">
                        <p className="font-medium">Lưu ý:</p>
                        <ul className="list-disc list-inside pl-2 text-primary-800/80">
                            {localizeNotes(preview.notes).map((note, idx) => (
                                <li key={idx}>{note}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {preview.scoreRules && preview.scoreRules.length > 0 && (
                    <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
                        <table className="min-w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 bg-gray-50 uppercase tracking-wider">
                                <tr>
                                    <th className="px-3 py-2 font-semibold">Loại điểm</th>
                                    <th className="px-3 py-2 font-semibold">Điều kiện</th>
                                    <th className="px-3 py-2 font-semibold">Cách tính</th>
                                    <th className="px-3 py-2 font-semibold text-right">Số điểm</th>
                                    {hasAnyFailPoints && (
                                        <th className="px-3 py-2 font-semibold text-right">
                                            Điểm trừ khi không đạt
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {preview.scoreRules.map((rule, idx) => (
                                    <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50/80">
                                        <td className="px-3 py-2 font-medium text-primary-900">
                                            {getCodeLabel(rule.scoreType)}
                                        </td>
                                        <td className="px-3 py-2 text-gray-700">
                                            {getCodeLabel(rule.triggerType)}
                                        </td>
                                        <td className="px-3 py-2 text-gray-700">
                                            {getCalculationLabel(rule.calculation)}
                                        </td>
                                        <td className="px-3 py-2 text-right text-emerald-700 font-semibold tabular-nums">
                                            {rule.points}
                                        </td>
                                        {hasAnyFailPoints && (
                                            <td className="px-3 py-2 text-right text-rose-600 tabular-nums">
                                                {rule.failPoints != null ? rule.failPoints : '—'}
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
