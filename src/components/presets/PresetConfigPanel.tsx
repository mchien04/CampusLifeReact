import React, { useState, useCallback } from 'react';
import { ActivityPresetDefinition, ActivityPresetPreviewRequest, PresetRuleDescriptor, FieldDefinition, ActivityPresetPreviewResponse, SeriesPresetDefinition, SeriesPresetPreviewRequest, SeriesPresetPreviewResponse } from '../../types/presets';
import { ActivityType, ActivityScoreRuleRequest } from '../../types/activity';
import { ScoreType } from '../../types/activity';
import PresetRuleCard from './PresetRuleCard';
import PresetSelector from './PresetSelector';

type PresetDefinition = ActivityPresetDefinition | SeriesPresetDefinition;
type PreviewResponse = ActivityPresetPreviewResponse | SeriesPresetPreviewResponse;

interface PresetConfigPanelProps {
    presets: PresetDefinition[];
    selectedPresetCode: string;
    onPresetChange: (code: string) => void;
    config: Record<string, unknown>;
    onConfigChange: (config: Record<string, unknown>) => void;
    enabledRules: Record<string, boolean>;
    onRuleToggle: (ruleKey: string, enabled: boolean) => void;
    onPreview: () => Promise<void>;
    previewResponse: PreviewResponse | null;
    previewLoading: boolean;
    mode: 'activity' | 'series';
    activityType?: ActivityType;
    requiresSubmission?: boolean | null;
    errors?: Record<string, string>;
    externalOptions?: Record<string, Array<{ value: string | number; label: string }>>;
    /** P6-10: lock preset dropdown khi edit activity (giữ value, vẫn cho edit presetConfig). */
    lockPreset?: boolean;
}

const buildEnabledRules = (preset: PresetDefinition): Record<string, boolean> => {
    const rules: Record<string, boolean> = {};
    for (const rule of preset.supportedRules) {
        rules[rule.ruleKey] = rule.required ? true : rule.enabledByDefault;
    }
    return rules;
};

const buildInitialConfig = (preset: PresetDefinition): Record<string, unknown> => {
    const config: Record<string, unknown> = {};
    for (const rule of preset.supportedRules) {
        for (const field of rule.fieldDefinitions) {
            if (field.defaultValue !== undefined && field.defaultValue !== null) {
                config[field.fieldName] = field.defaultValue;
            }
        }
    }
    return config;
};

const PresetConfigPanel: React.FC<PresetConfigPanelProps> = ({
    presets,
    selectedPresetCode,
    onPresetChange,
    config,
    onConfigChange,
    enabledRules,
    onRuleToggle,
    onPreview,
    previewResponse,
    previewLoading,
    mode,
    activityType,
    requiresSubmission,
    errors = {},
    externalOptions,
    lockPreset = false
}) => {
    const selectedPreset = presets.find(p => p.code === selectedPresetCode);

    const handlePresetChange = useCallback((code: string) => {
        onPresetChange(code);
        if (code) {
            const preset = presets.find(p => p.code === code);
            if (preset) {
                const newRules = buildEnabledRules(preset);
                const newConfig = buildInitialConfig(preset);
                // Merge existing onRuleToggle and onConfigChange calls
                for (const [key, enabled] of Object.entries(newRules)) {
                    onRuleToggle(key, enabled);
                }
                onConfigChange(newConfig);
            }
        }
    }, [presets, onPresetChange, onRuleToggle, onConfigChange]);

    const handleRuleToggle = (ruleKey: string, enabled: boolean) => {
        onRuleToggle(ruleKey, enabled);
    };

    const handleFieldChange = (fieldName: string, value: unknown) => {
        onConfigChange({
            ...config,
            [fieldName]: value
        });
    };

    const isActivityPreview = (res: PreviewResponse): res is ActivityPresetPreviewResponse => {
        return 'activityType' in res;
    };

    const isSeriesPreview = (res: PreviewResponse): res is SeriesPresetPreviewResponse => {
        return 'milestonePoints' in res && !('activityType' in res);
    };

    return (
        <div className="space-y-6 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900">
                Cấu hình điểm tự động (Preset)
            </h3>

            <PresetSelector
                presets={presets}
                selectedCode={selectedPresetCode}
                onChange={handlePresetChange}
                disabled={lockPreset}
                label={mode === 'series' ? 'Mẫu cấu hình chuỗi sự kiện' : 'Mẫu cấu hình sự kiện'}
                placeholder="-- Tùy chỉnh (Không dùng mẫu) --"
            />
            {lockPreset && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                    Mẫu cấu hình đã khoá khi chỉnh sửa. Bạn vẫn có thể tuỳ chỉnh chi tiết bên dưới.
                </p>
            )}

            {selectedPreset && (
                <div className="space-y-4">
                    {selectedPreset.supportedRules.map(rule => {
                        const isEnabled = enabledRules[rule.ruleKey] ?? rule.enabledByDefault;
                        return (
                            <PresetRuleCard
                                key={rule.ruleKey}
                                rule={rule}
                                enabled={isEnabled}
                                onToggle={handleRuleToggle}
                                fieldValues={config}
                                onFieldChange={handleFieldChange}
                                errors={errors}
                                externalOptions={externalOptions}
                                presetCode={selectedPreset.code}
                                // P6.1: TASK_OVERDUE chỉ bật được khi SUBMISSION_GRADED bật.
                                // Chỉ disable toggle khi đang OFF (không cho bật); nếu đang ON vẫn cho tắt.
                                toggleDisabled={rule.ruleKey === 'TASK_OVERDUE' && !enabledRules.SUBMISSION_GRADED && !isEnabled}
                            />
                        );
                    })}

                    <button
                        type="button"
                        onClick={onPreview}
                        disabled={previewLoading}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                        {previewLoading ? 'Đang xem trước...' : 'Xem trước cấu hình rule'}
                    </button>

                    {previewResponse && isActivityPreview(previewResponse) && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-md space-y-3">
                            <h4 className="text-sm font-semibold text-green-900">
                                Xem trước: {previewResponse.presetCode}
                            </h4>
                            {(() => {
                                // P6.1: ưu tiên previewRows (display-ready), fallback scoreRules.
                                const rows = previewResponse.previewRows;
                                if (rows && rows.length > 0) {
                                    return (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-xs text-left">
                                                <thead className="text-gray-600 bg-green-100">
                                                    <tr>
                                                        <th className="px-2 py-1">Tình huống</th>
                                                        <th className="px-2 py-1">Loại điểm</th>
                                                        <th className="px-2 py-1 text-right">Điểm</th>
                                                        <th className="px-2 py-1">Đối tượng</th>
                                                        <th className="px-2 py-1">Học kỳ</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {rows.map((row, idx) => (
                                                        <tr key={idx} className="border-t border-green-200">
                                                            <td className="px-2 py-1 text-green-800">{row.description}</td>
                                                            <td className="px-2 py-1 text-green-700">{row.scoreType}</td>
                                                            <td className={`px-2 py-1 text-right font-semibold ${row.points >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                                                {row.points >= 0 ? `+${row.points}` : row.points}
                                                            </td>
                                                            <td className="px-2 py-1 text-gray-600">{row.audience === 'ALL_PARTICIPANTS' ? 'Tất cả' : row.audience}</td>
                                                            <td className="px-2 py-1 text-gray-600">{row.semester === 'ACTIVITY_SEMESTER' ? 'Theo sự kiện' : row.semester}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                }
                                // fallback cũ: render từ scoreRules
                                const hasAnyFailPoints = previewResponse.scoreRules.some(
                                    (r: ActivityScoreRuleRequest) => r.failPoints !== null && r.failPoints !== undefined
                                );
                                return (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-xs text-left">
                                            <thead className="text-gray-600 bg-green-100">
                                                <tr>
                                                    <th className="px-2 py-1">Trigger</th>
                                                    <th className="px-2 py-1">Loại điểm</th>
                                                    <th className="px-2 py-1 text-right">Điểm</th>
                                                    {hasAnyFailPoints && (
                                                        <th className="px-2 py-1 text-right">Điểm trừ</th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {previewResponse.scoreRules.map((rule: ActivityScoreRuleRequest, idx: number) => (
                                                    <tr key={idx} className="border-t border-green-200">
                                                        <td className="px-2 py-1 text-green-800">{rule.triggerType}</td>
                                                        <td className="px-2 py-1 text-green-700">{rule.scoreType}</td>
                                                        <td className="px-2 py-1 text-right text-green-700 font-semibold">{rule.points}</td>
                                                        {hasAnyFailPoints && (
                                                            <td className="px-2 py-1 text-right text-red-600">
                                                                {rule.failPoints != null ? rule.failPoints : '-'}
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })()}
                            {previewResponse.notes.length > 0 && (
                                <ul className="list-disc list-inside text-xs text-green-700">
                                    {previewResponse.notes.map((note, idx) => (
                                        <li key={idx}>{note}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {previewResponse && isSeriesPreview(previewResponse) && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-md space-y-3">
                            <h4 className="text-sm font-semibold text-green-900">
                                Xem trước: {previewResponse.presetCode}
                            </h4>
                            <div className="text-sm text-green-800">
                                <p>Loại điểm: {previewResponse.scoreType}</p>
                                <p>Mốc điểm:</p>
                                <div className="ml-4 space-y-1">
                                    {Object.entries(previewResponse.milestonePoints).map(([count, points]) => (
                                        <div key={count} className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                            <span>{count} sự kiện → {points} điểm</span>
                                        </div>
                                    ))}
                                </div>
                                {previewResponse.minimumRequirementEnabled && (
                                    <p className="mt-2 text-orange-700">
                                        Yêu cầu tối thiểu: {previewResponse.minimumRequiredEvents} sự kiện, phạt {previewResponse.minimumPenaltyPoints} điểm
                                    </p>
                                )}
                            </div>
                            {previewResponse.notes.length > 0 && (
                                <ul className="list-disc list-inside text-xs text-green-700">
                                    {previewResponse.notes.map((note, idx) => (
                                        <li key={idx}>{note}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PresetConfigPanel;
